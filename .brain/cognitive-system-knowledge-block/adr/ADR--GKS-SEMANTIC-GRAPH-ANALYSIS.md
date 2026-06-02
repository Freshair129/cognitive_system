---
id: ADR--GKS-SEMANTIC-GRAPH-ANALYSIS
phase: 2
type: adr
status: active
vault_id: default
tier: process
source_type: axiomatic
title: Upgrade GKS Graph to DiGraph with Semantic Edge Attributes and Adapt Graph Analysis Algorithms
tags:
  - gks
  - graph-analysis
  - networkx
  - semantic-network
  - infranodus
  - decision
crosslinks:
  references:
    - CONCEPT--TAXONOMY-V2-3
created_at: 2026-05-24T17:23:00.000+07:00
aliases:
  - ADR
  - implementation_flow
  - Architecture decision record
cluster: implementation_flow
role: Architecture decision record
attributes:
  domain: adr
  language: markdown
---

# ADR — GKS Semantic Graph Analysis

## Context

GKS (Genesis Knowledge System) originally used a simple undirected graph (`nx.Graph`) to model note relationships, linking notes purely via body-text Wikilinks. To transition GKS into an Active Thinking Engine inspired by InfraNodus, the system needs to support directed, semantic relationships (e.g., `Node A -- contradicts --> Node B`) declared inside note properties.

Changing the graph structure to a directed graph (`nx.DiGraph`) causes compatibility issues with network analysis algorithms used in `/api/v1/analyze-gaps` (such as `nx.connected_components` and `greedy_modularity_communities`), which are mathematically or programmatically defined only for undirected graphs in NetworkX.

## Decision

1. **Graph Representation**: Initialize `G` as `nx.DiGraph()` to natively store directed relationships.
2. **Semantic Edge Extraction**: Parse YAML Frontmatter block properties (`related_to`, `contradicts`, `expands_on`, `depends_on`, `references`) to extract directed semantic edges with a `relation_type` attribute. Fall back to standard Wikilinks in the note body as `related_to` relations.
3. **Graph Analysis Compatibility**: 
   - Perform an undirected conversion of the graph `G_undirected = G.to_undirected()` for algorithms that do not support directed structures:
     - `nx.connected_components(G_undirected)` (islands detection).
     - `greedy_modularity_communities(G_undirected)` (community/cluster detection).
   - Use the original directed graph `G` for `nx.betweenness_centrality(G)` calculations, preserving the flow-based semantic centrality when identifying hubs.
   - Use `G_undirected.has_edge(hub1, hub2)` to verify whether there is any connection (regardless of direction) between two cluster hubs.

## Consequences

**Positive**
- Fully supports semantic directionality (e.g. contradictions, dependencies) in note relations.
- Prevents FastAPI crashes due to `NetworkXNotImplemented` errors on the gap analysis endpoint.
- Correctly identifies potential bridges between communities by validating bidirectional connectivity.

**Negative**
- Converting to undirected adds a negligible execution step.

## Alternatives Considered

1. **Weakly Connected Components & Directed Modularity**:
   NetworkX does not have native support for directed greedy modularity community detection. Using alternative libraries would introduce complex external dependencies.
2. **Keep Graph Undirected & Store Direction in Attributes**:
   Would require custom path traversal logic and prevent leveraging native NetworkX directed graph algorithms.

## Source

- User requirement for Active Thinking Engine (InfraNodus concept)
- NetworkX DiGraph documentation
