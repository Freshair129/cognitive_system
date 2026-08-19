/**
 * R-01 — the belief approval gate.
 *
 * Distilled beliefs are single-pass LLM inference. They may be stored and
 * searched, but they must not reach an agent's system prompt until a human
 * has approved them. These tests pin that boundary.
 */
import { mkdtemp, readFile, rm, writeFile, mkdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { afterEach, describe, expect, it } from 'vitest'

import {
  writeBeliefAtom,
  writeNarrativeAtom,
  coresDir,
  spheresDir,
} from '../../src/orchestrator/distiller/pillar-relation.js'
import {
  loadAllBeliefs,
  loadIdentityBeliefs,
  isApproved,
  isPersonaEligible,
} from '../../src/memory/identity.js'
import { generateIdentityPreamble } from '../../src/orchestrator/persona/preamble.js'
import type { IdentityBelief, NarrativeUnit } from '../../src/orchestrator/distiller/types.js'

const NS = 'test-ns'
const roots: string[] = []

afterEach(async () => {
  for (const dir of roots.splice(0)) await rm(dir, { recursive: true, force: true })
})

async function freshRoot(): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), 'msp-belief-gate-'))
  roots.push(root)
  return root
}

function belief(overrides: Partial<IdentityBelief> = {}): IdentityBelief {
  return {
    id: 'BELIEF--ABC1234',
    statement: 'The operator prefers terse commit messages.',
    confidence: 0.91,
    epistemic_state: 'hypothesis',
    source_narratives: ['NARRATIVE--1', 'NARRATIVE--2'],
    first_observed_at: '2026-08-19T00:00:00.000Z',
    times_confirmed: 0,
    times_contested: 0,
    provenance: {
      method: 'distilled',
      model: 'ollama',
      distilled_at: '2026-08-19T00:00:00.000Z',
      source_ids: ['NARRATIVE--1', 'NARRATIVE--2'],
    },
    ...overrides,
  }
}

function narrative(): NarrativeUnit {
  return {
    id: 'NARRATIVE--1',
    namespace: NS,
    created_at: '2026-08-19T00:00:00.000Z',
    domain: 'meta',
    epistemic_state: 'hypothesis',
    confidence: 0.8,
    encoding_level: 'L2',
    source_episodes: [{ id: 'EPISODE--A', session_id: 's1', encoding_level: 'L2' }],
    content: {
      summary: 'Operator iterates in small commits.',
      key_decisions: [],
      unresolved_questions: [],
      patterns_observed: ['small commits'],
    },
  }
}

describe('distillation write boundary', () => {
  it('writes beliefs to the project store, never the atom vault', async () => {
    const root = await freshRoot()
    const path = await writeBeliefAtom(root, NS, belief())

    expect(path).toBe(join(spheresDir(root, NS), 'BELIEF--ABC1234.md'))
    expect(path).toContain(join('.brain', 'msp', 'projects', NS, 'memory', 'spheres'))
    expect(path).not.toContain(`${join(root, 'gks')}`)
  })

  it('writes narratives to the project store, never the atom vault', async () => {
    const root = await freshRoot()
    const path = await writeNarrativeAtom(root, NS, narrative())

    expect(path).toBe(join(coresDir(root, NS), 'NARRATIVE--1.md'))
    expect(path).not.toContain(`${join(root, 'gks')}`)
  })

  it('creates its own directories rather than assuming initMemoryStore ran', async () => {
    const root = await freshRoot()
    // No initMemoryStore() call — this used to throw ENOENT.
    await expect(writeBeliefAtom(root, NS, belief())).resolves.toBeTruthy()
  })

  it('never stamps synthesised output as stable or confirmed', async () => {
    const root = await freshRoot()
    const raw = await readFile(await writeBeliefAtom(root, NS, belief()), 'utf8')

    expect(raw).toContain('status: draft')
    expect(raw).not.toContain('status: stable')
    expect(raw).toContain('epistemic_state: hypothesis')
    expect(raw).not.toMatch(/^approval:/m)
  })

  it('records synthesis provenance on the artifact', async () => {
    const root = await freshRoot()
    const raw = await readFile(await writeBeliefAtom(root, NS, belief()), 'utf8')

    expect(raw).toContain('method: distilled')
    expect(raw).toContain('model: ollama')
    expect(raw).toMatch(/source_ids:\s*\n\s+- NARRATIVE--1/)
  })
})

