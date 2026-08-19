/**
 * Resource attributes must reach the PDP no matter which source found the hit.
 *
 * Retrieval fuses eight sources but only three (`identity`, `narrative`,
 * `gks-vector`) ever attached `hit.attributes`; the other five returned bare
 * hits. Whether a policy saw any attribute at all therefore depended on which
 * source happened to win RRF for that atom — so the classification, secret and
 * tenant rules were unreachable in practice. `AttributeResolver` closes that at
 * the PEP choke point.
 */
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { AttributeResolver } from '../../src/policy/resource-attributes.js'
import { loadVaults } from '../../src/vault/registry.js'

const INDEX_DIR = join('.brain', 'cognitive-system-knowledge-block', '00_index')

/** A root whose L0 index holds `rows`. */
async function rootWithIndex(rows: Array<Record<string, unknown>>): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), 'msp-resource-attrs-'))
  await mkdir(join(root, INDEX_DIR), { recursive: true })
  await writeFile(
    join(root, INDEX_DIR, 'atomic_index.jsonl'),
    rows.map((r) => JSON.stringify(r)).join('\n'),
    'utf8',
  )
  return root
}

const OPENAI_KEY = 'sk-abcdef0123456789abcdef0123456789abcdef01'

describe('AttributeResolver', () => {
  it('supplies frontmatter attributes for a hit that carries none', async () => {
    // The exact case the five bare sources produce: grep/obsidian/episodic/
    // backlinks/graph hand back an atom id and a snippet, nothing else.
    const root = await rootWithIndex([
      { id: 'ADR--SECRETS', path: 'gks/adr/ADR--SECRETS.md', attributes: { classification: 'restricted' } },
    ])
    const resolver = new AttributeResolver(root)

    const { attributes } = await resolver.resolve({ atomId: 'ADR--SECRETS', snippet: 'plain text' })

    expect(attributes['classification']).toBe('restricted')
  })

  it('lets the hit override the index', async () => {
    const root = await rootWithIndex([
      { id: 'A', path: 'gks/adr/A.md', attributes: { classification: 'public' } },
    ])
    const resolver = new AttributeResolver(root)

    const { attributes } = await resolver.resolve({
      atomId: 'A',
      snippet: 'plain text',
      attributes: { classification: 'restricted' },
    })

    expect(attributes['classification']).toBe('restricted')
  })

  it('derives has_secret from the snippet when the atom declares nothing', async () => {
    const root = await rootWithIndex([{ id: 'A', path: 'gks/adr/A.md' }])
    const resolver = new AttributeResolver(root)

    const { attributes } = await resolver.resolve({
      atomId: 'A',
      snippet: `config: OPENAI_API_KEY=${OPENAI_KEY}`,
    })

    expect(attributes['has_secret']).toBe(true)
  })

  it('escalates over a declared has_secret: false', async () => {
    // `msp-tag` stamps `has_secret: false` on every atom it has ever scanned
    // and then re-tags that value as manual/frontmatter, so a stale negative
    // would otherwise let content opt itself out of the secret pack.
    const root = await rootWithIndex([
      { id: 'A', path: 'gks/adr/A.md', attributes: { has_secret: false } },
    ])
    const resolver = new AttributeResolver(root)

    const { attributes } = await resolver.resolve({
      atomId: 'A',
      snippet: `leaked: ${OPENAI_KEY}`,
    })

    expect(attributes['has_secret']).toBe(true)
  })

  it('never downgrades a declared has_secret: true', async () => {
    const root = await rootWithIndex([
      { id: 'A', path: 'gks/adr/A.md', attributes: { has_secret: true } },
    ])
    const resolver = new AttributeResolver(root)

    const { attributes } = await resolver.resolve({ atomId: 'A', snippet: 'nothing sensitive here' })

    expect(attributes['has_secret']).toBe(true)
  })

  it('leaves descriptive attributes to the atom, not the classifier', async () => {
    // Only `has_secret` and `pii` escalate. `domain` is descriptive, so a
    // declared value stands even though PathClassifier would derive another.
    const root = await rootWithIndex([
      { id: 'A', path: 'gks/adr/A.md', attributes: { domain: 'hand-picked' } },
    ])
    const resolver = new AttributeResolver(root)

    const { attributes } = await resolver.resolve({ atomId: 'A', snippet: 'text' })

    expect(attributes['domain']).toBe('hand-picked')
  })

  it('skips derivation when classify is off', async () => {
    const root = await rootWithIndex([{ id: 'A', path: 'gks/adr/A.md' }])
    const resolver = new AttributeResolver(root, { classify: false })

    const { attributes } = await resolver.resolve({
      atomId: 'A',
      snippet: `leaked: ${OPENAI_KEY}`,
    })

    expect(attributes['has_secret']).toBeUndefined()
  })

  it('still resolves when there is no index at all', async () => {
    const root = await mkdtemp(join(tmpdir(), 'msp-resource-attrs-none-'))
    const resolver = new AttributeResolver(root)

    const { attributes } = await resolver.resolve({
      atomId: 'UNKNOWN',
      snippet: `leaked: ${OPENAI_KEY}`,
      attributes: { classification: 'restricted' },
    })

    expect(attributes['classification']).toBe('restricted')
    expect(attributes['has_secret']).toBe(true)
  })

  it('always exposes the snippet as `body` for the PII pack', async () => {
    const root = await rootWithIndex([{ id: 'A', path: 'gks/adr/A.md' }])
    const resolver = new AttributeResolver(root)

    const { attributes } = await resolver.resolve({ atomId: 'A', snippet: 'hello' })

    expect(attributes['body']).toBe('hello')
  })

  it('leaves tenant_id unset when no vault is registered', async () => {
    // `tenant_id` is a forbidden frontmatter field, so it can only come from
    // the vault registry. With no vault loaded the multi-tenant rule stays
    // inert rather than matching on an invented tenant.
    const root = await rootWithIndex([
      { id: 'A', path: 'gks/adr/A.md', vault_id: 'not-registered' },
    ])
    const resolver = new AttributeResolver(root)

    const { attributes, namespace } = await resolver.resolve({ atomId: 'A', snippet: 'text' })

    expect(attributes['tenant_id']).toBeUndefined()
    expect(namespace).toEqual({})
  })

  it('mirrors tenant_id from the vault registry once a vault is registered', async () => {
    // This is the whole path the multi-tenant pack needs: atom -> vault_id ->
    // registered vault -> namespace.tenant_id -> resource.attributes.tenant_id.
    // Deriving it here rather than reading it from frontmatter is what keeps an
    // atom from claiming a tenant it does not belong to.
    const vaultsDir = await mkdtemp(join(tmpdir(), 'msp-vaults-'))
    await writeFile(
      join(vaultsDir, 'acme.yaml'),
      ['id: acme-vault', 'read_from:', '  - tenant_id: acme', 'write_to:', '  tenant_id: acme', ''].join('\n'),
      'utf8',
    )
    await loadVaults(vaultsDir)

    const root = await rootWithIndex([
      { id: 'A', path: 'gks/adr/A.md', vault_id: 'acme-vault' },
    ])
    const resolver = new AttributeResolver(root)

    const { attributes, namespace } = await resolver.resolve({ atomId: 'A', snippet: 'text' })

    expect(namespace.tenant_id).toBe('acme')
    expect(attributes['tenant_id']).toBe('acme')
  })

  it('refuses a tenant_id the atom declared for itself', async () => {
    // `forbidden-fields` bans `tenant_id` at the top level of frontmatter, but
    // it only inspects top-level keys — a value nested under `attributes:`
    // slips past the validator. The multi-tenant rule trusts exactly that
    // field, so the resolver drops it rather than letting an atom self-assign.
    const root = await rootWithIndex([
      { id: 'A', path: 'gks/adr/A.md', attributes: { tenant_id: 'someone-elses' } },
    ])
    const resolver = new AttributeResolver(root)

    const { attributes } = await resolver.resolve({ atomId: 'A', snippet: 'text' })

    expect(attributes['tenant_id']).toBeUndefined()
  })

  it('lets the registry override a declared tenant_id', async () => {
    const vaultsDir = await mkdtemp(join(tmpdir(), 'msp-vaults-override-'))
    await writeFile(
      join(vaultsDir, 'real.yaml'),
      ['id: real-vault', 'read_from:', '  - tenant_id: real', ''].join('\n'),
      'utf8',
    )
    await loadVaults(vaultsDir)

    const root = await rootWithIndex([
      { id: 'A', path: 'gks/adr/A.md', vault_id: 'real-vault', attributes: { tenant_id: 'claimed' } },
    ])
    const resolver = new AttributeResolver(root)

    const { attributes } = await resolver.resolve({ atomId: 'A', snippet: 'text' })

    expect(attributes['tenant_id']).toBe('real')
  })
})
