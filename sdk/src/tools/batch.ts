/**
 * Execute multiple tool calls in parallel.
 * This is called from the handleToolCall function in run.ts
 * which provides the runtime context for executing tool calls.
 */
export async function batchTool(params: {
  calls: Array<{
    toolName: string
    input: Record<string, unknown>
  }>
  executeToolCall: (toolName: string, input: Record<string, unknown>) => Promise<Array<Record<string, unknown>>>
}): Promise<{
  results: Array<{ toolName: string; success: boolean; error?: string }>
  totalCalls: number
  succeeded: number
  failed: number
}> {
  const calls = params.calls.slice(0, 25)
  const totalCalls = calls.length

  const results = await Promise.allSettled(
    calls.map(async (call) => {
      try {
        await params.executeToolCall(call.toolName, call.input)
        return {
          toolName: call.toolName,
          success: true,
        }
      } catch (error) {
        return {
          toolName: call.toolName,
          success: false,
          error: error instanceof Error ? error.message : String(error),
        }
      }
    }),
  )

  const formattedResults = results.map((r) =>
    r.status === 'fulfilled' ? r.value : { toolName: 'unknown' as const, success: false as const, error: String(r.reason) },
  )

  const succeeded = formattedResults.filter((r) => r.success).length
  const failed = formattedResults.filter((r) => !r.success).length

  return {
    results: formattedResults,
    totalCalls,
    succeeded,
    failed,
  }
}
