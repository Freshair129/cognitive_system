import type { SessionTurn } from '../../memory/sessions/types.js'
import type { Embedder } from '@freshair129/gks'
import type { SlmClient as BaseSlmClient } from '../../codegen/slm/types.js'
import type { RequestContext, Subject } from '../../policy/types.js'

/**
 * A single turn from session.jsonl. Re-exports the existing memory shape so
 * the consolidator can be wired to the sessions reader without remapping.
 */
export type Turn = SessionTurn

/**
 * The canonical SLM client type (function-based) used across MSP.
 */
export type LlmClient = BaseSlmClient

/** Alias for LlmClient to support legacy references in tests/modules. */
export type SlmClient = LlmClient

/**
 * A contiguous group of turns (one possible episode candidate).
 */
export type Chunk = Turn[]

export type Verdict = 'keep' | 'drop' | 'borderline'

export type ScoreBreakdown = Record<string, number>

export interface Tier1Result {
  score: number
  verdict: Verdict
  breakdown: ScoreBreakdown
}

export type ScoreSource = 'tier1' | 'tier2' | 'tier2-default'

export interface Tier2Result {
  score: number
  summary: string
  tags: string[]
  source: 'tier2' | 'tier2-default'
}

export interface SessionStats {
  turnCount: number
  meanTurnBytes: number
  stddevTurnBytes: number
}

export interface Thresholds {
  low?: number
  high?: number
  boundary?: number
}

export interface ConsolidateOptions {
  sessionId: string
  root?: string
  namespace?: string
  llm?: SlmClient
  embedder?: Embedder
  thresholds?: Thresholds
  maxLlmCallsPerSession?: number
  llmCallTimeoutMs?: number
  /** Injected clock for testing. */
  now?: () => Date
  /** UCF Subject for policy enforcement. */
  subject?: Subject
  /** UCF Request Context for policy enforcement. */
  context?: RequestContext
}

// --- Tiered Memory Enums (Phase A) ---

export type MemoryDomain =
  | 'safety'
  | 'identity-relationship'
  | 'knowledge-skill'
  | 'contextual'
  | 'meta'

export type EpistemicState =
  | 'hypothesis'
  | 'confirmed'
  | 'contested'
  | 'deprecated'

export type EncodingLevel =
  | 'L0'   // trace
  | 'L1'   // light
  | 'L2'   // standard
  | 'L3'   // deep
  | 'L4'   // critical

/** The final output of consolidation for one contiguous chunk. */
export interface Episode {
  sessionId: string
  turnRange: [number, number]
  summary: string
  tags: string[]
  score: number
  scoreSource: ScoreSource
  createdAt: string
  
  // Tiered memory extensions (Phase A)
  domain?: MemoryDomain
  epistemic_state?: EpistemicState
  encoding_level?: EncodingLevel
}
