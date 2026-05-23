import z from 'zod/v4'

import { $getNativeToolCallExampleString, jsonToolResultSchema } from '../utils'

import type { $ToolParams } from '../../constants'

const toolName = 'ast_search'
const endsAgentStep = true

const inputSchema = z
  .object({
    pattern: z
      .string()
      .min(1)
      .describe(
        'The AST pattern to search for using tree-sitter. Supports metavariables like $VAR, $FUNC, etc. ' +
        'Examples:\n' +
        '- `function $NAME($$$PARAMS) { $$$BODY }` — find all function declarations\n' +
        '- `console.log($MSG)` — find all console.log calls\n' +
        '- `try { $$$TRY_BODY } catch($ERR) { $$$CATCH_BODY }` — find all try-catch blocks\n' +
        '- `import { $IMPORT } from $SOURCE` — find specific imports\n' +
        '- `class $CLASS { $$$BODY }` — find all class declarations',
      ),
    path: z
      .string()
      .optional()
      .describe('File or directory path to search within. Defaults to current directory.'),
    glob: z
      .string()
      .optional()
      .describe('Glob pattern to filter files (e.g., "**/*.ts", "**/*.go"). Wildcards supported.'),
    language: z
      .string()
      .optional()
      .describe(
        'Programming language of the AST pattern. Auto-detected from file extension if not provided. ' +
        'Supported: typescript, javascript, python, go, rust, java, c, cpp, ruby, php, swift, kotlin, scala, bash, sql, html, css, json, yaml, markdown',
      ),
    maxResults: z
      .number()
      .int()
      .min(1)
      .max(500)
      .optional()
      .default(50)
      .describe('Maximum number of matches to return. Default: 50, Max: 500.'),
    contextLines: z
      .number()
      .int()
      .min(0)
      .max(10)
      .optional()
      .default(2)
      .describe('Number of context lines before and after each match. Default: 2.'),
  })
  .describe(
    'Search code using AST (Abstract Syntax Tree) pattern matching via tree-sitter. ' +
    'More powerful than regex-based search because it understands code structure. ' +
    'Uses the ast-grep engine for semantic code search. ' +
    'Patterns use metavariables ($VAR, $$$BODY) to match any subtree. ' +
    'Supports all major programming languages.',
  )

const outputValueSchema = z.object({
  results: z.array(
    z.object({
      filePath: z.string(),
      lineNumber: z.number(),
      column: z.number(),
      matchedCode: z.string(),
      context: z.string().describe('Code context with surrounding lines.'),
      matchedNode: z.string().optional().describe('The AST node type that matched.'),
    }),
  ),
  total: z.number().describe('Total number of matches found.'),
  truncated: z.boolean().describe('Whether results were truncated due to maxResults limit.'),
  pattern: z.string(),
  language: z.string().optional(),
})

export const astSearchParams = {
  toolName,
  endsAgentStep,
  description: `Search code using AST (Abstract Syntax Tree) pattern matching.

This tool is much more powerful than regex-based search because it understands the structure of code. 
You can search for patterns like "all function declarations with a specific name", "all try-catch blocks", 
"all console.log calls", or "all imports from a specific source".

The pattern uses metavariables (like \\$VAR, \\$\\$\\$BODY) that match any code subtree at that position.

Example:
${$getNativeToolCallExampleString({
  toolName,
  inputSchema,
  input: {
    pattern: 'function $NAME($$$PARAMS) { $$$BODY }',
    path: 'src',
    glob: '**/*.ts',
    maxResults: 20,
  },
  endsAgentStep,
})}`.trim(),
  inputSchema,
  outputSchema: jsonToolResultSchema(outputValueSchema),
} satisfies $ToolParams
