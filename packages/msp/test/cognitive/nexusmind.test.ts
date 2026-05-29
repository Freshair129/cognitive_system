import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdir, rm, writeFile, mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { MemoryStore, retain, mockEmbedder } from '@freshair129/gks'
import { runNexusmind } from '../../src/cognitive/nexusmind.js'
import { createCognitiveLayer } from '../../src/cognitive/index.js'
import { makeSubject } from '../../src/policy/types.js'

describe('Nexusmind Thinking Levels', () => {
  let root: string
  let store: MemoryStore

  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), 'msp-nexusmind-test-'))
    const gksDir = join(root, 'gks')
    await mkdir(join(gksDir, '00_index'), { recursive: true })
    await mkdir(join(gksDir, 'concept'), { recursive: true })
    await mkdir(join(root, 'policies'), { recursive: true })

    // Write index
    const indexLine = JSON.stringify({
      id: 'CONCEPT--SEED',
      phase: 1,
      type: 'concept',
      status: 'stable',
      vault_id: 'default',
      path: 'concept/CONCEPT--SEED.md',
    }) + '\n' + JSON.stringify({
      id: 'CONCEPT--NEIGHBOR',
      phase: 1,
      type: 'concept',
      status: 'draft',
      vault_id: 'default',
      path: 'concept/CONCEPT--NEIGHBOR.md',
    }) + '\n'
    await writeFile(join(gksDir, '00_index', 'atomic_index.jsonl'), indexLine, 'utf8')

    // Write notes
    await writeFile(join(gksDir, 'concept', 'CONCEPT--SEED.md'), '---\nid: CONCEPT--SEED\ntitle: Seed Note\nsummary: Seed summary\n---\nSeed Body Content', 'utf8')
    await writeFile(join(gksDir, 'concept', 'CONCEPT--NEIGHBOR.md'), '---\nid: CONCEPT--NEIGHBOR\ntitle: Neighbor Note\nsummary: Neighbor summary\n---\nNeighbor Body Content', 'utf8')

    store = new MemoryStore({ root, embedder: mockEmbedder(64) })
    await store.init()

    await store.graph.addNode({ id: 'CONCEPT--SEED', labels: ['Concept'], props: { domain: 'knowledge' } })
    await store.graph.addNode({ id: 'CONCEPT--NEIGHBOR', labels: ['Concept'], props: { domain: 'knowledge' } })
    await store.graph.addEdge({ from: 'CONCEPT--SEED', to: 'CONCEPT--NEIGHBOR', rel: 'depends_on' })
  })

  afterEach(async () => {
    await rm(root, { recursive: true, force: true })
  })

  it('runNexusmind computes parameters and tiers correctly', async () => {
    // Level 1: Low (all SUMMARY)
    const res1 = await runNexusmind(store, ['CONCEPT--SEED'], 1)
    expect(res1.tiers.get('CONCEPT--SEED')).toBe('SUMMARY')
    expect(res1.tiers.get('CONCEPT--NEIGHBOR')).toBe('SUMMARY')

    // Level 2: Normal (Hop-Based BFS resolution)
    const res2 = await runNexusmind(store, ['CONCEPT--SEED'], 2)
    expect(res2.tiers.get('CONCEPT--SEED')).toBe('FULL')
    expect(res2.tiers.get('CONCEPT--NEIGHBOR')).toBe('SUMMARY')

    // Level 3: High (Decision Utility U(n) based)
    const res3 = await runNexusmind(store, ['CONCEPT--SEED'], 3)
    expect(res3.tiers.get('CONCEPT--SEED')).toBe('FULL')
    // Neighbor walk score = 0.8. Domain congruence = 1.0, tags = 0, role = 1.0. Cross = 0.7. V(n) = 0.56.
    // Cost = body(21 chars) / 1000 = 0.021. U(n) = 0.56 - 0.2*0.021 = 0.5558.
    // Threshold is 0.15, so U(n) > threshold => FULL
    expect(res3.tiers.get('CONCEPT--NEIGHBOR')).toBe('FULL')
  })

  it('runNexusmind Level 5 shifts status based on K-Impact', async () => {
    const res5 = await runNexusmind(store, ['CONCEPT--SEED'], 5)
    
    // CONCEPT--NEIGHBOR is 'draft'. Reliability = 0.6. Evidence = 1 (depends_on).
    // K-Impact = (0.6 * 2) / 1.0 = 1.2 >= 0.8.
    // So it should shift to stable!
    const note = await store.lookup('CONCEPT--NEIGHBOR')
    expect(note?.status).toBe('stable')
  })
})

