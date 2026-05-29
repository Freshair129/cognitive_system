import {
  type MemoryStore,
  type AtomicNote,
  type ResolutionTier,
  walkGraph,
  DEFAULT_REL_WEIGHTS,
} from '@freshair129/gks'

export interface NexusmindResult {
  expandedIds: string[]
  tiers: Map<string, ResolutionTier>
  informationValues: Map<string, number>
  recandidatedIds: string[]
}

/**
 * Runs Nexusmind Mode (N0-N5) mathematical calculations and matrix evaluations.
 */
export async function runNexusmind(
  store: MemoryStore,
  seeds: string[],
  level: number,
  relWeights: Record<string, number> = DEFAULT_REL_WEIGHTS,
  decayRate = 0.8,
): Promise<NexusmindResult> {
  const expandedIds: string[] = []
  const tiers = new Map<string, ResolutionTier>()
  const informationValues = new Map<string, number>()
  const recandidatedIds: string[] = []

  if (level === 0 || seeds.length === 0) {
    for (const s of seeds) {
      tiers.set(s, 'FULL')
    }
    return { expandedIds, tiers, informationValues, recandidatedIds }
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

    // Main Chain Relevance
    const mainChainRelevance = walkRes.score

    // Domain Congruence
    let domainCongruence = 0.0
    if (note.domain && seedDomains.includes(note.domain)) {
      domainCongruence = 1.0
    }

    // Semantic Tag Synergy
    let tagSynergy = 0.0
    if (note.tags && note.tags.length > 0 && seedTags.size > 0) {
      const intersection = note.tags.filter((t) => seedTags.has(t)).length
      tagSynergy = intersection / seedTags.size
    }

    // Structural Role
    let roleAlignment = 0.0
    if (note.type === 'adr' || note.type === 'concept' || note.type === 'blueprint') {
      roleAlignment = 1.0
    }

    // S_cross
    const sCross = (mainChainRelevance + domainCongruence + tagSynergy + roleAlignment) / 4.0

    // Information Value V(n)
    const vVal = walkRes.score * sCross
    informationValues.set(nodeId, vVal)

    // Step 2: Compute Decision Matrix Utility U(n) and Resolution Tiers
    const cost = note.body ? note.body.length / 1000 : 0.1
    const costWeight = 0.2
    let utility = vVal - costWeight * cost

    const isReCandidate = (note.status as string) === 'need review' || (note.status as string) === 'under review'
    if (isReCandidate) {
      utility *= 0.5
      recandidatedIds.push(nodeId)
    }

    // Tier mapping by level:
    if (level === 1) {
      tiers.set(nodeId, 'SUMMARY')
    } else if (level === 2) {
      if (walkRes.hop === 0) tiers.set(nodeId, 'FULL')
      else if (walkRes.hop === 1) tiers.set(nodeId, 'SUMMARY')
      else if (walkRes.hop === 2) tiers.set(nodeId, 'SKELETON')
      else tiers.set(nodeId, 'MENTION')
    } else {
      if (walkRes.hop === 0) {
        tiers.set(nodeId, 'FULL')
      } else {
        const threshold = 0.15
        if (utility >= threshold) {
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

    // Step 3: K-Impact Epistemic State Shifts (N4-N5)
    if (level >= 4) {
      const ageInDays = note.created_at ? (Date.now() - Date.parse(note.created_at)) / (1000 * 60 * 60 * 24) : 0
      const reliability = note.status === 'stable' ? 1.0 : 0.6
      const incoming = await store.graph.query({ to: note.id })
      const evidenceCount = incoming.length

      const isTruth = note.status === 'stable' || note.source_type === 'axiomatic'
      const timeDecay = isTruth ? 1.0 : 1.0 + 0.01 * ageInDays
      const kImpact = (reliability * (1.0 + evidenceCount)) / timeDecay

      if (level === 5) {
        if (kImpact < 0.3 && note.status === 'stable') {
          logStateShift(note.id, note.status, 'draft', kImpact)
          note.status = 'draft' as any
          const entry = store.atomic.getEntry(note.id)
          if (entry) {
            entry.status = 'draft' as any
          }
        } else if (kImpact >= 0.8 && note.status === 'draft') {
          logStateShift(note.id, note.status, 'stable', kImpact)
          note.status = 'stable' as any
          const entry = store.atomic.getEntry(note.id)
          if (entry) {
            entry.status = 'stable' as any
          }
        }
      }
    }
  }

  return { expandedIds, tiers, informationValues, recandidatedIds }
}

function logStateShift(id: string, from: string, to: string, kImpact: number) {
  console.log(`[nexusmind] State Shift for ${id}: ${from} -> ${to} | K-Impact: ${kImpact.toFixed(3)}`)
}
