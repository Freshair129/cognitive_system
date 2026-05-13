import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../src/agents/tiers/qwen.js', () => ({
  qwenAdapter: {
    name: 'T1' as const,
    healthcheck: async () => true,
    run: async (prompt: string) => ({
      ok: true,
      output: `[mocked T1] ${prompt}`,
      exit_code: 0,
    }),
  },
}))

vi.mock('../../src/agents/tiers/gemini.js', () => ({
  geminiAdapter: {
    name: 'T2' as const,
    healthcheck: async () => true,
    run: async (prompt: string) => ({
      ok: true,
      output: `[mocked T2] ${prompt}`,
      exit_code: 0,
    }),
  },
}))

vi.mock('../../src/agents/tiers/claude.js', () => ({
  claudeAdapter: {
    name: 'T3' as const,
    healthcheck: async () => true,
    run: async (prompt: string) => ({
      ok: true,
      output: `[mocked T3] ${prompt}`,
      exit_code: 0,
    }),
  },
}))

import { dispatch } from '../../src/agents/dispatch.js'
import type { DispatchTask } from '../../src/agents/types.js'

describe('Phase D e2e — dispatch → episode → on-disk artefact', () => {
  let root: string
  let originalCwd: () => string

  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), 'phase-d-e2e-'))
    originalCwd = process.cwd
    process.cwd = () => root
  })

  afterEach(async () => {
    process.cwd = originalCwd
    await rm(root, { recursive: true, force: true })
  })

  it('dispatch(summarize) routes to T1, writes an episode atom, and the atom is reloadable', async () => {
    const task: DispatchTask = {
      type: 'summarize',
      severity: 'regular',
      prompt: 'hello world',
    }

    const result = await dispatch(task)

    expect(result.tier_used).toBe('T1')
    expect(result.output).toBe('[mocked T1] hello world')
    expect(result.duration_ms).toBeGreaterThanOrEqual(0)

    const episodeDir = join(root, 'gks', 'episode')
    const files = await readdir(episodeDir)
    const episodes = files.filter((f) => f.startsWith('EPISODE--AGENT-RUN-') && f.endsWith('.md'))
    expect(episodes).toHaveLength(1)

    const body = await readFile(join(episodeDir, episodes[0]!), 'utf8')
    expect(body).toMatch(/type: episode/)
    expect(body).toMatch(/hello world/)
    expect(body).toMatch(/\[mocked T1\] hello world/)
    expect(body).toMatch(/T1/)
  })

  it('dispatch(critical codegen) routes to T3 and records the tier', async () => {
    const task: DispatchTask = {
      type: 'codegen',
      severity: 'critical',
      prompt: 'fix the auth bug',
    }

    const result = await dispatch(task)

    expect(result.tier_used).toBe('T3')
    expect(result.output).toBe('[mocked T3] fix the auth bug')

    const episodeDir = join(root, 'gks', 'episode')
    const files = await readdir(episodeDir)
    const body = await readFile(join(episodeDir, files[0]!), 'utf8')
    expect(body).toMatch(/T3/)
  })

  it('dispatch with oversized context forces T2 even for a summarize task', async () => {
    const task: DispatchTask = {
      type: 'summarize',
      severity: 'regular',
      prompt: 'big',
      context_size_tokens: 3_000_000,
    }

    const result = await dispatch(task)

    expect(result.tier_used).toBe('T2')
    expect(result.output).toBe('[mocked T2] big')
  })
})
