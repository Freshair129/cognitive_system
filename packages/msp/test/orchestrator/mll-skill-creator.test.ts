import { describe, expect, it, vi } from 'vitest'
import { distillSkillFromEpisodes } from '../../src/orchestrator/mll/skill-creator.js'
import * as dispatchModule from '../../src/agents/dispatch.js'
import { resolve } from 'node:path'
import { rm, access } from 'node:fs/promises'

vi.mock('../../src/agents/dispatch.js', () => ({
  dispatch: vi.fn()
}))

describe('MLL Phase 1: Skill Creator', () => {
  const root = resolve(process.cwd())
  const candidateDir = resolve(root, '.brain/msp/projects/test-mll/candidates')

  it('distills a skill from mock episodes and saves a candidate', async () => {
    const mockOutput = `---
id: SKILL--MOCK-SKILL
version: 1.0
type: skill
tier: genesis
---
# Executive Summary
Mock skill description.
`

    vi.mocked(dispatchModule.dispatch).mockResolvedValue({
      output: mockOutput,
      tier_used: 'T3',
      duration_ms: 100,
      cost_usd: 0.01
    })

    const results = await distillSkillFromEpisodes({
      root,
      limit: 1,
      namespace: 'test-mll'
    })

    expect(results).toHaveLength(1)
    expect(results[0]?.skill_id).toBe('SKILL--MOCK-SKILL')

    // Verify file creation
    const filePath = resolve(candidateDir, 'SKILL--MOCK-SKILL.md')
    await expect(access(filePath)).resolves.toBeUndefined()

    // Cleanup
    await rm(resolve(root, '.brain/msp/projects/test-mll'), { recursive: true, force: true })
  })
})
