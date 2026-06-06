---
id: ADR--GENESISDB-KIMPACT-ALGORITHM
phase: 2
type: adr
status: stable
vault_id: GKS-CORE
tier: process
source_type: axiomatic
title: "ADR — K-Impact Propagation Algorithm"
tags: [genesisdb, k-impact]
created_at: 2026-06-04T16:15:00+07:00
crosslinks:
  references: [CONCEPT--NEXUSMIND-THINKING-LEVELS]
---
# ADR — GenesisDB K-Impact Algorithm

## Context
Node relevance decays over time unless reinforced by evidence.

## Decision
Apply a weighted propagation algorithm based on edge density and axiomatic distance.

## Consequences
Automated "Importance" ranking for retrieval tuning.
