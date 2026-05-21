import { createSlmClient } from '../../codegen/slm/factory.js'
import { SlmClient } from '../../codegen/slm/types.js'

/**
 * Calculates a stability score for a given definition by seeking consensus 
 * across multiple SLM providers.
 * 
 * Implements MLL-FR-04: Multi-Model Stability Check.
 */
export async function calculateStabilityScore(content: string): Promise<number> {
  // 1. Prepare providers (ideally these should be different models/backends)
  // For the MVP, we use the configured default plus Gemini and Qwen if available.
  const providers: SlmClient[] = [
    createSlmClient({ provider: 'gemini' }),
    createSlmClient({ provider: 'qwen' }),
    createSlmClient({ provider: 'ollama' })
  ]

  const prompt = `Summarize the core essence of the following technical definition in exactly 3 words.
Definition:
---
${content}
---
Output ONLY the 3 words, no punctuation.`

  try {
    // 2. Parallel consensus gathering
    const results = await Promise.allSettled(
      providers.map(p => p({ prompt, model: 'stability-check', attempt: 1 }))
    )

    const summaries = results
      .filter((r): r is PromiseFulfilledResult<string> => r.status === 'fulfilled')
      .map(r => r.value.trim().toLowerCase())

    if (summaries.length < 2) {
      console.warn('[mll] Stability check failed: insufficient model responses.')
      return 0.5 // Neutral fallback
    }

    // 3. Compare results (Consensus check)
    // Simple logic: if 2 or more models agree on the 3 words, score is high.
    // In future, use semantic similarity embeddings.
    const agreementCount = countMaxAgreement(summaries)
    const score = agreementCount / summaries.length

    console.log(`[mll] Stability check summaries: ${summaries.join(' | ')} (Score: ${score})`)
    return score

  } catch (err) {
    console.error(`[mll] Stability check error: ${(err as Error).message}`)
    return 0.5
  }
}

function countMaxAgreement(arr: string[]): number {
  const counts: Record<string, number> = {}
  let max = 0
  for (const s of arr) {
    counts[s] = (counts[s] || 0) + 1
    if (counts[s]! > max) max = counts[s]!
  }
  return max
}
