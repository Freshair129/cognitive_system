import { describe, expect, it, vi } from 'vitest'
import { distillSkillFromEpisodes } from '../../src/orchestrator/mll/skill-creator.js'
import * as dispatchModule from '../../src/agents/dispatch.js'
import { resolve, join } from 'node:path'
import { rm, access, mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { createGenesisGraphBackend } from '@freshair129/gks'

vi.mock('../../src/agents/dispatch.js', () => ({
  dispatch: vi.fn()
}))

describe('MLL Phase 1: Skill Creator', () => {
  it('distills a skill from mock episodes and saves a candidate', async () => {
    const root = await mkdtemp(join(tmpdir(), 'msp-mll-test-'))
    const candidateDir = resolve(root, '.brain/msp/projects/test-mll/candidates')

    // Populate graph with root and an episode node
    const dbPath = resolve(root, 'gks')
    const backend = createGenesisGraphBackend({ path: dbPath })
    await backend.load()
    await backend.addNode({ id: 'N-ROOT', labels: ['Root'], props: {} })
    await backend.addNode({ id: 'EPISODE--1', labels: ['episode'], props: { success: true } })
    await backend.addEdge({ from: 'N-ROOT', to: 'EPISODE--1', rel: 'has_episode' })

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
    await rm(root, { recursive: true, force: true })
  })
})