describe('Cognitive Layer Recall thinkingLevel Routing', () => {
  let root: string
  let layer: any

  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), 'msp-cog-nexus-'))
    const gksDir = join(root, 'gks')
    await mkdir(join(gksDir, '00_index'), { recursive: true })
    await mkdir(join(gksDir, 'concept'), { recursive: true })
    await mkdir(join(root, 'policies'), { recursive: true })

    // Write index
    const indexLine = JSON.stringify({
      id: 'CONCEPT--SEED',
      phase: 1,
      type: 'concept',
      status: 'stable',
      vault_id: 'default',
      path: 'concept/CONCEPT--SEED.md',
      title: 'Seed Note',
      summary: 'Seed summary',
    }) + '\n' + JSON.stringify({
      id: 'CONCEPT--NEIGHBOR',
      phase: 1,
      type: 'concept',
      status: 'stable',
      vault_id: 'default',
      path: 'concept/CONCEPT--NEIGHBOR.md',
      title: 'Neighbor Note',
      summary: 'Neighbor summary',
    }) + '\n'
    await writeFile(join(gksDir, '00_index', 'atomic_index.jsonl'), indexLine, 'utf8')

    // Write notes
    await writeFile(join(gksDir, 'concept', 'CONCEPT--SEED.md'), '---\nid: CONCEPT--SEED\ntitle: Seed Note\nsummary: Seed summary\n---\nSeed Body', 'utf8')
    await writeFile(join(gksDir, 'concept', 'CONCEPT--NEIGHBOR.md'), '---\nid: CONCEPT--NEIGHBOR\ntitle: Neighbor Note\nsummary: Neighbor summary\n---\nNeighbor Body', 'utf8')

    layer = await createCognitiveLayer({
      root,
      embedder: mockEmbedder(64),
    })
    ;(layer.store as any).vectorScoreThreshold = -1

    await retain(layer.store, {
      content: 'Seed Body',
      metadata: {
        id: 'CONCEPT--SEED',
        atom_id: 'CONCEPT--SEED',
        path: 'concept/CONCEPT--SEED.md',
        title: 'Seed Note',
        summary: 'Seed summary',
        type: 'concept',
        phase: 1,
        status: 'stable',
      },
    })
    await retain(layer.store, {
      content: 'Neighbor Body',
      metadata: {
        id: 'CONCEPT--NEIGHBOR',
        atom_id: 'CONCEPT--NEIGHBOR',
        path: 'concept/CONCEPT--NEIGHBOR.md',
        title: 'Neighbor Note',
        summary: 'Neighbor summary',
        type: 'concept',
        phase: 1,
        status: 'stable',
      },
    })
    
    await layer.graph.addNode({ id: 'CONCEPT--SEED', labels: ['Concept'] })
    await layer.graph.addNode({ id: 'CONCEPT--NEIGHBOR', labels: ['Concept'] })
    await layer.graph.addEdge({ from: 'CONCEPT--SEED', to: 'CONCEPT--NEIGHBOR', rel: 'depends_on' })
  })

  afterEach(async () => {
    await rm(root, { recursive: true, force: true })
  })

  it('recall routes correctly by thinking level N1 (Low) via T1 subject', async () => {
    const res = await layer.recall('CONCEPT--SEED', {
      subject: makeSubject('user', 'sub1', { tier: 'T1' }),
    })
    
    // N1 maps all to SUMMARY
    const seed = res.hits.find((h: any) => h.id === 'CONCEPT--SEED')!
    expect(seed.metadata.tier).toBe('SUMMARY')
    expect(seed.snippet).toContain('summary: Seed summary')
    expect(seed.snippet).not.toContain('Seed Body')
  })

  it('recall routes correctly by thinking level N3 (High) via T2 subject', async () => {
    const res = await layer.recall('CONCEPT--SEED', {
      subject: makeSubject('user', 'sub2', { tier: 'T2' }),
    })

    // N3 expands to FULL for high utility nodes
    const seed = res.hits.find((h: any) => h.id === 'CONCEPT--SEED')!
    expect(seed.metadata.tier).toBe('FULL')
    expect(seed.snippet).toContain('Seed Body')
  })
})
