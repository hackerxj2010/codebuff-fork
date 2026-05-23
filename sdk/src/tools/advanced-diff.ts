import { execa } from 'execa'

export type AdvancedDiffResult = {
  files: Array<{
    filePath: string
    status: 'modified' | 'added' | 'deleted' | 'renamed'
    addedLines: number
    removedLines: number
    hunks: Array<{
      header: string
      lines: Array<{ type: 'added' | 'removed' | 'unchanged'; content: string; oldLineNumber: number | null; newLineNumber: number | null }>
    }>
  }>
  totalFiles: number
  totalAdded: number
  totalRemoved: number
  format: 'semantic' | 'unified' | 'json'
}

export async function advancedDiffTool(params: {
  filePath: string
  stages?: ('staged' | 'unstaged' | 'working-tree')[]
  contextLines?: number
  format?: 'semantic' | 'unified' | 'json'
}): Promise<AdvancedDiffResult> {
  const { filePath, stages, contextLines, format } = params

  try {
    // Get git diff for the file
    const diffArgs = ['diff', '--unified=' + (contextLines ?? 3), '--', filePath]
    if (stages?.includes('staged')) {
      // Include staged changes
      diffArgs.unshift('--staged')
    }

    const { stdout } = await execa('git', diffArgs, {
      cwd: process.cwd(),
      reject: false,
      timeout: 15000,
    })

    if (!stdout) {
      return {
        files: [],
        totalFiles: 0,
        totalAdded: 0,
        totalRemoved: 0,
        format: format ?? 'semantic',
      }
    }

    // Parse git diff output into structured hunks
    const lines = stdout.split('\n')
    const hunks: Array<{
      header: string
      lines: Array<{ type: 'added' | 'removed' | 'unchanged'; content: string; oldLineNumber: number | null; newLineNumber: number | null }>
    }> = []
    let currentHunk: typeof hunks[0] | null = null
    let totalAdded = 0
    let totalRemoved = 0

    for (const line of lines) {
      if (line.startsWith('@@')) {
        if (currentHunk) hunks.push(currentHunk)
        currentHunk = { header: line, lines: [] }
      } else if (currentHunk) {
        if (line.startsWith('+')) {
          currentHunk.lines.push({ type: 'added', content: line.slice(1), oldLineNumber: null, newLineNumber: null })
          totalAdded++
        } else if (line.startsWith('-')) {
          currentHunk.lines.push({ type: 'removed', content: line.slice(1), oldLineNumber: null, newLineNumber: null })
          totalRemoved++
        } else if (line.startsWith(' ')) {
          currentHunk.lines.push({ type: 'unchanged', content: line.slice(1), oldLineNumber: null, newLineNumber: null })
        }
      }
    }
    if (currentHunk) hunks.push(currentHunk)

    // Determine file status
    let status: 'modified' | 'added' | 'deleted' | 'renamed' = 'modified'
    if (stdout.includes('new file')) status = 'added'
    else if (stdout.includes('deleted file')) status = 'deleted'
    else if (stdout.includes('rename from')) status = 'renamed'

    return {
      files: [{
        filePath,
        status,
        addedLines: totalAdded,
        removedLines: totalRemoved,
        hunks,
      }],
      totalFiles: 1,
      totalAdded,
      totalRemoved,
      format: format ?? 'semantic',
    }
  } catch (error) {
    return {
      files: [],
      totalFiles: 0,
      totalAdded: 0,
      totalRemoved: 0,
      format: format ?? 'semantic',
    }
  }
}
