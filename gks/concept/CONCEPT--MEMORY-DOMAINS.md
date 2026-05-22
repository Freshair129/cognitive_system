---
id: CONCEPT--MEMORY-DOMAINS
phase: 1
type: concept
status: stable
tier: process
source_type: axiomatic
vault_id: default
title: Memory Domains — semantic categorization for decay and promotion
aliases:
  - knowledge categories
  - memory classification
cluster: memory
role: Strategic intent / PRD
tags:
  - msp
  - memory
  - taxonomy
  - lifecycle
crosslinks:
  references:
    - CONCEPT--TIERED-MEMORY-DISTILLATION
    - CONCEPT--EPISTEMIC-STATES
created_at: 2026-05-19T10:30:00+07:00
---

# CONCEPT — Memory Domains

## Intent

To provide a structured classification system for memory units (Sessions, Cores, Spheres) based on their semantic content. This classification determines the **retention policy** (decay rate) and **promotion difficulty** (confidence threshold required to move up the hierarchy).

## Domain Taxonomy

We identify five core domains for memory:

| Domain | Description | Decay Rate | Promotion Difficulty |
|---|---|---|---|
| `safety` | Hard constraints, ethical boundaries, security rules. | None (Permanent) | Extreme (0.95+) |
| `identity` | Trust bonds, relationship facts, persona evolution. | Slow (180 days) | High (0.85+) |
| `knowledge` | Learned facts, tool-use patterns, domain expertise. | Medium (90 days) | Standard (0.75+) |
| `contextual` | Project-specific context, ephemeral decisions. | Fast (30 days) | Moderate (0.65+) |
| `meta` | System events, internal logs, uncategorized data. | Medium (60 days) | Standard (0.70+) |

## Decay Mechanism

Decay is not physical deletion but **Priority Reduction**. As a memory unit ages past its domain's default decay window, its retrieval weight in RRF fusion is proportionally reduced. A decayed memory is still accessible via explicit lookup but will not naturally surface in query results.

## Guiding Principles

1. **Safety is Permanent:** Knowledge in the `safety` domain never decays and has the highest bar for modification.
2. **Context is Ephemeral:** Project-specific details age quickly to prevent them from cluttering the long-term knowledge graph.
3. **Decoupled Difficulty:** Different types of knowledge require different levels of evidence to be promoted to "Identity" status.

## Connections

- `[[CONCEPT--TIERED-MEMORY-DISTILLATION]]` — uses domains to filter the distillation queue.
- `[[SPEC--MEMORY-888]]` — defines the technical implementation of the decay logic.
