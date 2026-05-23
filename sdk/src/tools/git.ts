import { spawn } from 'child_process'
import * as path from 'path'

import type { CodebuffToolOutput } from '../../../common/src/tools/list'

const GIT_TIMEOUT_MS = 60_000
const OUTPUT_LIMIT = 50_000

export async function gitTool(params: {
  operation: string
  args?: string[]
  message?: string
  paths?: string[]
  cwd?: string
  projectPath: string
}): Promise<CodebuffToolOutput<'git'>> {
  const { operation, args, cwd, projectPath } = params

  const resolvedCwd = cwd ? path.resolve(projectPath, cwd) : projectPath

  return new Promise((resolve) => {
    const gitArgs = buildGitArgs(operation, params)
    const childProcess = spawn('git', gitArgs, {
      cwd: resolvedCwd,
      stdio: 'pipe',
    })

    let stdout = ''
    let stderr = ''
    let timer: ReturnType<typeof setTimeout> | null = null

    timer = setTimeout(() => {
      childProcess.kill('SIGTERM')
      resolve([
        {
          type: 'json',
          value: {
            operation,
            stdout: stdout.substring(0, OUTPUT_LIMIT),
            stderr: `Command timed out after 60 seconds\n${stderr}`.substring(0, OUTPUT_LIMIT),
            exitCode: -1,
          },
        },
      ])
    }, GIT_TIMEOUT_MS)

    childProcess.stdout.on('data', (data: Buffer) => {
      stdout += data.toString()
    })

    childProcess.stderr.on('data', (data: Buffer) => {
      stderr += data.toString()
    })

    childProcess.on('close', (exitCode) => {
      if (timer) clearTimeout(timer)

      const truncatedStdout = stdout.substring(0, OUTPUT_LIMIT)
      const truncatedStderr = stderr.substring(0, OUTPUT_LIMIT)

      resolve([
        {
          type: 'json',
          value: {
            operation,
            stdout: truncatedStdout,
            ...(truncatedStderr ? { stderr: truncatedStderr } : {}),
            exitCode: exitCode ?? -1,
          },
        },
      ])
    })

    childProcess.on('error', (error) => {
      if (timer) clearTimeout(timer)
      resolve([
        {
          type: 'json',
          value: {
            operation,
            stdout: '',
            stderr: `Failed to spawn git: ${error.message}`,
            exitCode: -1,
          },
        },
      ])
    })
  })
}

function buildGitArgs(operation: string, params: { args?: string[]; message?: string; paths?: string[] }): string[] {
  switch (operation) {
    case 'status':
      return ['status', '--short', '--branch', ...(params.args ?? [])]
    case 'diff':
      return ['diff', ...(params.paths ?? []), ...(params.args ?? [])]
    case 'diff_staged':
      return ['diff', '--staged', ...(params.args ?? [])]
    case 'log':
      return ['log', '--oneline', '-20', ...(params.args ?? [])]
    case 'commit':
      return ['commit', '-m', params.message ?? 'chore: auto-commit', ...(params.args ?? [])]
    case 'add':
      return ['add', ...(params.paths ?? ['.']), ...(params.args ?? [])]
    case 'reset':
      return ['reset', ...(params.paths ?? []), ...(params.args ?? [])]
    case 'branch':
      return ['branch', '-v', ...(params.args ?? [])]
    case 'checkout':
      return ['checkout', ...(params.args ?? [])]
    case 'stash':
      return ['stash', ...(params.args ?? [])]
    case 'push':
      return ['push', ...(params.args ?? [])]
    case 'pull':
      return ['pull', ...(params.args ?? [])]
    default:
      return [operation, ...(params.args ?? [])]
  }
}
