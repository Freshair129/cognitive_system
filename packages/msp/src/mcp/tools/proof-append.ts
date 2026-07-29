import { z } from 'zod'

import { appendProof, type ProofInput } from '../../govibe/proof.js'
import { errorResult, jsonResult, type ToolHandlerCtx, type ToolTextResult } from '../types.js'

export const name = 'msp_proof_append'
export const description =
  'Append msp-proof/v1 provenance, evidence, and verification metadata to Workspace Brain. Symbol and graph payloads are rejected.'

export const inputSchema = {
  workspace_root: z.string().optional(),
  record_id: z.string().min(1),
  run_id: z.string().min(1),
  provenance: z.object({ type: z.string().min(1), source_ref: z.string().min(1) }),
  evidence: z.array(z.object({ ref: z.string().min(1), source_hash: z.string().optional() })),
  verification: z.object({
    verdict: z.enum(['pass', 'fail', 'inconclusive']),
    method: z.string().optional(),
  }),
  actor: z.string().min(1),
  timestamp: z.string().min(1),
  source_hash: z.string().min(1),
  knowledge_ref: z.string().optional(),
  symbols: z.unknown().optional(),
  nodes: z.unknown().optional(),
  edges: z.unknown().optional(),
  communities: z.unknown().optional(),
  processes: z.unknown().optional(),
  provenance_ref: z.unknown().optional(),
}
type ProofAppendArgs = ProofInput & { workspace_root?: string }

export function handler(ctx: ToolHandlerCtx) {
  return async (args: ProofAppendArgs): Promise<ToolTextResult> => {
    try {
      if (!ctx.subject?.id) throw new Error('authenticated subject is required')
      if (args.actor !== ctx.subject.id) throw new Error('actor does not match authenticated subject')
      const { workspace_root, ...record } = args
      record.actor = ctx.subject.id
      const result = await appendProof({
        serverRoot: ctx.root,
        workspaceRoot: workspace_root,
        record,
      })
      return jsonResult({ ok: true, schema: 'msp-proof/v1', ...result })
    } catch (error) {
      return errorResult(`proof_append failed: ${(error as Error).message}`)
    }
  }
}
