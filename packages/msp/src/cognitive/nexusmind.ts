import {
  type MemoryStore,
  type ResolutionTier,
  walkGraph,
  DEFAULT_REL_WEIGHTS,
} from '@freshair129/gks'

export interface StateShift {
  id: string
  from: string
  to: string
  kImpact: number
}

export interface NexusmindResult {
  expandedIds: string[]
  tiers: Map<string, ResolutionTier>
  informationValues: Map<string, number>
  stateShifts: StateShift[]
}

/**
 * Runs Nexusmind Mode (N0-N5) mathematical calculations and matrix evaluations.
 */
export async function runNexusmind(
  store: MemoryStore,
  seeds: string[],
  level: number,
  options: {
    vectorScores?: Map<string, number>
    relWeights?: Record<string, number>
    decayRate?: number
    costWeight?: number
    utilityThreshold?: number
  } = {},
): Promise<NexusmindResult> {
  const expandedIds: string[] = []
  const tiers = new Map<string, ResolutionTier>()
  const informationValues = new Map<string, number>()
  const stateShifts: StateShift[] = []

  const relWeights = options.relWeights ?? DEFAULT_REL_WEIGHTS
  const decayRate = options.decayRate ?? 0.8
  const vectorScores = options.vectorScores ?? new Map<string, number>()
  const costWeight = options.costWeight ?? 0.2
  const utilityThreshold = options.utilityThreshold ?? 0.15

  if (level === 0 || seeds.length === 0) {
    for (const s of seeds) {
      tiers.set(s, 'FULL')
    }
    return { expandedIds, tiers, informationValues, stateShifts }
  }

  // Walk the graph to find all candidates up to depth 3
  const maxDepth = level >= 3 ? 3 : level === 1 ? 1 : 2
  const walk = await walkGraph(store.graph, seeds, maxDepth, relWeights, decayRate)

  // Step 1: Compute Knowledge Matrix (K) & Information Value (V)
  const seedNotes = await Promise.all(seeds.map((s) => store.lookup(s)))
  const seedDomains = seedNotes.map((sn) => sn?.domain).filter(Boolean) as string[]
  const seedTags = new Set(seedNotes.flatMap((sn) => sn?.tags ?? []))

  for (const [nodeId, walkRes] of walk.entries()) {
    const note = await store.lookup(nodeId)
    if (!note) continue

    // Knowledge Matrix Dimensions (4D)
    // D1: Main Chain Relevance (Path score from graph walk)
    const mainChainRelevance = walkRes.score

    // D2: Domain Congruence (1.0 if match, 0.0 otherwise)
    let domainCongruence = 0.0
    if (note.domain && seedDomains.includes(note.domain)) {
      domainCongruence = 1.0
    }

    // D3: Semantic Tag Synergy (Normalized intersection)
    let tagSynergy = 0.0
    if (note.tags && note.tags.length > 0 && seedTags.size > 0) {
      const intersection = note.tags.filter((t) => seedTags.has(t)).length
      tagSynergy = intersection / seedTags.size
    }

    // D4: Structural Role (Type alignment)
    let roleAlignment = 0.0
    if (note.type === 'adr' || note.type === 'concept' || note.type === 'blueprint') {
      roleAlignment = 1.0
    }

    // S_cross: Knowledge Matrix Synergy Score
    const sCross = (mainChainRelevance + domainCongruence + tagSynergy + roleAlignment) / 4.0

    // S_vector: Similarity score (default 0.5 if not a search hit)
    const sVector = vectorScores.get(nodeId) ?? 0.5

    // Information Value V(n) = PathScore * S_vector * S_cross
    const vVal = walkRes.score * sVector * sCross
    informationValues.set(nodeId, vVal)

    // Step 2: Compute Decision Matrix Utility U(n) and Resolution Tiers
    const cost = note.body ? note.body.length / 1000 : 0.1
    let utility = vVal - costWeight * cost

    const isUnderReview = (note.status as string) === 'need review' || (note.status as string) === 'under review'
    if (isUnderReview) {
      utility *= 0.5 // Penalty for unverified information
    }

    // Tier mapping by Thinking Level:
    if (level === 1) {
      tiers.set(nodeId, 'SUMMARY')
    } else if (level === 2) {
      if (walkRes.hop === 0) tiers.set(nodeId, 'FULL')
      else if (walkRes.hop === 1) tiers.set(nodeId, 'SUMMARY')
      else if (walkRes.hop === 2) tiers.set(nodeId, 'SKELETON')
      else tiers.set(nodeId, 'MENTION')
    } else {
      // N3-N5 use Utility-based expansion
      if (walkRes.hop === 0) {
        tiers.set(nodeId, 'FULL')
      } else {
        if (utility >= utilityThreshold) {
          tiers.set(nodeId, 'FULL')
          expandedIds.push(nodeId)
        } else if (utility >= 0.05) {
          tiers.set(nodeId, 'SUMMARY')
        } else if (utility >= 0.0) {
          tiers.set(nodeId, 'SKELETON')
        } else {
          tiers.set(nodeId, 'MENTION')
        }
      }
    }

    // Step 3: K-Impact Evaluation (N4-N5)
    if (level >= 4) {
      // Guard against malformed created_at: Date.parse → NaN would propagate
      // through timeDecay into kImpact, making both shift thresholds false and
      // silently suppressing the epistemic transition. Treat unparseable dates
      // as age 0 (no decay) instead.
      const parsedCreated = note.created_at ? Date.parse(note.created_at) : NaN
      const ageInDays = Number.isNaN(parsedCreated)
        ? 0
        : (Date.now() - parsedCreated) / (1000 * 60 * 60 * 24)
      const reliability = note.status === 'stable' ? 1.0 : 0.6
      const incoming = await store.graph.query({ to: nodeId })
      const evidenceCount = incoming.length

      const isTruth = note.status === 'stable' || note.source_type === 'axiomatic'
      const timeDecay = isTruth ? 1.0 : 1.0 + 0.01 * ageInDays
      const kImpact = (reliability * (1.0 + evidenceCount)) / timeDecay

      if (level === 5) {
        if (kImpact < 0.3 && note.status === 'stable') {
          stateShifts.push({ id: nodeId, from: note.status, to: 'draft', kImpact })
        } else if (kImpact >= 0.8 && note.status === 'draft') {
          stateShifts.push({ id: nodeId, from: note.status, to: 'stable', kImpact })
        }
      }
    }
  }

  return { expandedIds, tiers, informationValues, stateShifts }
}
