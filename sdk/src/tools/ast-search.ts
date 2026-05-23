import { execa } from 'execa'

export type AstSearchResult = {
  results: Array<{
    filePath: string
    lineNumber: number
    column: number
    matchedCode: string
    context: string
    matchedNode?: string
  }>
  total: number
  truncated: boolean
  pattern: string
  language?: string
}

export async function astSearchTool(params: {
  pattern: string
  path?: string
  glob?: string
  language?: string
  maxResults?: number
  contextLines?: number
}): Promise<AstSearchResult> {
  const { pattern, path: searchPath, glob, language, maxResults, contextLines } = params

  try {
    // Try using @ast-grep/cli via npx
    const args: string[] = [
      'run',
      '--pattern', pattern,
      '--json',
    ]

    if (searchPath) args.push('--path', searchPath)
    if (glob) args.push('--glob', glob)
    if (language) args.push('--lang', language)
    if (maxResults) args.push('--max-query-count', String(maxResults))

    const { stdout } = await execa('sg', args, {
      cwd: process.cwd(),
      reject: false,
      timeout: 30000,
    })

    if (!stdout) {
      return {
        results: [],
        total: 0,
        truncated: false,
        pattern,
        language,
      }
    }

    const allMatches = stdout
      .split('\n')
      .filter(Boolean)
      .map((line) => {
        try {
          const parsed = JSON.parse(line)
          if (parsed.type === 'match' || parsed.text) {
            return {
              filePath: parsed.file?.path ?? parsed.path ?? '',
              lineNumber: parsed.lineNumber ?? parsed.pos?.start?.line ?? 0,
              column: parsed.column ?? parsed.pos?.start?.column ?? 0,
              matchedCode: parsed.text ?? parsed.match ?? '',
              context: (parsed.text?.split('\n').slice(-(contextLines ?? 2)).join('\n') ?? ''),
              matchedNode: parsed.nodeType ?? parsed.kind ?? undefined,
            }
          }
          return null
        } catch {
          return null
        }
      })
      .filter((r): r is NonNullable<typeof r> => r !== null)

    const limit = maxResults ?? 50
    const results = allMatches.slice(0, limit)

    return {
      results,
      total: allMatches.length,
      truncated: allMatches.length > limit,
      pattern,
      language,
    }
  } catch {
    // ast-grep not available — return empty results
    return {
      results: [],
      total: 0,
      truncated: false,
      pattern,
      language,
    }
  }
}
