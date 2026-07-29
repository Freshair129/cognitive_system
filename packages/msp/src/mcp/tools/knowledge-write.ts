import { z } from 'zod'

import { writeCodeKnowledge, type CodeKnowledgeInput } from '../../govibe/knowledge.js'
import { errorResult, jsonResult, type ToolHandlerCtx, type ToolTextResult } from '../types.js'

export const name = 'msp_knowledge_write'
export const description =
  'Validate and serialize gks-code-knowledge/v1 writes through the MSP facade into the GKS GraphStore. Proof and evidence payloads are rejected.'

const propsSchema = z.record(z.unknown())
const nodeSchema = z.object({
  id: z.string().min(1),
  labels: z.array(z.string().min(1)).min(1),
  props: propsSchema.optional(),
})
const symbolSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  kind: z.string().min(1),
  path: z.string().optional(),
  line: z.number().int().positive().optional(),
  props: propsSchema.optional(),
})
const edgeSchema = z.object({
  id: z.string().min(1),
  from: z.string().min(1),
  to: z.string().min(1),
  rel: z.string().min(1),
  props: propsSchema.optional(),
})
const communitySchema = z.object({
  id: z.string().min(1),
  label: z.string().optional(),
  member_ids: z.array(z.string().min(1)),
  props: propsSchema.optional(),
})
const processSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  step_ids: z.array(z.string().min(1)),
  props: propsSchema.optional(),
})

export const inputSchema = {
  workspace_root: z.string().optional(),
  record_id: z.string().min(1),
  provenance_ref: z.string().min(1),
  symbols: z.array(symbolSchema).optional(),
  nodes: z.array(nodeSchema).optional(),
  edges: z.array(edgeSchema).optional(),
  communities: z.array(communitySchema).optional(),
  processes: z.array(processSchema).optional(),
  evidence: z.unknown().optional(),
  verification: z.unknown().optional(),
  proof: z.unknown().optional(),
  verdict: z.unknown().optional(),
  knowledge_ref: z.unknown().optional(),
}
type KnowledgeWriteArgs = CodeKnowledgeInput & { workspace_root?: string }

export function handler(ctx: ToolHandlerCtx) {
  return async (args: KnowledgeWriteArgs): Promise<ToolTextResult> => {
    try {
      const { workspace_root, ...record } = args
      const result = await writeCodeKnowledge({
        serverRoot: ctx.root,
        workspaceRoot: workspace_root,
        record,
      })
      return jsonResult({ ok: true, schema: 'gks-code-knowledge/v1', ...result })
    } catch (error) {
      return errorResult(`knowledge_write failed: ${(error as Error).message}`)
    }
  }
}
