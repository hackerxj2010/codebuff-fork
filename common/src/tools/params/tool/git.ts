import z from 'zod/v4'

import { $getNativeToolCallExampleString, jsonToolResultSchema } from '../utils'

import type { $ToolParams } from '../../constants'

const toolName = 'git'
const endsAgentStep = true
const inputSchema = z
  .object({
    operation: z
      .enum([
        'status',
        'diff',
        'diff_staged',
        'log',
        'commit',
        'add',
        'reset',
        'branch',
        'checkout',
        'stash',
        'push',
        'pull',
      ])
      .describe(
        'The git operation to perform (e.g., status, diff, commit, push).',
      ),
    args: z
      .array(z.string())
      .optional()
      .describe('Additional git arguments to pass to the command.'),
    message: z
      .string()
      .optional()
      .describe('Commit message (required for commit operation).'),
    paths: z
      .array(z.string())
      .optional()
      .describe('File paths for add/reset/checkout operations.'),
    cwd: z
      .string()
      .optional()
      .describe(
        'Working directory for the git command. Defaults to project root.',
      ),
  })
  .describe(
    `Execute a git operation (status, diff, log, commit, add, branch, checkout, stash, push, pull). This is a convenient wrapper around common git commands.`,
  )

const description = `
Git operations tool. Use this for all git-related tasks instead of run_terminal_command.

Supported operations:
- **status**: Show working tree status
- **diff**: Show unstaged changes
- **diff_staged**: Show staged changes
- **log**: Show recent commit history
- **commit**: Create a new commit
- **add**: Stage files
- **reset**: Unstage files
- **branch**: List branches
- **checkout**: Switch branches or restore files
- **stash**: Stash changes
- **push**: Push commits to remote
- **pull**: Pull changes from remote

Example:
${$getNativeToolCallExampleString({
  toolName,
  inputSchema,
  input: {
    operation: 'status',
  },
  endsAgentStep,
})}

${$getNativeToolCallExampleString({
  toolName,
  inputSchema,
  input: {
    operation: 'log',
    args: ['--oneline', '-5'],
  },
  endsAgentStep,
})}

${$getNativeToolCallExampleString({
  toolName,
  inputSchema,
  input: {
    operation: 'commit',
    message: 'feat: add new feature',
    args: ['--amend'],
  },
  endsAgentStep,
})}
`.trim()

export const gitParams = {
  toolName,
  description,
  endsAgentStep,
  inputSchema,
  outputSchema: jsonToolResultSchema(
    z.object({
      operation: z.string().describe('The git operation that was performed'),
      stdout: z.string().optional().describe('Standard output from the command'),
      stderr: z.string().optional().describe('Error output from the command'),
      exitCode: z.number().describe('Exit code (0 = success)'),
    }),
  ),
} satisfies $ToolParams
