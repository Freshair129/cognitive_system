import { loadIdentityBeliefs, type BeliefQuery } from '../../memory/identity.js'

/**
 * Pillar 5: INFECT (Identity Evolution)
 *
 * Generates a system preamble from distilled Tier 3 beliefs to inform the
 * agent's persona.
 *
 * This is the one place where synthesised memory becomes agent *instruction*,
 * so it reads through `loadIdentityBeliefs()`, which returns approved,
 * non-contested beliefs only (R-01). An unapproved belief never appears here
 * regardless of its confidence score.
 */
export async function generateIdentityPreamble(query: BeliefQuery = {}): Promise<string> {
  try {
    const beliefs = await loadIdentityBeliefs(query)

    if (beliefs.length === 0) {
      return '' // No approved beliefs yet; standard generic persona applies
    }

    // Sort by confidence (highest first)
    const sorted = [...beliefs].sort((a, b) => b.confidence - a.confidence)

    const lines = [
      '### LONG-TERM IDENTITY BELIEFS',
      'The following beliefs have been distilled from your interaction history,',
      'reviewed, and approved. They should guide your behavior:',
      '',
      ...sorted.map(
        (b) => `- ${b.statement} (Confidence: ${Math.round(b.confidence * 100)}%)`,
      ),
      '',
    ]

    return lines.join('\n')
  } catch (err) {
    console.error(`[persona] failed to generate preamble: ${(err as Error).message}`)
    return ''
  }
}
