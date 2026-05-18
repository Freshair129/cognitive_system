#!/usr/bin/env node
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { parseArgs } from 'node:util'

import { parse as parseYaml } from 'yaml'

import { loadAtomicIndex } from './index.js'
import {
  AtrophyStatus,
  getAtrophyStatus,
  parseValidUntil,
} from './utils/atrophy.js'
import { ValidatorIOError } from './types.js'

const HELP = `msp-atrophy — scan and report atrophied (expired) GKS atoms

Usage:
  msp-atrophy report [--root=<dir>] [--json]
  msp-atrophy --help

Flags:
  --root=<dir>       project root (default: cwd)
  --index=<path>     atomic index path (default: <root>/gks/00_index/atomic_index.jsonl)
  --json             machine-readable output
  --help             this message

Examples:
  msp-atrophy report
  msp-atrophy report --json > atrophy.json
`

interface AtrophyReportEntry {
  id: string
  status: AtrophyStatus
  daysUntilExpiry: number
  validUntil: string
  title: string
  path: string
}

function parseFrontmatter(raw: string): Record<string, unknown> | null {
  const m = raw.match(/^---\s*\n([\s\S]*?)\n---/)
  if (!m) return null
  try {
    const parsed = parseYaml(m[1]!)
    if (parsed === null || typeof parsed !== 'object') return null
    return parsed as Record<string, unknown>
  } catch {
    return null
  }
}

async function main(): Promise<number> {
  let parsed
  try {
    parsed = parseArgs({
      args: process.argv.slice(2),
      options: {
        root: { type: 'string' },
        index: { type: 'string' },
        json: { type: 'boolean' },
        help: { type: 'boolean', short: 'h' },
      },
      allowPositionals: true,
    })
  } catch (err) {
    process.stderr.write(`error: ${(err as Error).message}\n${HELP}`)
    return 2
  }
  const { values } = parsed

  if (values.help) {
    process.stdout.write(HELP)
    return 0
  }

  const root = resolve(values.root ?? process.cwd())
  const indexPath = resolve(
    values.index ?? `${root}/gks/00_index/atomic_index.jsonl`,
  )

  let atomicIndex
  try {
    atomicIndex = await loadAtomicIndex(indexPath)
  } catch (err) {
    if (err instanceof ValidatorIOError) {
      process.stderr.write(`✗ ${err.message}\n`)
      return 2
    }
    throw err
  }

  const report: AtrophyReportEntry[] = []
  const now = new Date()

  for (const atom of atomicIndex.values()) {
    if (atom.status === 'superseded') continue

    const fullPath = resolve(root, 'gks', atom.path)
    let raw: string
    try {
      raw = await readFile(fullPath, 'utf8')
    } catch {
      continue
    }

    const fm = parseFrontmatter(raw)
    if (!fm) continue

    const validUntilRaw = parseValidUntil(fm['valid_until'])
    if (validUntilRaw === null) continue

    const atrophy = getAtrophyStatus(validUntilRaw, now)
    if (!atrophy) continue

    if (atrophy.status !== AtrophyStatus.HEALTHY) {
      report.push({
        id: atom.id,
        status: atrophy.status,
        daysUntilExpiry: atrophy.daysUntilExpiry,
        validUntil: atrophy.validUntil,
        title: atom.title ?? 'Untitled',
        path: atom.path,
      })
    }
  }

  // Sort: Expired first (most negative days first), then near-expiry
  report.sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry)

  if (values.json) {
    process.stdout.write(JSON.stringify(report, null, 2) + '\n')
  } else {
    if (report.length === 0) {
      process.stdout.write('✓ No atrophied atoms found.\n')
      return 0
    }

    process.stdout.write(`Atrophy Report (${report.length} items):\n\n`)
    process.stdout.write(
      `${'ID'.padEnd(35)} | ${'Status'.padEnd(10)} | ${'Days'.padEnd(8)} | Title\n`,
    )
    process.stdout.write(`${'-'.repeat(35)}-+-${'-'.repeat(10)}-+-${'-'.repeat(8)}-+----------\n`)

    for (const e of report) {
      const statusIcon = e.status === AtrophyStatus.EXPIRED ? '🔴 EXPIRED' : '🟡 WARN   '
      const days = e.daysUntilExpiry.toString().padStart(6)
      process.stdout.write(
        `${e.id.padEnd(35)} | ${statusIcon.padEnd(10)} | ${days.padEnd(8)} | ${e.title}\n`,
      )
    }
    process.stdout.write('\n')
  }

  return 0
}

main()
  .then((code) => process.exit(code))
  .catch((err) => {
    process.stderr.write(`✗ unexpected error: ${(err as Error).message}\n`)
    process.exit(2)
  })
