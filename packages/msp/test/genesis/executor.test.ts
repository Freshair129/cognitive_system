import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { DispatchResult, DispatchTask } from '../../src/agents/types.js'
import type {
  GenesisManifest,
  LoadedMembers,
} from '../../src/genesis/types.js'

const mocks = vi.hoisted(() => ({
  dispatchMock: vi.fn(),
  loadManifestMock: vi.fn(),
  loadMembersMock: vi.fn(),
}))

vi.mock('../../src/agents/dispatch.js', () => ({
  dispatch: (task: DispatchTask) => mocks.dispatchMock(task),
}))

vi.mock('../../src/genesis/loader.js', () => ({
  loadManifest: (blockId: string, root: string) =>
    mocks.loadManifestMock(blockId, root),
  loadMembers: (manifest: GenesisManifest, root: string) =>
    mocks.loadMembersMock(manifest, root),
}))

// Import AFTER vi.mock so the mocked deps are resolved.
import { executeBlock } from '../../src/genesis/executor.js'

function okDispatch(overrides: Partial<DispatchResult> = {}): DispatchResult {
  return {
    tier_used: 'T2',
    output: 'dispatch-output',
    duration_ms: 5,
    ...overrides,
  }
}

function emptyMembers(): LoadedMembers {
  return {
    cognitive: [],
    algo: [],
    concept: [],
    runbook: [],
    params: [],
  }
}

beforeEach(() => {
  mocks.dispatchMock.mockReset()
  mocks.loadManifestMock.mockReset()
  mocks.loadMembersMock.mockReset()
})

describe('executeBlock', () => {
  it('orchestrates loadManifest → loadMembers → composePrompt → dispatch', async () => {
    const manifest: GenesisManifest = {
      id: 'IDENTITY-ENGINE',
      members: { cognitive: ['COGNITIVE--A'], algo: ['ALGO--B'] },
    }
    mocks.loadManifestMock.mockResolvedValueOnce(manifest)

    const members = emptyMembers()
    members.cognitive = [
      {
        id: 'COGNITIVE--A',
        dimension: 'cognitive',
        body: 'cog-lens',
        path: '/fake/cog.md',
      },
    ]
    members.algo = [
      {
        id: 'ALGO--B',
        dimension: 'algo',
        body: 'algo-body',
        path: '/fake/algo.md',
      },
    ]
    mocks.loadMembersMock.mockResolvedValueOnce(members)
    mocks.dispatchMock.mockResolvedValueOnce(
      okDispatch({ output: 'final-output', tier_used: 'T2' }),
    )

    const result = await executeBlock('IDENTITY-ENGINE', {
      root: '/fake/root',
      prompt: 'user prompt here',
    })

    expect(mocks.loadManifestMock).toHaveBeenCalledWith(
      'IDENTITY-ENGINE',
      '/fake/root',
    )
    expect(mocks.loadMembersMock).toHaveBeenCalledWith(manifest, '/fake/root')

    expect(mocks.dispatchMock).toHaveBeenCalledOnce()
    const [sentTask] = mocks.dispatchMock.mock.calls[0]! as [DispatchTask]
    expect(sentTask.type).toBe('codegen')
    expect(sentTask.severity).toBe('regular')
    expect(sentTask.prompt).toContain('cog-lens')
    expect(sentTask.prompt).toContain('algo-body')
    expect(sentTask.prompt).toContain('user prompt here')
    expect(sentTask.prompt).toContain('## Context (Cognitive)')
    expect(sentTask.prompt).toContain('## User Request')
    expect(sentTask.budget_hint).toBeUndefined()

    expect(result.block_id).toBe('IDENTITY-ENGINE')
    expect(result.output).toBe('final-output')
    expect(result.members_loaded).toBe(2)
    expect(result.tier_used).toBe('T2')
    expect(typeof result.duration_ms).toBe('number')
    expect(result.duration_ms).toBeGreaterThanOrEqual(0)
  })

  it('forwards opts.tier to dispatch as budget_hint', async () => {
    mocks.loadManifestMock.mockResolvedValueOnce({
      id: 'FOO',
      members: {},
    })
    mocks.loadMembersMock.mockResolvedValueOnce(emptyMembers())
    mocks.dispatchMock.mockResolvedValueOnce(okDispatch({ tier_used: 'T1' }))

    await executeBlock('FOO', {
      root: '/r',
      prompt: 'p',
      tier: 'T1',
    })

    const [sentTask] = mocks.dispatchMock.mock.calls[0]! as [DispatchTask]
    expect(sentTask.budget_hint).toBe('T1')
  })

  it('returns members_loaded = 0 when manifest has no members', async () => {
    mocks.loadManifestMock.mockResolvedValueOnce({ id: 'EMPTY', members: {} })
    mocks.loadMembersMock.mockResolvedValueOnce(emptyMembers())
    mocks.dispatchMock.mockResolvedValueOnce(okDispatch())

    const result = await executeBlock('EMPTY', { root: '/r', prompt: 'p' })
    expect(result.members_loaded).toBe(0)
  })

  it('propagates loadManifest errors', async () => {
    mocks.loadManifestMock.mockRejectedValueOnce(new Error('manifest gone'))
    await expect(
      executeBlock('MISSING', { root: '/r', prompt: 'p' }),
    ).rejects.toThrow(/manifest gone/)
    expect(mocks.dispatchMock).not.toHaveBeenCalled()
  })

  it('propagates dispatch errors', async () => {
    mocks.loadManifestMock.mockResolvedValueOnce({
      id: 'FOO',
      members: {},
    })
    mocks.loadMembersMock.mockResolvedValueOnce(emptyMembers())
    mocks.dispatchMock.mockRejectedValueOnce(new Error('dispatch crashed'))

    await expect(
      executeBlock('FOO', { root: '/r', prompt: 'p' }),
    ).rejects.toThrow(/dispatch crashed/)
  })

  it('uses the dispatcher tier_used in the result', async () => {
    mocks.loadManifestMock.mockResolvedValueOnce({ id: 'FOO', members: {} })
    mocks.loadMembersMock.mockResolvedValueOnce(emptyMembers())
    mocks.dispatchMock.mockResolvedValueOnce(okDispatch({ tier_used: 'T3' }))

    const result = await executeBlock('FOO', { root: '/r', prompt: 'p' })
    expect(result.tier_used).toBe('T3')
  })
})
