/**
 * Union type of all available tool names
 */
export type ToolName =
  | 'add_message'
  | 'advanced_diff'
  | 'apply_patch'
  | 'ask_user'
  | 'ast_search'
  | 'batch'
  | 'code_search'
  | 'end_turn'
  | 'find_files'
  | 'git'
  | 'glob'
  | 'gravity_index'
  | 'list_directory'
  | 'lookup_agent_info'
  | 'multi_edit'
  | 'propose_str_replace'
  | 'propose_write_file'
  | 'read_docs'
  | 'read_files'
  | 'read_subtree'
  | 'read_url'
  | 'render_ui'
  | 'run_file_change_hooks'
  | 'run_terminal_command'
  | 'set_messages'
  | 'set_output'
  | 'skill'
  | 'skill_manager'
  | 'spawn_agents'
  | 'str_replace'
  | 'suggest_followups'
  | 'task_completed'
  | 'think_deeply'
  | 'todo_read'
  | 'web_search'
  | 'write_file'
  | 'write_todos'

/**
 * Map of tool names to their parameter types
 */
export interface ToolParamsMap {
  add_message: AddMessageParams
  apply_patch: ApplyPatchParams
  advanced_diff: AdvancedDiffParams
  ask_user: AskUserParams
  ast_search: AstSearchParams
  batch: BatchParams
  code_search: CodeSearchParams
  end_turn: EndTurnParams
  find_files: FindFilesParams
  git: GitParams
  glob: GlobParams
  gravity_index: GravityIndexParams
  list_directory: ListDirectoryParams
  lookup_agent_info: LookupAgentInfoParams
  multi_edit: MultiEditParams
  skill_manager: SkillManagerParams
  propose_str_replace: ProposeStrReplaceParams
  propose_write_file: ProposeWriteFileParams
  read_docs: ReadDocsParams
  read_files: ReadFilesParams
  read_subtree: ReadSubtreeParams
  read_url: ReadUrlParams
  render_ui: RenderUiParams
  run_file_change_hooks: RunFileChangeHooksParams
  run_terminal_command: RunTerminalCommandParams
  set_messages: SetMessagesParams
  set_output: SetOutputParams
  skill: SkillParams
  spawn_agents: SpawnAgentsParams
  str_replace: StrReplaceParams
  suggest_followups: SuggestFollowupsParams
  task_completed: TaskCompletedParams
  think_deeply: ThinkDeeplyParams
  todo_read: TodoReadParams
  web_search: WebSearchParams
  write_file: WriteFileParams
  write_todos: WriteTodosParams
}

/**
 * Add a new message to the conversation history.
 */
export interface AddMessageParams {
  role: 'user' | 'assistant'
  content: string
}

/**
 * Apply a file operation (create, update, or delete) using Codex-style apply_patch format.
 */
export interface ApplyPatchParams {
  operation: {
    type: 'create_file' | 'update_file' | 'delete_file'
    path: string
    diff?: string
  }
}

/**
 * Ask the user multiple choice questions and pause execution until they respond.
 */
export interface AskUserParams {
  questions: {
    question: string
    header?: string
    options: {
      label: string
      description?: string
    }[]
    multiSelect?: boolean
    validation?: {
      maxLength?: number
      minLength?: number
      pattern?: string
      patternError?: string
    }
  }[]
}

/**
 * Execute multiple tool calls in parallel and collect results.
 */
/**
 * Show structured diffs for changed files in the working tree.
 */
export interface AdvancedDiffParams {
  filePath: string
  stages?: ('staged' | 'unstaged' | 'working-tree')[]
  contextLines?: number
  format?: 'semantic' | 'unified' | 'json'
}

/**
 * Search code using AST pattern matching via tree-sitter/ast-grep.
 */
export interface AstSearchParams {
  pattern: string
  path?: string
  glob?: string
  language?: string
  maxResults?: number
  contextLines?: number
}

/**
 * Execute multiple tool calls in parallel and collect results.
 */
export interface BatchParams {
  calls: {
    toolName: string
    input: Record<string, unknown>
  }[]
}

/**
 * Search for string patterns in the project's files using ripgrep.
 */
export interface CodeSearchParams {
  pattern: string
  flags?: string
  cwd?: string
  maxResults?: number
}

/**
 * End your turn, regardless of any new tool results that might be coming.
 */
export interface EndTurnParams {}

/**
 * Find several files related to a brief natural language description.
 */
export interface FindFilesParams {
  prompt: string
}

/**
 * Execute a git operation (status, diff, log, commit, add, branch, checkout, stash, push, pull).
 */
export interface GitParams {
  operation: 'status' | 'diff' | 'diff_staged' | 'log' | 'commit' | 'add' | 'reset' | 'branch' | 'checkout' | 'stash' | 'push' | 'pull'
  args?: string[]
  message?: string
  paths?: string[]
  cwd?: string
}

