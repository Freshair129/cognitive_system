import type { Thresholds } from './types.js'

// Feature weights for Tier-1 scoring
export const WEIGHTS = {
  decision: 2.5,
  code: 2.0,
  numeric: 1.5,
  length: 1.0,
  continuity: 1.2,
  deadEnd: -3.0,
  filler: -2.0,
}

// Default thresholds for scoring and boundary detection
export const DEFAULT_THRESHOLDS: Thresholds = {
  low: 0.3,
  high: 0.65,
  boundary: 0.25,
}

// Default timeout for Tier-2 LLM calls
export const DEFAULT_LLM_CALL_TIMEOUT_MS = 8000

// Default maximum number of LLM calls per session
export const DEFAULT_MAX_LLM_CALLS_PER_SESSION = 20
