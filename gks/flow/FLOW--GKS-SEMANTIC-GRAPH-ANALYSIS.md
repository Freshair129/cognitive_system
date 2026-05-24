---
id: FLOW--GKS-SEMANTIC-GRAPH-ANALYSIS
phase: 2
type: flow
status: active
vault_id: default
tier: process
source_type: axiomatic
title: GKS Semantic Graph Analysis DFD
tags:
  - gks
  - data-flow-diagram
  - dfd
  - semantic-graph
  - flow
crosslinks:
  references:
    - FEAT--GKS-SEMANTIC-GRAPH-ANALYSIS
    - ADR--GKS-SEMANTIC-GRAPH-ANALYSIS
created_at: 2026-05-24T17:32:00.000+07:00
aliases:
  - FLOW
  - implementation_flow
  - Data / UI flow
cluster: implementation_flow
role: Data / UI flow
attributes:
  domain: flow
  language: markdown
---

# FLOW — GKS Semantic Graph Analysis DFD

## Flow Diagram

```mermaid
flowchart TD
    %% External Entities
    Agent["EVA Agent / Client"]
    
    %% Data Stores
    Vault[("Obsidian Vault: Markdown Files")]
    GraphStore[("In-Memory NetworkX DiGraph")]
    
    %% Processes
    P1["1.0 Extract Graph from Vault"]
    P2["2.0 Analyze Gaps and Clusters"]
    
    %% Flow Connections
    Agent -- "1. AnalyzeRequest: vault_path" --> P2
    P2 -- "2. Read Vault Directory" --> P1
    Vault -- "3. Note Contents / Metadata" --> P1
    
    %% Inside P1 Graph Construction
    P1 -- "4. Parse YAML Frontmatter & Body" --> P1
    P1 -- "5. Write Nodes & Directed Semantic Edges" --> GraphStore
    
    %% Inside P2 Analysis
    GraphStore -- "6. Fetch DiGraph" --> P2
    P2 -- "7. Perform Undirected Copy" --> P2
    P2 -- "8. Calculate Betweenness Centrality on DiGraph" --> P2
    P2 -- "9. Detect Islands & Communities on Undirected Graph" --> P2
    P2 -- "10. Check Bidirectional Hub Connectivity" --> P2
    
    %% Output
    P2 -- "11. GapAnalysisResponse" --> Agent
```

## Sequence

1. **Request Initiation**: The `EVA Agent / Client` calls the FastAPI endpoint `/api/v1/analyze-gaps` with `vault_path`.
2. **Graph Extraction**:
   - The endpoint invokes `extract_graph_from_vault(vault_path)`.
   - The parser walks the vault directory, reading each Markdown file.
   - It extracts YAML Frontmatter keys: `related_to`, `contradicts`, `expands_on`, `depends_on`, `references` and registers them as directed edges in a `nx.DiGraph`.
   - It parses note bodies for standard Wikilinks (`[[NoteName]]`), registering them as default `related_to` edges.
3. **Graph Analysis**:
   - The endpoint calls NetworkX algorithms on the extracted graph.
   - An undirected copy of the graph (`G_undirected`) is generated.
   - Isolates (orphans) are extracted from the main graph.
   - Connected components (islands) are calculated on `G_undirected`.
   - Communities/clusters are detected using Greedy Modularity on `G_undirected`.
   - Centrality metrics are computed on the directed graph `G` to identify the primary `hub` node for each community.
   - Gaps/bridges are identified by checking whether there is any edge between community hubs using `G_undirected.has_edge(hub1, hub2)`.
4. **Response Delivery**: The endpoint compiles the results and sends a `GapAnalysisResponse` back to the `EVA Agent`.

## Source
- `[[FEAT--GKS-SEMANTIC-GRAPH-ANALYSIS]]`
- `[[ADR--GKS-SEMANTIC-GRAPH-ANALYSIS]]`
