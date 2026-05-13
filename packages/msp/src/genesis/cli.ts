#!/usr/bin/env node
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'
import { parseArgs } from 'node:util'

import { executeBlock } from './executor.js'
import type { ExecuteResult } from './types.js'

const HELP = `msp-genesis-exec — execute a Genesis Block by id

Usage:
  msp-genesis-exec <blockId> --prompt "<text>" [flags]
  msp-genesis-exec --help

Arguments:
  <blockId>           bare block slug, e.g. IDENTITY-ENGINE
                      (the runtime looks for GENESIS--<blockId>.md)

Flags:
  --prompt=<text>     user-facing runtime input (required)
  --tier=<T1|T2|T3>   override automatic tier routing
  --root=<dir>        project root (default: cwd)
  --json              emit ExecuteResult as JSON instead of plain text
  --help              show this message

Exit codes:
  0  execution succeeded
  1  execution failed (manifest missing, dispatch error, etc.)
  2  bad usage / parse error
`

const VALID_TIERS = ['T1', 'T2', 'T3'] as const
type Tier = (typeof VALID_TIERS)[number]

function isTier(value: string): value is Tier {
  return (VALID_TIERS as readonly string[]).includes(value)
}

export async function main(): Promise<number> {
  let parsed
  try {
    parsed = parseArgs({
      args: process.argv.slice(2),
      options: {
        prompt: { type: 'string' },
        tier: { type: 'string' },
        root: { type: 'string' },
        json: { type: 'boolean' },
        help: { type: 'boolean' },
      },
      allowPositionals: true,
    })
  } catch (err) {
    process.stderr.write(`error: ${(err as Error).message}\n${HELP}`)
    return 2
  }
  const { values, positionals } = parsed

  if (values.help) {
    process.stdout.write(HELP)
    return 0
  }

  if (positionals.length === 0) {
    process.stderr.write(`error: no blockId given\n${HELP}`)
    return 2
  }
  const blockId = positionals[0]!

  if (typeof values.prompt !== 'string' || values.prompt.length === 0) {
    process.stderr.write(`error: --prompt is required\n${HELP}`)
    return 2
  }
  const prompt = values.prompt

  let tier: Tier | undefined
  if (values.tier !== undefined) {
    if (!isTier(values.tier)) {
      process.stderr.write(
        `error: --tier must be one of ${VALID_TIERS.join('|')}, got "${values.tier}"\n${HELP}`,
      )
      return 2
    }
    tier = values.tier
  }

  const root = resolve(values.root ?? process.cwd())

  let result: ExecuteResult
  try {
    result = await executeBlock(blockId, {
      root,
      prompt,
      ...(tier ? { tier } : {}),
    })
  } catch (err) {
    process.stderr.write(`✗ genesis-exec error: ${(err as Error).message}\n`)
    return 1
  }

  if (values.json) {
    process.stdout.write(JSON.stringify(result, null, 2) + '\n')
  } else {
    process.stdout.write(result.output)
    if (!result.output.endsWith('\n')) process.stdout.write('\n')
    process.stderr.write(
      `[genesis] block=${result.block_id} tier=${result.tier_used} members=${result.members_loaded} duration_ms=${result.duration_ms}\n`,
    )
  }
  return 0
}

function isDirectInvocation(): boolean {
  const entry = process.argv[1]
  if (!entry) return false
  const here = fileURLToPath(import.meta.url)
  return entry === here || entry === here.replace(/\.ts$/, '.js')
}

if (isDirectInvocation()) {
  main()
    .then((code) => process.exit(code))
    .catch((err) => {
      process.stderr.write(`✗ unexpected: ${(err as Error).message}\n`)
      process.exit(2)
    })
}
