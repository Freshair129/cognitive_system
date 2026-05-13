import { dispatch } from '../agents/dispatch.js'
import type { DispatchTask } from '../agents/types.js'

import { composePrompt } from './composer.js'
import { loadManifest, loadMembers } from './loader.js'
import {
  DIMENSIONS,
  type ExecuteOptions,
  type ExecuteResult,
  type LoadedMembers,
} from './types.js'

function totalMembers(members: LoadedMembers): number {
  let n = 0
  for (const dim of DIMENSIONS) {
    n += members[dim].length
  }
  return n
}

/**
 * Execute a Genesis Block end-to-end.
 *
 * Orchestrates:
 *   1. loadManifest()  — parse the GENESIS--<blockId> frontmatter
 *   2. loadMembers()   — resolve every member atom and read its body
 *   3. composePrompt() — concatenate bodies by dimension + append userPrompt
 *   4. dispatch()      — send the composed prompt through the tier router
 *
 * `dispatch()` is called with `type: 'codegen'`, `severity: 'regular'`.
 * The `codegen` type biases routing toward T2 (per
 * `BLUEPRINT--AGENT-DISPATCHER`), which is the right default for the
 * structured-composite workload a Genesis Block represents.
 *
 * If the caller supplied `opts.tier`, it is forwarded to dispatch as
 * `budget_hint`. The dispatcher's cost-policy still applies — e.g. asking
 * for T3 on a regular-severity task will throw, NOT silently downgrade.
 */
export async function executeBlock(
  blockId: string,
  opts: ExecuteOptions,
): Promise<ExecuteResult> {
  const startedAt = Date.now()

  const manifest = await loadManifest(blockId, opts.root)
  const members = await loadMembers(manifest, opts.root)
  const composedPrompt = composePrompt(manifest, members, opts.prompt)

  const task: DispatchTask = {
    type: 'codegen',
    severity: 'regular',
    prompt: composedPrompt,
    ...(opts.tier ? { budget_hint: opts.tier } : {}),
  }

  const result = await dispatch(task)

  return {
    block_id: manifest.id,
    output: result.output,
    members_loaded: totalMembers(members),
    tier_used: result.tier_used,
    duration_ms: Date.now() - startedAt,
  }
}
