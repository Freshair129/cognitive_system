---
id: ADR--MONOREPO-TURBO-TSREF-PIVOT
phase: 2
type: adr
status: stable
vault_id: default
tier: process
source_type: axiomatic
title: Monorepo Turbo & TS Project References Pivot
tags:
  - monorepo
  - turborepo
  - typescript
  - performance
  - architecture
crosslinks:
  references:
    - ADR--MONOREPO-STRUCTURE
    - CONCEPT--MONOREPO-MIGRATION
created_at: 2026-06-04T10:00:00+07:00
aliases:
  - ADR
cluster: implementation_flow
role: Architecture decision record
attributes:
  domain: infra
---

# ADR — Monorepo Turbo & TS Project References Pivot

## Context
The `cognitive-system` monorepo has grown significantly. The current `npm workspaces` setup without task orchestration or incremental builds leads to slow feedback loops and potential type-safety drifts across package boundaries.

## Decision
Adopt **Turborepo** for task orchestration and **TypeScript Project References** for type-safe incremental builds.

### 1. Turborepo Integration
- Install `turbo` at the root.
- Define a `turbo.json` with pipelines for `build`, `test`, and `typecheck`.
- Enable local caching to speed up developer workflows.

### 2. TypeScript Project References
- Enable `composite: true` and `declaration: true` in `tsconfig.base.json`.
- Migrating packages to use `references` instead of `paths` aliases for internal dependencies.
- This ensures that `msp` cannot be built unless its dependency `gks` is built and up-to-date.

## Consequences
- **Positive**: Faster builds, guaranteed dependency order, improved type safety.
- **Negative**: Initial configuration overhead; requires standardizing `build` scripts.