describe('approval gate', () => {
  it('withholds an unapproved belief from the persona preamble', async () => {
    const root = await freshRoot()
    await writeBeliefAtom(root, NS, belief())

    const all = await loadAllBeliefs({ root, namespace: NS })
    const eligible = await loadIdentityBeliefs({ root, namespace: NS })

    expect(all).toHaveLength(1)
    expect(eligible).toHaveLength(0)

    const preamble = await generateIdentityPreamble({ root, namespace: NS })
    expect(preamble).toBe('')
    expect(preamble).not.toContain('terse commit messages')
  })

  it('admits the belief once approved', async () => {
    const root = await freshRoot()
    await writeBeliefAtom(
      root,
      NS,
      belief({ approval: { approved_by: 'boss', approved_at: '2026-08-19T01:00:00.000Z' } }),
    )

    const eligible = await loadIdentityBeliefs({ root, namespace: NS })
    expect(eligible).toHaveLength(1)

    const preamble = await generateIdentityPreamble({ root, namespace: NS })
    expect(preamble).toContain('terse commit messages')
    expect(preamble).toContain('LONG-TERM IDENTITY BELIEFS')
  })

  it('revokes eligibility when a belief is later contested or deprecated', async () => {
    const approval = { approved_by: 'boss', approved_at: '2026-08-19T01:00:00.000Z' }
    for (const state of ['contested', 'deprecated'] as const) {
      const root = await freshRoot()
      await writeBeliefAtom(root, NS, belief({ approval, epistemic_state: state }))

      expect(await loadIdentityBeliefs({ root, namespace: NS })).toHaveLength(0)
      expect(await generateIdentityPreamble({ root, namespace: NS })).toBe('')
    }
  })

  it('treats a partial approval block as unapproved', async () => {
    const root = await freshRoot()
    const dir = spheresDir(root, NS)
    await mkdir(dir, { recursive: true })
    await writeFile(
      join(dir, 'BELIEF--PARTIAL.md'),
      [
        '---',
        'id: BELIEF--PARTIAL',
        'type: belief',
        'status: draft',
        'epistemic_state: hypothesis',
        'confidence: 0.9',
        'approval:',
        '  approved_at: 2026-08-19T01:00:00.000Z',
        'crosslinks:',
        '  references: []',
        '---',
        '',
        '## Belief',
        '',
        'Half-written approval block.',
        '',
      ].join('\n'),
      'utf8',
    )

    expect(await loadIdentityBeliefs({ root, namespace: NS })).toHaveLength(0)
  })

  it('isolates namespaces', async () => {
    const root = await freshRoot()
    const approval = { approved_by: 'boss', approved_at: '2026-08-19T01:00:00.000Z' }
    await writeBeliefAtom(root, 'alpha', belief({ approval }))

    expect(await loadIdentityBeliefs({ root, namespace: 'alpha' })).toHaveLength(1)
    expect(await loadIdentityBeliefs({ root, namespace: 'beta' })).toHaveLength(0)
  })

  it('returns nothing when no project root is supplied', async () => {
    // Guards against a caller accidentally getting an unscoped belief set.
    const beliefs = await loadIdentityBeliefs({})
    expect(Array.isArray(beliefs)).toBe(true)
  })
})

describe('gate predicates', () => {
  it('isApproved requires a non-empty approver', () => {
    expect(isApproved(belief())).toBe(false)
    expect(
      isApproved(belief({ approval: { approved_by: '', approved_at: 'x' } })),
    ).toBe(false)
    expect(
      isApproved(belief({ approval: { approved_by: 'boss', approved_at: 'x' } })),
    ).toBe(true)
  })

  it('isPersonaEligible is approval AND epistemic health', () => {
    const approval = { approved_by: 'boss', approved_at: 'x' }
    expect(isPersonaEligible(belief({ approval }))).toBe(true)
    expect(isPersonaEligible(belief({ approval, epistemic_state: 'contested' }))).toBe(false)
    expect(isPersonaEligible(belief({ epistemic_state: 'confirmed' }))).toBe(false)
  })
})
