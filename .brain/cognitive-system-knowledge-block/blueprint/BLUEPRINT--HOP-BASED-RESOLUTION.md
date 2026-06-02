---
id: BLUEPRINT--HOP-BASED-RESOLUTION
phase: 3
type: blueprint
status: stable
vault_id: default
tier: process
source_type: axiomatic
title: BLUEPRINT — Hop-Based Resolution Implementation Plan
tags: [msp, ucf, blueprint, retrieval, resolution, graph, recall]
aliases: [BLUEPRINT, implementation_flow, Implementation plan]
cluster: implementation_flow
role: Implementation plan
linked_symbols:
  - file: packages/gks/src/memory/graph.ts
  - file: packages/gks/src/memory/index.ts
crosslinks:
  references:
    - CONCEPT--HOP-BASED-RESOLUTION
    - FEAT--RESOLUTION-EXPAND-ON-DEMAND
created_at: 2026-05-29T04:30:00+07:00
attributes:
  task_ids:
    - hop-bfs-walk
    - hop-tier-map
    - anchor-extract
    - retrieve-wiring
---

# BLUEPRINT — Hop-Based Resolution

## 1. Goal

Implement the Graph Walk Engine to traverse GKS crosslinks outward from focus query hits, calculate hop distances, map them to resolution tiers (`FULL`, `SUMMARY`, `SKELETON`, `MENTION`), and strip markdown bodies accordingly during retrieval.

## 2. Implementation Steps

### T1: BFS Graph Walk Engine (`packages/gks/src/memory/graph.ts`)
- Use the existing `neighbors()` method or implement a specialized BFS traversal on `GraphStore`.
- Input: Seed candidate IDs (Stage 1 vector/text hits), relationship filters, max depth.
- Output: Map of `atomId -> hopCount`.
- Ensure traversal edge weight handling:
  ```typescript
  // Default weights:
  const weights: Record<string, number> = {
    depends_on: 1.0,
    belongs_to: 1.0,
    implements: 0.9,
    expands_on: 0.8,
    references: 0.5,
    supersedes: 0.3
  }
  ```

### T2: Anchor Field Extraction (`packages/gks/src/memory/graph.ts` or new parser helper)
- Create a markdown/YAML parsing helper to extract anchor fields from markdown documents:
  - `id`: Compound ID of the Atom.
  - `title`: Short title.
  - `summary`: Short summary (≤250 chars).
  - `salient`: Main point.
  - `trigger`: Execution trigger.
  - `hook`: Connection back.
- Strip the rest of the body depending on the assigned resolution tier:
  - `FULL`: Keep entire frontmatter + body + crosslinks.
  - `SUMMARY`: Return only frontmatter, summary, title, salient, trigger, hook (no body).
  - `SKELETON`: Return only frontmatter, title, salient, trigger, hook (no summary, no body).
  - `MENTION`: Return only the compound ID and hop distance indicator.

### T3: Retrieval Integration (`packages/gks/src/memory/index.ts`)
- Configure `hop_tier_map` in GKS Options (defaulting to `{ 0: 'FULL', 1: 'SUMMARY', 2: 'SKELETON', 3: 'MENTION' }`).
- In `retrieve()`, after candidates are fetched and deduped:
  - Run BFS starting from the top candidates up to `max_depth` (default 3).
  - Assign each reached node its corresponding resolution tier.
  - Format the payload returned in the retrieval hits according to their tier.

## 3. Verification Plan

### 3.1 Unit Tests (`packages/gks/test/memory/hop-resolution.test.ts`)
- Test BFS traversal paths and hop calculation.
- Test parsing and extracting anchor fields for each of the 4 tiers.
- Verify that a `SUMMARY` hit contains the `summary` but no `body`.
- Verify that a `SKELETON` hit contains the `title` but no `summary` or `body`.
- Verify that a `MENTION` hit contains only `id` and hop metadata.