/**
 * Search for files matching a glob pattern.
 */
export interface GlobParams {
  pattern: string
  cwd?: string
}

/**
 * Search, browse, inspect, or report integrations in the Gravity Index.
 */
export type GravityIndexParams =
  | {
      action: 'search'
      query: string
      search_id?: string
      context?: Record<string, any>
    }
  | {
      action: 'browse'
      category?: string
      q?: string
    }
  | {
      action: 'list_categories'
    }
  | {
      action: 'get_service'
      slug: string
    }
  | {
      action: 'report_integration'
      search_id: string
      integrated_slug: string
    }

/**
 * List files and directories in the specified path.
 */
export interface ListDirectoryParams {
  path: string
}

/**
 * Retrieve information about an agent by ID
 */
export interface LookupAgentInfoParams {
  agentId: string
}

/**
 * Apply multiple file edits atomically with fuzzy string matching.
 */
export interface MultiEditParams {
  operations: {
    filePath: string
    oldString: string
    newString: string
    allowMultiple?: boolean
  }[]
  atomic?: boolean
}

/**
 * Propose string replacements in a file without actually applying them.
 */
export interface ProposeStrReplaceParams {
  path: string
  replacements: {
    oldString: string
    newString: string
    allowMultiple?: boolean
  }[]
}

/**
 * Propose creating or editing a file without actually applying the changes.
 */
export interface ProposeWriteFileParams {
  path: string
  instructions: string
  content: string
}

/**
 * Fetch up-to-date documentation for libraries and frameworks using Context7 API.
 */
export interface ReadDocsParams {
  libraryTitle: string
  topic: string
  max_tokens?: number
}

/**
 * Read the multiple files from disk and return their contents.
 */
export interface ReadFilesParams {
  paths: string[]
}

/**
 * Read one or more directory subtrees.
 */
export interface ReadSubtreeParams {
  paths?: string[]
  maxTokens?: number
}

/**
 * Fetch a URL and extract readable text from the page.
 */
export interface ReadUrlParams {
  url: string
  max_chars?: number
}

/**
 * Render a small interactive UI widget in the Codebuff CLI.
 */
export interface RenderUiParams {
  widget: {
    type: 'button'
    text: string
    link: string
    variant?: 'primary' | 'secondary'
  }
}

/**
 * Parameters for run_file_change_hooks tool
 */
export interface RunFileChangeHooksParams {
  files: string[]
}

/**
 * Execute a CLI command from the project root.
 */
export interface RunTerminalCommandParams {
  command: string
  process_type?: 'SYNC' | 'BACKGROUND'
  cwd?: string
  timeout_seconds?: number
}

/**
 * Set the conversation history to the provided messages.
 */
export interface SetMessagesParams {
  messages: any
}

/**
 * JSON object to set as the agent output.
 */
export interface SetOutputParams {}

/**
 * Manage the self-evolving skill registry (create, delete, list, validate, show skills).
 */
export interface SkillManagerParams {
  operation: 'create' | 'delete' | 'list' | 'validate' | 'show'
  name?: string
  description?: string
  content?: string
  overwrite?: boolean
}

/**
 * Load a skill's full instructions when relevant to the current task.
 */
export interface SkillParams {
  name: string
}

/**
 * Spawn multiple agents and send a prompt and/or parameters to each of them.
 */
export interface SpawnAgentsParams {
  agents: {
    agent_type: string
    prompt?: string
    params?: Record<string, any>
  }[]
}

/**
 * Replace strings in a file with new strings.
 */
export interface StrReplaceParams {
  path: string
  replacements: {
    oldString: string
    newString: string
    allowMultiple?: boolean
  }[]
}

/**
 * Suggest clickable followup prompts to the user.
 */
export interface SuggestFollowupsParams {
  followups: {
    prompt: string
    label?: string
  }[]
}

/**
 * Signal that the task is complete.
 */
export interface TaskCompletedParams {}

/**
 * Deeply consider complex tasks by brainstorming approaches and tradeoffs step-by-step.
 */
export interface ThinkDeeplyParams {
  thought: string
}

/**
 * Read the current todo list for the session.
 */
export interface TodoReadParams {}

/**
 * Search the web for current information using Serper API.
 */
export interface WebSearchParams {
  query: string
  depth?: 'standard' | 'deep'
}

/**
 * Create or edit a file with the given content.
 */
export interface WriteFileParams {
  path: string
  instructions: string
  content: string
}

/**
 * Write a todo list to track tasks for multi-step implementations.
 */
export interface WriteTodosParams {
  todos: {
    task: string
    completed: boolean
  }[]
}

/**
 * Get parameters type for a specific tool
 */
export type GetToolParams<T extends ToolName> = ToolParamsMap[T]
