import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it, vi } from 'vitest'
import { judgeContradiction } from '../../src/validator/contradiction-judge.js'
import * as dispatchModule from '../../src/agents/dispatch.js'

vi.mock('../../src/agents/dispatch.js', () => ({
  dispatch: vi.fn()
}))

const packageRoot = fileURLToPath(new URL('../..', import.meta.url))
const repoRoot = resolve(packageRoot, '../..')

describe('The Machine Judge: Semantic Contradiction Detection', () => {
  it('correctly reports a definite contradiction from LLM response', async () => {
    const mockOutput = JSON.stringify({
      contradictions: [
        {
          old_atom: 'ADR--001',
          claim: 'Use Postgres',
          new_claim: 'Use SQLite',
          severity: 'definite',
          rationale: 'Opposite database choices'
        }
      ]
    })

    vi.mocked(dispatchModule.dispatch).mockResolvedValue({
      output: mockOutput,
      tier_used: 'T3',
      duration_ms: 100,
      cost_usd: 0.01
    })

    // We use a real file for parsing
    const result = await judgeContradiction('gks/adr/ADR--ANTI-HALLUCINATION-RULES.md', {
      root: repoRoot,
      limit: 1
    })

    expect(result.ok).toBe(false)
    expect(result.contradictions).toHaveLength(1)
    expect(result.contradictions[0]?.severity).toBe('definite')
  })

  it('reports ok when no contradictions are found', async () => {
    vi.mocked(dispatchModule.dispatch).mockResolvedValue({
      output: JSON.stringify({ contradictions: [] }),
      tier_used: 'T3',
      duration_ms: 100,
      cost_usd: 0.01
    })

    const result = await judgeContradiction('gks/adr/ADR--ANTI-HALLUCINATION-RULES.md', {
      root: repoRoot,
      limit: 1
    })

    expect(result.ok).toBe(true)
    expect(result.contradictions).toHaveLength(0)
  })
})
