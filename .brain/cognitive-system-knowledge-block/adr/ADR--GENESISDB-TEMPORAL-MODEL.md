---
id: ADR--GENESISDB-TEMPORAL-MODEL
phase: 2
type: adr
status: stable
vault_id: GKS-CORE
tier: process
source_type: axiomatic
title: "ADR — Bi-Temporal Node Model"
tags: [genesisdb, temporal]
created_at: 2026-06-04T16:10:00+07:00
crosslinks:
  references: [CONCEPT--RESOLUTION-GRADIENT]
---
# ADR — GenesisDB Temporal Model

## Context
Atoms change over time, but past states must remain queryable.

## Decision
Use a Bi-temporal addressing model (System Time vs. Knowledge Time).

## Consequences
Enables time-travel queries for "Epistemic Recall".
