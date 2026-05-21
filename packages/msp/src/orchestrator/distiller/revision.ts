import { judgeContradiction, Contradiction } from '../../validator/contradiction-judge.js'
import { EpistemicState } from '../consolidator/types.js'
import { NarrativeUnit, IdentityBelief } from './types.js'

export interface RevisionDecision {
  oldState: EpistemicState
  newState: EpistemicState
  rationale: string
  contradictions: Contradiction[]
}

/**
 * Technical logic for transitioning epistemic states based on new evidence.
 * 
 * Implements the state machine for Phase D:
 * - confirmed + Definite Contradiction -> contested
 * - contested + Supporting Evidence -> confirmed
 * - contested + Definite Contradiction -> deprecated (if threshold hit)
 */
export function decideStateTransition(
  currentBelief: IdentityBelief,
  judgeResult: { ok: boolean; contradictions: Contradiction[] }
): RevisionDecision {
  const { ok, contradictions } = judgeResult
  const current = currentBelief.epistemic_state

  // 1. Definite Contradiction Case
  if (!ok) {
    if (current === 'confirmed') {
      return {
        oldState: 'confirmed',
        newState: 'contested',
        rationale: 'Established belief contradicted by new session evidence.',
        contradictions
      }
    }
    
    if (current === 'contested') {
      // For now, second contradiction moves straight to deprecated.
      // In future, use the challenge_counter from frontmatter.
      return {
        oldState: 'contested',
        newState: 'deprecated',
        rationale: 'Persistent contradiction confirmed; belief is no longer valid.',
        contradictions
      }
    }
  }

  // 2. Supporting Evidence / Stability Case
  if (ok && current === 'contested') {
    // If the judge finds no conflict for a contested belief, we move it back.
    return {
      oldState: 'contested',
      newState: 'confirmed',
      rationale: 'Contradiction not sustained; belief reinstated.',
      contradictions: []
    }
  }

  // 3. No Change
  return {
    oldState: current,
    newState: current,
    rationale: 'No logical tension detected.',
    contradictions: []
  }
}

/**
 * High-level hook for the distiller to check a new artifact against the world.
 */
export async function runRevisionPass(
  root: string,
  newArtifactPath: string,
): Promise<RevisionDecision[]> {
  // Logic to iterate through Tier 3 beliefs and judge them
  // This will be implemented in T1/T2 as part of the orchestrator integration.
  return []
}
