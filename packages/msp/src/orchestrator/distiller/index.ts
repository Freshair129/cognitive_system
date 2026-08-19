import { resolve } from 'node:path'

import type { DistillOptions, DistillResult, IdentityBelief, NarrativeUnit } from './types.js'
import { cleanEpisodes } from './pillar-clean.js'
import { synthesizeNarrative, synthesizeIdentity } from './pillar-summary.js'
import { writeNarrativeAtom, writeBeliefAtom } from './pillar-relation.js'
import { readMemoryCounters, updateMemoryCounters } from '../../memory/counters.js'
import { initMemoryStore } from '../../memory/init.js'
import { loadUndistilledEpisodes, loadUndistilledNarratives } from './loader.js'

/**
 * Main orchestrator for memory distillation (Phase B & C).
 * 
 * Implements the 8-8-8 protocol:
 * - 8 Sessions -> 1 Narrative (Tier 2)
 * - 8 Narratives -> 1 Identity Belief (Tier 3)
 */
export async function distill(opts: DistillOptions): Promise<DistillResult> {
  const root = opts.root ?? process.cwd()
  const namespace = opts.namespace
  const result: DistillResult = {
    episodesProcessed: 0,
    narrativesCreated: 0,
    beliefsRevised: 0,
    errors: []
  }

  try {
    await initMemoryStore(root, namespace)
    const counters = await readMemoryCounters(root, namespace)

    // --- Phase B: Session -> Narrative ---
    const sessionThreshold = 8
    if (counters.session_seq >= sessionThreshold || opts.force) {
      const rawEpisodes = await loadUndistilledEpisodes({ root, namespace, limit: 50 })
      if (rawEpisodes.length > 0) {
        const cleaned = cleanEpisodes(rawEpisodes)
        result.episodesProcessed = cleaned.length

        if (cleaned.length > 0 && opts.llm) {
          console.log(`[distill] Tier 2: synthesizing narrative from ${cleaned.length} episodes...`)
          const summary = await synthesizeNarrative(cleaned, opts.llm, opts.llmTimeoutMs)

          const narrativeId = `NARRATIVE--${Date.now()}`
          const distilledAt = new Date().toISOString()
          const sourceEpisodes = cleaned.map(ep => ({
            id: 'EPISODE--MOCK',
            session_id: ep.sessionId,
            encoding_level: ep.encoding_level || 'L2'
          }))
          const narrative: NarrativeUnit = {
            id: narrativeId,
            namespace,
            created_at: distilledAt,
            domain: 'meta',
            // Single-pass synthesis is inference, not corroborated fact.
            epistemic_state: 'hypothesis',
            confidence: 0.8,
            encoding_level: 'L2',
            source_episodes: sourceEpisodes,
            content: summary,
            provenance: {
              method: 'distilled',
              model: opts.model ?? 'unknown',
              distilled_at: distilledAt,
              source_ids: sourceEpisodes.map(ep => ep.session_id),
            }
          }

          if (!opts.dryRun) {
            await writeNarrativeAtom(root, namespace, narrative)
            await updateMemoryCounters(root, namespace, 'core')
            result.narrativesCreated = 1
          }
        }
      }
    }

    // --- Phase C: Narrative -> Identity ---
    // Re-read counters after Phase B update
    const updatedCounters = await readMemoryCounters(root, namespace)
    const coreThreshold = 8
    if (updatedCounters.core_seq >= coreThreshold || opts.force) {
      const narratives = await loadUndistilledNarratives({ root, namespace, limit: 50 })
      
      if (narratives.length > 0 && opts.llm) {
        console.log(`[distill] Tier 3: synthesizing identity from ${narratives.length} narratives...`)
        const identityResult = await synthesizeIdentity(narratives, opts.llm, opts.llmTimeoutMs)

        if (!opts.dryRun) {
          const distilledAt = new Date().toISOString()
          for (const b of identityResult.beliefs) {
            const beliefId = `BELIEF--${Math.random().toString(36).substring(2, 9).toUpperCase()}`
            const belief: IdentityBelief = {
              id: beliefId,
              statement: b.belief,
              confidence: b.confidence,
              // A belief derived once has been corroborated zero times. It
              // starts as a hypothesis and is never self-certified as
              // `confirmed` by the pass that invented it.
              epistemic_state: 'hypothesis',
              source_narratives: b.evidence_cite,
              first_observed_at: distilledAt,
              times_confirmed: 0,
              times_contested: 0,
              provenance: {
                method: 'distilled',
                model: opts.model ?? 'unknown',
                distilled_at: distilledAt,
                source_ids: b.evidence_cite,
              }
              // NB: no `approval` — synthesis never grants it.
            }
            await writeBeliefAtom(root, namespace, belief)
            result.beliefsRevised++
          }
          await updateMemoryCounters(root, namespace, 'sphere')
        }
      }
    }

  } catch (err) {
    const msg = (err as Error).message
    console.error(`[distill] error: ${msg}`)
    result.errors.push(msg)
  }

  return result
}
