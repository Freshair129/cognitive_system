#!/usr/bin/env node
import { parseArgs } from 'node:util'
import { resolve } from 'node:path'
import { judgeContradiction } from './contradiction-judge.js'

const HELP = `msp-judge — Semantic Contradiction Detection for GKS atoms

Usage:
  msp-judge check <file> [options]

Options:
  --root <dir>       Project root (default: .)
  --hops <n>         Number of graph hops to search (default: 2)
  --limit <n>        Max number of context atoms (default: 5)
  --json             Output as raw JSON
  --help             Show this message
`

async function main(): Promise<number> {
  const { values, positionals } = parseArgs({
    options: {
      root: { type: 'string' },
      hops: { type: 'string' },
      limit: { type: 'string' },
      json: { type: 'boolean' },
      help: { type: 'boolean' },
    },
    allowPositionals: true,
  })

  if (values.help || positionals.length < 2 || positionals[0] !== 'check') {
    process.stdout.write(HELP)
    return 0
  }

  const file = positionals[1]!
  const root = values.root || process.cwd()
  const hops = values.hops ? parseInt(values.hops, 10) : 2
  const limit = values.limit ? parseInt(values.limit, 10) : 5

  try {
    const result = await judgeContradiction(resolve(root, file), { root, hops, limit })

    if (values.json) {
      process.stdout.write(JSON.stringify(result, null, 2) + '\n')
    } else {
      process.stdout.write(`\n--- Semantic Contradiction Audit ---\n`)
      process.stdout.write(`File: ${file}\n`)
      process.stdout.write(`Neighbors checked: ${result.neighbors_checked.length}\n`)
      
      if (result.contradictions.length === 0) {
        process.stdout.write(`✓ No contradictions detected.\n`)
      } else {
        process.stdout.write(`✗ ${result.contradictions.length} potential contradictions found:\n\n`)
        for (const c of result.contradictions) {
          process.stdout.write(`[${c.severity.toUpperCase()}] Conflict with ${c.old_atom}\n`)
          process.stdout.write(`  Old claim: "${c.claim}"\n`)
          process.stdout.write(`  New claim: "${c.new_claim}"\n`)
          process.stdout.write(`  Rationale: ${c.rationale}\n\n`)
        }
        process.stdout.write(`Note: Machine judgment is advisory. Reviewer must make final decision.\n`)
      }
    }

    return result.ok ? 0 : 0 // Always exit 0 as it is advisory, or 0 if we want to not block CI
  } catch (err) {
    process.stderr.write(`✗ error: ${(err as Error).message}\n`)
    return 1
  }
}

main().then((code) => process.exit(code))
