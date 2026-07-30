import { z } from 'zod'

import { writeCodeKnowledge } from '../../govibe/knowledge.js'
import { errorResult, jsonResult, type ToolHandlerCtx, type ToolTextResult } from '../types.js'

export const name = 'gks_code_upsert'
export const description = 'Upsert a versioned GoVibe KnowledgeBatch into the GKS graph authority.'

const hash = z.string().regex(/^[a-f0-9]{64}$/i)
const batchSchema = z.object({
  workspace_root: z.string().optional(),
  schema_version: z.literal('govibe-knowledge-batch/v1'),
  idempotency_key: z.string().min(1),
  run_id: z.string().min(1),
  stage: z.number().int().min(1).max(12),
  source_snapshot_hash: hash,
  provenance_ref: z.string().startsWith('msp:'),
  atoms: z.array(z.unknown()),
  symbols: z.array(z.unknown()),
  relations: z.array(z.unknown()),
  context_snapshots: z.array(z.object({ kind: z.string(), value: z.unknown() }).strict()),
}).strict()

export const inputSchema = batchSchema.shape
export function handler(ctx: ToolHandlerCtx) {
  return async (raw: unknown): Promise<ToolTextResult> => {
    try {
      const args = batchSchema.parse(raw)
      const communities = args.context_snapshots.find((item) => item.kind === 'communities')?.value
      const processes = args.context_snapshots.find((item) => item.kind === 'processes')?.value
      const result = await writeCodeKnowledge({
        serverRoot: ctx.root,
        workspaceRoot: args.workspace_root,
        record: {
          record_id: args.idempotency_key,
          provenance_ref: args.provenance_ref,
          nodes: args.atoms,
          symbols: args.symbols,
          edges: args.relations,
          ...(Array.isArray(communities) ? { communities } : {}),
          ...(Array.isArray(processes) ? { processes } : {}),
        },
      })
      return jsonResult({ ok: true, schema: args.schema_version, ...result })
    } catch (error) {
      return errorResult(`gks_code_upsert failed: ${(error as Error).message}`)
    }
  }
}
