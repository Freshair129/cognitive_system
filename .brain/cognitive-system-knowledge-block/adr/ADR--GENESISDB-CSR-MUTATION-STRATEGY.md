---
id: ADR--GENESISDB-CSR-MUTATION-STRATEGY
phase: 2
type: adr
status: stable
vault_id: GKS-CORE
tier: process
source_type: axiomatic
title: "ADR — Chunked-CSR and Slack Space for High-Throughput Write"
tags: [genesisdb, storage, performance]
created_at: 2026-06-04T16:00:00+07:00
crosslinks:
  references: [CONCEPT--HOP-BASED-RESOLUTION]
---
# ADR — Chunked-CSR Mutation Strategy

## Context
GenesisDB requires sub-millisecond write latency for temporal graph updates.

## Decision
Adopt a Chunked-CSR (Compressed Sparse Row) architecture with slack space.

## Consequences
Faster writes at the cost of occasional slack-rebalancing overhead.
