import { dispatch } from '../agents/dispatch.js'
import type { DispatchTask, Tier } from '../agents/types.js'
import { findActiveMaster } from '../master/registry.js'

import { composePrompt } from './composer.js'
import { loadManifest } from './loader.js'
import { GenesisBlockBridge } from './bridge.js'
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
 *   1. loadManifest()      — parse the GENESIS--<blockId> frontmatter
 *   2. GenesisBlockBridge  — resolve members via graph (Seeds + High-Impact Neighbors)
 *   3. findActiveMaster()  — check the Promoted-Block Registry
 *   4. composePrompt()     — concatenate bodies by dimension + append userPrompt
 *   5. dispatch()          — send the composed prompt through the tier router
 */
export async function executeBlock(
  blockId: string,
  opts: ExecuteOptions,
): Promise<ExecuteResult> {
  const startedAt = Date.now()

  const manifest = await loadManifest(blockId, opts.root)
  
  // Phase 4.4: Use Bridge for impact-aware resolution
  const bridge = new GenesisBlockBridge(opts.root)
  const members = await bridge.resolveMembers(blockId)

  // Phase F1: surface registry membership to the runtime.
  const masterEntry = await findActiveMaster(opts.root, manifest.id)
  const fromMaster = masterEntry !== null

  const composedPrompt = composePrompt(manifest, members, opts.prompt)

  // Tier resolution: explicit opt > master-floor > none.
  let budgetHint: Tier | undefined
  if (opts.tier !== undefined) {
    budgetHint = opts.tier
  } else if (fromMaster) {
    budgetHint = 'T2'
  }

  const task: DispatchTask = {
    type: 'codegen',
    severity: 'regular',
    prompt: composedPrompt,
    ...(budgetHint ? { budget_hint: budgetHint } : {}),
  }

  const result = await dispatch(task)

  return {
    block_id: manifest.id,
    output: result.output,
    members_loaded: totalMembers(members),
    tier_used: result.tier_used,
    duration_ms: Date.now() - startedAt,
    ...(fromMaster ? { from_master: true } : {}),
  }
}
