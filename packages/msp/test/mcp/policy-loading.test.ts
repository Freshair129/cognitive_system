/**
 * G-04 — the MCP server must load the ABAC packs before any tool can run.
 *
 * `getPolicySet()` is a module-level global consulted by every PEP. If the
 * server never loads it, `evaluatePolicy()` matches no rule and falls through
 * to default-permit, so every control is silently inert. These tests pin the
 * load, the visibility of an empty policy set, and the fail-closed opt-in.
 */
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { createMspMcpServer } from '../../src/mcp/server.js'
import { getPolicySet, type PolicySet } from '../../src/policy/loader.js'
import { evaluatePolicy } from '../../src/policy/pdp.js'
import { makeContext, makeResource, makeSubject } from '../../src/policy/types.js'

const roots: string[] = []

function countRules(set: PolicySet): number {
  return set.policies.reduce((n, p) => n + p.rules.length, 0)
}

afterEach(async () => {
  for (const dir of roots.splice(0)) await rm(dir, { recursive: true, force: true })
  delete process.env['MSP_REQUIRE_POLICIES']
})

beforeEach(() => {
  delete process.env['MSP_REQUIRE_POLICIES']
})

async function rootWithPolicies(packs: Record<string, string>): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), 'msp-policy-load-'))
  roots.push(root)
  const dir = join(root, 'policies')
  await mkdir(dir, { recursive: true })
  for (const [name, body] of Object.entries(packs)) {
    await writeFile(join(dir, name), body, 'utf8')
  }
  return root
}

const DENY_READS = `
id: test-deny-reads
description: Deny every read for the purposes of this test.
rules:
  - id: deny-all-reads
    description: Blanket deny.
    effect: deny
    match:
      action: [read]
    priority: 900
`

const PERMIT_BASE = `
id: test-default-permit
description: Baseline permit.
rules:
  - id: permit-everything
    description: Baseline.
    effect: permit
    priority: 0
`

describe('createMspMcpServer — policy loading (G-04)', () => {
  it('loads the packs found under <root>/policies', async () => {
    const root = await rootWithPolicies({ '00-permit.yaml': PERMIT_BASE, '90-deny.yaml': DENY_READS })
    await createMspMcpServer({ root })

    const set = getPolicySet()
    const ids = set.policies.map((p) => p.id).sort()
    expect(ids).toEqual(['test-default-permit', 'test-deny-reads'])
    expect(set.version).toBeGreaterThan(0)
  })

  it('makes a deny rule actually deny — the behaviour that was missing', async () => {
    const root = await rootWithPolicies({ '00-permit.yaml': PERMIT_BASE, '90-deny.yaml': DENY_READS })
    await createMspMcpServer({ root })

    const decision = evaluatePolicy(
      makeSubject('user', 'alice'),
      makeResource('atom', 'ADR--ANY'),
      'read',
      makeContext('mcp-stdio', 'trace-1'),
      getPolicySet(),
    )

    // Before this fix the policy set was empty, no rule matched, and the PDP
    // returned its default `permit` no matter what the packs said.
    expect(decision.effect).toBe('deny')
  })

  it('honours an explicit policiesDir override', async () => {
    const root = await rootWithPolicies({})
    const elsewhere = join(root, 'custom-policies')
    await mkdir(elsewhere, { recursive: true })
    await writeFile(join(elsewhere, 'deny.yaml'), DENY_READS, 'utf8')

    await createMspMcpServer({ root, policiesDir: elsewhere })
    expect(getPolicySet().policies.map((p) => p.id)).toContain('test-deny-reads')
  })

  it('starts with a warning when no policies are present', async () => {
    const root = await mkdtemp(join(tmpdir(), 'msp-policy-none-'))
    roots.push(root)

    // Default posture is Phase-1 default-permit (UCF D-7): a missing policies
    // directory must not stop a consumer project from running.
    await expect(createMspMcpServer({ root })).resolves.toBeTruthy()
  })

  it('refuses to start with requirePolicies when no rules load', async () => {
    const root = await mkdtemp(join(tmpdir(), 'msp-policy-strict-'))
    roots.push(root)

    await expect(createMspMcpServer({ root, requirePolicies: true })).rejects.toThrow(
      /no policy rules loaded/,
    )
  })

  it('refuses to start when MSP_REQUIRE_POLICIES=1 and no rules load', async () => {
    const root = await mkdtemp(join(tmpdir(), 'msp-policy-strict-env-'))
    roots.push(root)
    process.env['MSP_REQUIRE_POLICIES'] = '1'

    await expect(createMspMcpServer({ root })).rejects.toThrow(/MSP_REQUIRE_POLICIES/)
  })

  it('does not mistake a policy set loaded by another caller for its own', async () => {
    // `loadPolicies()` returns the previously loaded global unchanged when the
    // directory is missing. Inferring "did anything load?" from its return
    // value therefore reports success on whatever some earlier caller in the
    // same process happened to load — the exact order-dependence this fix
    // removes.
    const seeded = await rootWithPolicies({ '00-permit.yaml': PERMIT_BASE })
    await createMspMcpServer({ root: seeded })
    expect(countRules(getPolicySet())).toBeGreaterThan(0)

    const empty = await mkdtemp(join(tmpdir(), 'msp-policy-stale-'))
    roots.push(empty)
    await expect(createMspMcpServer({ root: empty, requirePolicies: true })).rejects.toThrow(
      /no policy rules loaded/,
    )
  })

  it('starts under requirePolicies when rules do load', async () => {
    const root = await rootWithPolicies({ '00-permit.yaml': PERMIT_BASE })
    await expect(createMspMcpServer({ root, requirePolicies: true })).resolves.toBeTruthy()
  })
})
