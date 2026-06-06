/**
 * Atomic index re-builder for MSP.
 *
 * Walks multiple potential knowledge base roots (vaults), parses YAML
 * frontmatter, and writes a unified `atomic_index.jsonl`.
 *
 * Path Strategy:
 *   Entries in the index store `path` relative to the MONOREPO ROOT.
 *   This ensures a unified addressing space across all monorepo tools.
 */

import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { parseArgs } from 'node:util'

import { parse as parseYaml } from 'yaml'

import { gksLayout, isAtomicId, normaliseStatus } from '@freshair129/gks'

interface IndexRow {
  id: string
  phase: number
  type: string
  status: string
  vault_id: string
  path: string
  title?: string
  tags?: string[]
  crosslinks?: Record<string, string[]>
  valid_from?: string
  valid_to?: string | null
  linked_symbols?: unknown[]
  geography?: string[]
  attributes?: Record<string, unknown>
}

async function* walkMarkdown(dir: string): AsyncGenerator<string> {
  let entries
  try {
    entries = await readdir(dir, { withFileTypes: true })
  } catch (err) {
    const e = err as NodeJS.ErrnoException
    if (e.code === 'ENOENT') return
    throw err
  }
  for (const entry of entries) {
    const p = join(dir, entry.name)
    if (entry.isDirectory()) {
      if (entry.name === '00_index' || entry.name === 'node_modules' || entry.name === '.git') continue
      yield* walkMarkdown(p)
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      yield p
    }
  }
}

function extractFrontmatter(text: string): Record<string, unknown> | null {
  if (!text.startsWith('---')) return null
  const end = text.indexOf('\n---', 3)
  if (end === -1) return null
  const fmText = text.slice(3, end).trim()
  try {
    const parsed = parseYaml(fmText)
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>
    }
    return null
  } catch {
    return null
  }
}

function asString(v: unknown): string | undefined {
  return typeof v === 'string' && v.length > 0 ? v : undefined
}

function asStringArray(v: unknown): string[] | undefined {
  if (!Array.isArray(v)) return undefined
  const out = v.filter((x): x is string => typeof x === 'string')
  return out.length > 0 ? out : undefined
}

function asPhase(v: unknown): number | undefined {
  if (typeof v === 'number' && Number.isInteger(v) && v >= 0 && v <= 6) return v
  if (typeof v === 'string') {
    const n = Number.parseInt(v, 10)
    if (Number.isFinite(n) && n >= 0 && n <= 6) return n
  }
  return undefined
}

function rowFromFrontmatter(
  fm: Record<string, unknown>,
  pathRel: string,
): { row: IndexRow | null; reason?: string } {
  const id = asString(fm['id'])
  if (!id) return { row: null, reason: 'missing id' }
  if (!isAtomicId(id)) return { row: null, reason: `invalid id format: ${id}` }

  const phase = asPhase(fm['phase'])
  if (phase === undefined) return { row: null, reason: 'missing/invalid phase' }

  const type = asString(fm['type'])
  if (!type) return { row: null, reason: 'missing type' }

  const status = normaliseStatus(asString(fm['status'])) ?? 'draft'
  const vault_id = asString(fm['vault_id']) ?? 'default'

  const row: IndexRow = { id, phase, type, status, vault_id, path: pathRel }

  const title = asString(fm['title'])
  if (title) row.title = title

  const tags = asStringArray(fm['tags'])
  if (tags) row.tags = tags

  if (fm['crosslinks'] && typeof fm['crosslinks'] === 'object' && !Array.isArray(fm['crosslinks'])) {
    const cl: Record<string, string[]> = {}
    for (const [k, v] of Object.entries(fm['crosslinks'] as Record<string, unknown>)) {
      const arr = asStringArray(v)
      if (arr) cl[k] = arr
    }
    if (Object.keys(cl).length > 0) row.crosslinks = cl
  }

  if (asString(fm['valid_from'])) row.valid_from = asString(fm['valid_from'])
  if (fm['valid_to'] === null) row.valid_to = null
  else if (asString(fm['valid_to'])) row.valid_to = asString(fm['valid_to'])

  if (Array.isArray(fm['linked_symbols'])) {
    const filtered = fm['linked_symbols'].filter(
      (s) =>
        s &&
        typeof s === 'object' &&
        !Array.isArray(s) &&
        typeof (s as { file?: unknown }).file === 'string',
    )
    if (filtered.length > 0) row.linked_symbols = filtered
  }

  const geography = asStringArray(fm['geography'])
  if (geography) row.geography = geography

  if (fm['attributes'] && typeof fm['attributes'] === 'object' && !Array.isArray(fm['attributes'])) {
    row.attributes = fm['attributes'] as Record<string, unknown>
  }

  return { row }
}

