import { readFile, readdir, stat } from 'node:fs/promises'
import { join, resolve } from 'node:path'

import { parse as parseYaml } from 'yaml'

import {
  DIMENSIONS,
  type Dimension,
  type GenesisManifest,
  type LoadedMember,
  type LoadedMembers,
} from './types.js'

const FRONTMATTER_DELIM = '---'

/**
 * Canonical subdirectory under `<root>/gks/` for each dimension.
 *
 * Mirrors `packages/msp/src/brain/project-vault.ts` so the runtime stays
 * consistent with the rest of MSP's atom layout.
 */
const DIMENSION_DIR: Record<Dimension, string> = {
  cognitive: 'cognitive',
  algo: 'algo',
  concept: 'concept',
  runbook: 'runbook',
  params: 'params',
}

interface ParsedAtom {
  fm: Record<string, unknown>
  body: string
}

/**
 * Parse a markdown atom into `{ fm, body }`. Returns `null` on malformed
 * input. Tolerates CRLF and atoms with no body.
 */
function parseAtom(source: string): ParsedAtom | null {
  const normalised = source.replace(/\r\n/g, '\n')
  if (!normalised.startsWith(`${FRONTMATTER_DELIM}\n`)) return null
  const end = normalised.indexOf(
    `\n${FRONTMATTER_DELIM}`,
    FRONTMATTER_DELIM.length,
  )
  if (end === -1) return null
  const fmText = normalised.slice(FRONTMATTER_DELIM.length, end).trim()
  let fm: unknown
  try {
    fm = parseYaml(fmText)
  } catch {
    return null
  }
  if (!fm || typeof fm !== 'object' || Array.isArray(fm)) return null
  const bodyStart = end + `\n${FRONTMATTER_DELIM}`.length
  const body = normalised.slice(bodyStart).replace(/^\n/, '')
  return { fm: fm as Record<string, unknown>, body }
}

async function pathExists(p: string): Promise<boolean> {
  try {
    await stat(p)
    return true
  } catch {
    return false
  }
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  const out: string[] = []
  for (const item of value) {
    if (typeof item === 'string' && item.length > 0) out.push(item)
  }
  return out
}

/**
 * Pull `members.<dim>` out of the parsed frontmatter, supporting both the
 * SPEC's nested `members.core.<dim>` / `members.optional.<dim>` shape and a
 * flatter `members.<dim>` shape. The five core dimensions are the only
 * ones the runtime cares about; the optional buckets (guard/safety/stack…)
 * are silently ignored here.
 */
function extractMembers(
  fm: Record<string, unknown>,
): GenesisManifest['members'] {
  const membersRaw = fm['members']
  if (!membersRaw || typeof membersRaw !== 'object' || Array.isArray(membersRaw)) {
    return {}
  }
  const m = membersRaw as Record<string, unknown>
  const core = m['core']
  const out: GenesisManifest['members'] = {}

  const collectFrom = (source: Record<string, unknown>): void => {
    for (const dim of DIMENSIONS) {
      const ids = asStringArray(source[dim])
      if (ids.length === 0) continue
      const existing = out[dim] ?? []
      out[dim] = [...existing, ...ids]
    }
  }

  if (core && typeof core === 'object' && !Array.isArray(core)) {
    collectFrom(core as Record<string, unknown>)
  } else {
    // Flat shape: members.<dim> directly.
    collectFrom(m)
  }
  return out
}

function extractDaci(
  fm: Record<string, unknown>,
): GenesisManifest['daci'] | undefined {
  const raw = fm['daci']
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined
  const r = raw as Record<string, unknown>
  const driver = typeof r['driver'] === 'string' ? (r['driver'] as string) : undefined
  const approverRaw = r['approver']
  const approver =
    typeof approverRaw === 'string'
      ? approverRaw
      : Array.isArray(approverRaw) && approverRaw.length > 0 && typeof approverRaw[0] === 'string'
        ? (approverRaw[0] as string)
        : undefined
  const contributor = asStringArray(r['contributor'])
  const informed = asStringArray(r['informed'])
  const daci: NonNullable<GenesisManifest['daci']> = {}
  if (driver !== undefined) daci.driver = driver
  if (approver !== undefined) daci.approver = approver
  if (contributor.length > 0) daci.contributor = contributor
  if (informed.length > 0) daci.informed = informed
  return Object.keys(daci).length > 0 ? daci : undefined
}

