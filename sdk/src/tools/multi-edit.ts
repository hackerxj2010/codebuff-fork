import * as fs from 'fs'
import * as path from 'path'

import type { CodebuffToolOutput } from '../../../common/src/tools/list'

/**
 * Apply multiple file edits with fuzzy string matching.
 */
export async function multiEditTool(params: {
  operations: Array<{
    filePath: string
    oldString: string
    newString: string
    allowMultiple?: boolean
  }>
  atomic?: boolean
  projectPath: string
}): Promise<CodebuffToolOutput<'multi_edit'>> {
  const { operations, atomic = false, projectPath } = params
  const snapshots = new Map<string, string>()

  // Phase 1: Read all files and create snapshots for atomic rollback
  if (atomic) {
    for (const op of operations) {
      if (!snapshots.has(op.filePath)) {
        const absPath = path.resolve(projectPath, op.filePath)
        try {
          const content = fs.readFileSync(absPath, 'utf-8')
          snapshots.set(op.filePath, content)
        } catch (error) {
          return [
            {
              type: 'json',
              value: {
                results: [
                  {
                    filePath: op.filePath,
                    success: false,
                    matchStrategy: 'none',
                    error: `Failed to read file: ${error instanceof Error ? error.message : String(error)}`,
                  },
                ],
                atomic,
                allSucceeded: false,
              },
            },
          ]
        }
      }
    }
  }

  // Phase 2: Apply all operations
  const results: Array<{
    filePath: string
    success: boolean
    matchStrategy?: string
    error?: string
  }> = []

  for (const op of operations) {
    const absPath = path.resolve(projectPath, op.filePath)
    // eslint-disable-next-line prefer-const
    let content: string

    try {
      content = fs.readFileSync(absPath, 'utf-8')
    } catch (error) {
      results.push({
        filePath: op.filePath,
        success: false,
        error: `Failed to read file: ${error instanceof Error ? error.message : String(error)}`,
      })

      if (atomic) {
        rollback(snapshots, projectPath)
        break
      }
      continue
    }

    const matchResult = fuzzyReplace({
      content,
      oldString: op.oldString,
      newString: op.newString,
      allowMultiple: op.allowMultiple ?? false,
    })

    if (!matchResult.success) {
      results.push({
        filePath: op.filePath,
        success: false,
        matchStrategy: 'none',
        error: 'Could not find a match for oldString in the file. Tried exact match, trimmed lines, whitespace-normalized, and flexible indentation strategies.',
      })

      if (atomic) {
        rollback(snapshots, projectPath)
        break
      }
      continue
    }

    try {
      fs.writeFileSync(absPath, matchResult.content, 'utf-8')
      results.push({
        filePath: op.filePath,
        success: true,
        matchStrategy: matchResult.strategy,
      })
    } catch (error) {
      results.push({
        filePath: op.filePath,
        success: false,
        error: `Failed to write file: ${error instanceof Error ? error.message : String(error)}`,
      })

      if (atomic) {
        rollback(snapshots, projectPath)
        break
      }
    }
  }

  const allSucceeded = results.every((r) => r.success)

  return [
    {
      type: 'json',
      value: {
        results,
        atomic,
        allSucceeded,
      },
    },
  ]
}

function rollback(snapshots: Map<string, string>, projectPath: string): void {
  for (const [filePath, content] of snapshots) {
    const absPath = path.resolve(projectPath, filePath)
    try {
      fs.writeFileSync(absPath, content, 'utf-8')
    } catch {
      // Best-effort rollback
    }
  }
}

interface FuzzyMatchResult {
  success: boolean
  content: string
  strategy?: string
}

/**
 * Fuzzy replacement engine using multiple matching strategies.
 */
function fuzzyReplace(params: {
  content: string
  oldString: string
  newString: string
  allowMultiple: boolean
}): FuzzyMatchResult {
  const { content, oldString, newString, allowMultiple } = params

  // Strategy 1: Exact match
  if (content.includes(oldString)) {
    const result = allowMultiple ? content.replaceAll(oldString, newString) : content.replace(oldString, newString)
    return { success: true, content: result, strategy: 'exact' }
  }

  // Strategy 2: Trimmed lines
  const trimmedOld = oldString
    .split('\n')
    .map((l) => l.trim())
    .join('\n')
  if (trimmedOld !== oldString && content.includes(trimmedOld)) {
    const trimmedNew = newString
      .split('\n')
      .map((l) => l.trim())
      .join('\n')
    const result = allowMultiple ? content.replaceAll(trimmedOld, trimmedNew) : content.replace(trimmedOld, trimmedNew)
    return { success: true, content: result, strategy: 'trimmed_lines' }
  }

  // Strategy 3: Whitespace-normalized
  const normalizedContent = content.replace(/\s+/g, ' ')
  const normalizedOld = oldString.replace(/\s+/g, ' ')
  const normalizedNew = newString.replace(/\s+/g, ' ')
  if (normalizedContent.includes(normalizedOld)) {
    const result = allowMultiple
      ? normalizedContent.replaceAll(normalizedOld, normalizedNew)
      : normalizedContent.replace(normalizedOld, normalizedNew)
    return { success: true, content: result, strategy: 'whitespace_normalized' }
  }

  // Strategy 4: Flexible indentation
  const indentRegex = oldString.replace(/^[ \t]+/gm, (match) => `[ \\t]{${match.length}}`)
  const escapedRegex = indentRegex.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\\\[\s\\t\\\]\\\{(\d+)\\\}/g, (_, n) => `[ \\t]{${n}}`)
  try {
    const regex = new RegExp(escapedRegex)
    if (regex.test(content)) {
      const result = allowMultiple
        ? content.replace(new RegExp(escapedRegex, 'g'), newString)
        : content.replace(regex, newString)
      return { success: true, content: result, strategy: 'flexible_indent' }
    }
  } catch {
    // Regex too complex, skip
  }

  // Strategy 5: Fuzzy (contiguous subsequence matching)
  const fuzzyMatch = fuzzyMatchSubsequence(content, oldString, newString)
  if (fuzzyMatch) {
    const result = allowMultiple ? fuzzyMatch.replaceAll : fuzzyMatch.replaceOnce
    return { success: true, content: result, strategy: 'fuzzy' }
  }

  return { success: false, content }
}

/**
 * Find oldString as a contiguous subsequence in content.
 * Each character of oldString must appear in order in content,
 * with no other characters from oldString in between.
 */
function fuzzyMatchSubsequence(content: string, oldString: string, replacement: string): { replaceOnce: string; replaceAll: string } | null {
  const firstChar = oldString[0]
  let startIdx = content.indexOf(firstChar)

  while (startIdx !== -1) {
    let contentIdx = startIdx
    let patternIdx = 0

    while (patternIdx < oldString.length && contentIdx < content.length) {
      if (content[contentIdx] === oldString[patternIdx]) {
        patternIdx++
      }
      contentIdx++
    }

    if (patternIdx === oldString.length) {
      const before = content.substring(0, startIdx)
      const after = content.substring(contentIdx)
      const replaced = before + replacement + after
      return { replaceOnce: replaced, replaceAll: content.split(oldString).join(replacement) }
    }

    startIdx = content.indexOf(firstChar, startIdx + 1)
  }

  return null
}
