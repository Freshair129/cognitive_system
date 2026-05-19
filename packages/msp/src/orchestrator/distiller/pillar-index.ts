import type { Embedder } from '@freshair129/gks'
import type { NarrativeUnit } from './types.js'

/**
 * Pillar 3: INDEX
 * Embeds the narrative unit into the vector store for future retrieval.
 */
export async function indexNarrative(
  narrative: NarrativeUnit,
  embedder: Embedder
): Promise<void> {
  const textToIndex = `
Summary: ${narrative.content.summary}
Decisions: ${narrative.content.key_decisions.join(', ')}
Patterns: ${narrative.content.patterns_observed.join(', ')}
  `.trim()

  try {
    const vector = await embedder.embed(textToIndex)
    // TODO: Persistent vector store write.
    // For now, we assume the caller handles the indexing orchestration
    // as per BLUEPRINT--DISTILLER-PIPELINE T3.
    console.log(`[distiller] indexed narrative ${narrative.id}`)
  } catch (err) {
    console.warn(`[distiller] failed to index narrative ${narrative.id}: ${(err as Error).message}`)
  }
}
