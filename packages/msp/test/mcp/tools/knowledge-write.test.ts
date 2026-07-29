import { promises as fs } from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { GraphStore, gksLayout } from '@freshair129/gks'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { handler } from '../../../src/mcp/tools/knowledge-write.js'
import { handler as contextHandler } from '../../../src/mcp/tools/context-resolve.js'

describe('msp_knowledge_write tool', () => {
  let root: string

  beforeEach(async () => {
    root = await fs.mkdtemp(path.join(os.tmpdir(), 'msp-knowledge-'))
  })

  afterEach(async () => {
    await fs.rm(root, { recursive: true, force: true })
  })

  it('writes code knowledge with a provenance reference and is idempotent', async () => {
    const args = {
      record_id: 'scan-stage-05',
      provenance_ref: 'msp:proof/2026-07-29.jsonl#proof-05',
      symbols: [{ id: 'symbol-1', name: 'main', kind: 'function' }],
    }
    const first = await handler({ root })(args)
    const second = await handler({ root })(args)
    const firstParsed = JSON.parse(first.content[0]!.text)
    const secondParsed = JSON.parse(second.content[0]!.text)

    expect(firstParsed).toMatchObject({ ok: true, idempotent: false })
    expect(secondParsed).toMatchObject({ ok: true, idempotent: true })
    const graph = new GraphStore({ path: path.join(gksLayout(root).graph, 'graph.jsonl') })
    await graph.load()
    const stored = graph.getNode('govibe-code-knowledge:scan-stage-05')
    expect(stored?.props['schema']).toBe('gks-code-knowledge/v1')
    expect(stored?.props['provenance_ref']).toBe(args.provenance_ref)

    const context = await contextHandler({ root })({
      mode: 'codev', knowledge_refs: [firstParsed.knowledge_ref],
    })
    const contextParsed = JSON.parse(context.content[0]!.text)
    expect(contextParsed.knowledge_refs).toEqual([
      expect.objectContaining({ ref: firstParsed.knowledge_ref }),
    ])
  })

  it('rejects proof payloads and tampered immutable records', async () => {
    const rejected = await handler({ root })({
      record_id: 'bad-owner',
      provenance_ref: 'msp:proof/ref',
      nodes: [{ id: 'node-1', labels: ['Module'] }],
      evidence: [{ ref: 'source' }],
    })
    expect(rejected.isError).toBe(true)
    expect(rejected.content[0]!.text).toMatch(/MSP-owned field: evidence/)

    await handler({ root })({
      record_id: 'immutable', provenance_ref: 'msp:proof/ref', nodes: [{ id: 'node-1', labels: ['Module'] }],
    })
    const tampered = await handler({ root })({
      record_id: 'immutable', provenance_ref: 'msp:proof/ref', nodes: [{ id: 'node-2', labels: ['Module'] }],
    })
    expect(tampered.isError).toBe(true)
    expect(tampered.content[0]!.text).toMatch(/different hash/)
  })

  it('rejects malformed collections before they reach GKS', async () => {
    const malformed = await handler({ root })({
      record_id: 'malformed', provenance_ref: 'msp:proof/ref', symbols: [null],
    })
    expect(malformed.isError).toBe(true)
    expect(malformed.content[0]!.text).toMatch(/symbols\[0\] must be an object/)
  })
})
