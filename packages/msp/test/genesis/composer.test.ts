import { describe, expect, it } from 'vitest'

import { composePrompt } from '../../src/genesis/composer.js'
import type {
  Dimension,
  GenesisManifest,
  LoadedMember,
  LoadedMembers,
} from '../../src/genesis/types.js'

function member(id: string, dimension: Dimension, body: string): LoadedMember {
  return { id, dimension, body, path: `/fake/${id}.md` }
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

const FAKE_MANIFEST: GenesisManifest = {
  id: 'FOO',
  members: {},
}

describe('composePrompt', () => {
  it('emits sections in fixed order: cognitive → algo → concept → runbook → params → user', () => {
    const members: LoadedMembers = {
      cognitive: [member('COGNITIVE--A', 'cognitive', 'cog')],
      algo: [member('ALGO--B', 'algo', 'algo')],
      concept: [member('CONCEPT--C', 'concept', 'con')],
      runbook: [member('RUNBOOK--D', 'runbook', 'run')],
      params: [member('PARAMS--E', 'params', 'par')],
    }
    const out = composePrompt(FAKE_MANIFEST, members, 'do the thing')

    // Order check: find each header's index and confirm monotonic increase.
    const indices = [
      out.indexOf('## Context (Cognitive)'),
      out.indexOf('## Algorithm'),
      out.indexOf('## Concept'),
      out.indexOf('## Runbook'),
      out.indexOf('## Params'),
      out.indexOf('## User Request'),
    ]
    for (let i = 0; i < indices.length; i++) {
      expect(indices[i]).toBeGreaterThan(-1)
      if (i > 0) expect(indices[i]).toBeGreaterThan(indices[i - 1]!)
    }
    expect(out).toContain('cog')
    expect(out).toContain('algo')
    expect(out).toContain('con')
    expect(out).toContain('run')
    expect(out).toContain('par')
    expect(out).toContain('do the thing')
  })

  it('skips empty dimensions entirely (no orphan header)', () => {
    const members = emptyMembers()
    members.cognitive = [member('COGNITIVE--A', 'cognitive', 'lens')]
    members.params = [member('PARAMS--P', 'params', 'tunables')]

    const out = composePrompt(FAKE_MANIFEST, members, 'go')
    expect(out).toContain('## Context (Cognitive)')
    expect(out).toContain('## Params')
    expect(out).toContain('## User Request')
    expect(out).not.toContain('## Algorithm')
    expect(out).not.toContain('## Concept')
    expect(out).not.toContain('## Runbook')
  })

  it('concatenates multi-member dimensions with one blank line between bodies', () => {
    const members = emptyMembers()
    members.algo = [
      member('ALGO--A', 'algo', 'first'),
      member('ALGO--B', 'algo', 'second'),
    ]
    const out = composePrompt(FAKE_MANIFEST, members, 'go')
    expect(out).toContain('## Algorithm\nfirst\n\nsecond')
  })

  it('produces a minimal prompt when no members are loaded (just the user request)', () => {
    const out = composePrompt(FAKE_MANIFEST, emptyMembers(), 'just ask')
    // Block marker, then immediately User Request.
    expect(out).toContain('<!-- GENESIS--FOO -->')
    expect(out).toContain('## User Request\njust ask')
    expect(out).not.toContain('## Context')
    expect(out).not.toContain('## Algorithm')
  })

  it('emits the block-id marker first', () => {
    const out = composePrompt(
      { id: 'IDENTITY-ENGINE', members: {} },
      emptyMembers(),
      'go',
    )
    expect(out.startsWith('<!-- GENESIS--IDENTITY-ENGINE -->')).toBe(true)
  })

  it('treats whitespace-only member bodies as empty (no section emitted)', () => {
    const members = emptyMembers()
    members.cognitive = [member('COGNITIVE--EMPTY', 'cognitive', '   \n\n   ')]
    const out = composePrompt(FAKE_MANIFEST, members, 'go')
    expect(out).not.toContain('## Context (Cognitive)')
  })

  it('appends the user prompt verbatim', () => {
    const out = composePrompt(
      FAKE_MANIFEST,
      emptyMembers(),
      'line one\nline two',
    )
    expect(out).toContain('## User Request\nline one\nline two')
  })
})
