---
id: ADR--GOVIBE-EXTERNAL-MCP-PORTS
version: 1.0.0
phase: 2
type: adr
tier: process
status: stable
enforcement_state: active
created_at: 2026-07-30T13:35:00+07:00
created_by: ATHER
last_update: 2026-07-30T13:35:00+07:00
delivery_from: owner-approved GoVibe full capability migration
superseded_by: null
vault_id: GKS-CORE
source_type: axiomatic
title: GoVibe External MCP Ports
summary: Separates GoVibe knowledge and proof transport into versioned GKS and MSP MCP ports while retaining their canonical ownership boundaries.
tags: [govibe, mcp, gks, msp, ownership]
domain: architecture
priority: P0
crosslinks:
  references: [FEAT--GOVIBE-CONTEXT-PROOF-BRIDGE]
  supersedes: [ADR--GOVIBE-SKILL-AND-DATA-OWNERSHIP]
aliases: [ADR--]
cluster: implementation_flow
role: Architecture decision
---

# ADR--GOVIBE-EXTERNAL-MCP-PORTS

## Context

The first GoVibe slice routed knowledge and proof through an MSP facade. The
approved full migration assigns code knowledge directly to a GKS MCP port and
proof directly to an MSP MCP port so either authority can fail independently
without creating a GoVibe-owned fallback store.

## Decision

1. GoVibe calls `gks_code_upsert` for versioned knowledge batches.
2. GoVibe calls `msp_evidence_record` for versioned proof batches.
3. GKS records only `provenance_ref`; MSP records only `knowledge_ref`.
4. GenesisBlockDB remains behind GKS/MSP and is never called directly by GoVibe.
5. The legacy MSP facade tools remain during a bounded compatibility window.
6. Missing transport, schema mismatch, or storage failure fails closed.

## Consequences

- GKS and MSP transports can be tested and degraded independently.
- Existing consumers are not broken immediately.
- No new local knowledge or proof store is introduced in GoVibe.

## Alternatives considered

- Keep the MSP-only facade: rejected because it hides independent authority and availability.
- Copy GKS/MSP into GoVibe: rejected because it creates fork drift and duplicate ownership.

## Source

Boss-approved GoVibe full migration instruction, 2026-07-30.
