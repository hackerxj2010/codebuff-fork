import z from 'zod/v4'

import { jsonToolResultSchema } from '../utils'

import type { $ToolParams } from '../../constants'

const toolName = 'todo_read'
const endsAgentStep = false
const inputSchema = z
  .object({})
  .describe(
    `Read the current todo list. Returns all pending, in-progress, and completed tasks.`,
  )

const description = `
Read the current todo list for the session.

Use cases:
- Check what tasks remain in the current implementation plan
- Review completed tasks
- Get an overview of the current work breakdown
`.trim()

export const todoReadParams = {
  toolName,
  description,
  endsAgentStep,
  inputSchema,
  outputSchema: jsonToolResultSchema(
    z.object({
      todos: z.array(
        z.object({
          task: z.string(),
          completed: z.boolean(),
        }),
      ),
      total: z.number(),
      completedCount: z.number(),
      pendingCount: z.number(),
    }),
  ),
} satisfies $ToolParams
