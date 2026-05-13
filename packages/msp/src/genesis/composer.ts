import type { Dimension, GenesisManifest, LoadedMembers } from './types.js'

/**
 * Fixed section header per dimension. Cognitive is labelled "Context
 * (Cognitive)" because it's the lens through which the rest of the prompt
 * should be interpreted.
 */
const SECTION_HEADERS: Record<Dimension, string> = {
  cognitive: '## Context (Cognitive)',
  algo: '## Algorithm',
  concept: '## Concept',
  runbook: '## Runbook',
  params: '## Params',
}

/**
 * Fixed emission order: Cognitive frames how the agent should reason; then
 * the executable Algorithm; then the Concept (origin/purpose); then the
 * Runbook (procedural SOP); then Params (tunable values). User Request
 * always comes last so the LLM reads the full block before the live ask.
 */
const SECTION_ORDER: readonly Dimension[] = [
  'cognitive',
  'algo',
  'concept',
  'runbook',
  'params',
] as const

/**
 * Compose a single LLM prompt from a manifest, its loaded members, and a
 * user-supplied prompt.
 *
 * Pure function: no IO, no clock, deterministic in its inputs.
 *
 * - Empty dimensions are skipped entirely (no header for them).
 * - Multiple member bodies in one dimension are concatenated with one
 *   blank line between them.
 * - Section bodies are trimmed of trailing whitespace; the joining glue
 *   (`\n\n`) provides exactly one blank line between sections.
 * - The `manifest` argument is currently used only for the block id
 *   header; future versions could surface `daci.driver` or block tags.
 */
export function composePrompt(
  manifest: GenesisManifest,
  members: LoadedMembers,
  userPrompt: string,
): string {
  const blocks: string[] = []
  blocks.push(`<!-- GENESIS--${manifest.id} -->`)

  for (const dim of SECTION_ORDER) {
    const dimMembers = members[dim]
    if (dimMembers.length === 0) continue
    const bodies = dimMembers
      .map((m) => m.body.replace(/\s+$/, ''))
      .filter((b) => b.length > 0)
    if (bodies.length === 0) continue
    blocks.push(`${SECTION_HEADERS[dim]}\n${bodies.join('\n\n')}`)
  }

  blocks.push(`## User Request\n${userPrompt}`)
  return blocks.join('\n\n')
}
