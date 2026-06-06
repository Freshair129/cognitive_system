---
id: FEAT--GRAPH-WALK-ENGINE
phase: 2
type: feat
status: stable
vault_id: default
tier: process
source_type: axiomatic
title: "FEAT — Graph Walk Engine (Nexusmind Mode)"
tags:
  - knowledge-engine
  - graph
  - reasoning
  - nexusmind
  - ucf
crosslinks:
  references:
    - CONCEPT--HOP-BASED-RESOLUTION
    - CONCEPT--NEXUSMIND-THINKING-LEVELS
created_at: 2026-06-04T12:00:00+07:00
aliases:
  - FEAT
cluster: implementation_flow
role: Feature specification
attributes:
  domain: knowledge-engine
---

# FEAT — Graph Walk Engine (Nexusmind Mode)

## Context
Advanced reasoning requires traversing the knowledge graph beyond initial search hits. The Graph Walk Engine (Nexusmind) evaluates nodes based on a multi-dimensional matrix.

## API Contract

```typescript
interface NexusmindOptions {
  level: number; // N0-N5 thinking levels
  decayRate?: number; // Default 0.8
  costWeight?: number; // Default 0.2
  utilityThreshold?: number; // Default 0.15
  relWeights?: Record<string, number>;
}

interface NexusmindInput {
  seeds: string[];
  vectorScores: Map<string, number>; // ID -> initial similarity score
}

interface NexusmindResult {
  expandedIds: string[]; // Nodes promoted to FULL resolution
  tiers: Map<string, ResolutionTier>;
  informationValues: Map<string, number>;
  stateShifts: Array<{ id: string; from: string; to: string; kImpact: number }>;
}
```

## Requirements
1.  **Refined $V(n)$ Formula:** Integrate `vectorScores` into the calculation: $V(n) = \text{PathScore} \cdot S_{\text{vector}}(n) \cdot S_{\text{cross}}(n)$.
2.  **Knowledge Matrix:** Implement 4-dimension scoring (Main Chain, Domain, Tags, Type).
3.  **K-Impact Calculation:** Evaluate reliability, evidence (incoming edges), and time decay.
4.  **Governance:** State shifts must be proposed via `proposeInbound` per `[[ADR--NEXUSMIND-EPISTEMIC-TRANSITIONS]]`.
