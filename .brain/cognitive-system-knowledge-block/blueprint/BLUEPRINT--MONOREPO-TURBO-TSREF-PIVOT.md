---
id: BLUEPRINT--MONOREPO-TURBO-TSREF-PIVOT
phase: 3
type: blueprint
status: stable
vault_id: default
tier: process
source_type: axiomatic
title: BLUEPRINT — Monorepo Turbo & TS Project References Pivot
created_at: 2026-06-04T10:05:00+07:00
scale_level: L3
tags:
  - monorepo
  - turborepo
  - typescript
  - implementation
crosslinks:
  references:
    - ADR--MONOREPO-TURBO-TSREF-PIVOT
linked_symbols:
  - file: package.json
  - file: turbo.json
  - file: tsconfig.base.json
  - file: tsconfig.json
aliases:
  - BLUEPRINT
cluster: implementation_flow
role: Implementation plan
attributes:
  domain: infra
---

# BLUEPRINT — Monorepo Turbo & TS Project References Pivot

## Geography
- Root: `package.json`, `turbo.json`, `tsconfig.base.json`, `tsconfig.json`
- Packages: `packages/gks/tsconfig.json`, `packages/msp/tsconfig.json`

## Tasks

### Phase 1: Turborepo Foundation
- [ ] Install `turbo` devDependency at root.
- [ ] Create `turbo.json` with `build`, `test`, `typecheck` pipelines.

### Phase 2: TypeScript Composite Migration
- [ ] Update `tsconfig.base.json` to enable `composite`, `declaration`, and `declarationMap`.
- [ ] Update `packages/gks/tsconfig.json` (leaf package).
- [ ] Update `packages/msp/tsconfig.json` (pointing to `gks`).
- [ ] Update root `tsconfig.json` to include references to all packages.

### Phase 3: Verification
- [ ] Run `npx turbo run build`.
- [ ] Verify caching by running it again.
- [ ] Run `npx turbo run test`.

## Acceptance
- `turbo build` caches correctly.
- `tsc -b` correctly handles the dependency graph.
tly handles the dependency graph.
