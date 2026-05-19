import type { Episode } from '../consolidator/types.js'
import type { SlmClient } from '../../codegen/slm/types.js'

export interface SummaryResult {
  summary: string
  key_decisions: string[]
  unresolved_questions: string[]
  patterns_observed: string[]
}

const NARRATIVE_PROMPT = (episodes: Episode[]) => `You are an expert memory synthesis engine. You are provided with a cluster of session summaries. 
Your task is to synthesize them into a single coherent Narrative unit.

INPUT SUMMARIES:
${episodes.map((ep, i) => `${i + 1}. [Session ${ep.sessionId}]: ${ep.summary}`).join('\n')}

INSTRUCTIONS:
1. Identify the overarching narrative arc or theme across these sessions.
2. Extract key technical or architectural decisions made.
3. Identify recurring behavioral patterns or facts about the environment.
4. List any major unresolved questions or next steps.

OUTPUT FORMAT (JSON):
{
  "summary": "string (max 600 tokens)",
  "key_decisions": ["string", ...],
  "unresolved_questions": ["string", ...],
  "patterns_observed": ["string", ...]
}`

/**
 * Pillar 2: SUMMARY
 * Uses an LLM to synthesize multiple episodes into a single narrative summary.
 */
export async function synthesizeNarrative(
  episodes: Episode[],
  llm: SlmClient,
  timeoutMs: number = 30000
): Promise<SummaryResult> {
  const prompt = NARRATIVE_PROMPT(episodes)
  
  try {
    const raw = await Promise.race([
      llm({ prompt, model: 'memory-distiller', attempt: 1 }),
      new Promise<string>((_, reject) =>
        setTimeout(() => reject(new Error('Narrative synthesis timed out')), timeoutMs),
      ),
    ])

    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('LLM response did not contain valid JSON metadata.')
    }
    
    const parsed = JSON.parse(jsonMatch[0])
    return {
      summary: parsed.summary || 'No summary generated.',
      key_decisions: parsed.key_decisions || [],
      unresolved_questions: parsed.unresolved_questions || [],
      patterns_observed: parsed.patterns_observed || [],
    }
  } catch (err) {
    throw new Error(`Narrative synthesis failed: ${(err as Error).message}`)
  }
}
