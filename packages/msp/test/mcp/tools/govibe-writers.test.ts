import { promises as fs } from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { handler as gksHandler } from '../../../src/mcp/tools/gks-code-upsert.js'
import { handler as mspHandler } from '../../../src/mcp/tools/evidence-record.js'

const HASH = 'a'.repeat(64)

describe('GoVibe external writer contracts', () => {
  let root: string

  beforeEach(async () => {
    root = await fs.mkdtemp(path.join(os.tmpdir(), 'govibe-writers-'))
  })

  afterEach(async () => {
    await fs.rm(root, { recursive: true, force: true })
  })

  it('upserts govibe-knowledge-batch/v1 through the GKS-owned writer', async () => {
    const input = {
      schema_version: 'govibe-knowledge-batch/v1',
      idempotency_key: 'run-1-stage-1',
      run_id: 'run-1',
      stage: 1,
      source_snapshot_hash: HASH,
      provenance_ref: 'msp:proof/provenance-1',
      atoms: [{ id: 'file:src/index.ts', labels: ['File'], props: { path: 'src/index.ts' } }],
      symbols: [],
      relations: [],
      context_snapshots: [],
    }
    const first = await gksHandler({ root })(input)
    const second = await gksHandler({ root })(input)
    expect(JSON.parse(first.content[0]!.text)).toMatchObject({ ok: true, idempotent: false })
    expect(JSON.parse(second.content[0]!.text)).toMatchObject({ ok: true, idempotent: true })
  })

  it('records govibe-proof-batch/v1 through the MSP-owned writer', async () => {
    const input = {
      schema_version: 'govibe-proof-batch/v1',
      idempotency_key: 'proof-run-1-stage-1',
      run_id: 'run-1',
      stage: 1,
      source_snapshot_hash: HASH,
      findings: [],
      stage_evidence: [{ ref: 'inventory:l1', source_hash: HASH, kind: 'scan-stage' }],
      verification: { verdict: 'passed' as const, method: 'inventory' },
      artifact_lineage: [],
      actor: 'govibe',
      recorded_at: '2026-07-30T01:02:03.000Z',
    }
    const ctx = { root, subject: { kind: 'service' as const, id: 'govibe', attributes: {} } }
    const first = await mspHandler(ctx)(input)
    const second = await mspHandler(ctx)(input)
    expect(JSON.parse(first.content[0]!.text)).toMatchObject({ ok: true, idempotent: false })
    expect(JSON.parse(second.content[0]!.text)).toMatchObject({ ok: true, idempotent: true })
  })

  it('rejects cross-owner fields and unsupported schemas', async () => {
    const badKnowledge = await gksHandler({ root })({
      schema_version: 'govibe-knowledge-batch/v1', idempotency_key: 'bad', run_id: 'run-1', stage: 1,
      source_snapshot_hash: HASH, provenance_ref: 'msp:proof/1', atoms: [], symbols: [], relations: [],
      context_snapshots: [], findings: [],
    })
    expect(badKnowledge.isError).toBe(true)

    const badProof = await mspHandler({ root, subject: { kind: 'service' as const, id: 'govibe', attributes: {} } })({
      schema_version: 'govibe-proof-batch/v0', idempotency_key: 'bad-proof', run_id: 'run-1', stage: 1,
      source_snapshot_hash: HASH, findings: [], stage_evidence: [], verification: { verdict: 'passed' as const },
      artifact_lineage: [], actor: 'govibe', recorded_at: '2026-07-30T01:02:03.000Z',
    })
    expect(badProof.isError).toBe(true)
  })
})
