import z from 'zod/v4'

import { $getNativeToolCallExampleString, jsonToolResultSchema } from '../utils'

import type { $ToolParams } from '../../constants'

const toolName = 'advanced_diff'
const endsAgentStep = true

const inputSchema = z
  .object({
    filePath: z
      .string()
      .min(1)
      .describe('Path to the file to show the diff for.'),
    stages: z
      .array(
        z.enum(['staged', 'unstaged', 'working-tree']),
      )
      .optional()
      .default(['unstaged'])
      .describe('Which diff stages to include. Default: ["unstaged"].'),
    contextLines: z
      .number()
      .int()
      .min(0)
      .max(20)
      .optional()
      .default(3)
      .describe('Number of context lines. Default: 3.'),
    format: z
      .enum(['semantic', 'unified', 'json'])
      .optional()
      .default('semantic')
      .describe(
        'Output format. "semantic" provides structured diff with line-level changes categorized as added/removed/modified. ' +
        '"unified" provides standard unified diff format. ' +
        '"json" provides machine-parseable structured output.',
      ),
  })
  .describe(
    'Show the differences (diff) for a file or files in the git working tree. ' +
    'Unlike a simple git diff, this provides structured output categorized by change type. ' +
    'Useful for reviewing changes before staging or committing.',
  )

const diffLineSchema = z.object({
  type: z.enum(['added', 'removed', 'unchanged']),
  content: z.string(),
  oldLineNumber: z.number().nullable(),
  newLineNumber: z.number().nullable(),
})

const diffHunkSchema = z.object({
  header: z.string(),
  lines: z.array(diffLineSchema),
})

const fileDiffSchema = z.object({
  filePath: z.string(),
  status: z.enum(['modified', 'added', 'deleted', 'renamed']),
  addedLines: z.number(),
  removedLines: z.number(),
  hunks: z.array(diffHunkSchema),
})

const outputValueSchema = z.object({
  files: z.array(fileDiffSchema),
  totalFiles: z.number(),
  totalAdded: z.number(),
  totalRemoved: z.number(),
  format: z.enum(['semantic', 'unified', 'json']),
})

export const advancedDiffParams = {
  toolName,
  endsAgentStep,
  description: `Show structured diffs for changed files in the working tree.

Provides categorized output with added/removed/modified lines, making it easy to understand exactly 
what changed in a file. Unlike standard git diff output, this categorizes each line by change type 
for easier reading by AI agents.

Example:
${$getNativeToolCallExampleString({
  toolName,
  inputSchema,
  input: {
    filePath: 'src/index.ts',
    stages: ['unstaged'],
    format: 'semantic',
  },
  endsAgentStep,
})}`.trim(),
  inputSchema,
  outputSchema: jsonToolResultSchema(outputValueSchema),
} satisfies $ToolParams
