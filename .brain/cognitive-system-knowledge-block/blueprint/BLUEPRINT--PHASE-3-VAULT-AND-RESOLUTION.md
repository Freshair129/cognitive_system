---
id: BLUEPRINT--PHASE-3-VAULT-AND-RESOLUTION
phase: 3
type: blueprint
status: active
vault_id: default
tier: process
source_type: axiomatic
title: BLUEPRINT — Phase 3 vault composition + 2-tier resolution gradient, first
  default-deny flip
tags:
  - msp
  - ucf
  - blueprint
  - phase-3
  - vault
  - resolution
crosslinks:
  implements:
    - FEAT--VAULT-COMPOSITION
    - FEAT--RESOLUTION-EXPAND-ON-DEMAND
  references:
    - ADR--VAULT-NAMESPACE-LAYERING
    - ADR--RESOLUTION-TIER-COUNT
    - ADR--DEFAULT-POLICY-POSTURE
    - BLUEPRINT--PHASE-2-SUBAGENT-SCOPING
created_at: 2026-05-14T22:21:54.630+07:00
aliases:
  - BLUEPRINT
  - implementation_flow
  - Implementation plan
cluster: implementation_flow
role: Implementation plan
attributes:
  scale_level: L2
  linked_symbols:
    - file: packages/msp/src/vault/registry.ts
    - file: packages/msp/src/vault/types.ts
    - file: packages/msp/src/orchestrator/resolution/tier.ts
    - file: packages/msp/src/orchestrator/resolution/budget.ts
  domain: blueprint
  language: markdown
  is_test: false
  is_entrypoint: false
  has_secret: true
  secret_type: aws_secret
  leak_risk: high
  encryption_level: none
linked_symbols:
  - file: packages/msp/src/index.ts
---

# BLUEPRINT — Phase 3: vault composition + resolution gradient

> Implementation plan for spec §11 Phase 3. Ships Vault composition (Layer 1 view) and the 2-tier resolution gradient (Layers 4–5), and performs the **first per-endpoint flip from `default-permit` to `default-deny`** — for `expose-to-llm` on `restricted`-tier Resources.

## Geography

New:

- `packages/msp/src/vault/registry.ts` — `loadVaults` / `resolveVault` / `vaultReadNamespaces` / `vaultWriteNamespace`.
- `packages/msp/src/vault/types.ts` — `Vault`, `VaultRegistry`, `ResolutionPolicy`.
- `~/.msp/vaults/*.yaml` — vault config files (loaded, not committed).
- `packages/msp/src/orchestrator/resolution/tier.ts` — tier-assignment function (`score = w1·sim + w2·1/(1+hops)`), emits `FULL | MENTION` (MVP), data model carries all four.
- `packages/msp/src/orchestrator/resolution/budget.ts` — Layer 5 budget enforcement.
- `expand` — facade method + `msp_expand` MCP tool.
- `apps/cli` / `packages/msp` bin — `msp-vault` CLI (`list` / `show` / `check`).

Touched:

- `packages/msp/src/memory.ts` — recall resolves the active Vault → `read_from` OR-union of Namespaces (Layer 1); retain → single `write_to`.
- `packages/msp/src/cognitive/index.ts` — `recall` returns mixed-tier hits; add `expand()`.
- `policies/20-restricted-expose.yaml` — the rule that makes `expose-to-llm` on `restricted` Resources `default-deny`.
- composer — apply resolution tiering (Layer 4) + budget (Layer 5) after the scope filter.

## Acceptance

- A Vault with `read_from: [{user_id: alice}, {tenant_id: eng-team}]` returns the union of both Namespaces on a single `recall()`; retain stamps only `write_to`.
- A read-only Vault (no `write_to`) rejects retain with a clear error.
- `recall()` returns mixed `FULL` / `MENTION` hits; `body` present iff `FULL`.
- `expand(id, { to: 'FULL' })` promotes a `MENTION`; a denied-by-policy Resource returns `{ denied_reason }`, no body. Each `expand()` is audit-logged (the Phase 3.5 telemetry signal).
- Token consumption on the standard query set is **≥ 60% below** flat top-K at the same K.
- **First default-deny flip**: `expose-to-llm` on `restricted`-tier Resources is denied unless an explicit permit rule matches — verified in the audit log. All other endpoints stay `default-permit`.
- `msp-vault check` agrees with actual `recall` visibility.
- `MSP_PROJECT` still works — a single-Namespace Vault behaves identically to the legacy single-Namespace project.

## Dependencies

- `[[BLUEPRINT--PHASE-2-SUBAGENT-SCOPING]]` — scope filter must run before resolution tiering.
- `[[FEAT--VAULT-COMPOSITION]]`, `[[FEAT--RESOLUTION-EXPAND-ON-DEMAND]]` — the contracts implemented.
- `[[ADR--VAULT-NAMESPACE-LAYERING]]` — Vault is a runtime view, never stamped.
- `[[ADR--RESOLUTION-TIER-COUNT]]` — 2-tier MVP, 4-tier data model, Phase 3.5 gate.
- `[[ADR--DEFAULT-POLICY-POSTURE]]` — per-endpoint default-deny graduation starts here.

## Tasks

1. **T3.1** — `vault/types.ts` + `vault/registry.ts`: load `~/.msp/vaults/*.yaml`, resolve to Namespace sets.
2. **T3.2** — Wire `memory.ts` recall to the Vault `read_from` OR-union (Layer 1); retain to `write_to`.
3. **T3.3** — `resolution/tier.ts`: tier-assignment function; emit `FULL | MENTION`; encode all four enum values.
4. **T3.4** — `resolution/budget.ts`: Layer 5 budget enforcement (`on_overflow` strategies).
5. **T3.5** — `expand()` facade method + `msp_expand` MCP tool; re-run ABAC on expand; per-vault `expand_limit`; audit-log every call.
6. **T3.6** — Composer: apply Layer 4 (tiering) + Layer 5 (budget) after the Phase 2 scope filter.
7. **T3.7** — `policies/20-restricted-expose.yaml` + flip the `expose-to-llm` endpoint to `default-deny` for `restricted`; verify via audit log.
8. **T3.8** — `msp-vault` CLI (`list` / `show` / `check`).
9. **T3.9** — Token-savings benchmark harness; assert ≥60% reduction vs flat top-K (the **ship gate**).

## Source

- `docs/msp/UNIVERSAL-CONTEXT-FRAMEWORK_spec.md` §11 Phase 3, §5, §6, §10.
- `[[FEAT--VAULT-COMPOSITION]]`, `[[FEAT--RESOLUTION-EXPAND-ON-DEMAND]]` — the contracts implemented.
- `[[ADR--VAULT-NAMESPACE-LAYERING]]`, `[[ADR--RESOLUTION-TIER-COUNT]]`, `[[ADR--DEFAULT-POLICY-POSTURE]]` — governing decisions.
- `[[BLUEPRINT--PHASE-2-SUBAGENT-SCOPING]]` — predecessor phase.
