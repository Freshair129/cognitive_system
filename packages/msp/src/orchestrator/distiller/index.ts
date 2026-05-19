import { resolve } from 'node:path'
import { readFile, writeFile } from 'node:fs/promises'

import type { Episode } from '../consolidator/types.js'
import type { DistillOptions, DistillResult, NarrativeUnit } from './types.js'
import { cleanEpisodes } from './pillar-clean.js'
import { synthesizeNarrative } from './pillar-summary.js'
import { writeNarrativeAtom } from './pillar-relation.js'
import { readMemoryCounters, updateMemoryCounters } from '../../memory/counters.js'
import { initMemoryStore } from '../../memory/init.js'

/**
 * Main orchestrator for memory distillation.
 * 
 * Workflow:
 * 1. Initialize store and read counters.
 * 2. Check trigger: sessions since last narrative >= 8.
 * 3. Load unconsolidated episodes.
 * 4. Run 4-pillars pipeline.
 * 5. Update counters and persist narrative.
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

    // Trigger check (M11 default: 8)
    if (counters.session_seq < 8 && !opts.dryRun) {
      return result // Not enough sessions for narrative synthesis
    }

    // TODO: Load episodes from episodic_memory.json that haven't been distilled.
    // For now, we mock the episode retrieval logic.
    const mockEpisodes: Episode[] = [] 

    if (mockEpisodes.length === 0) {
      return result
    }

    // Pillar 1: CLEAN
    const cleaned = cleanEpisodes(mockEpisodes)
    result.episodesProcessed = cleaned.length

    if (cleaned.length === 0) return result

    // Pillar 2: SUMMARY
    if (!opts.llm) {
      throw new Error('LLM client required for narrative synthesis')
    }
    const summary = await synthesizeNarrative(cleaned, opts.llm, opts.llmTimeoutMs)

    // Construct Narrative Unit
    const narrativeId = `NARRATIVE--${Date.now()}` // TODO: Use ULID
    const narrative: NarrativeUnit = {
      id: narrativeId,
      namespace,
      created_at: new Date().toISOString(),
      domain: 'meta',
      epistemic_state: 'confirmed',
      confidence: 0.8,
      encoding_level: 'L2',
      source_episodes: cleaned.map(ep => ({
        id: 'EPISODE--MOCK', // TODO: Real ID
        session_id: ep.sessionId,
        encoding_level: ep.encoding_level || 'L2'
      })),
      content: summary
    }

    // Pillar 4: RELATION (Persistence)
    if (!opts.dryRun) {
      await writeNarrativeAtom(root, narrative)
      await updateMemoryCounters(root, namespace, 'core')
      result.narrativesCreated = 1
    }

    console.log(`[distill] successfully created narrative ${narrativeId}`)

  } catch (err) {
    result.errors.push((err as Error).message)
  }

  return result
}
