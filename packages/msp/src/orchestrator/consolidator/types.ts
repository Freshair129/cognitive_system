import type { SlmClient } from '../../codegen/slm/types.js'
import type { Embedder } from '@freshair129/gks'

/** A single user/agent turn, read from a session log. */
export interface Turn {
  id: string // sequential, e.g. turn_001
  timestamp: string // ISO 8601
  speaker: 'user' | 'agent'
  text: string
}

/**
 * A sequence of turns forming a logical unit of conversation, to be
 * scored and potentially summarised.
 */
export type Chunk = Turn[]

export type Verdict = 'keep' | 'drop' | 'borderline'

export interface SessionStats {
  turnCount: number
  meanTurnBytes: number
  stddevTurnBytes: number
}

export interface Thresholds {
  low: number
  high: number
  boundary: number
}

/** Options for the main `consolidate()` orchestrator. */
export interface ConsolidateOptions {
  sessionId: string
  root?: string
  llm?: SlmClient
  embedder?: Embedder
  thresholds?: Partial<Thresholds>
  maxLlmCallsPerSession?: number
  llmCallTimeoutMs?: number
}

/** The final output of consolidation for one contiguous chunk. */
export interface Episode {
  sessionId: string
  turnRange: [number, number] // [startTurnIndex, endTurnIndex]
  summary: string
  tags: string[]
  score: number
  scoreSource: 'tier1' | 'tier2' | 'tier2-default'
  createdAt: string // ISO 8601
}
