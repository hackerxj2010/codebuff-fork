import z from 'zod/v4'

import { $getNativeToolCallExampleString, jsonToolResultSchema } from '../utils'

import type { $ToolParams } from '../../constants'

const toolName = 'batch'
const endsAgentStep = false
const inputSchema = z
  .object({
    calls: z
      .array(
        z.object({
          toolName: z
            .string()
            .describe('The name of the tool to call'),
          input: z
            .record(z.string(), z.unknown())
            .describe('The input parameters for the tool'),
        }),
      )
      .min(1, 'At least one tool call is required')
      .max(25, 'Maximum of 25 parallel tool calls allowed')
      .describe('Array of tool calls to execute in parallel (max 25)'),
  })
  .describe(
    `Execute multiple tool calls in parallel and return all results. Use this to batch independent operations for efficiency.`,
  )

const description = `
Execute up to 25 tool calls in parallel and collect all results.

Use cases:
- Read multiple files at once
- Search multiple patterns simultaneously
- List multiple directories in parallel
- Execute multiple independent terminal commands
- Combine glob and code_search for complex discovery

Important:
- All tool calls run in parallel — they must NOT depend on each other
- If one fails, the others still complete (no atomic rollback)
- Maximum 25 tool calls per batch
- Results are returned in the same order as the input calls

Example:
${$getNativeToolCallExampleString({
  toolName,
  inputSchema,
  input: {
    calls: [
      {
        toolName: 'glob',
        input: { pattern: '**/*.ts' },
      },
      {
        toolName: 'code_search',
        input: { pattern: 'importantFunction', flags: '-g *.ts' },
      },
    ],
  },
  endsAgentStep,
})}
`.trim()

export const batchParams = {
  toolName,
  description,
  endsAgentStep,
  inputSchema,
  outputSchema: jsonToolResultSchema(
    z.object({
      results: z.array(
        z.object({
          toolName: z.string(),
          success: z.boolean(),
          error: z.string().optional(),
        }),
      ),
      totalCalls: z.number(),
      succeeded: z.number(),
      failed: z.number(),
    }),
  ),
} satisfies $ToolParams
