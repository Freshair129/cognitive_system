export const ATOM_TYPES_UPPER = [
  'CONCEPT',
  'ADR',
  'FEAT',
  'BLUEPRINT',
  'FRAME',
  'AUDIT',
  'PROTO',
] as const

export type AtomTypeUpper = (typeof ATOM_TYPES_UPPER)[number]

export interface CandidateWriteInput {
  type: string
  proposed_id: string
  title: string
  body: string
  rationale?: string
  confidence?: number
}

export interface CandidateFrontmatter {
  proposed_id: string
  type: string
  status: 'candidate'
  proposed_at: string
  proposed_by: 'agent' | 'human'
  aliases?: string[]
  rationale?: string
  confidence?: number
}

export interface CandidateSummary extends CandidateFrontmatter {
  title: string
  path: string
}

export interface CandidateRecord extends CandidateSummary {
  body: string
}

export interface CandidateWriteResult {
  path: string
  overwritten: boolean
}

export interface CandidateWriterOpts {
  root: string
  namespace?: string
  proposedBy?: 'agent' | 'human'
  /** UCF Phase 4: Subject identity for audit trails (optional). */
  subject?: import('../../policy/types.js').Subject
  /** UCF Phase 4: Request context for audit trails (optional). */
  context?: import('../../policy/types.js').RequestContext
}

export class CandidateIdError extends Error {
  constructor(id: string) {
    super(
      `Invalid proposed_id "${id}" — must match /^[A-Z]+--[A-Z0-9-]+$/`,
    )
    this.name = 'CandidateIdError'
  }
}

export class CandidateNotFoundError extends Error {
  constructor(id: string) {
    super(`Candidate not found: ${id}`)
    this.name = 'CandidateNotFoundError'
  }
}
