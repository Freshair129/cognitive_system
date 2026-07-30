import { z } from 'zod'

import { appendProof } from '../../govibe/proof.js'
import { errorResult, jsonResult, type ToolHandlerCtx, type ToolTextResult } from '../types.js'

export const name = 'msp_evidence_record'
export const description = 'Record an immutable GoVibe ProofBatch in the MSP proof authority.'

const hash = z.string().regex(/^[a-f0-9]{64}$/i)
const batchSchema = z.object({
  workspace_root: z.string().optional(),
  schema_version: z.literal('govibe-proof-batch/v1'),
  idempotency_key: z.string().min(1),
  run_id: z.string().min(1),
  stage: z.number().int().min(0).max(12),
  source_snapshot_hash: hash,
  findings: z.array(z.unknown()),
  stage_evidence: z.array(z.object({
    ref: z.string().min(1),
    source_hash: hash.optional(),
    kind: z.string().optional(),
    provenance_ref: z.string().optional(),
  }).strict()),
  verification: z.object({
    verdict: z.enum(['actual', 'blocked', 'failed', 'passed']),
    method: z.string().optional(),
  }).strict(),
  artifact_lineage: z.array(z.unknown()),
  actor: z.string().min(1),
  recorded_at: z.string().datetime(),
  knowledge_ref: z.string().startsWith('gks:').optional(),
}).strict()

export const inputSchema = batchSchema.shape
const verdictMap = { actual: 'pass', passed: 'pass', blocked: 'inconclusive', failed: 'fail' } as const

export function handler(ctx: ToolHandlerCtx) {
  return async (raw: unknown): Promise<ToolTextResult> => {
    try {
      if (!ctx.subject?.id) throw new Error('authenticated subject is required')
      const args = batchSchema.parse(raw)
      if (args.actor !== ctx.subject.id) throw new Error('actor does not match authenticated subject')
      const result = await appendProof({
        serverRoot: ctx.root,
        workspaceRoot: args.workspace_root,
        record: {
          record_id: args.idempotency_key,
          run_id: args.run_id,
          provenance: { type: `govibe-stage-${args.stage}`, source_ref: args.stage_evidence[0]?.ref ?? `run:${args.run_id}` },
          evidence: args.stage_evidence.map(({ ref, source_hash }) => ({ ref, ...(source_hash ? { source_hash } : {}) })),
          verification: { verdict: verdictMap[args.verification.verdict], ...(args.verification.method ? { method: args.verification.method } : {}) },
          actor: ctx.subject.id,
          timestamp: args.recorded_at,
          source_hash: args.source_snapshot_hash,
          ...(args.knowledge_ref ? { knowledge_ref: args.knowledge_ref } : {}),
          govibe_batch: args,
        },
      })
      return jsonResult({ ok: true, schema: args.schema_version, ...result })
    } catch (error) {
      return errorResult(`msp_evidence_record failed: ${(error as Error).message}`)
    }
  }
}
