---
id: FEAT--GKS-SEMANTIC-GRAPH-ANALYSIS
phase: 2
type: feat
status: active
vault_id: default
tier: process
source_type: axiomatic
title: GKS Semantic Graph Analysis API
tags:
  - gks
  - network-analysis
  - semantic-graph
  - infranodus
  - feat
crosslinks:
  references:
    - CONCEPT--TAXONOMY-V2-3
    - ADR--GKS-SEMANTIC-GRAPH-ANALYSIS
created_at: 2026-05-24T17:28:00.000+07:00
aliases:
  - FEAT
  - implementation_flow
  - Feature spec
cluster: implementation_flow
role: Feature spec
attributes:
  domain: feat
  language: markdown
---

# FEAT — GKS Semantic Graph Analysis API

## User-facing behaviour

The GKS Graph Analysis service provides advanced structural gap and cluster analysis over an Obsidian knowledge base.

It exposes a REST API endpoint `/api/v1/analyze-gaps` that returns:
- **Total nodes and edges** showing the overall volume of the semantic graph.
- **Orphan nodes** (concept files that do not connect to any other concept).
- **Islands** (sub-graph clusters that are completely isolated from the main component of the graph).
- **Potential Bridges** (suggested relationships between the primary central hubs of different communities to bridge conceptual gaps, simulating active thinking engines like InfraNodus).

The semantic network engine extracts typed, directed relationships defined in the YAML Frontmatter block of Markdown notes:
- `related_to`: Standard or default relationship.
- `contradicts`: Signifies opposing or conflicting ideas.
- `expands_on`: Marks ideas that build on top of parent concepts.
- `depends_on`: Denotes conceptual prerequisites.

## Verification

### Automated Tests
Verify that the FastAPI analysis endpoint handles directed graphs without throwing modularity/connectivity errors:
- Send a `POST` request to `/api/v1/analyze-gaps` with `vault_path`.
- Assert response properties:
  - `total_nodes` and `total_edges` are non-zero integers.
  - `islands` is a list of arrays of node names.
  - `potential_bridges` contains a list of suggested concept bridges with `concept_a` and `concept_b`.

### Manual Verification
Validate that relations in the frontmatter are parsed correctly and form directed edges inside the NetworkX graph.

## Out of Scope
- Visual rendering of the semantic network graph on the dashboard (deferred to UI dashboard integration).
- Real-time indexing via directory watchers (indexing triggers on-demand per API call).

## Source
- User specification for transitioning GKS into an Active Thinking Engine (InfraNodus concept).
- `[[ADR--GKS-SEMANTIC-GRAPH-ANALYSIS]]`
