import z from 'zod/v4'

import { $getNativeToolCallExampleString, jsonToolResultSchema } from '../utils'

import type { $ToolParams } from '../../constants'

const toolName = 'multi_edit'
const endsAgentStep = false
const inputSchema = z
  .object({
    operations: z
      .array(
        z.object({
          filePath: z
            .string()
            .min(1, 'File path cannot be empty')
            .describe('Path to the file to edit, relative to project root'),
          oldString: z
            .string()
            .min(1, 'oldString cannot be empty')
            .describe(
              'The string to replace. Uses fuzzy matching if exact match fails.',
            ),
          newString: z
            .string()
            .describe(
              'The replacement string. Can be empty to delete the matched text.',
            ),
          allowMultiple: z
            .boolean()
            .optional()
            .default(false)
            .describe('Whether to replace ALL occurrences (instead of just the first)'),
        }),
      )
      .min(1, 'At least one operation is required')
      .max(20, 'Maximum of 20 operations per call')
      .describe('Array of edit operations to apply (max 20)'),
    atomic: z
      .boolean()
      .optional()
      .default(false)
      .describe(
        'If true, all-or-nothing: rollback all changes if any single operation fails.',
      ),
  })
  .describe(
    `Apply multiple file edits in one call with fuzzy matching. More flexible than str_replace — attempts multiple matching strategies.`,
  )

const description = `
Apply multiple file edits atomically with fuzzy string matching.

Matching strategies (tried in order):
1. **Exact match** — Direct string replacement
2. **Trimmed lines** — Ignores leading/trailing whitespace on each line
3. **Whitespace-normalized** — Collapses all whitespace runs to single spaces
4. **Flexible indentation** — Matches regardless of indentation differences
5. **Fuzzy (contiguous subsequence)** — Matches if characters appear in order

Use cases:
- Apply multiple edits across different files in one call
- Edit blocks of code where exact whitespace may vary
- Batch refactoring operations across the codebase

Example:
${$getNativeToolCallExampleString({
  toolName,
  inputSchema,
  input: {
    operations: [
      {
        filePath: 'src/foo.ts',
        oldString: 'function oldName() {',
        newString: 'function newName() {',
      },
      {
        filePath: 'src/bar.ts',
        oldString: 'console.log("old message")',
        newString: 'console.log("new message")',
      },
    ],
    atomic: true,
  },
  endsAgentStep,
})}
`.trim()

export const multiEditParams = {
  toolName,
  description,
  endsAgentStep,
  inputSchema,
  outputSchema: jsonToolResultSchema(
    z.object({
      results: z.array(
        z.object({
          filePath: z.string(),
          success: z.boolean(),
          matchStrategy: z
            .string()
            .optional()
            .describe('Which matching strategy was used for this operation'),
          error: z.string().optional(),
        }),
      ),
      atomic: z.boolean(),
      allSucceeded: z.boolean(),
    }),
  ),
} satisfies $ToolParams
