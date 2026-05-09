---
id: AUDIT--SESSION-2026-05-09
phase: 6
type: audit
status: stable
tier: process
source_type: axiomatic
vault_id: default
title: AUDIT — Session 2026-05-09 (3-tier model + Symbol Graph + reconciliation, 16 PRs)
tags:
  - msp
  - audit
  - session
  - 3-tier
  - symbol-graph
  - reconciliation
  - milestone
crosslinks: {"references":["FRAME--KNOWLEDGE-3-TIER","FRAME--SYMBOL-GRAPH","FRAME--AUTHORITY-MATRIX","AUDIT--INBOUND-TO-CANDIDATES-MIGRATION-COMPLETE","AUDIT--CORE-FRAMEWORK-RECONCILE-V1","AUDIT--SYMBOL-GRAPH-V1","AUDIT--PR-2-PACKAGE-JSON-RESIDUE","CONCEPT--KNOWLEDGE-LAYERS-V2","ADR--AGENT-WRITE-BOUNDARIES"]}
created_at: 2026-05-09T14:00:00.000Z
---

# AUDIT — Session 2026-05-09

Single-day session that shipped two major architectural axes (3-tier knowledge model + Symbol Graph layer) plus reconciliation cleanup. 16 PRs merged across the 3 waves.

## What shipped (16 PRs)

### Wave 1 — Inbound→Candidates migration + 3-tier knowledge model (8 PRs)

| # | PR | Title | Merge SHA |
|---|---|---|---|
| W1.0 | #48 | docs(framework): bump v1.1.0 — surface candidates layer | 389babe |
| W1.1 | #49 | feat(mcp): deprecate `msp_propose`, delegate to CandidateWriter (Phase 2) | 96c1dec |
| W1.2 | #50 | feat: delete `msp_propose` + inbound infrastructure (Phase 3) | 7eff62b |
| W1.3 | #51 | feat(atoms): Phase 4 supersession + introduce 3-tier knowledge model | e9f01d8 |
| W1.4 | #52 | feat(atoms+validator): bulk-tag 165 atoms with `tier:` + 2 new rules | 68ee928 |
| W1.5 | #54 | feat(atoms+validator): first Master promotions | 47a1163 |
| W1.6 | #53 | feat(cli): `msp:master compose` loader | 21c0b5c |
| W1.7 | #55 | fix(packaging): residual `msp_propose` bin + files cleanup | 498c4fe |

### Wave 2 — Documentation reconciliation (2 PRs)

| # | PR | Title |
|---|---|---|
| W2.1 | #56 | docs(spec): reconcile `CORE_FRAMEWORK` with actual MSP codebase (W1+W2) |
| W2.2 | #61 | docs(atom): update `FRAME--AUTHORITY-MATRIX` to current MSP reality (W4) |

### Wave 3 — Symbol Graph layer (6 PRs)

| # | PR | Title |
|---|---|---|
| W3.1 | #57 | feat(atoms): Symbol Graph layer — FRAME + 2 CONCEPTs (PR-1 of 6) |
| W3.2 | #58 | feat(atoms): Symbol Graph layer — 2 ADRs + 3 FEATs (PR-2 of 6) |
| W3.3 | #59 | feat(symbols): BLUEPRINT + parser + SQLite + JSONL + Leiden (PR-3 of 6) |
| W3.4 | #60 | feat(symbols): CLI `msp:graph` + 5 MCP tools (PR-4 of 6) |
| W3.5 | #62 | feat(web): Symbols tab + 6 API endpoints (PR-5 of 6) |
| W3.6 | #63 | feat(symbols): AUDIT + upstream proposal + remove feature flag (PR-6 of 6) |

## Final state — counts

| Dimension | Start of session | End of session | Delta |
|---|---|---|---|
| Tests passing | 535 | **625** | +90 |
| Atoms | 173 | **193** | +20 |
| MCP tools | 12 | **16** | +4 (5 added, 1 deleted) |
| Bin entries | 5 | **6** | +1 (`msp-graph`) |
| npm `msp:*` scripts | 8 | **10** | +2 (`msp:master`, `msp:graph`) |
| Validator rules | 12 | **14** | +2 (`tier-enum`, `master-requires-promotion`) |
| PROTO predicates | 12 | **14** | +2 (`master-body-schema`, `master-token-cap`) |
| Master atoms | 0 | **2** | first promotions via ADR-evidence |
| Atom types under `gks/` | 9 | **10** | +`master/` |

