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
    const gksDir = join(root, '.brain', 'cognitive-system-knowledge-block')
    await mkdir(join(gksDir, '00_index'), { recursive: true })
    await mkdir(join(gksDir, 'concept'), { recursive: true })
    await mkdir(join(root, 'policies'), { recursive: true })

    // Write notes first so retain can find them (or we can just use write index)
    await writeFile(join(gksDir, 'concept', 'CONCEPT--SEED.md'), '---\nid: CONCEPT--SEED\ntitle: Seed Note\nsummary: Seed summary\n---\nSeed Body Content', 'utf8')
    await writeFile(join(gksDir, 'concept', 'CONCEPT--NEIGHBOR.md'), '---\nid: CONCEPT--NEIGHBOR\ntitle: Neighbor Note\nsummary: Neighbor summary\n---\nNeighbor Body Content', 'utf8')

    // Write index
    const indexLine = JSON.stringify({
      id: 'CONCEPT--SEED',
      phase: 1,
      type: 'concept',
      status: 'stable',
      vault_id: 'default',
      path: '.brain/cognitive-system-knowledge-block/concept/CONCEPT--SEED.md',
      domain: 'knowledge'
    }) + '\n' + JSON.stringify({
      id: 'CONCEPT--NEIGHBOR',
      phase: 1,
      type: 'concept',
      status: 'draft',
      vault_id: 'default',
      path: '.brain/cognitive-system-knowledge-block/concept/CONCEPT--NEIGHBOR.md',
      domain: 'knowledge'
    }) + '\n'
    await writeFile(join(gksDir, '00_index', 'atomic_index.jsonl'), indexLine, 'utf8')

    store = new MemoryStore({ root, embedder: mockEmbedder(64) })
    await store.init()

    await store.graph.addNode({ id: 'CONCEPT--SEED', labels: ['Concept'], props: { domain: 'knowledge' } })
    await store.graph.addNode({ id: 'CONCEPT--NEIGHBOR', labels: ['Concept'], props: { domain: 'knowledge' } })
    await store.graph.addEdge({ from: 'CONCEPT--SEED', to: 'CONCEPT--NEIGHBOR', rel: 'depends_on' })
  })

  afterEach(async () => {
    await rm(root, { recursive: true, force: true })
  })

  it('runNexusmind computes parameters and tiers correctly with vector scores', async () => {
    // Level 1: Low (all SUMMARY)
    const res1 = await runNexusmind(store, ['CONCEPT--SEED'], 1)
    expect(res1.tiers.get('CONCEPT--SEED')).toBe('SUMMARY')
    expect(res1.tiers.get('CONCEPT--NEIGHBOR')).toBe('SUMMARY')

    // Level 2: Normal (Hop-Based BFS resolution)
    const res2 = await runNexusmind(store, ['CONCEPT--SEED'], 2)
    expect(res2.tiers.get('CONCEPT--SEED')).toBe('FULL')
    expect(res2.tiers.get('CONCEPT--NEIGHBOR')).toBe('SUMMARY')

    // Level 3: High (Decision Utility U(n) based)
    // Seed note has domain 'knowledge', NEIGHBOR also has domain 'knowledge'.
    // NEIGHBOR walk score = 0.8. S_vector = 0.5 (default). S_cross = 0.7.
    // V(n) = 0.8 * 0.5 * 0.7 = 0.28.
    // Cost = body(21 chars) / 1000 = 0.021. U(n) = 0.28 - 0.2*0.021 = 0.2758.
    // Threshold is 0.15, so U(n) > threshold => FULL
    const res3 = await runNexusmind(store, ['CONCEPT--SEED'], 3)
    expect(res3.tiers.get('CONCEPT--SEED')).toBe('FULL')
    expect(res3.tiers.get('CONCEPT--NEIGHBOR')).toBe('FULL')

    // Verify vector score integration
    // If S_vector is low (e.g. 0.2), U(n) = 0.8 * 0.2 * 0.7 - 0.0196 = 0.112 - 0.0196 = 0.0924
    // 0.05 < U(n) < 0.15 => SUMMARY
    const vectorScores = new Map([['CONCEPT--NEIGHBOR', 0.2]])
    const resVector = await runNexusmind(store, ['CONCEPT--SEED'], 3, { vectorScores })
    expect(resVector.tiers.get('CONCEPT--NEIGHBOR')).toBe('SUMMARY')
  })

  it('runNexusmind Level 5 returns state shifts instead of direct mutation', async () => {
    // CONCEPT--NEIGHBOR is 'draft'. Reliability = 0.6. Evidence = 1 (depends_on).
    // K-Impact = (0.6 * 2) / 1.0 = 1.2 >= 0.8.
    // Shift from 'draft' to 'stable'.
    const res5 = await runNexusmind(store, ['CONCEPT--SEED'], 5)
    expect(res5.stateShifts).toHaveLength(1)
    expect(res5.stateShifts[0].id).toBe('CONCEPT--NEIGHBOR')
    expect(res5.stateShifts[0].to).toBe('stable')

    // Verify NO direct mutation happened (ADR--NEXUSMIND-EPISTEMIC-TRANSITIONS)
    const note = await store.lookup('CONCEPT--NEIGHBOR')
    expect(note?.status).toBe('draft')
  })
})

describe('Cognitive Layer Recall thinkingLevel Routing', () => {
  let root: string
  let layer: any

  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), 'msp-cog-nexus-'))
    const gksDir = join(root, '.brain', 'cognitive-system-knowledge-block')
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
      path: '.brain/cognitive-system-knowledge-block/concept/CONCEPT--SEED.md',
      title: 'Seed Note',
      summary: 'Seed summary',
    }) + '\n' + JSON.stringify({
      id: 'CONCEPT--NEIGHBOR',
      phase: 1,
      type: 'concept',
      status: 'stable',
      vault_id: 'default',
      path: '.brain/cognitive-system-knowledge-block/concept/CONCEPT--NEIGHBOR.md',
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

  it('recall N5 triggers inbound proposals for state shifts', async () => {
    // Set NEIGHBOR to draft so it can be promoted
    const neighborEntry = layer.store.atomic.getEntry('CONCEPT--NEIGHBOR')!
    neighborEntry.status = 'draft'
    
    // N5 via T3 subject
    const res = await layer.recall('CONCEPT--SEED', {
      subject: makeSubject('user', 'sub3', { tier: 'T3' }),
    })

    expect(res.stateShifts).toBeDefined()
    expect(res.stateShifts?.length).toBeGreaterThan(0)
    expect(res.stateShifts![0].to).toBe('stable')

    // Verify inbound proposal exists
    const inboundFiles = await layer.store.inbound.list()
    expect(inboundFiles.length).toBeGreaterThan(0)
    
    // Check that one of the inbound files matches our proposed_id
    const proposal = inboundFiles.find((f: any) => f.proposed_id === 'CONCEPT--NEIGHBOR')!
    expect(proposal).toBeDefined()
    
    // Read the file content
    const { text } = await layer.store.inbound.readById('CONCEPT--NEIGHBOR')
    expect(text).toContain('Nexusmind detected K-Impact variance')
  })
})
