import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtemp, rm, writeFile, mkdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { GraphStore, walkGraph } from '../../src/memory/graph.js'
import { MemoryStore } from '../../src/memory/index.js'
import type { AtomicNote } from '../../src/memory/types.js'
import { renderByTier } from '../../src/memory/index.js'

describe('Hop-Based Resolution', () => {
  let g: GraphStore

  beforeEach(async () => {
    g = new GraphStore()
    await g.load()
  })

  it('walkGraph BFS correctly computes hops and scores', async () => {
    // Setup simple linear graph: A -> B -> C -> D
    await g.addNode({ id: 'CONCEPT--A', labels: ['Concept'] })
    await g.addNode({ id: 'CONCEPT--B', labels: ['Concept'] })
    await g.addNode({ id: 'CONCEPT--C', labels: ['Concept'] })
    await g.addNode({ id: 'CONCEPT--D', labels: ['Concept'] })

    await g.addEdge({ from: 'CONCEPT--A', to: 'CONCEPT--B', rel: 'depends_on' })
    await g.addEdge({ from: 'CONCEPT--B', to: 'CONCEPT--C', rel: 'references' })
    await g.addEdge({ from: 'CONCEPT--C', to: 'CONCEPT--D', rel: 'supersedes' })

    const walk = await walkGraph(g, ['CONCEPT--A'], 3)
    
    // Seed A should be hop 0, score 1.0
    const a = walk.get('CONCEPT--A')!
    expect(a.hop).toBe(0)
    expect(a.score).toBe(1.0)

    // B should be hop 1, score = 1.0 * depends_on(1.0) * decay(0.8) = 0.8
    const b = walk.get('CONCEPT--B')!
    expect(b.hop).toBe(1)
    expect(b.score).toBeCloseTo(0.8)

    // C should be hop 2, score = 0.8 * references(0.5) * decay(0.8) = 0.32
    const c = walk.get('CONCEPT--C')!
    expect(c.hop).toBe(2)
    expect(c.score).toBeCloseTo(0.32)

    // D should be hop 3, score = 0.32 * supersedes(0.3) * decay(0.8) = 0.0768
    const d = walk.get('CONCEPT--D')!
    expect(d.hop).toBe(3)
    expect(d.score).toBeCloseTo(0.0768)
  })

  it('renderByTier properly strips body/summary', () => {
    const note: AtomicNote = {
      id: 'CONCEPT--TEST',
      phase: 1,
      type: 'concept',
      status: 'stable',
      vault_id: 'default',
      path: 'gks/concept/CONCEPT--TEST.md',
      title: 'Test Atom',
      summary: 'This is a summary of the test atom.',
      body: 'This is the full body content that should be hidden in summary/skeleton tiers.',
      attributes: {
        salient: 'Important salient point',
        trigger: 'Trigger condition',
        hook: 'Hook back to parent',
      },
    }

    const full = renderByTier(note, 'FULL')
    expect(full).toBe(note.body)

    const summary = renderByTier(note, 'SUMMARY')
    expect(summary).toContain('id: CONCEPT--TEST')
    expect(summary).toContain('title: Test Atom')
    expect(summary).toContain('summary: This is a summary of the test atom.')
    expect(summary).toContain('salient: Important salient point')
    expect(summary).not.toContain('This is the full body')

    const skeleton = renderByTier(note, 'SKELETON')
    expect(skeleton).toContain('id: CONCEPT--TEST')
    expect(skeleton).toContain('title: Test Atom')
    expect(skeleton).toContain('salient: Important salient point')
    expect(skeleton).not.toContain('summary: ')
    expect(skeleton).not.toContain('This is the full body')

    const mention = renderByTier(note, 'MENTION')
    expect(mention).toBe('id: CONCEPT--TEST')
  })
})

describe('Hop-Based Resolution in retrieve()', () => {
  let root: string
  let store: MemoryStore

  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), 'gks-hop-test-'))
    const gksDir = join(root, '.brain', 'gks')
    await mkdir(join(gksDir, '00_index'), { recursive: true })
    await mkdir(join(gksDir, 'concept'), { recursive: true })

    // Write index
    const indexLine = JSON.stringify({
      id: 'CONCEPT--SEED',
      phase: 1,
      type: 'concept',
      status: 'stable',
      vault_id: 'default',
      path: '.brain/gks/concept/CONCEPT--SEED.md',
    }) + '\n' + JSON.stringify({
      id: 'CONCEPT--NEIGHBOR',
      phase: 1,
      type: 'concept',
      status: 'stable',
      vault_id: 'default',
      path: '.brain/gks/concept/CONCEPT--NEIGHBOR.md',
    }) + '\n'
    await writeFile(join(gksDir, '00_index', 'atomic_index.jsonl'), indexLine, 'utf8')

    // Write notes
    await writeFile(join(gksDir, 'concept', 'CONCEPT--SEED.md'), '---\nid: CONCEPT--SEED\ntitle: Seed Note\n---\nSeed Body', 'utf8')
    await writeFile(join(gksDir, 'concept', 'CONCEPT--NEIGHBOR.md'), '---\nid: CONCEPT--NEIGHBOR\ntitle: Neighbor Note\n---\nNeighbor Body', 'utf8')

    store = new MemoryStore({ root })
    await store.init()

    // Add nodes/edges to the memory store's graph
    await store.graph.addNode({ id: 'CONCEPT--SEED', labels: ['Concept'] })
    await store.graph.addNode({ id: 'CONCEPT--NEIGHBOR', labels: ['Concept'] })
    await store.graph.addEdge({ from: 'CONCEPT--SEED', to: 'CONCEPT--NEIGHBOR', rel: 'depends_on' })
  })

  afterEach(async () => {
    await rm(root, { recursive: true, force: true })
  })

  it('retrieve() expands neighbors using hop resolution', async () => {
    const result = await store.retrieve('CONCEPT--SEED', {
      strategy: 'atomic',
      enableHopResolution: true,
      maxHopDepth: 1,
    })

    expect(result.hits).toHaveLength(2)
    
    const seedHit = result.hits.find((h) => h.id === 'CONCEPT--SEED')!
    expect(seedHit.tier).toBe('FULL')
    expect(seedHit.snippet).toContain('Seed Body')

    const neighborHit = result.hits.find((h) => h.id === 'CONCEPT--NEIGHBOR')!
    expect(neighborHit.tier).toBe('SUMMARY')
    expect(neighborHit.snippet).toContain('id: CONCEPT--NEIGHBOR')
    expect(neighborHit.snippet).not.toContain('Neighbor Body')
  })
})
