import { readFile } from 'node:fs/promises'

import { gksLayout, type Namespace } from '@freshair129/gks'

import { runClassifiers } from './classifiers/engine.js'
import { ContentClassifier } from './classifiers/content.js'
import { SecurityClassifier } from './classifiers/security.js'
import { resolveVault } from '../vault/registry.js'
import type { AttributeBag, JsonValue } from './types.js'

/**
 * Attributes a classifier is allowed to *escalate* over a declared value.
 *
 * Everything an atom declares in frontmatter normally wins over a derived
 * value — that is the precedence rule `runClassifiers` implements, and it is
 * right for descriptive attributes like `domain` or `classification`.
 *
 * These two are different: they drive deny rules. Letting an atom's
 * `has_secret: false` suppress a live detection would make the control
 * opt-out-able by the very content it is meant to gate, so a positive
 * detection escalates over a declared negative. A declared *positive* still
 * stands — manual escalation is never downgraded.
 */
const ESCALATABLE = new Set(['has_secret', 'pii'])

interface IndexRow {
  id: string
  path?: string
  vault_id?: string
  attributes?: Record<string, unknown>
}

/** One retrieval hit, reduced to what attribute resolution needs. */
export interface ResolvableHit {
  atomId: string
  snippet?: string
  attributes?: Record<string, any>
}

export interface ResolvedAttributes {
  attributes: AttributeBag
  namespace: Namespace
}

export interface AttributeResolverOptions {
  /**
   * Derive `has_secret` / `pii` from the hit's snippet when the atom does not
   * declare them. On by default.
   *
   * Note the scan sees the *snippet*, not the whole atom — which is the right
   * scope here, since the snippet is what actually reaches the model.
   */
  classify?: boolean
}

/**
 * Resolves the UCF Resource attributes for a retrieval hit.
 *
 * Retrieval fuses eight sources, but only three of them (`identity`,
 * `narrative`, `gks-vector`) ever populated `hit.attributes`; the other five
 * returned bare hits. Whether a policy saw any attribute at all therefore
 * depended on which source happened to win RRF for that atom. Resolving here —
 * once, at the PEP choke point — makes every source equivalent rather than
 * patching five adapters.
 *
 * Precedence, highest first:
 *   1. attributes the source attached to the hit
 *   2. attributes declared in the atom's frontmatter (via the L0 index)
 *   3. attributes derived from the snippet by the classifiers
 *
 * with the `ESCALATABLE` exception above.
 */
export class AttributeResolver {
  private readonly root: string
  private readonly classify: boolean
  private index: Promise<Map<string, IndexRow>> | null = null
  private readonly classifiers = [new ContentClassifier(), new SecurityClassifier()]

  constructor(root: string, opts: AttributeResolverOptions = {}) {
    this.root = root
    this.classify = opts.classify ?? true
  }

  async resolve(hit: ResolvableHit): Promise<ResolvedAttributes> {
    const row = (await this.loadIndex()).get(hit.atomId)

    const declared: AttributeBag = {
      ...((row?.attributes ?? {}) as AttributeBag),
      ...((hit.attributes ?? {}) as AttributeBag),
    }

    const body = hit.snippet ?? ''
    const attributes: AttributeBag = { ...declared, body: hit.snippet ?? null }

    if (this.classify && body) {
      // Classify against an empty bag so the classifiers always derive a fresh
      // verdict; `runClassifiers` would otherwise tag whatever `declared`
      // already holds as `manual/frontmatter` and never re-derive it.
      const derived = await runClassifiers(
        { id: hit.atomId, path: row?.path ?? hit.atomId, body },
        this.classifiers,
      )
      for (const [key, value] of Object.entries(derived.attributes)) {
        if (!(key in declared)) {
          attributes[key] = value as JsonValue
        } else if (ESCALATABLE.has(key) && value === true) {
          attributes[key] = true
        }
      }
    }

    const namespace = resolveNamespace(row?.vault_id)

    // The vault registry is the only authority on tenancy.
    //
    // `tenant_id` is on the validator's forbidden-frontmatter list precisely so
    // an atom cannot claim its own tenant — but that rule only inspects
    // top-level keys, so a value nested under `attributes:` slips past it. The
    // multi-tenant pack reads `resource.attributes.tenant_id`, so anything
    // declared is dropped here and the registry's answer substituted; with no
    // vault registered the rule stays inert rather than trusting the atom.
    delete attributes['tenant_id']
    if (namespace.tenant_id !== undefined) {
      attributes['tenant_id'] = namespace.tenant_id
    }

    return { attributes, namespace }
  }

  private loadIndex(): Promise<Map<string, IndexRow>> {
    this.index ??= readIndex(this.root)
    return this.index
  }
}

/**
 * Namespace for an atom, via its vault.
 *
 * A vault is a view over namespaces, so the tenant is a property of the vault
 * registry — not of the atom. With no vault registered this returns `{}`,
 * which is what the PDP has always seen.
 */
function resolveNamespace(vaultId: string | undefined): Namespace {
  if (!vaultId) return {}
  const vault = resolveVault(vaultId)
  if (!vault) return {}
  return vault.write_to ?? vault.read_from[0] ?? {}
}

async function readIndex(root: string): Promise<Map<string, IndexRow>> {
  const byId = new Map<string, IndexRow>()
  let raw: string
  try {
    raw = await readFile(gksLayout(root).atomicIndex, 'utf8')
  } catch {
    // No index — hit attributes and classification still apply.
    return byId
  }
  for (const line of raw.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed) continue
    try {
      const row = JSON.parse(trimmed) as IndexRow
      if (row.id) byId.set(row.id, row)
    } catch {
      // skip malformed line — best-effort load, same as scale-gate
    }
  }
  return byId
}
