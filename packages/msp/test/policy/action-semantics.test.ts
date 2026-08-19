/**
 * The UCF action on the recall path must be `expose-to-llm`, not `read`.
 *
 * Every protective deny rule in `policies/` — restricted-exposure, PII block,
 * secret block — scopes itself to `action: [expose-to-llm]`, because the packs
 * deliberately distinguish "a human read this locally" from "this entered a
 * model's context". The retrieval orchestrator labelled its PEP pass `read`, so
 * none of those rules could ever match and every hit fell through to the
 * baseline permit. Loading the packs (G-04) did not fix that on its own.
 *
 * These tests pin the new default, the escape hatch, and the fact that the
 * change is monotone: nothing that matched `read` stops matching.
 */
import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { mockEmbedder } from '@freshair129/gks'
import { beforeEach, describe, expect, it } from 'vitest'

import { createCognitiveLayer } from '../../src/cognitive/index.js'

import type { ObsidianClient, SearchHit } from '../../src/obsidian/types.js'
import { recall } from '../../src/orchestrator/retrieval/index.js'
import { loadPolicies } from '../../src/policy/loader.js'

// Resolve the repo root from this file, not process.cwd(): vitest runs with
// cwd = packages/msp under the workspace script, and `policies/` is at the top.
const packageRoot = fileURLToPath(new URL('../..', import.meta.url))
const repoRoot = resolve(packageRoot, '../..')

const SSN_SNIPPET = 'Contact record for the operator, SSN 123-45-6789, do not share.'
const CLEAN_SNIPPET = 'Cortex handles planning in the Tri-Brain.'

function mockObsidian(hits: SearchHit[]): ObsidianClient {
  return {
    mode: 'rest',
    async search() {
      return hits
    },
    async readFile() {
      return ''
    },
  }
}

function hit(path: string, snippet: string): SearchHit {
  return { path, title: path, snippet, score: 1 }
}

async function fixtureRoot(): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), 'msp-action-semantics-'))
  await mkdir(join(root, '.brain/msp/projects/evaAI/memory'), { recursive: true })
  return root
}

/** Every action recorded by the PEP in this root's shadow log. */
async function loggedActions(root: string): Promise<string[]> {
  const path = join(root, '.brain', 'msp', 'audit', 'policy-decisions.jsonl')
  const text = await readFile(path, 'utf8')
  return text
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line).action as string)
}

describe('recall PEP action semantics', () => {
  describe('against the real policy packs', () => {
    beforeEach(async () => {
      await loadPolicies(resolve(repoRoot, 'policies'))
    })

    it('blocks a hit carrying an SSN — 40-pii-block-from-llm now reachable', async () => {
      const root = await fixtureRoot()
      const result = await recall({
        query: 'operator',
        root,
        obsidian: mockObsidian([hit('gks/note/PII.md', SSN_SNIPPET), hit('gks/note/OK.md', CLEAN_SNIPPET)]),
      })

      const ids = result.hits.map((h) => h.atomId)
      expect(ids).toContain('OK')
      // Under the old `read` label this hit was returned verbatim.
      expect(ids).not.toContain('PII')
    })

    it('records the decision under expose-to-llm', async () => {
      const root = await fixtureRoot()
      await recall({
        query: 'cortex',
        root,
        obsidian: mockObsidian([hit('gks/note/OK.md', CLEAN_SNIPPET)]),
      })

      const actions = await loggedActions(root)
      expect(actions.length).toBeGreaterThan(0)
      expect(new Set(actions)).toEqual(new Set(['expose-to-llm']))
    })

    it('honours an explicit read override for callers that do not feed a model', async () => {
      const root = await fixtureRoot()
      const result = await recall({
        query: 'operator',
        root,
        action: 'read',
        obsidian: mockObsidian([hit('gks/note/PII.md', SSN_SNIPPET)]),
      })

      // The PII rule is scoped to expose-to-llm by design: reading locally is
      // permitted, handing it to a model is not.
      expect(result.hits.map((h) => h.atomId)).toContain('PII')
      expect(await loggedActions(root)).toEqual(['read'])
    })
  })

  describe('with a synthetic expose-only deny pack', () => {
    let policiesDir: string

    beforeEach(async () => {
      const dir = await mkdtemp(join(tmpdir(), 'msp-action-packs-'))
      policiesDir = join(dir, 'policies')
      await mkdir(policiesDir, { recursive: true })
      await writeFile(
        join(policiesDir, '90-expose-only.yaml'),
        [
          'id: test-expose-only-deny',
          'description: Deny only expose-to-llm, to isolate the action label.',
          'rules:',
          '  - id: deny-expose',
          '    description: Blanket deny on expose-to-llm.',
          '    effect: deny',
          '    match:',
          '      action: [expose-to-llm]',
          '    priority: 900',
          '',
        ].join('\n'),
        'utf8',
      )
      await loadPolicies(policiesDir)
    })

    it('drops every hit by default', async () => {
      const root = await fixtureRoot()
      const result = await recall({
        query: 'cortex',
        root,
        obsidian: mockObsidian([hit('gks/note/OK.md', CLEAN_SNIPPET)]),
      })
      expect(result.hits).toEqual([])
    })

    it('drops nothing when the caller declares read', async () => {
      const root = await fixtureRoot()
      const result = await recall({
        query: 'cortex',
        root,
        action: 'read',
        obsidian: mockObsidian([hit('gks/note/OK.md', CLEAN_SNIPPET)]),
      })
      expect(result.hits.map((h) => h.atomId)).toEqual(['OK'])
    })
  })
})

describe('cognitive facade action plumbing', () => {
  // The facade computed an action, logged it, and then called the retrieval
  // orchestrator without it — so the PEP always ran under the orchestrator's
  // own hardcoded label whatever the caller asked for.
  async function layerRoot(): Promise<string> {
    const root = await mkdtemp(join(tmpdir(), 'msp-action-facade-'))
    await mkdir(join(root, 'gks', '00_index'), { recursive: true })
    await writeFile(join(root, 'gks', '00_index', 'atomic_index.jsonl'), '', 'utf8')
    // Baseline permit only: this test is about which action reaches the PEP,
    // not about which rule fires.
    await mkdir(join(root, 'policies'), { recursive: true })
    await writeFile(
      join(root, 'policies', '00-permit.yaml'),
      ['id: facade-baseline', 'rules:', '  - id: permit-all', '    effect: permit', '    priority: 0', ''].join('\n'),
      'utf8',
    )
    return root
  }

  it('defaults to expose-to-llm', async () => {
    const root = await layerRoot()
    const layer = await createCognitiveLayer({ root, embedder: mockEmbedder(64) })
    ;(layer.store as any).vectorScoreThreshold = -1
    await layer.remember('Cortex handles planning.', { tags: ['cortex'] })
    await layer.recall('cortex planning', { topK: 5, scoreThreshold: -1 } as any)

    const actions = await loggedActions(root)
    expect(actions.length).toBeGreaterThan(0)
    expect(new Set(actions)).toEqual(new Set(['expose-to-llm']))
  })

  it('forwards an explicit action to the orchestrator', async () => {
    const root = await layerRoot()
    const layer = await createCognitiveLayer({ root, embedder: mockEmbedder(64) })
    ;(layer.store as any).vectorScoreThreshold = -1
    await layer.remember('Cortex handles planning.', { tags: ['cortex'] })
    await layer.recall('cortex planning', { topK: 5, scoreThreshold: -1, action: 'read' } as any)

    const actions = await loggedActions(root)
    expect(actions.length).toBeGreaterThan(0)
    expect(new Set(actions)).toEqual(new Set(['read']))
  })
})
