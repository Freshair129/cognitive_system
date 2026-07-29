import { z } from 'zod'

import { resolveGoVibeContext } from '../../govibe/context.js'
import { errorResult, jsonResult, type ToolHandlerCtx, type ToolTextResult } from '../types.js'

export const name = 'msp_context_resolve'
export const description =
  'Resolve reference-only GoVibe context from Global and Workspace .brain state, enforce CoDev private-memory isolation, and validate requested GKS knowledge references.'

export const inputSchema = {
  workspace_root: z.string().optional(),
  mode: z.enum(['covibe', 'codev']),
  state_keys: z.array(z.string().min(1)).optional(),
  knowledge_refs: z.array(z.string().min(1)).optional(),
}
interface ContextResolveArgs {
  workspace_root?: string
  mode: 'covibe' | 'codev'
  state_keys?: string[]
  knowledge_refs?: string[]
}

export function handler(ctx: ToolHandlerCtx) {
  return async (args: ContextResolveArgs): Promise<ToolTextResult> => {
    try {
      const attestedMode = ctx.subject?.attributes['govibe_mode']
      const effectiveMode = args.mode === 'covibe' && attestedMode === 'covibe'
        ? 'covibe'
        : 'codev'
      const result = await resolveGoVibeContext({
        serverRoot: ctx.root,
        workspaceRoot: args.workspace_root,
        mode: effectiveMode,
        stateKeys: args.state_keys,
        knowledgeRefs: args.knowledge_refs,
      })
      if (args.mode !== effectiveMode) {
        result.policy_decisions.unshift({
          decision: 'deny',
          ref: 'request:mode',
          reason: 'covibe_mode_not_attested_by_subject',
        })
      }
      return jsonResult({ ok: true, requested_mode: args.mode, effective_mode: effectiveMode, ...result })
    } catch (error) {
      return errorResult(`context_resolve failed: ${(error as Error).message}`)
    }
  }
}
