---
id: BLUEPRINT--RESOLUTION-EXPAND-ON-DEMAND
phase: 3
type: blueprint
status: stable
vault_id: default
tier: process
source_type: axiomatic
title: "BLUEPRINT — Resolution Expand-on-Demand"
tags:
  - msp
  - ucf
  - resolution
  - retrieval
crosslinks:
  references:
    - CONCEPT--RESOLUTION-GRADIENT
    - ADR--RESOLUTION-TIER-COUNT
    - FRAMEWORK--UNIVERSAL-CONTEXT-FRAMEWORK
  implements:
    - FEAT--RESOLUTION-EXPAND-ON-DEMAND
created_at: 2026-06-05T08:20:00+07:00
linked_symbols:
  - file: packages/gks/src/memory/index.ts
  - file: packages/gks/src/memory/gks.ts
aliases:
  - BLUEPRINT
cluster: implementation_flow
role: Implementation plan
attributes:
  domain: knowledge-engine
---

# BLUEPRINT — Resolution Expand-on-Demand

## Context
To save tokens, the system retrieves only the necessary "tier" of an atom (MENTION, SKELETON, SUMMARY, FULL). The `expand()` API allows promoting a node to a higher tier on demand.

## Implementation Details

### 1. Tiered Rendering
Implement `renderByTier` to filter atom content based on the target ResolutionTier.
- **Geography**: `packages/gks/src/memory/index.ts`

### 2. Expand Logic
Update the `retrieve` API to accept `expansions` and provide a standalone `expand(id)` method.
- **Geography**: `packages/gks/src/memory/gks.ts`

## Verification
- Verified with `vector-store.test.ts` (resolution tiers check).
