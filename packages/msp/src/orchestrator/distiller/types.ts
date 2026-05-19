import type { Episode, MemoryDomain, EpistemicState, EncodingLevel } from '../consolidator/types.js'
import type { SlmClient } from '../../codegen/slm/types.js'

/**
 * Options for the main `distill()` orchestrator.
 */
export interface DistillOptions {
  namespace: string
  root?: string
  dryRun?: boolean
  llm?: SlmClient
  maxLlmCalls?: number
  llmTimeoutMs?: number
}

/**
 * Result of the `distill()` operation.
 */
export interface DistillResult {
  episodesProcessed: number
  narrativesCreated: number
  beliefsRevised: number
  errors: string[]
}

/**
 * Represents a single Narrative unit (Tier 2).
 */
export interface NarrativeUnit {
  id: string
  namespace: string
  created_at: string
  domain: MemoryDomain
  epistemic_state: EpistemicState
  confidence: number
  encoding_level: EncodingLevel
  
  source_episodes: Array<{
    id: string
    session_id: string
    encoding_level: EncodingLevel
  }>

  content: {
    summary: string
    key_decisions: string[]
    unresolved_questions: string[]
    patterns_observed: string[]
  }
}

/**
 * Represents a distilled Identity belief (Tier 3).
 */
export interface IdentityBelief {
  id: string
  statement: string
  confidence: number
  epistemic_state: EpistemicState
  source_narratives: string[]
  first_observed_at: string
  times_confirmed: number
  times_contested: number
}
