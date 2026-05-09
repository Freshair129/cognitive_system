import { resolve } from 'node:path'

import { z } from 'zod'

import { CandidateWriter } from '../../memory/candidates/writer.js'
import { jsonResult, type ToolHandlerCtx, type ToolTextResult } from '../types.js'

export const name = 'msp_propose'

export const description =
  '[deprecated — use msp_candidate instead] Propose a new atom. As of Phase 2 of BLUEPRINT--INBOUND-TO-CANDIDATES-MIGRATION, this tool delegates to CandidateWriter and writes to .brain/.../candidates/ (not inbound/). Result shape preserved for back-compat. Will be removed in Phase 3.'

export const inputSchema = {
  id: z
    .string()
    .describe('Atomic id (TYPE--SLUG, e.g. CONCEPT--FOO or AUDIT--BAR; ADR-NNN also accepted).'),
  title: z.string().describe('Human-readable title (≤ 100 chars).'),
  body: z.string().describe('Body markdown. Pass "placeholder" if you intend to edit before promoting.'),
  phase: z.number().int().min(0).max(6).describe('Atom phase 0..6 (informational only — no longer routed through phase-6 patching wrapper).'),
  type: z.string().describe('Atom type (concept, adr, feat, blueprint, audit, frame, ...).'),
  root: z.string().optional().describe('Project root (default: server context root).'),
}

export function handler(ctx: ToolHandlerCtx) {
  return async (args: {
    id: string
    title: string
    body: string
    phase: number
    type: string
    root?: string
  }): Promise<ToolTextResult> => {
    const root = resolve(args.root ?? ctx.root)
    const writer = new CandidateWriter({ root, proposedBy: 'agent' })
    const result = await writer.write({
      type: args.type,
      proposed_id: args.id,
      title: args.title,
      body: args.body,
    })
    return jsonResult({
      proposed_id: args.id,
      inbound_path: result.path,
      candidate_path: result.path,
      overwritten: result.overwritten,
      _deprecation_notice:
        'msp_propose is deprecated; switch to msp_candidate. File now lives in candidates/ not inbound/.',
    })
  }
}
