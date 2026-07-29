---
id: FEAT--GOVIBE-CONTEXT-PROOF-BRIDGE
version: 1.0.0
phase: 2
type: feat
tier: process
status: stable
enforcement_state: active
created_at: 2026-07-29T00:00:00+07:00
created_by: ATHER
last_update: 2026-07-29T00:00:00+07:00
delivery_from: owner-approved GoVibe capability absorption plan
superseded_by: null
vault_id: GKS-CORE
source_type: axiomatic
title: GoVibe Context and Proof Bridge
summary: Defines the MSP facade used by GoVibe to resolve two-brain context, write GKS code knowledge, and append non-duplicated proof records.
tags: [govibe, msp, gks, context, provenance]
domain: agent-runtime
priority: P0
crosslinks:
  references: [ADR--GOVIBE-SKILL-AND-DATA-OWNERSHIP]
aliases: [FEAT--]
cluster: implementation_flow
role: Runtime capability contract
---

# FEAT--GOVIBE-CONTEXT-PROOF-BRIDGE

## Objective

Expose the smallest MSP-owned interface required by the first GoVibe vertical slice without moving executable skill definitions into either Brain.

## Capability Contract

MSP shall expose three operations:

1. `msp_context_resolve` reads references from the Global Brain and Workspace Brain, applies sharing policy, and returns a context packet fragment.
2. `msp_knowledge_write` validates and writes code-knowledge records to the workspace GKS through the MSP facade.
3. `msp_proof_append` appends provenance, evidence, and verification records to the Workspace Brain.

The operations shall use the following versioned payloads:

- `govibe-context-fragment/v1`: global/workspace state references, knowledge references, policy decisions, and source hashes.
- `gks-code-knowledge/v1`: symbols, nodes, edges, communities, processes, and `provenance_ref`.
- `msp-proof/v1`: provenance/evidence/verification metadata and `knowledge_ref`, without duplicated GKS payloads.

## Security And Precedence

- Global identity and security policy cannot be weakened by Workspace state.
- Workspace state wins only for project-scoped keys.
- CoDev/shared context denies Global private-memory content unless the item is explicitly promoted and redacted.
- Returned context contains references and hashes. It does not return arbitrary private file contents.
- Writes must remain inside the resolved workspace roots and reject traversal.

## Acceptance Criteria

- `SKILL` remains a valid GKS metadata/reference atom but resolves project-only; MSP does not create or execute `~/.brain/skills`.
- Context resolution distinguishes missing roots from empty roots and records policy denials.
- Proof records reject embedded symbol/graph payloads and include `knowledge_ref` when knowledge is involved.
- Knowledge records reject embedded evidence/proof payloads and include `provenance_ref`.
- MCP registration and focused package tests cover all three operations.

## Out Of Scope

- Executable GoVibe Skill Registry implementation.
- GoVibe stage execution and UI behavior.
- Migration or deletion of existing user files under `~/.brain/skills`.
- Direct GoVibe-to-GKS access.
