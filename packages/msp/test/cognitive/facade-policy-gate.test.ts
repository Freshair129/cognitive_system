/**
 * The cognitive facade must gate everything it returns.
 *
 * `recall()` ran a PEP pass over each hit's snippet, and the facade then did
 * two things that widened the result *after* policy had spoken:
 *
 *   1. it replaced a passing hit's snippet with `renderByTier(note, tier)` —
 *      the atom's full rendered body, which policy never examined;
 *   2. it appended every atom Nexusmind expanded into, straight from
 *      `store.lookup`, with no policy check at all — those atoms were never
 *      recall candidates, so nothing had ever evaluated them.
 *
 * The facade now runs one pass over the final text of every candidate, seeds
 * and expansions alike, and reports what it dropped.
 */
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { mockEmbedder } from '@freshair129/gks'
import { beforeEach, describe, expect, it } from 'vitest'

import { createCognitiveLayer } from '../../src/cognitive/index.js'
import { loadPolicies } from '../../src/policy/loader.js'

const packageRoot = fileURLToPath(new URL('../..', import.meta.url))
const repoRoot = resolve(packageRoot, '../..')

const SSN_DOC = 'Cortex planning notes. Operator SSN 123-45-6789 recorded.'
const CLEAN_DOC = 'Cortex handles planning in the Tri-Brain.'

async function layerRoot(): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), 'msp-facade-gate-'))
  await mkdir(join(root, 'gks', '00_index'), { recursive: true })
  await writeFile(join(root, 'gks', '00_index', 'atomic_index.jsonl'), '', 'utf8')
  return root
}

async function layerFor(root: string) {
  const layer = await createCognitiveLayer({ root, embedder: mockEmbedder(64) })
  // The mock embedder scores everything near zero; keep the threshold open so
  // the fixture is about policy, not about similarity.
  ;(layer.store as any).vectorScoreThreshold = -1
  return layer
}

describe('cognitive facade policy gate', () => {
  beforeEach(async () => {
    await loadPolicies(join(repoRoot, 'policies'))
  })

  it('reports what policy dropped instead of returning a silently short list', async () => {
    const root = await layerRoot()
    const layer = await layerFor(root)
    await layer.remember(SSN_DOC, { tags: ['cortex'] })

    const result = await layer.recall('cortex planning', { topK: 5, scoreThreshold: -1 } as any)

    expect(result.hits).toHaveLength(0)
    expect(result.policy_filtered.length).toBeGreaterThan(0)
    expect(result.policy_filtered.some((h) => h.ruleId === 'pii-block-ssn')).toBe(true)
  })

  it('keeps the clean hit and drops only the denied one', async () => {
    const root = await layerRoot()
    const layer = await layerFor(root)
    await layer.remember(CLEAN_DOC, { tags: ['cortex'] })
    await layer.remember(SSN_DOC, { tags: ['cortex'] })

    const result = await layer.recall('cortex planning', { topK: 5, scoreThreshold: -1 } as any)

    for (const hit of result.hits) {
      expect(hit.snippet).not.toContain('123-45-6789')
    }
    expect(result.policy_filtered.length).toBeGreaterThan(0)
  })

  it('does not echo the denied content in the report', async () => {
    const root = await layerRoot()
    const layer = await layerFor(root)
    await layer.remember(SSN_DOC, { tags: ['cortex'] })

    const result = await layer.recall('cortex planning', { topK: 5, scoreThreshold: -1 } as any)

    expect(JSON.stringify(result.policy_filtered)).not.toContain('123-45-6789')
  })

  it('reports nothing filtered when every hit is permitted', async () => {
    const root = await layerRoot()
    const layer = await layerFor(root)
    await layer.remember(CLEAN_DOC, { tags: ['cortex'] })

    const result = await layer.recall('cortex planning', { topK: 5, scoreThreshold: -1 } as any)

    expect(result.hits.length).toBeGreaterThan(0)
    expect(result.policy_filtered).toEqual([])
  })
})
