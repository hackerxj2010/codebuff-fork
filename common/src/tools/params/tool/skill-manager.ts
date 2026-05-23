import z from 'zod/v4'

import { $getNativeToolCallExampleString, jsonToolResultSchema } from '../utils'

import type { $ToolParams } from '../../constants'

const toolName = 'skill_manager'
const endsAgentStep = true

const inputSchema = z
  .object({
    operation: z
      .enum(['create', 'delete', 'list', 'validate', 'show'])
      .describe(
        'Operation to perform on the skill registry:\n' +
        '- "create": Create a new skill from inline content. Skips if skill with same name already exists.\n' +
        '- "delete": Remove an existing skill by name.\n' +
        '- "list": List all available skills with descriptions.\n' +
        '- "validate": Validate a skill name and content without saving.\n' +
        '- "show": Show the full content of an existing skill.',
      ),
    name: z
      .string()
      .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Name must be lowercase alphanumeric with single hyphens')
      .min(1)
      .max(64)
      .optional()
      .describe(
        'Skill name for create/delete/show/validate operations. Required for those operations. ' +
        'Must be lowercase alphanumeric with hyphens as separators (e.g., "my-awesome-skill").',
      ),
    description: z
      .string()
      .min(1)
      .max(1024)
      .optional()
      .describe('Short description of what the skill does (1-1024 chars). Required for create.'),
    content: z
      .string()
      .optional()
      .describe(
        'The full content of the skill including instructions, examples, and any formatting. ' +
        'This content will be loaded when an agent uses the skill tool with this name. ' +
        'Should include clear instructions for the agent on how and when to use this skill. ' +
        'Can include markdown formatting. Required for create.',
      ),
    overwrite: z
      .boolean()
      .optional()
      .default(false)
      .describe('If true, overwrite an existing skill with the same name. Default: false.'),
  })
  .describe(
    'Manage the self-evolving skill registry. Skills are reusable instruction sets that agents can load ' +
    'on-demand. This tool allows creating new skills dynamically, for example when you discover a useful ' +
    'pattern or workflow that should be saved for future use. ' +
    'New skills are tested before being persisted to ensure they work correctly.',
  )

const skillSummarySchema = z.object({
  name: z.string(),
  description: z.string(),
  exists: z.boolean(),
})

const outputValueSchema = z.object({
  success: z.boolean(),
  operation: z.enum(['create', 'delete', 'list', 'validate', 'show']),
  message: z.string(),
  skill: z
    .object({
      name: z.string(),
      description: z.string(),
      content: z.string().optional(),
    })
    .optional(),
  skills: z.array(skillSummarySchema).optional(),
})

export const skillManagerParams = {
  toolName,
  endsAgentStep,
  description: `Manage the self-evolving skill registry for Codebuff agents.

Skills are reusable instruction sets that any agent can load on-demand via the skill tool. 
This tool lets you CREATE new skills (from patterns you discover), LIST existing skills, 
DELETE obsolete ones, or SHOW a skill's content.

When a new skill is created, it is validated and tested before being saved to the registry, 
ensuring it's ready for immediate use by any agent.

Example - Create a new skill:
${$getNativeToolCallExampleString({
  toolName,
  inputSchema,
  input: {
    operation: 'create',
    name: 'git-release-workflow',
    description: 'Instructions for creating a git release with changelog.',
    content: '# Git Release Workflow\n\nWhen asked to create a release:\n1. Run `git log --oneline` to see recent commits\n2. Categorize commits by type (feat/fix/chore/docs)\n3. Create a changelog entry\n4. Tag the release with `git tag`',
  },
  endsAgentStep,
})}

Example - List all skills:
${$getNativeToolCallExampleString({
  toolName,
  inputSchema,
  input: {
    operation: 'list',
  },
  endsAgentStep,
})}`.trim(),
  inputSchema,
  outputSchema: jsonToolResultSchema(outputValueSchema),
} satisfies $ToolParams
