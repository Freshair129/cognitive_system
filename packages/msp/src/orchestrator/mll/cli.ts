#!/usr/bin/env node
import { parseArgs } from 'node:util'
import { resolve } from 'node:path'
import { distillSkillFromEpisodes } from './skill-creator.js'

const HELP = `msp-mll — Meta-Learning Loop CLI

Usage:
  msp-mll distill [options]

Options:
  --root <dir>       Project root (default: .)
  --limit <n>        Max number of episodes to analyze (default: 5)
  --ns <name>        Namespace/Tenant ID (default: default)
  --help             Show this message
`

async function main(): Promise<number> {
  const { values, positionals } = parseArgs({
    options: {
      root: { type: 'string' },
      limit: { type: 'string' },
      ns: { type: 'string' },
      help: { type: 'boolean' },
    },
    allowPositionals: true,
  })

  if (values.help || positionals.length === 0 || positionals[0] !== 'distill') {
    process.stdout.write(HELP)
    return 0
  }

  const root = values.root || process.cwd()
  const limit = values.limit ? parseInt(values.limit, 10) : 5
  const namespace = values.ns || 'default'

  try {
    process.stdout.write(`[mll] Distilling skills from recent episodes (limit: ${limit})...\n`)
    
    const results = await distillSkillFromEpisodes({ root, limit, namespace })

    if (results.length === 0) {
      process.stdout.write(`✓ No new skills identified.\n`)
    } else {
      process.stdout.write(`✓ Distillation complete. Created ${results.length} skill candidates:\n`)
      for (const r of results) {
        process.stdout.write(`  - ${r.skill_id} (from ${r.source_episodes.length} episodes)\n`)
      }
      process.stdout.write(`\nCheck .brain/msp/projects/${namespace}/candidates/ for details.\n`)
    }

    return 0
  } catch (err) {
    process.stderr.write(`✗ error: ${(err as Error).message}\n`)
    return 1
  }
}

main().then((code) => process.exit(code))