/**
 * Locate the manifest file for a given `blockId` (e.g. `IDENTITY-ENGINE`).
 *
 * Looks under `<root>/gks/genesis/GENESIS--<blockId>.md` first (canonical
 * per `SPEC--GENESIS-BLOCK-MANIFEST` §2). If that misses, recursively
 * scans `<root>/gks/` for any `GENESIS--<blockId>.md`.
 */
async function findManifestFile(
  blockId: string,
  root: string,
): Promise<string | null> {
  const filename = `GENESIS--${blockId}.md`
  const canonical = resolve(root, 'gks/genesis', filename)
  if (await pathExists(canonical)) return canonical
  const gksDir = resolve(root, 'gks')
  if (!(await pathExists(gksDir))) return null
  return scanForFile(gksDir, filename)
}

async function scanForFile(dir: string, filename: string): Promise<string | null> {
  let entries: import('node:fs').Dirent[]
  try {
    entries = await readdir(dir, { withFileTypes: true })
  } catch {
    return null
  }
  for (const entry of entries) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      const found = await scanForFile(full, filename)
      if (found) return found
    } else if (entry.isFile() && entry.name === filename) {
      return full
    }
  }
  return null
}

/**
 * Load and parse a `GENESIS--<blockId>` manifest atom.
 *
 * Throws when the file is missing or the frontmatter cannot be parsed.
 * The returned `GenesisManifest.id` is the bare `blockId` (not prefixed).
 */
export async function loadManifest(
  blockId: string,
  root: string,
): Promise<GenesisManifest> {
  const filepath = await findManifestFile(blockId, root)
  if (filepath === null) {
    throw new Error(
      `loadManifest: GENESIS--${blockId}.md not found under ${resolve(root, 'gks')}`,
    )
  }
  let raw: string
  try {
    raw = await readFile(filepath, 'utf8')
  } catch (err) {
    throw new Error(
      `loadManifest: failed to read ${filepath}: ${(err as Error).message}`,
    )
  }
  const parsed = parseAtom(raw)
  if (parsed === null) {
    throw new Error(`loadManifest: malformed frontmatter in ${filepath}`)
  }
  const fmId = parsed.fm['id']
  if (typeof fmId !== 'string') {
    throw new Error(`loadManifest: missing or non-string \`id\` in ${filepath}`)
  }
  return {
    id: blockId,
    members: extractMembers(parsed.fm),
    ...(extractDaci(parsed.fm) ? { daci: extractDaci(parsed.fm)! } : {}),
  }
}

/**
 * Resolve one member id to a file path. Tries `gks/<dim>/<id>.md` first,
 * then recursively scans `gks/`. Returns `null` if the atom is not found.
 */
async function findMemberFile(
  id: string,
  dimension: Dimension,
  root: string,
): Promise<string | null> {
  const filename = `${id}.md`
  const canonical = resolve(root, 'gks', DIMENSION_DIR[dimension], filename)
  if (await pathExists(canonical)) return canonical
  const gksDir = resolve(root, 'gks')
  if (!(await pathExists(gksDir))) return null
  return scanForFile(gksDir, filename)
}

/**
 * Materialise every member atom declared by the manifest.
 *
 * For each dimension in the manifest, walks the declared ids in order,
 * reads each atom, parses frontmatter, and captures the body. Atoms that
 * cannot be located or parsed are silently skipped (a stderr warning is
 * emitted) — this keeps the runtime resilient when a manifest references
 * an atom that has not yet been authored.
 *
 * The returned record always has all 5 dimension keys present; empty
 * dimensions are `[]`.
 */
export async function loadMembers(
  manifest: GenesisManifest,
  root: string,
): Promise<LoadedMembers> {
  const out: LoadedMembers = {
    cognitive: [],
    algo: [],
    concept: [],
    runbook: [],
    params: [],
  }

  for (const dim of DIMENSIONS) {
    const ids = manifest.members[dim] ?? []
    for (const id of ids) {
      const filepath = await findMemberFile(id, dim, root)
      if (filepath === null) {
        process.stderr.write(
          `[genesis-loader] skip ${id} (${dim}): not found under gks/\n`,
        )
        continue
      }
      let raw: string
      try {
        raw = await readFile(filepath, 'utf8')
      } catch (err) {
        process.stderr.write(
          `[genesis-loader] skip ${id} (${dim}): read failed (${(err as Error).message})\n`,
        )
        continue
      }
      const parsed = parseAtom(raw)
      if (parsed === null) {
        process.stderr.write(
          `[genesis-loader] skip ${id} (${dim}): malformed frontmatter\n`,
        )
        continue
      }
      const body = parsed.body.replace(/\s+$/, '')
      out[dim].push({ id, dimension: dim, body, path: filepath })
    }
  }

  return out
}
