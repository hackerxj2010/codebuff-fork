// Tool handlers for the Codebuff SDK
import { changeFile } from './change-file'
import { codeSearch } from './code-search'
import { glob } from './glob'
import { listDirectory } from './list-directory'
import { getFiles } from './read-files'
import { runFileChangeHooks } from './run-file-change-hooks'
import { advancedDiffTool } from './advanced-diff'
import { astSearchTool } from './ast-search'
import { batchTool } from './batch'
import { gitTool } from './git'
import { multiEditTool } from './multi-edit'
import { skillManagerTool } from './skill-manager'
import { runTerminalCommand } from './run-terminal-command'

// Export tools under Tools namespace
export const ToolHelpers = {
  runTerminalCommand,
  codeSearch,
  glob,
  listDirectory,
  getFiles,
  runFileChangeHooks,
  changeFile,
  advancedDiffTool,
  astSearchTool,
  gitTool,
  batchTool,
  multiEditTool,
  skillManagerTool,
}
