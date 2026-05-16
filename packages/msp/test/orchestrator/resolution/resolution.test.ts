import { describe, it, expect } from 'vitest'
import { assignResolutionTiers } from '../../../src/orchestrator/resolution/tier.js'
import { enforceResolutionBudget } from '../../../src/orchestrator/resolution/budget.js'
import type { RetrievalHit } from '../../../src/orchestrator/retrieval/types.js'

const mkHit = (atomId: string, extras: Partial<RetrievalHit> = {}): RetrievalHit => ({
  atomId,
  source: 'gks-vector',
  score: 0.5,
  rank: 1,
  perSourceRanks: {},
  ...extras,
})

describe('UCF Resolution Gradient', () => {
  const mockHits: RetrievalHit[] = [
    mkHit('A', { score: 0.9, rank: 1, snippet: 'Hello world' }),
    mkHit('B', { score: 0.8, rank: 2, snippet: 'Foo bar' }),
    mkHit('C', { score: 0.7, rank: 3, snippet: 'Baz qux' }),
    mkHit('D', { score: 0.6, rank: 4, snippet: 'Test 123' }),
  ]

  describe('assignResolutionTiers', () => {
    it('should assign FULL to top N hits and MENTION to others', () => {
      const results = assignResolutionTiers(mockHits, { fullCount: 2 })
      expect(results[0].tier).toBe('FULL')
      expect(results[1].tier).toBe('FULL')
      expect(results[2].tier).toBe('MENTION')
      expect(results[3].tier).toBe('MENTION')
    })

    it('should use default fullCount of 3', () => {
      const results = assignResolutionTiers(mockHits)
      expect(results[0].tier).toBe('FULL')
      expect(results[1].tier).toBe('FULL')
      expect(results[2].tier).toBe('FULL')
      expect(results[3].tier).toBe('MENTION')
    })
  })

  describe('enforceResolutionBudget', () => {
    const hitsWithBody = [
      { ...mkHit('A'), tier: 'FULL' as const, body: 'A '.repeat(100) }, // ~130 tokens
      { ...mkHit('B'), tier: 'FULL' as const, body: 'B '.repeat(1000) }, // ~1300 tokens
      { ...mkHit('C'), tier: 'FULL' as const, body: 'C '.repeat(1000) }, // ~1300 tokens
    ]

    it('should downgrade hits when budget is exceeded (downgrade mode)', () => {
      // Total tokens: A(~130) + B(~1300) + C(~1300) = ~2730
      // Budget: 1500
      // A (FULL) + B (FULL) = 1430 (OK)
      // C -> Downgrade to MENTION
      const results = enforceResolutionBudget(hitsWithBody, {
        maxTokens: 1500,
        onOverflow: 'downgrade'
      })

      expect(results[0].atomId).toBe('A')
      expect(results[0].tier).toBe('FULL')
      expect(results[1].atomId).toBe('B')
      expect(results[1].tier).toBe('FULL')
      expect(results[2].atomId).toBe('C')
      expect(results[2].tier).toBe('MENTION')
    })

    it('should drop hits when budget is exceeded (drop mode)', () => {
      const results = enforceResolutionBudget(hitsWithBody, {
        maxTokens: 1500,
        onOverflow: 'drop'
      })

      expect(results).toHaveLength(2)
      expect(results[0].atomId).toBe('A')
      expect(results[1].atomId).toBe('B')
      expect(results.find(h => h.atomId === 'C')).toBeUndefined()
    })

    it('should always keep MENTION hits', () => {
      const hitsWithMentions = [
        { ...mkHit('A'), tier: 'FULL' as const, body: 'A '.repeat(1000) }, // ~1300
        { ...mkHit('B'), tier: 'MENTION' as const, snippet: 'Short' },    // ~50
      ]

      const results = enforceResolutionBudget(hitsWithMentions, { maxTokens: 100 })
      // A is FULL and exceeds 100 -> downgraded to MENTION
      // B is MENTION -> kept
      expect(results[0].tier).toBe('MENTION')
      expect(results[1].tier).toBe('MENTION')
    })
  })
})
