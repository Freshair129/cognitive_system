import type { RequestContext, Subject } from '../../policy/types.js'

export interface Edge {
  from: string
  to: string
  type: string
}

export interface RebuildOpts {
  root: string
  namespace?: string
  dryRun?: boolean
  check?: boolean
  /** UCF Phase 4: Subject identity for audit trails (optional). */
  subject?: Subject
  /** UCF Phase 4: Request context for audit trails (optional). */
  context?: RequestContext
}

export interface RebuildResult {
  atomCount: number
  edgeCount: number
  changed: boolean
  outputPath: string
}
