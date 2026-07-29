import { promises as fs } from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { canonicalJson, sha256 } from '../../../src/govibe/canonical.js'
import { handler } from '../../../src/mcp/tools/proof-append.js'

describe('msp_proof_append tool', () => {
  let root: string
  const sourceHash = 'a'.repeat(64)

  beforeEach(async () => {
    root = await fs.mkdtemp(path.join(os.tmpdir(), 'msp-proof-'))
  })

  afterEach(async () => {
    await fs.rm(root, { recursive: true, force: true })
  })

  function validRecord() {
    return {
      record_id: 'proof-stage-01',
      run_id: 'run-01',
      provenance: { type: 'scan-stage', source_ref: 'repo:src/index.ts' },
      evidence: [{ ref: 'repo:src/index.ts', source_hash: sourceHash }],
      verification: { verdict: 'pass' as const, method: 'parser' },
      actor: 'govibe',
      timestamp: '2026-07-29T01:02:03.000Z',
      source_hash: sourceHash,
      knowledge_ref: 'gks:code-knowledge/stage-01.json',
    }
  }

  const ctx = () => ({
    root,
    subject: { kind: 'service' as const, id: 'govibe', attributes: {} },
  })

  it('appends canonical proof and treats exact retries as idempotent', async () => {
    const first = await handler(ctx())(validRecord())
    const second = await handler(ctx())(validRecord())
    const firstParsed = JSON.parse(first.content[0]!.text)
    const secondParsed = JSON.parse(second.content[0]!.text)

    expect(firstParsed).toMatchObject({ ok: true, idempotent: false })
    expect(secondParsed).toMatchObject({ ok: true, idempotent: true })
    const proofPath = path.join(root, '.brain', 'msp', 'proof', firstParsed.proof_ref.replace('msp:proof/', ''))
    expect(JSON.parse(await fs.readFile(proofPath, 'utf8')).schema).toBe('msp-proof/v1')
  })

  it('rejects GKS payloads and a duplicate id with a different hash', async () => {
    const rejected = await handler(ctx())({ ...validRecord(), symbols: [{ id: 'symbol-1' }] })
    expect(rejected.isError).toBe(true)
    expect(rejected.content[0]!.text).toMatch(/GKS-owned field: symbols/)

    await handler(ctx())(validRecord())
    const tampered = await handler(ctx())({ ...validRecord(), verification: { verdict: 'fail' as const } })
    expect(tampered.isError).toBe(true)
    expect(tampered.content[0]!.text).toMatch(/different hash/)
  })

  it('rejects a forged actor and serializes concurrent retries', async () => {
    const forged = await handler(ctx())({ ...validRecord(), actor: 'other-agent' })
    expect(forged.isError).toBe(true)
    expect(forged.content[0]!.text).toMatch(/actor does not match authenticated subject/)

    const results = await Promise.all([
      handler(ctx())(validRecord()),
      handler(ctx())(validRecord()),
    ])
    const parsed = results.map((result) => JSON.parse(result.content[0]!.text))
    expect(parsed.map((item) => item.idempotent).sort()).toEqual([false, true])
  })

  it('rejects a symbolic-link proof target when the platform permits the fixture', async () => {
    const proofDirectory = path.join(root, '.brain', 'msp', 'proof')
    const outside = path.join(path.dirname(root), `${path.basename(root)}-outside.jsonl`)
    await fs.mkdir(proofDirectory, { recursive: true })
    await fs.writeFile(outside, 'outside\n')
    const body = canonicalJson({ schema: 'msp-proof/v1', ...validRecord() })
    const target = path.join(proofDirectory, `2026-07-29--proof-stage-01--${sha256(body)}.json`)
    try {
      await fs.symlink(outside, target, 'file')
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'EPERM') {
        await fs.rm(outside, { force: true })
        return
      }
      throw error
    }
    try {
      const result = await handler(ctx())(validRecord())
      expect(result.isError).toBe(true)
      expect(result.content[0]!.text).toMatch(/symbolic link|must be a regular file/)
      expect(await fs.readFile(outside, 'utf8')).toBe('outside\n')
    } finally {
      await fs.rm(outside, { force: true })
    }
  })
})