## Doc / code / algo / tech-stack consistency check

### ✅ Consistent

- **193 atoms** all carry `tier:` + `source_type:` (validated by `tier-enum` warn-level rule)
- **2 Master atoms** both satisfy `master-requires-promotion` (have `promoted_from` + `promoted_at` + `promotion_adr`; no `learned_from`)
- **16 MCP tools** registered in `src/mcp/server.ts` `TOOLS` array; matches assertions in `test/mcp/server.test.ts` + `test/mcp/bin.test.ts` + `test/mcp/tools/candidate.test.ts`
- **6 bin entries** in `package.json`: msp-validate, msp-backlinks, msp-run-task, msp-master, msp-mcp-server, msp-graph — all point at existing `dist/` artifacts
- **`@aflsolutions/graphology-communities-leiden` 1.1.1** + **`graphology-communities-louvain` 2.0.2** fallback installed; matches `ADR--LEIDEN-COMMUNITY-DETECTION`
- **`better-sqlite3` 11.x** with WAL mode; matches `ADR--SYMBOL-GRAPH-PERSISTENCE`
- **TypeScript Compiler API parser** (per `CONCEPT--PARSER-CHOICE`); tree-sitter NOT a dep; matches v1 decision
- **Symbol Graph build smoke** (PR-4): 897 symbols / 1843 edges / 143 communities, modularity 0.958 — recorded in `AUDIT--SYMBOL-GRAPH-V1`
- **Master Block compose** smoke: 2 atoms = 720 tokens; both ≤ 400-token warn threshold
- **`FRAME--AUTHORITY-MATRIX`** body lists current paths (singular, with `master/` `proto/` rows; no `inbound/` references)
- **`FRAME--KNOWLEDGE-3-TIER`** ↔ `FRAME--SYMBOL-GRAPH` correctly orthogonal (knowledge-class axis vs structural axis)
- **All 21 FEATs** pass `gks verify-flow` (no draft atoms in any FEAT's reachable graph)
- **Validator gates** (`npx tsx src/validator/cli.ts --all`) exit 0 across the 16 PRs
- **CI** green on Node 20 + 22 across all 16 PRs (7 transient retries — npm registry / determinism)

### ⚠️ Known drift (deferred to next session — see TODO below)

- **`CORE_FRAMEWORK_MASTER_SPEC.md` §15.1** does not mention the new `msp:master` and `msp:graph` scripts (added in W1.6 / W3.4). Drift introduced by design — Reconciliation v2 was deferred.
- **`CORE_FRAMEWORK_MASTER_SPEC.md` §16.5** lists 11 MCP tools; reality is now 16 (5 `msp_symbol_*` added in W3.4). Same drift class.
- **`CORE_FRAMEWORK_MASTER_SPEC.md` §4.1 phase/status vocab** — uses P0–P7 + `stub/raw/verified`; reality uses `draft/stable/superseded/deprecated` per `FRAME--PHASE-GOVERNANCE`. W3 of the original audit; not blocking.
- **`CORE_FRAMEWORK_MASTER_SPEC.md` §7.3 forbidden fields** — example shows 3; reality is 17 in `atomic_contract.yaml`. Illustrative; not blocking.
- **`upstream/gks-proposals/05-symbol-graph.md`** filed in repo but **not yet filed as a GitHub issue** at `Freshair129/GksV3`. Deferred until GKS team is ready to receive.
- **`linked_symbols[]`** on FEAT atoms not yet populated with real symbol IDs (post-Symbol-Graph work). Manual today; could be automated later.

## Architectural axes after this session

```
                     ┌────────────────────────────────────────┐
        Knowledge-class axis ─▶ Safety / Master / Genesis / Process
        (FRAME--KNOWLEDGE-3-TIER)
                                              │
                                              ▼
        Conceptual graph (atoms)              Storage layer
        ─────────────────────────────────     ───────────────────────
        gks/<type>/*.md (193 atoms)           gks/00_index/atomic_index.jsonl
        crosslinks {references, supersedes,   .brain/.../vector/backlinks.jsonl
                    implements, ...}
                                              │
                                              ▼
                     ┌────────────────────────────────────────┐
        Structural axis ─▶ symbols / edges / communities (Leiden)
        (FRAME--SYMBOL-GRAPH)                 │
                                              ▼
                                              .brain/.../symbols/{graph.db, *.jsonl}
                                              MSP repo: 897 symbols / 1843 edges
                                              / 143 communities

        Authority axis ─▶ T1 / T2 / T3 / Boss (orthogonal to Knowledge-class)
        (FRAME--AUTHORITY-MATRIX)
```

The 4 axes (Knowledge-class, Conceptual graph, Structural graph, Authority) are independently queryable and orthogonal. Each has its own validator rules, MCP tools, CLI, and storage path.

## Tech stack additions

| Package | Version | Purpose | Source |
|---|---|---|---|
| `better-sqlite3` | ^11.10 | Symbol Graph SQLite store | `ADR--SYMBOL-GRAPH-PERSISTENCE` |
| `graphology` | ^0.25 | Graph data structure | `ADR--LEIDEN-COMMUNITY-DETECTION` |
| `graphology-types` | ^0.24 | TypeScript types | sibling of above |
| `@aflsolutions/graphology-communities-leiden` | ^1.1 | Leiden community detection | primary |
| `graphology-communities-louvain` | ^2.0 | Louvain fallback | dynamic-import |
| `@types/better-sqlite3` | ^7.6 | dev typing | typing |

All in `dependencies` (Leiden + Louvain dynamic-import-with-try-catch keeps install simple).

Existing stack unchanged: TypeScript ESM strict, Vitest, Express, MCP SDK, `@freshair129/gks` 3.6.

## Lessons learned (logged for next session)

1. **`graphology@0.25` ESM-of-CJS named-import bug** — `import { UndirectedGraph } from 'graphology'` fails at runtime but typechecks. PR-3 didn't catch it because no test triggered the leiden import path. PR-4 fixed in-line. Lesson: every new module needs at least one runtime-trigger test, not just type tests.
2. **`gks verify-flow` doesn't accept draft atoms in FEAT chains** — first SG PR-2 attempt failed CI because new FEATs reached draft FRAME/CONCEPTs. Lesson: when shipping atoms across multiple PRs, the early ones must be `stable` if downstream PRs will reference them. Promote ahead.
3. **Per-file `ts.Program` parser limits cross-file resolution** — actual SG counts (897 symbols / 1843 edges) were ~5× lower than BLUEPRINT estimate (~5000 / ~20000) because each file gets its own type-checker. Documented; Phase 2 fix when needed.
4. **Doc drift is invisible until grep'd** — CORE_FRAMEWORK had 9 drift points found by audit subagent (#56 fixed 5; rest deferred). Lesson: future BLUEPRINTs of system changes should commit to a "Reconciliation v_N" follow-up PR explicitly.
5. **Worktree subagents need `npm ci` first** — already in CLAUDE.md; reaffirmed across 3 subagent runs.
6. **Empty commit re-triggers CI** for transient npm registry flakes; standard pattern.

## What's NOT in this session

- Auto-inject hook for Master atoms into Claude Code session start (requires SessionStart hook config) — Wave 2.3 of roadmap
- `msp_master_*` MCP tools (list/load/compose) — Wave 2.1
- Cross-file project-wide `ts.Program` for Symbol Graph — Wave 3.1
- Tree-sitter parser for multi-language (Python / Go / Rust) — Wave 3.3
- CLAUDE.md migration to Master atoms — Wave 4.3 (high drift risk; defer)

## Source

- 16 PRs merged 2026-05-09: #48 → #63 (skipping the unused/cancelled internal numbers)
- Plan: `/root/.claude/plans/scope-calm-rose.md` (3-tier) + `/root/.claude/plans/symbol-graph.md` (Symbol Graph)
- Audits this session: `AUDIT--PR-2-PACKAGE-JSON-RESIDUE`, `AUDIT--CORE-FRAMEWORK-RECONCILE-V1`, `AUDIT--INBOUND-TO-CANDIDATES-MIGRATION-COMPLETE`, `AUDIT--SYMBOL-GRAPH-V1`, this atom
