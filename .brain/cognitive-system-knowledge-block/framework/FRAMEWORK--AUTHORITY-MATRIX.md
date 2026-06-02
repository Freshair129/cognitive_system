---
id: FRAMEWORK--AUTHORITY-MATRIX
phase: 0
type: framework
status: stable
vault_id: default
tier: master
source_type: axiomatic
title: Authority matrix — who writes which path, by which channel
tags:
  - msp
  - authority
  - governance
  - foundation
crosslinks:
  references:
    - FRAMEWORK--MSP-ARCHITECTURE-V2
    - ADR--AGENT-WRITE-BOUNDARIES
    - CONCEPT--KNOWLEDGE-LAYERS-V2
created_at: 2026-05-03T14:01:49.281+07:00
aliases:
  - FRAMEWORK
  - implementation_flow
  - Governance / architectural framework
cluster: implementation_flow
role: Governance / architectural framework
attributes:
  domain: framework
  language: markdown
  is_test: false
  is_entrypoint: false
  has_secret: true
  secret_type: high_entropy_string
  leak_risk: high
  encryption_level: none
promoted_from: CONCEPT--KNOWLEDGE-LAYERS-V2
promoted_at: 2026-05-13T12:21:49+07:00
promotion_adr: ADR--TAXONOMY-V2-3-MIGRATION
---

# FRAME — authority matrix

Every path in the repo has exactly one legal write channel. Anything else is an authority violation and is blocked by the validator + pre-commit hook.

> 🔵 **Authoritative source for the boundary itself:** `[[ADR--AGENT-WRITE-BOUNDARIES]]` (post-Phase-3 of `[[BLUEPRINT--INBOUND-TO-CANDIDATES-MIGRATION]]`). This frame summarizes the matrix for quick reference; on conflict, defer to the ADR.

## Matrix

| Path | Direct write | Channel |
|---|---|---|
| `gks/concept/`, `gks/adr/`, `gks/feat/`, `gks/frame/` | ❌ | `msp_candidate` MCP tool → `.brain/.../candidates/` → human PR |
| `gks/blueprint/` | ✅ T3 only (Claude/Opus) — direct edit; human review required | doc-to-code workflow Phase 3 |
| `gks/audit/` | ✅ free-write — phase 6 record of what shipped | author the AUDIT atom alongside the PR |
| `gks/master/` | ❌ never authored — only **promoted** from Genesis | `[[ADR--MASTER-PROMOTION]]-<SLUG>` evidence ADR + frontmatter `promoted_from`/`promoted_at`/`promotion_adr` (per `[[FRAMEWORK--KNOWLEDGE-3-TIER]]`) |
| `gks/proto/` | ✅ T3 with ADR — predicate atoms paired with `src/validator/proto/<name>.ts` | author atom + impl together |
| `gks/task/` | ✅ T2/T3 — codegen runner consumes; rare in practice | acceptance tests gate execution |
| `src/` (hand-written) | ✅ T3 only with ADR | direct edit + AUDIT atom afterwards |
| `src/` (auto-generated from microtasks) | ❌ | edit task YAML + rerun codegen |
| `CLAUDE.md`, `GEMINI.md`, `registry.yaml` | ❌ Boss-only | ask first |
| `.brain/msp/projects/<ns>/candidates/` | ✅ agents | drop proposal via `msp_candidate` MCP tool |
| `.brain/msp/projects/<ns>/sessions/` | ✅ agents | turn-by-turn JSONL via `msp_session_append` |
| `.brain/msp/projects/<ns>/memory/` | ✅ agents | episodic memory via `msp_episode_append` |
| `.brain/msp/projects/<ns>/symbols/` | ❌ derived | `npm run msp:graph build` only (per `[[FRAMEWORK--SYMBOL-GRAPH]]`) |
| `.brain/msp/LLM_Contract/` | ❌ MSP maintainer only | code review |
| `gks/00_index/atomic_index.jsonl` | ❌ derived | `npm run msp:index` only |

## Tier definitions

| Tier | Who | Capability |
|---|---|---|
| **T1** | SLM (Qwen, Llama local) | execute microtasks under codegen contract |
| **T2** | Gemini | implementer; can write code + tasks but not ADRs |
| **T3** | Claude / Opus | architect; can write ADRs + Blueprints |
| **Boss** | Human owner | absolute authority over `CLAUDE.md`, `GEMINI.md`, `registry.yaml` |

> 🔵 **Tier axis vs. Knowledge tier:** `T1 / T2 / T3 / Boss` is the **agent authority** axis (who writes). `Safety / Master / Genesis / Process` is the **knowledge class** axis (what kind of atom) — see `[[FRAMEWORK--KNOWLEDGE-3-TIER]]`. The two are orthogonal.

## Enforcement points

| Where | What blocks |
|---|---|
| Pre-commit hook | direct write to `gks/<type>/` without going through `msp_candidate` |
| `gks verify-flow` | tier writing above its rank (e.g. T1 trying to write ADR) |
| Validator `master-requires-promotion` rule | tier:master atom without `promoted_from` + `promoted_at` + `promotion_adr` |
| `[[PROTO--AUTHORITY-ENFORCEMENT]]` predicate | `.brain/msp/authority.yaml` shape; every tier needs a candidates path |
| Manual code review | bypass attempts on `CLAUDE.md` etc. |

## Source

- `[[ADR--AGENT-WRITE-BOUNDARIES]]` — canonical source post-Phase-3 inbound migration
- `[[FRAMEWORK--KNOWLEDGE-3-TIER]]` — orthogonal knowledge-class axis (Safety / Master / Genesis)
- `[[FRAMEWORK--SYMBOL-GRAPH]]` — defines the derived `symbols/` storage path
- `[[BLUEPRINT--INBOUND-TO-CANDIDATES-MIGRATION]]` — the migration that retired `/submit-memory` + `inbound/` + the `gks inbound promote` workflow

## Connections

- [[FRAMEWORK--MSP-ARCHITECTURE-V2]]
- [[CONCEPT--KNOWLEDGE-LAYERS-V2]]
