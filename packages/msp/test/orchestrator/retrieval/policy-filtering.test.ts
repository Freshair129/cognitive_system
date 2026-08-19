/**
 * A hit dropped by policy must leave a trace in the result.
 *
 * `recall()` filtered denied hits out of `hits` and said nothing else, so a
 * policy misfire was indistinguishable from "your query matched nothing" —
 * from the caller's side the atom simply did not exist. That is exactly the
 * failure mode a default-permit shadow posture is supposed to make visible.
 *
 * `policy_filtered` reports the drop without putting the denied content back
 * within reach: atom id, source and deciding rule, never the snippet.
 */
import { mkdir, mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { beforeEach, describe, expect, it } from 'vitest'

import type { ObsidianClient, SearchHit } from '../../../src/obsidian/types.js'
import { recall } from '../../../src/orchestrator/retrieval/index.js'
import { loadPolicies } from '../../../src/policy/loader.js'

const packageRoot = fileURLToPath(new URL('../../..', import.meta.url))
const repoRoot = resolve(packageRoot, '../..')

const SSN_SNIPPET = 'Operator contact record, SSN 123-45-6789, internal only.'
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
  const root = await mkdtemp(join(tmpdir(), 'msp-policy-filtering-'))
  await mkdir(join(root, '.brain/msp/projects/evaAI/memory'), { recursive: true })
  return root
}

describe('recall reports policy-filtered hits', () => {
  beforeEach(async () => {
    await loadPolicies(join(repoRoot, 'policies'))
  })

  it('names the rule that dropped a hit', async () => {
    const root = await fixtureRoot()

    const result = await recall({
      query: 'operator',
      root,
      obsidian: mockObsidian([hit('gks/adr/PII.md', SSN_SNIPPET)]),
    })

    expect(result.hits).toHaveLength(0)
    expect(result.policy_filtered).toHaveLength(1)
    expect(result.policy_filtered[0]?.ruleId).toBe('pii-block-ssn')
    expect(result.policy_filtered[0]?.source).toBe('obsidian-text')
  })

  it('does not leak the denied snippet into the report', async () => {
    const root = await fixtureRoot()

    const result = await recall({
      query: 'operator',
      root,
      obsidian: mockObsidian([hit('gks/adr/PII.md', SSN_SNIPPET)]),
    })

    expect(JSON.stringify(result.policy_filtered)).not.toContain('123-45-6789')
  })

  it('stays empty when nothing is denied', async () => {
    const root = await fixtureRoot()

    const result = await recall({
      query: 'cortex',
      root,
      obsidian: mockObsidian([hit('gks/adr/CLEAN.md', CLEAN_SNIPPET)]),
    })

    expect(result.hits.length).toBeGreaterThan(0)
    expect(result.policy_filtered).toEqual([])
  })

  it('separates the kept hits from the dropped ones', async () => {
    const root = await fixtureRoot()

    const result = await recall({
      query: 'operator cortex',
      root,
      obsidian: mockObsidian([
        hit('gks/adr/PII.md', SSN_SNIPPET),
        hit('gks/adr/CLEAN.md', CLEAN_SNIPPET),
      ]),
    })

    expect(result.hits.map((h) => h.atomId)).toEqual(['CLEAN'])
    expect(result.policy_filtered.map((h) => h.atomId)).toEqual(['PII'])
  })
})
