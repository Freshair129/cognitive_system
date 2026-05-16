import { describe, it, expect } from 'vitest'
import { assignResolutionTiers } from '../../../src/orchestrator/resolution/tier.js'
import { enforceResolutionBudget } from '../../../src/orchestrator/resolution/budget.js'
import type { RetrievalHit } from '../../../src/orchestrator/retrieval/types.js'

describe('UCF Resolution Gradient', () => {
  const mockHits: RetrievalHit[] = [
    { id: 'A', score: 0.9, snippet: 'Hello world' },
    { id: 'B', score: 0.8, snippet: 'Foo bar' },
    { id: 'C', score: 0.7, snippet: 'Baz qux' },
    { id: 'D', score: 0.6, snippet: 'Test 123' },
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
      { id: 'A', tier: 'FULL' as const, body: 'A '.repeat(100) }, // ~130 tokens
      { id: 'B', tier: 'FULL' as const, body: 'B '.repeat(1000) }, // ~1300 tokens
      { id: 'C', tier: 'FULL' as const, body: 'C '.repeat(1000) }, // ~1300 tokens
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
      
      expect(results[0].id).toBe('A')
      expect(results[0].tier).toBe('FULL')
      expect(results[1].id).toBe('B')
      expect(results[1].tier).toBe('FULL')
      expect(results[2].id).toBe('C')
      expect(results[2].tier).toBe('MENTION')
    })

    it('should drop hits when budget is exceeded (drop mode)', () => {
      const results = enforceResolutionBudget(hitsWithBody, { 
        maxTokens: 1500,
        onOverflow: 'drop' 
      })
      
      expect(results).toHaveLength(2)
      expect(results[0].id).toBe('A')
      expect(results[1].id).toBe('B')
      expect(results.find(h => h.id === 'C')).toBeUndefined()
    })

    it('should always keep MENTION hits', () => {
      const hitsWithMentions = [
        { id: 'A', tier: 'FULL' as const, body: 'A '.repeat(1000) }, // ~1300
        { id: 'B', tier: 'MENTION' as const, snippet: 'Short' },    // ~50
      ]
      
      const results = enforceResolutionBudget(hitsWithMentions, { maxTokens: 100 })
      // A is FULL and exceeds 100 -> downgraded to MENTION
      // B is MENTION -> kept
      expect(results[0].tier).toBe('MENTION')
      expect(results[1].tier).toBe('MENTION')
    })
  })
})
