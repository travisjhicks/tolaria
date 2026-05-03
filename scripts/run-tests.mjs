import { spawnSync } from 'node:child_process'

const testArgs = process.argv.slice(2)
if (testArgs[0] === '--') {
  testArgs.shift()
}

const workspaceTarget = findWorkspaceTarget(testArgs)
if (workspaceTarget) {
  run('pnpm', [
    '--filter',
    workspaceTarget.filter,
    'exec',
    'vitest',
    'run',
    '--config',
    'vitest.config.ts',
    ...workspaceTarget.args,
  ])
  process.exit(0)
}

run('pnpm', ['exec', 'vitest', 'run', ...testArgs])

if (isFullSuite(testArgs)) {
  run('pnpm', ['--filter', './apps/*', 'test', '--', ...testArgs])
  run('pnpm', ['--filter', './packages/*', 'test', '--', ...testArgs])
}

function run(command, args) {
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    shell: process.platform === 'win32',
  })

  if (result.error) {
    throw result.error
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }
}

function findWorkspaceTarget(args) {
  const workspacePaths = ['./apps/mobile', './packages/markdown']
  return workspacePaths.map((workspacePath) => rebaseArgs(workspacePath, args)).find(Boolean)
}

function rebaseArgs(workspacePath, args) {
  const prefix = `${workspacePath.slice(2)}/`
  if (!args.some((arg) => arg.startsWith(prefix))) {
    return null
  }

  return {
    filter: workspacePath,
    args: args.map((arg) => arg.startsWith(prefix) ? arg.slice(prefix.length) : arg),
  }
}

function isFullSuite(args) {
  return args.every((arg) => arg.startsWith('-'))
}
