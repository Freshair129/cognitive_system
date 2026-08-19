import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'

import type { IdentityBelief, NarrativeUnit } from './types.js'

/**
 * Pillar 4: RELATION — persist distilled artifacts.
 *
 * WHERE THESE GO, AND WHY (R-01):
 *
 * Narratives and beliefs are **model-synthesised project memory**, not
 * reviewed canonical knowledge. They are written to the project store —
 * `.brain/msp/projects/<ns>/memory/{cores,spheres}/` — the tiers that
 * `initMemoryStore()` provisions and that `MemoryCounters` already counts
 * (`session_seq` → `core_seq` → `sphere_seq`).
 *
 * They are deliberately NOT written into the atom vault. The re-indexer
 * scans the vault as a canon root, so a `status: stable` atom there becomes
 * indexed, recall-visible canonical knowledge with no review — which is how
 * an unverified single-pass LLM inference could end up quoted back to a
 * future agent as established fact.
 *
 * Both artifacts are written `status: draft` with explicit `provenance:`, and
 * beliefs additionally start at `epistemic_state: hypothesis` with no
 * `approval:` block. See `memory/identity.ts` for the read-side gate that
 * keeps unapproved beliefs out of the agent's system preamble.
 */

/** Absolute path to the Tier-2 (narrative / "core") directory. */
export function coresDir(root: string, namespace: string): string {
  return join(root, '.brain', 'msp', 'projects', namespace, 'memory', 'cores')
}

/** Absolute path to the Tier-3 (belief / "sphere") directory. */
export function spheresDir(root: string, namespace: string): string {
  return join(root, '.brain', 'msp', 'projects', namespace, 'memory', 'spheres')
}

function renderProvenance(
  provenance: NarrativeUnit['provenance'],
  indent = '  ',
): string {
  if (!provenance) return ''
  const lines = [
    `${indent}method: ${provenance.method}`,
    `${indent}model: ${provenance.model}`,
    `${indent}distilled_at: ${provenance.distilled_at}`,
    `${indent}source_ids:`,
    ...provenance.source_ids.map((id) => `${indent}  - ${id}`),
  ]
  return `provenance:\n${lines.join('\n')}\n`
}

async function writeAtomic(filePath: string, content: string): Promise<string> {
  // Do not rely on initMemoryStore() having run — these writers are reachable
  // from `msp_distill` on a workspace that has never been initialised.
  await mkdir(dirname(filePath), { recursive: true })
  await writeFile(filePath, content, 'utf8')
  return filePath
}

/**
 * Persist a distilled Identity belief (Tier 3) to the project store.
 *
 * The belief is written unapproved. Nothing about this call makes it
 * eligible to influence agent behaviour.
 */
export async function writeBeliefAtom(
  root: string,
  namespace: string,
  belief: IdentityBelief,
): Promise<string> {
  const approvalBlock = belief.approval
    ? `approval:\n  approved_by: ${belief.approval.approved_by}\n  approved_at: ${belief.approval.approved_at}\n`
    : ''

  const content = `---
id: ${belief.id}
phase: 1
type: belief
status: draft
vault_id: project
tier: process
source_type: learned
epistemic_state: ${belief.epistemic_state}
confidence: ${belief.confidence}
namespace: ${namespace}
title: BELIEF — ${belief.id}
tags: [msp, memory, identity, belief, distillation]
aliases: [Identity Memory, BELIEF]
cluster: memory
role: Distilled long-term belief (unapproved)
${renderProvenance(belief.provenance)}${approvalBlock}crosslinks:
  references:
${belief.source_narratives.map((id) => `    - ${id}`).join('\n')}
created_at: ${new Date().toISOString()}
---

# BELIEF — ${belief.id}

## Belief

${belief.statement}

## Evidence

- Supported by ${belief.source_narratives.length} narratives.
- First observed at: ${belief.first_observed_at}
- Times confirmed: ${belief.times_confirmed}
- Times contested: ${belief.times_contested}

## Status

This belief is **synthesised inference**, not observation. It is
\`status: draft\` and \`epistemic_state: ${belief.epistemic_state}\`. It will not be
included in the agent identity preamble until a human approves it
(\`msp-belief approve ${belief.id}\`).

## Source

- Distilled from hierarchical 8-8-8 memory synthesis.
`

  return writeAtomic(join(spheresDir(root, namespace), `${belief.id}.md`), content)
}

/**
 * Pillar 4: RELATION
 * Persist a distilled narrative unit (Tier 2) to the project store.
 */
export async function writeNarrativeAtom(
  root: string,
  namespace: string,
  narrative: NarrativeUnit,
): Promise<string> {
  const content = `---
id: ${narrative.id}
phase: 1
type: narrative
status: draft
vault_id: project
tier: process
source_type: learned
epistemic_state: ${narrative.epistemic_state}
confidence: ${narrative.confidence}
namespace: ${narrative.namespace}
title: NARRATIVE — ${narrative.id} — ${narrative.domain} synthesis
tags: [msp, memory, narrative, distillation, ${narrative.domain}]
aliases: [Core Memory, NARRATIVE]
cluster: memory
role: Cross-session pattern / arc
${renderProvenance(narrative.provenance)}crosslinks:
  references:
${narrative.source_episodes.map((ep) => `    - ${ep.id}`).join('\n')}
created_at: ${narrative.created_at}
---

# NARRATIVE — ${narrative.id}

## Summary

${narrative.content.summary}

## Patterns

${narrative.content.patterns_observed.map((p) => `- ${p}`).join('\n')}

## Source

- Distilled from ${narrative.source_episodes.length} episodes.
- Synthesised inference — \`status: draft\`, not reviewed canon.
`

  return writeAtomic(join(coresDir(root, namespace), `${narrative.id}.md`), content)
}
