---
id: FLOW--SYSTEM-DATA-FLOW
phase: 2
type: flow
status: active
vault_id: default
tier: process
source_type: axiomatic
title: System Architecture DFD (Agent-MSP-GKS-DB)
tags:
  - system
  - data-flow-diagram
  - dfd
  - msp
  - gks
  - flow
crosslinks:
  references:
    - FRAMEWORK--MSP-ARCHITECTURE-V2
created_at: 2026-05-24T17:38:00.000+07:00
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

# FLOW — System Architecture DFD (Agent-MSP-GKS-DB)

## Flow Diagram

### Level 0: Context Diagram

```mermaid
flowchart LR
    Agent["Agent / LLM"] <-->|"1. Context & Memory Requests"| MSP["MSP Orchestrator"]
    MSP <-->|"2. Validation & Knowledge Queries"| GKS["GKS Engine"]
    GKS <-->|"3. File I/O, Cypher & Semantic Queries"| DB[("Database / File System / Vector Store")]
```

### Level 1: Data Flow Diagram

```mermaid
flowchart TD
    %% Entities
    subgraph Agents["Agent Layer"]
        A["Agent - Codex/Gemini/Qwen/Antigravity"]
    end

    subgraph MSP["MSP (Memory & Soul Passport)"]
        M_Ret["Retrieval Orchestrator"]
        M_Lock["Session & Lock Manager"]
        M_Cand["Candidate Pipeline / Writer"]
    end

    subgraph GKS["GKS (Genesis Knowledge System)"]
        G_Val["Validation Engine"]
        G_Logic["Graph & Vector Logic"]
        G_Store["Storage Engine"]
    end

    subgraph DB["Database Layer"]
        D_MD[("Atomic Markdown Files - gks/")]
        D_Graph[("Genesis Graph DB - JSONL Log")]
        D_Vec[("Vector Store - JSONL files")]
    end

    %% Agent <--> MSP Data Flow
    A -- "1. Request Session" --> M_Lock
    M_Lock -- "2. Grant Lock / Session ID" --> A
    
    A -- "3. Query Context (Prompt/State)" --> M_Ret
    M_Ret -- "4. Inject Unified Context" --> A
    
    A -- "5. Submit Candidate Atom" --> M_Cand
    
    %% MSP <--> GKS Data Flow
    M_Ret -- "6. Search & Fetch Atoms" --> G_Logic
    G_Logic -- "7. Relevant Knowledge Graph" --> M_Ret
    
    M_Cand -- "8. Pass for Validation" --> G_Val
    G_Val -- "9. Validation Status" --> M_Cand
    G_Val -- "10. Validated Atom" --> G_Store

    %% GKS <--> DB Data Flow
    G_Logic -- "11. Read/Cypher Query" --> D_Graph
    D_Graph -- "12. Graph Data" --> G_Logic
    
    G_Logic -- "13. Read Metadata & Content" --> D_MD
    D_MD -- "14. Markdown / Frontmatter" --> G_Logic

    G_Logic -- "17. Semantic Query" --> D_Vec
    D_Vec -- "18. Semantic Match Hits" --> G_Logic
    
    G_Store -- "15. Write/Append Log" --> D_Graph
    G_Store -- "16. Write Atom File" --> D_MD
    G_Store -- "19. Embed & Write Vector" --> D_Vec
```

## Sequence

1. **Session & Lock Initialization**:
   - An `Agent` starts a new task and requests session/concurrency lock initialization from `Session & Lock Manager (MSP)`.
   - The lock is granted, returning a session key to prevent write conflicts during execution.
2. **Context Retrieval**:
   - The `Agent` sends the current execution state/prompt to the `Retrieval Orchestrator (MSP)`.
   - The `Retrieval Orchestrator` sends search requests to the `GKS Graph & Vector Logic`.
   - `GKS` reads note files (`gks/` folder) and queries the local `Genesis Graph DB` log to assemble the relevant graph neighborhood.
   - `GKS` resolves wikilinks and constraints, returning structured knowledge back to `Retrieval Orchestrator`.
   - `Retrieval Orchestrator` compiles this into a unified context payload and injects it back to the `Agent`.
3. **Memory Proposal & Commit**:
   - As the `Agent` completes work, it proposes new or modified knowledge (e.g., `CONCEPT`, `ADR`, `BLUEPRINT` atoms) via the `Candidate Pipeline (MSP)`.
   - The candidate is passed to the `GKS Validation Engine` to check schemas (such as `atom_schema.yaml`) and link integrity.
   - If validation passes, the `GKS Storage Engine` writes the markdown file to `gks/` and appends a transaction log entry to `Genesis Graph DB`.
   - The `Candidate Pipeline` responds to the `Agent` with success.

## Source
- `[[FRAMEWORK--MSP-ARCHITECTURE-V2]]`
- `[[FRAMEWORK--FOUR-LAYERS]]`
