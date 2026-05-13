import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { loadManifest, loadMembers } from '../../src/genesis/loader.js'

interface Fixture {
  root: string
  cleanup: () => Promise<void>
}

async function makeFixture(): Promise<Fixture> {
  const root = await mkdtemp(join(tmpdir(), 'genesis-loader-'))
  await mkdir(join(root, 'gks', 'genesis'), { recursive: true })
  await mkdir(join(root, 'gks', 'cognitive'), { recursive: true })
  await mkdir(join(root, 'gks', 'algo'), { recursive: true })
  await mkdir(join(root, 'gks', 'concept'), { recursive: true })
  await mkdir(join(root, 'gks', 'runbook'), { recursive: true })
  await mkdir(join(root, 'gks', 'params'), { recursive: true })
  return {
    root,
    cleanup: () => rm(root, { recursive: true, force: true }),
  }
}

function atom(id: string, body: string, extraFrontmatter = ''): string {
  // One blank line between closing `---` and the body. The loader strips one
  // leading newline from the body slice, so the resulting `LoadedMember.body`
  // is exactly the `body` argument (no leading/trailing whitespace from the
  // template literal).
  return `---
id: ${id}
type: cognitive
status: stable
title: test atom ${id}
created_at: 2026-05-14T09:00:00.000+07:00${extraFrontmatter ? '\n' + extraFrontmatter : ''}
---
${body}`
}

let fixture: Fixture | undefined

beforeEach(async () => {
  fixture = await makeFixture()
})

afterEach(async () => {
  if (fixture) await fixture.cleanup()
  fixture = undefined
  vi.restoreAllMocks()
})

describe('loadManifest', () => {
  it('parses a manifest with nested members.core.<dim>', async () => {
    const root = fixture!.root
    const manifestText = `---
id: GENESIS--FOO
type: genesis
status: draft
title: Foo block
created_at: 2026-05-14T09:00:00.000+07:00
members:
  core:
    cognitive: [COGNITIVE--A]
    algo: [ALGO--B, ALGO--C]
    concept: [CONCEPT--D]
    runbook: [RUNBOOK--E]
    params: [PARAMS--F]
daci:
  driver: MOD--FOO
  approver: [PERSONA--ARCH]
  contributor: [PERSONA--IMPL]
  informed: [ENTITY--USERS]
---

# Foo
`
    await writeFile(
      join(root, 'gks', 'genesis', 'GENESIS--FOO.md'),
      manifestText,
      'utf8',
    )

    const m = await loadManifest('FOO', root)
    expect(m.id).toBe('FOO')
    expect(m.members.cognitive).toEqual(['COGNITIVE--A'])
    expect(m.members.algo).toEqual(['ALGO--B', 'ALGO--C'])
    expect(m.members.concept).toEqual(['CONCEPT--D'])
    expect(m.members.runbook).toEqual(['RUNBOOK--E'])
    expect(m.members.params).toEqual(['PARAMS--F'])
    expect(m.daci?.driver).toBe('MOD--FOO')
    expect(m.daci?.approver).toBe('PERSONA--ARCH')
    expect(m.daci?.contributor).toEqual(['PERSONA--IMPL'])
    expect(m.daci?.informed).toEqual(['ENTITY--USERS'])
  })

  it('parses a manifest with flat members.<dim> (no core/optional nesting)', async () => {
    const root = fixture!.root
    const manifestText = `---
id: GENESIS--BAR
type: genesis
status: draft
title: Bar block
created_at: 2026-05-14T09:00:00.000+07:00
members:
  cognitive: [COGNITIVE--X]
  algo: [ALGO--Y]
---

body
`
    await writeFile(
      join(root, 'gks', 'genesis', 'GENESIS--BAR.md'),
      manifestText,
      'utf8',
    )

    const m = await loadManifest('BAR', root)
    expect(m.members.cognitive).toEqual(['COGNITIVE--X'])
    expect(m.members.algo).toEqual(['ALGO--Y'])
    expect(m.members.concept).toBeUndefined()
  })

  it('throws when the manifest file is missing', async () => {
    const root = fixture!.root
    await expect(loadManifest('MISSING', root)).rejects.toThrow(
      /GENESIS--MISSING\.md not found/,
    )
  })

  it('throws when the frontmatter is malformed', async () => {
    const root = fixture!.root
    await writeFile(
      join(root, 'gks', 'genesis', 'GENESIS--BAD.md'),
      'no frontmatter at all',
      'utf8',
    )
    await expect(loadManifest('BAD', root)).rejects.toThrow(/malformed frontmatter/)
  })

  it('falls back to recursive scan when the manifest is not at canonical path', async () => {
    const root = fixture!.root
    // Drop it in gks/master/ instead of gks/genesis/.
    await mkdir(join(root, 'gks', 'master'), { recursive: true })
    const manifestText = `---
id: GENESIS--ELSEWHERE
type: genesis
status: draft
title: Elsewhere
created_at: 2026-05-14T09:00:00.000+07:00
members:
  algo: [ALGO--Z]
---

body
`
    await writeFile(
      join(root, 'gks', 'master', 'GENESIS--ELSEWHERE.md'),
      manifestText,
      'utf8',
    )

    const m = await loadManifest('ELSEWHERE', root)
    expect(m.id).toBe('ELSEWHERE')
    expect(m.members.algo).toEqual(['ALGO--Z'])
  })
})

describe('loadMembers', () => {
  it('loads bodies for each declared member from canonical dirs', async () => {
    const root = fixture!.root
    await writeFile(
      join(root, 'gks', 'cognitive', 'COGNITIVE--A.md'),
      atom('COGNITIVE--A', 'cog-body'),
      'utf8',
    )
    await writeFile(
      join(root, 'gks', 'algo', 'ALGO--B.md'),
      atom('ALGO--B', 'algo-b-body'),
      'utf8',
    )
    await writeFile(
      join(root, 'gks', 'algo', 'ALGO--C.md'),
      atom('ALGO--C', 'algo-c-body'),
      'utf8',
    )

    const members = await loadMembers(
      {
        id: 'FOO',
        members: {
          cognitive: ['COGNITIVE--A'],
          algo: ['ALGO--B', 'ALGO--C'],
        },
      },
      root,
    )
    expect(members.cognitive).toHaveLength(1)
    expect(members.cognitive[0]!.body).toBe('cog-body')
    expect(members.cognitive[0]!.dimension).toBe('cognitive')
    expect(members.algo).toHaveLength(2)
    expect(members.algo.map((m) => m.body)).toEqual(['algo-b-body', 'algo-c-body'])
    // Empty dimensions are present but empty arrays.
    expect(members.concept).toEqual([])
    expect(members.runbook).toEqual([])
    expect(members.params).toEqual([])
  })

  it('silently skips members that cannot be located', async () => {
    const root = fixture!.root
    const stderr = vi
      .spyOn(process.stderr, 'write')
      .mockImplementation(() => true)

    await writeFile(
      join(root, 'gks', 'cognitive', 'COGNITIVE--PRESENT.md'),
      atom('COGNITIVE--PRESENT', 'here'),
      'utf8',
    )

    const members = await loadMembers(
      {
        id: 'FOO',
        members: {
          cognitive: ['COGNITIVE--PRESENT', 'COGNITIVE--MISSING'],
        },
      },
      root,
    )
    expect(members.cognitive).toHaveLength(1)
    expect(members.cognitive[0]!.id).toBe('COGNITIVE--PRESENT')
    expect(stderr).toHaveBeenCalled()
  })
})
