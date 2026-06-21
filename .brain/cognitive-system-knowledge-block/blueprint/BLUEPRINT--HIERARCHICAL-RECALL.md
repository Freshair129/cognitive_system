---
id: BLUEPRINT--HIERARCHICAL-RECALL
phase: 3
type: blueprint
status: stable
vault_id: default
tier: process
source_type: axiomatic
title: "BLUEPRINT — Hierarchical Recall (Multi-tier RRF Fusion)"
tags:
  - msp
  - ucf
  - retrieval
  - rrf
crosslinks:
  references:
    - CONCEPT--IDENTITY-EVOLUTION
    - SPEC--888-TIERED-MEMORY-DISTILLATION
    - ADR--RETRIEVAL-RRF-FUSION
  implements:
    - FEAT--HIERARCHICAL-RECALL
created_at: 2026-06-05T08:15:00+07:00
linked_symbols:
  - file: packages/msp/src/cognitive/index.ts
  - file: packages/msp/src/cognitive/fts.ts
aliases:
  - BLUEPRINT
cluster: implementation_flow
role: Implementation plan
attributes:
  domain: knowledge-engine
---

# BLUEPRINT — Hierarchical Recall

## Context
Standard RAG is insufficient for complex agent memory. Hierarchical Recall uses Reciprocal Rank Fusion (RRF) to combine Vector and Full-Text Search results.

## Implementation Details

### 1. Multi-tier Fusion
Implement RRF algorithm to merge results from `VectorStore` and `FtsSearch`.
- **Geography**: `packages/msp/src/cognitive/index.ts`

### 2. Full-Text Search
Implement SQLite-backed FTS5 search over atom bodies.
- **Geography**: `packages/msp/src/cognitive/fts.ts`

## Verification
- Verified with `fts.test.ts`.
- End-to-end recall verification in `cognitive-layer.test.ts`.
