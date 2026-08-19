import { z } from 'zod'

import { generateIdentityPreamble } from '../../orchestrator/persona/preamble.js'
import type { ToolHandlerCtx } from '../types.js'

export const name = 'msp_identity_beliefs'

export const description =
  "Returns the agent's long-term identity beliefs formatted as a system preamble. Only human-approved, non-contested beliefs are included; unapproved distillation output is withheld."

export const inputSchema = z.object({
  namespace: z.string().optional().describe('Project namespace (default `default`).'),
  root: z.string().optional().describe('Project root (default: server context root).'),
})

interface IdentityBeliefsArgs {
  namespace?: string
  root?: string
}

export function handler(ctx: ToolHandlerCtx) {
  return async (args: IdentityBeliefsArgs = {}) => {
    try {
      const preamble = await generateIdentityPreamble({
        root: args.root ?? ctx.root,
        ...(args.namespace ? { namespace: args.namespace } : {}),
      })

      return {
        content: [
          {
            type: 'text',
            text:
              preamble ||
              'No approved identity beliefs for this namespace yet. Distilled beliefs require explicit approval (`msp-belief approve <id>`) before they can shape agent behaviour.',
          },
        ],
      }
    } catch (err) {
      return {
        isError: true,
        content: [
          { type: 'text', text: `Failed to fetch identity beliefs: ${(err as Error).message}` },
        ],
      }
    }
  }
}
