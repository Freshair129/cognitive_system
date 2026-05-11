import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtemp, rm, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { AtomicEntry } from '../../src/memory/types.js'
import { deriveBacklinksFromEntries, emitBacklinksJsonl } from '../../src/memory/backlinks.js'

function entry(p: Partial<AtomicEntry> & { id: string }): AtomicEntry {
  return {
    phase: 2,
    type: 'concept',
    status: 'stable',
    vault_id: 'default',
    path: `gks/concept/${p.id}.md`,
    ...p,
  }
}

describe('deriveBacklinksFromEntries', () => {
  it('emits one edge per crosslinks entry', () => {
    const entries = [
      entry({ id: 'A', crosslinks: { references: ['B', 'C'], implements: ['D'] } }),
      entry({ id: 'B' }),
      entry({ id: 'C' }),
      entry({ id: 'D' }),
    ]
    const edges = deriveBacklinksFromEntries(entries)
    expect(edges).toEqual([
      { from: 'A', to: 'B', type: 'references' },
      { from: 'A', to: 'C', type: 'references' },
      { from: 'A', to: 'D', type: 'implements' },
    ])
  })

  it('filters by predicate type', () => {
    const entries = [
      entry({ id: 'A', crosslinks: { references: ['B'], implements: ['C'] } }),
      entry({ id: 'B' }),
      entry({ id: 'C' }),
    ]
    const edges = deriveBacklinksFromEntries(entries, { filterTypes: ['implements'] })
    expect(edges.map((e) => e.type)).toEqual(['implements'])
  })

  it('sorts deterministically for git diff stability', () => {
    const entries = [
      entry({ id: 'Z', crosslinks: { references: ['A'] } }),
      entry({ id: 'A', crosslinks: { references: ['Z'] } }),
    ]
    const a = deriveBacklinksFromEntries(entries)
    const b = deriveBacklinksFromEntries(entries)
    expect(a).toEqual(b)
    expect(a[0]?.from).toBe('A')
  })

  it('skips atoms with no crosslinks', () => {
    const entries = [entry({ id: 'A' }), entry({ id: 'B' })]
    expect(deriveBacklinksFromEntries(entries)).toEqual([])
  })

  it('skips non-string or empty crosslinks targets', () => {
    const entries = [
      entry({
        id: 'A',
        crosslinks: { references: ['', null as unknown as string, 'VALID--B'] },
      }),
      entry({ id: 'VALID--B' }),
    ]
    const edges = deriveBacklinksFromEntries(entries)
    expect(edges).toEqual([{ from: 'A', to: 'VALID--B', type: 'references' }])
  })
})

describe('emitBacklinksJsonl', () => {
  let dir = ''
  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'gks-backlinks-'))
  })
  afterEach(async () => {
    await rm(dir, { recursive: true, force: true })
  })

  it('writes valid JSONL and returns edgeCount + bytes', async () => {
    const entries = [
      entry({ id: 'A', crosslinks: { references: ['B'] } }),
      entry({ id: 'B' }),
    ]
    const outPath = join(dir, 'backlinks.jsonl')
    const result = await emitBacklinksJsonl(entries, outPath)
    expect(result.edgeCount).toBe(1)
    expect(result.bytes).toBeGreaterThan(0)
    const text = await readFile(outPath, 'utf8')
    const parsed = JSON.parse(text.trim())
    expect(parsed).toEqual({ from: 'A', to: 'B', type: 'references' })
  })

  it('creates parent directories automatically', async () => {
    const entries = [entry({ id: 'X', crosslinks: { implements: ['Y'] } }), entry({ id: 'Y' })]
    const outPath = join(dir, 'nested', 'deep', 'backlinks.jsonl')
    const result = await emitBacklinksJsonl(entries, outPath)
    expect(result.edgeCount).toBe(1)
    const text = await readFile(outPath, 'utf8')
    expect(text).toContain('"from":"X"')
  })

  it('writes an empty file when there are no edges', async () => {
    const outPath = join(dir, 'empty.jsonl')
    const result = await emitBacklinksJsonl([entry({ id: 'A' })], outPath)
    expect(result.edgeCount).toBe(0)
    expect(result.bytes).toBe(0)
    const text = await readFile(outPath, 'utf8')
    expect(text).toBe('')
  })
})
