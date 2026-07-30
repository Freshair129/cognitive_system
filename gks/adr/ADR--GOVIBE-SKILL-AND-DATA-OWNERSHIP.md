---
id: ADR--GOVIBE-SKILL-AND-DATA-OWNERSHIP
version: 1.0.0
phase: 2
type: adr
tier: process
status: superseded
enforcement_state: inactive
created_at: 2026-07-29T00:00:00+07:00
created_by: ATHER
last_update: 2026-07-30T13:35:00+07:00
delivery_from: owner-approved GoVibe capability absorption plan
superseded_by: ADR--GOVIBE-EXTERNAL-MCP-PORTS
vault_id: GKS-CORE
source_type: axiomatic
title: GoVibe Skill and Cognitive Data Ownership
summary: Assigns executable skills to GoVibe, code knowledge to GKS, and provenance evidence verification to MSP while preserving the MSP facade boundary.
tags: [govibe, skill-registry, msp, gks, ownership]
domain: architecture
priority: P0
crosslinks:
  references: [FEAT--GOVIBE-CONTEXT-PROOF-BRIDGE]
  implements: [FEAT--GOVIBE-CONTEXT-PROOF-BRIDGE]
aliases: [ADR--]
cluster: implementation_flow
role: Architecture decision
---

# ADR--GOVIBE-SKILL-AND-DATA-OWNERSHIP

> Superseded by `ADR--GOVIBE-EXTERNAL-MCP-PORTS`. The ownership assignments
> remain historical context; the MSP-facade-only transport decision is no
> longer active.

## Status

Accepted.

## Context

The historical Two-Brain routing table treats `SKILL` as global-first and maps it to `~/.brain/skills`. The GoVibe capability-absorption direction instead makes `.govibe` the canonical executable Skill Registry. Leaving both locations executable would create two authorities and allow content drift.

GoVibe also requires GKS knowledge and MSP proof during scan execution. ADR-014 in GoVibe requires agents to call MSP rather than GKS directly.

## Decision

1. Executable Skill Definitions and immutable version pins belong to GoVibe `.govibe` registries.
2. `SKILL` remains in the GKS taxonomy only as project-scoped metadata or a reference to an external Skill Definition.
3. MSP no longer routes `SKILL` to Global Brain and no longer initializes `~/.brain/skills`.
4. Existing `~/.brain/skills` content is left untouched; automatic deletion or migration is forbidden in this change.
5. Symbol, graph, community, process, and other code-knowledge payloads belong to GKS.
6. Provenance, evidence, verification, actor, timestamps, and source hashes belong to MSP proof records.
7. Cross-store links are references: GKS uses `provenance_ref`; MSP uses `knowledge_ref`. Payload duplication is rejected.
8. GoVibe accesses both stores through MSP's facade.

## Consequences

- The executable skill authority becomes unambiguous.
- Existing consumers of `msp_brain_resolve` can still use `SKILL`, but only against project GKS atoms.
- Global and Workspace `.brain` state resolution becomes a separate operation from GKS atom resolution.
- Old global skill folders may remain on disk but are not runtime authorities.
