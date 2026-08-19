/**
 * The secret detector must not fire on this repo's own vocabulary.
 *
 * `SecurityClassifier` used to fall back to a distinct-character-count check
 * (`new Set(word).size > 15` over any 32+ char run). Run over the 395 atoms in
 * this vault it flagged 232 of them (58.7%) — atom IDs, source paths and
 * snake_case config keys, none of which are secrets. The replacement flags 1.
 *
 * That matters because `has_secret: true` makes `80-security-secrets` deny
 * `expose-to-llm`, and a denied hit is dropped from recall. A false positive
 * therefore silently removes real knowledge from a model's context, which is a
 * worse failure than missing an exotic credential. The replacement trades
 * recall for precision: Shannon entropy, no word structure, all three
 * character classes present.
 */
import { describe, expect, it } from 'vitest'

import { SecurityClassifier } from '../../src/policy/classifiers/security.js'

const classifier = new SecurityClassifier()

async function hasSecret(body: string): Promise<boolean> {
  const { attributes } = await classifier.classify({ id: 'X', path: 'gks/adr/X.md', body })
  return attributes.has_secret === true
}

describe('SecurityClassifier precision', () => {
  describe('does not flag this repo\u2019s own vocabulary', () => {
    const benign: Array<[string, string]> = [
      ['atom ids', 'See BLUEPRINT--INBOUND-TO-CANDIDATES-MIGRATION and FEAT--GOVIBE-CONTEXT-PROOF-BRIDGE.'],
      ['source paths', 'Implemented in packages/msp/src/validator/rules/dangling-wikilinks.ts'],
      ['snake_case keys', 'Set include_failed_test_in_next_prompt to true in the runner config.'],
      ['doc links', 'Superseded by docs/adr/014-doc-to-code-enforcement.md in the migration.'],
      ['wiki links', 'Related: [[CONCEPT--KNOWLEDGE-LAYERS-V2]] and [[FRAMEWORK--MSP-ARCHITECTURE-V2]].'],
      ['prose', 'The orchestrator fuses eight retrieval sources with reciprocal rank fusion.'],
    ]

    for (const [name, body] of benign) {
      it(name, async () => {
        expect(await hasSecret(body)).toBe(false)
      })
    }
  })

  describe('still catches real credentials', () => {
    const secrets: Array<[string, string]> = [
      ['openai key', 'OPENAI_API_KEY=sk-1234567890abcdef1234567890abcdef1234567890abcdef'],
      ['aws access key id', 'access_key: AKIA1234567890ABCDEF'],
      ['github pat', 'token = ghp_16C7e42F292c6912E7710c838347Ae178B4a'],
      ['quoted generic secret', 'password: "hunter2-correct-horse"'],
      ['unbranded random token', 'Some random string: 4f7G9xZ2kLp6mN8vQ1rW3tY5uI0oP9aS8dF7gH6jJ5kK4l'],
      ['base64 blob', 'blob: dGhpc2lzYXZlcnlzZWNyZXRhbmRyYW5kb21zdHJpbmc5OTg4Nzc2Ng=='],
    ]

    for (const [name, body] of secrets) {
      it(name, async () => {
        expect(await hasSecret(body)).toBe(true)
      })
    }
  })

  it('treats a git SHA as an identifier, not a credential', async () => {
    // A 40-char lowercase hex run in this repo is a commit, and commits are
    // quoted constantly in AUDIT-- atoms. Requiring mixed case plus a digit is
    // what keeps them out — a deliberate recall trade, not an oversight.
    expect(await hasSecret('Fixed in a3f9c2e81b7d4650af92c3e7188b4d20fa71c9e3.')).toBe(false)
  })

  it('reports the detector that fired', async () => {
    const { attributes } = await classifier.classify({
      id: 'X',
      path: 'gks/adr/X.md',
      body: 'blob: 4f7G9xZ2kLp6mN8vQ1rW3tY5uI0oP9aS8dF7gH6jJ5kK4l',
    })
    expect(attributes.secret_type).toBe('high_entropy_string')
    expect(attributes.leak_risk).toBe('high')
  })
})