async function main(): Promise<void> {
  const { values } = parseArgs({
    args: process.argv.slice(2),
    options: {
      root: { type: 'string' },
      'dry-run': { type: 'boolean' },
      verbose: { type: 'boolean' },
    },
  })
  const root = resolve(values['root'] ?? process.cwd())
  const dryRun = values['dry-run'] === true
  const verbose = values['verbose'] === true

  const layout = gksLayout(root)
  console.log(`[index] target:      ${layout.atomicIndex}${dryRun ? '  (dry-run)' : ''}`)

  const rows: IndexRow[] = []
  const skipped: Array<{ path: string; reason: string }> = []
  let scanned = 0

  // VAULT ROOTS
  const modernBrain = layout.gks
  const canonDir = resolve(root, 'gks')
  const legacyBrain = resolve(root, '.brain', 'gks')

  const scanDir = (dir: string, name: string) => {
    if (!existsSync(dir)) return null
    return { dir, name, vaultRoot: dir }
  }

  const roots = [
    { dir: modernBrain, name: 'brain', vaultRoot: modernBrain },
    { dir: canonDir, name: 'canon', vaultRoot: canonDir },
    { dir: legacyBrain, name: 'legacy-brain', vaultRoot: legacyBrain },
  ].filter((r) => existsSync(r.dir))

  // Dedupe by absolute path
  const seenRoots = new Set<string>()
  const finalRoots = roots.filter(r => {
    const abs = resolve(r.dir)
    if (seenRoots.has(abs)) return false
    seenRoots.add(abs)
    return true
  })

  for (const r of finalRoots) {
    console.log(`[index] scanning ${r.name}:  ${r.dir}`)
    for await (const file of walkMarkdown(r.dir)) {
      scanned++
      
      // REPO-RELATIVE: Essential for monorepo-wide addressing and hard-governance resolution.
      const pathRelRoot = relative(root, file).replace(/\\/g, '/')
      
      let text: string
      try {
        text = await readFile(file, 'utf8')
      } catch {
        skipped.push({ path: pathRelRoot, reason: 'read error' })
        continue
      }

      const fm = extractFrontmatter(text)
      if (!fm) {
        skipped.push({ path: pathRelRoot, reason: 'no frontmatter' })
        continue
      }

      const { row, reason } = rowFromFrontmatter(fm, pathRelRoot)
      if (!row) {
        skipped.push({ path: pathRelRoot, reason: reason ?? 'invalid' })
        continue
      }
      rows.push(row)
      if (verbose) console.log(`  + ${row.id}  ${pathRelRoot}`)
    }
  }

  const seenIds = new Set<string>()
  const deduped: IndexRow[] = []
  let duplicates = 0
  for (const r of rows) {
    if (seenIds.has(r.id)) {
      duplicates++
      continue
    }
    seenIds.add(r.id)
    deduped.push(r)
  }

  deduped.sort((a, b) => a.id.localeCompare(b.id))

  console.log(`[index] scanned:     ${scanned}`)
  console.log(`[index] indexed:     ${deduped.length}`)
  console.log(`[index] skipped:     ${skipped.length}`)
  console.log(`[index] duplicates:  ${duplicates}`)

  if (dryRun) {
    console.log('[index] dry-run — no write')
    return
  }

  const body = deduped.map((r) => JSON.stringify(r)).join('\n') + (deduped.length > 0 ? '\n' : '')
  
  // Materialize the index at the adaptive layout path
  await mkdir(dirname(layout.atomicIndex), { recursive: true })
  await writeFile(layout.atomicIndex, body, 'utf8')
  console.log(`[index] wrote ${layout.atomicIndex}`)

  // Mirror to legacy path if it exists for tool compatibility
  const legacyIndexFile = resolve(root, '.brain', 'gks', '00_index', 'atomic_index.jsonl')
  if (resolve(layout.atomicIndex) !== legacyIndexFile && existsSync(dirname(dirname(legacyIndexFile)))) {
    await mkdir(dirname(legacyIndexFile), { recursive: true })
    await writeFile(legacyIndexFile, body, 'utf8')
    console.log(`[index] mirrored to legacy path: ${legacyIndexFile}`)
  }
}

main().catch((err) => {
  console.error('[index] failed:', (err as Error).message)
  process.exit(1)
})
