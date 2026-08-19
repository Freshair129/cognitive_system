import { readFile, readdir } from 'node:fs/promises'
import { join } from 'node:path'

import { mspHome } from '../lib/msp-home.js'
import { spheresDir } from '../orchestrator/distiller/pillar-relation.js'
import { parseFile } from '../validator/parse.js'
import type { IdentityBelief } from '../orchestrator/distiller/types.js'

/**
 * Identity-belief read path.
 *
 * THE GATE (R-01): beliefs are LLM-synthesised inference. `loadIdentityBeliefs`
 * is what feeds `generateIdentityPreamble()` — i.e. text that is injected into
 * an agent's system prompt and shapes its behaviour. It therefore returns ONLY
 * beliefs that a human has explicitly approved.
 *
 * An unapproved belief is still stored, still searchable via the `identity`
 * retrieval source, and still visible to `msp-belief list`. It simply cannot
 * influence the agent until someone signs off on it.
 *
 * Use `loadAllBeliefs()` when you want the unfiltered set (review tooling).
 */

export interface BeliefQuery {
  /** Project root. Required to read the project belief store. */
  root?: string
  /** Project namespace. */
  namespace?: string
}

const DEFAULT_NAMESPACE = 'default'

/** True when a belief carries a complete human approval record. */
export function isApproved(belief: IdentityBelief): boolean {
  const a = belief.approval
  return !!a && typeof a.approved_by === 'string' && a.approved_by.length > 0
}

/** True when a belief is eligible to enter an agent system prompt. */
export function isPersonaEligible(belief: IdentityBelief): boolean {
  if (!isApproved(belief)) return false
  // Approval does not survive later contradiction.
  return belief.epistemic_state !== 'deprecated' && belief.epistemic_state !== 'contested'
}

/**
 * Load every belief in the project store, approved or not.
 *
 * Callers that put text in front of a model must use `loadIdentityBeliefs()`
 * instead — this function applies no gate.
 */
export async function loadAllBeliefs(query: BeliefQuery = {}): Promise<IdentityBelief[]> {
  const fromProject = query.root
    ? await readProjectSpheres(query.root, query.namespace ?? DEFAULT_NAMESPACE)
    : []
  const fromLegacy = await readLegacyGlobalStore()
  return [...fromProject, ...fromLegacy]
}

/**
 * Load beliefs that are cleared to influence agent behaviour.
 *
 * Returns only approved, non-contested, non-deprecated beliefs.
 */
export async function loadIdentityBeliefs(query: BeliefQuery = {}): Promise<IdentityBelief[]> {
  const all = await loadAllBeliefs(query)
  return all.filter(isPersonaEligible)
}

/** Read `.brain/msp/projects/<ns>/memory/spheres/BELIEF--*.md`. */
async function readProjectSpheres(
  root: string,
  namespace: string,
): Promise<IdentityBelief[]> {
  const dir = spheresDir(root, namespace)
  let files: string[]
  try {
    files = await readdir(dir)
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return []
    throw err
  }

  const out: IdentityBelief[] = []
  for (const file of files) {
    if (!file.endsWith('.md')) continue
    try {
      const parsed = await parseFile(join(dir, file))
      const fm = parsed.fm as Record<string, unknown>
      const id = fm['id']
      if (typeof id !== 'string') continue
      out.push({
        id,
        statement: extractStatement(parsed.body) || String(fm['title'] ?? id),
        confidence: typeof fm['confidence'] === 'number' ? fm['confidence'] : 0,
        epistemic_state: (fm['epistemic_state'] as IdentityBelief['epistemic_state']) ?? 'hypothesis',
        source_narratives: extractRefs(fm['crosslinks']),
        first_observed_at: String(fm['created_at'] ?? ''),
        times_confirmed: 0,
        times_contested: 0,
        ...(isApprovalBlock(fm['approval']) ? { approval: fm['approval'] } : {}),
        ...(isProvenanceBlock(fm['provenance']) ? { provenance: fm['provenance'] } : {}),
      })
    } catch (err) {
      console.warn(`[identity] failed to load belief ${file}: ${(err as Error).message}`)
    }
  }
  return out
}

/**
 * Legacy global JSON store (`~/.msp/memory/identity/*.json`).
 *
 * No writer exists for this location in-tree; it is read for backward
 * compatibility with externally-provisioned beliefs. Records are subject to
 * the same approval gate — a legacy record without an `approval` block is
 * loaded but is not persona-eligible.
 */
async function readLegacyGlobalStore(): Promise<IdentityBelief[]> {
  const identityDir = join(mspHome(), 'memory', 'identity')
  let files: string[]
  try {
    files = await readdir(identityDir)
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return []
    throw err
  }

  const jsonFiles = files.filter((f) => f.endsWith('.json') && f !== 'identity_audit.jsonl')
  const allBeliefs: IdentityBelief[] = []

  for (const file of jsonFiles) {
    try {
      const raw = await readFile(join(identityDir, file), 'utf8')
      const data = JSON.parse(raw)
      if (!data?.beliefs || !Array.isArray(data.beliefs)) continue
      for (const b of data.beliefs) {
        allBeliefs.push({
          id: b.belief_id,
          statement: b.statement,
          confidence: b.confidence,
          epistemic_state: b.epistemic_state,
          source_narratives: b.source_narratives || [],
          first_observed_at: b.first_observed_at,
          times_confirmed: b.times_confirmed || 1,
          times_contested: b.times_contested || 0,
          ...(isApprovalBlock(b.approval) ? { approval: b.approval } : {}),
        })
      }
    } catch (err) {
      console.warn(`[identity] failed to load beliefs from ${file}: ${(err as Error).message}`)
    }
  }

  return allBeliefs
}

function isApprovalBlock(v: unknown): v is IdentityBelief['approval'] {
  return (
    !!v &&
    typeof v === 'object' &&
    typeof (v as Record<string, unknown>)['approved_by'] === 'string' &&
    typeof (v as Record<string, unknown>)['approved_at'] === 'string'
  )
}

function isProvenanceBlock(v: unknown): v is IdentityBelief['provenance'] {
  return !!v && typeof v === 'object' && 'method' in (v as Record<string, unknown>)
}

/**
 * Pull the prose under the `## Belief` heading.
 *
 * No `m` flag: the lazy group must run to the next `## ` heading or to the
 * end of the document, and under `m` the trailing `$` would stop at the first
 * newline instead.
 */
function extractStatement(body: string): string {
  const m = body.match(/##\s+Belief\s*\n([\s\S]*?)(?=\n##\s|$)/)
  return m ? m[1]!.trim() : ''
}

function extractRefs(crosslinks: unknown): string[] {
  if (!crosslinks || typeof crosslinks !== 'object') return []
  const refs = (crosslinks as Record<string, unknown>)['references']
  return Array.isArray(refs) ? refs.filter((r): r is string => typeof r === 'string') : []
}
