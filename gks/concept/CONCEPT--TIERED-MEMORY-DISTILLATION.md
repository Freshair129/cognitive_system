---
id: CONCEPT--TIERED-MEMORY-DISTILLATION
phase: 1
type: concept
status: stable
tier: process
source_type: axiomatic
vault_id: default
title: Tiered Memory Distillation — the 8-8-8 cross-session synthesis pipeline
aliases:
  - 8-8-8 protocol
  - consciousness-session-core-sphere
cluster: memory
role: Strategic intent / PRD
tags:
  - msp
  - memory
  - distillation
  - 888
  - architecture
crosslinks:
  references:
    - CONCEPT--MEMORY-SUBSYSTEM
    - CONCEPT--MEMORY-EPISODIC
    - FRAMEWORK--MSP-ARCHITECTURE-V2
created_at: 2026-05-19T10:00:00.000+07:00
---

# CONCEPT — Tiered Memory Distillation

## Intent

To evolve `cognitive_system` from a **session-isolated** agent into a **narrative-coherent** system that accumulates wisdom over time. This is achieved by implementing a hierarchical synthesis pipeline (the "8-8-8 protocol") that compresses raw interaction data into durable identity-level beliefs.

## North Star

Every turn an agent takes is informed not only by the immediate session context but by a distilled understanding of all prior interactions in that namespace, correctly prioritized by significance and confidence.

## The 8-8-8 Hierarchy

We adopt a four-tier memory structure, where each tier represents a different level of abstraction and durability:

| Tier | Name | cognitive_system Mapping | Ratio |
|---|---|---|---|
| **Tier 0** | Consciousness | Active LLM Context (transient) | — |
| **Tier 1** | Session | Interaction logs + snapshot atoms | — |
| **Tier 2** | Narrative | Cross-session patterns and arcs | **8 Sessions → 1 Narrative** |
| **Tier 3** | Identity | Durable beliefs and behavioral DNA | **8 Narratives → 1 Identity** |

## The 4 Pillars Pipeline

Every synthesis step follows a deterministic 4-step pipeline:

1. **CLEAN:** Strip greetings, boilerplate, and low-salience noise.
2. **SUMMARY:** LLM-driven synthesis of themes, decisions, and narratives.
3. **INDEX:** Embed the resulting artifact into the vector store.
4. **RELATION:** Link the new memory unit to its source evidence atoms.

## Guiding Principles

1. **Selective Forgetting:** The fixed 8:1 ratio forces the system to prioritize important knowledge over raw data.
2. **Atom-First Persistence:** Memory artifacts must result in GKS atoms to participate in the unified knowledge graph.
3. **MSP Write Authority:** Only the MSP distiller process (the "subconscious") can write distilled memory layers.

## Connections

- `[[CONCEPT--MEMORY-SUBSYSTEM]]` — provides the base session/episodic foundation.
- `[[SPEC--MEMORY-888]]` — the technical implementation contract for this concept.
- `[[FRAMEWORK--MSP-ARCHITECTURE-V2]]` — establishes the orchestrator-over-storage hierarchy.
