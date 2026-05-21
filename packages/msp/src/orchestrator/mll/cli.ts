#!/usr/bin/env node
import { parseArgs } from 'node:util'
import { resolve } from 'node:path'
import { runMll } from './orchestrator.js'

const HELP = `msp-mll — Meta Learning Loop (MLL) CLI

Usage:
  msp-mll run --session-id <id> [--namespace <ns>] [--root <path>] [--force]
  msp-mll --help

Flags:
  --session-id <id>   Session ID to analyze (required)
  --namespace <ns>    Project namespace (default: evaAI)
  --root <path>       Workspace root (default: cwd)
  --force             Trigger distillation regardless of complexity
  --help              This message

Examples:
  msp-mll run --session-id sess-123 --force
`

async function main(): Promise<number> {
  let parsed
  try {
    parsed = parseArgs({
      args: process.argv.slice(2),
      options: {
        'session-id': { type: 'string' },
        namespace: { type: 'string', default: 'evaAI' },
        root: { type: 'string' },
        force: { type: 'boolean' },
        help: { type: 'boolean', short: 'h' },
      },
      allowPositionals: true,
    })
  } catch (err) {
    process.stderr.write(`error: ${(err as Error).message}\n${HELP}`)
    return 2
  }
  const { values, positionals } = parsed

  if (values.help || (positionals[0] !== 'run' && !values['session-id'])) {
    process.stdout.write(HELP)
    return 0
  }

  const root = resolve(values.root ?? process.cwd())
  const sessionId = values['session-id']!
  const namespace = values.namespace!

  try {
    const result = await runMll({
      root,
      sessionId,
      namespace,
      force: values.force
    })

    if (result.errors.length > 0) {
      process.stderr.write(`✗ MLL failed with ${result.errors.length} errors:\n`)
      for (const e of result.errors) process.stderr.write(`  - ${e}\n`)
      return 1
    }

    process.stdout.write(`✅ MLL run complete.\n`)
    process.stdout.write(`Suggested Skills: ${result.skillsSuggested.join(', ') || 'None'}\n`)

  } catch (err) {
    process.stderr.write(`✗ unexpected error: ${(err as Error).message}\n`)
    return 1
  }

  return 0
}

main()
  .then((code) => process.exit(code))
  .catch((err) => {
    process.stderr.write(`✗ fatal error: ${(err as Error).message}\n`)
    process.exit(2)
  })
