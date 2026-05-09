# Next session — startup guide

> **Last session:** 2026-05-09 (16 PRs, full summary in `gks/audit/AUDIT--SESSION-2026-05-09.md`)
> **Repo state:** main is at PR #63 merge. 193 atoms, 625 tests, 16 MCP tools, 6 bin entries.

## Read first (orient yourself)

| Order | What | Why |
|---|---|---|
| 1 | `CLAUDE.md` | repo-wide rules, doc-to-code workflow |
| 2 | This file | what's queued |
| 3 | `gks/audit/AUDIT--SESSION-2026-05-09.md` | what shipped last session + drift state |
| 4 | `gks/master/MASTER--MSP-DOC-TO-CODE.md` + `MASTER--ATOM-CONTRADICTION-POLICY.md` | the 2 promoted Master rules — apply on every session |
| 5 | `gks/frame/FRAME--KNOWLEDGE-3-TIER.md` | knowledge-class model (Safety / Master / Genesis / Process) |
| 6 | `gks/frame/FRAME--SYMBOL-GRAPH.md` | structural-graph model (orthogonal to 3-tier) |

Smoke-load Master atoms into your system prompt:

```bash
npm run msp:master compose MASTER--MSP-DOC-TO-CODE MASTER--ATOM-CONTRADICTION-POLICY
```

Build the Symbol Graph (deterministic; takes ~60s):

```bash
npm run msp:graph build
npm run msp:graph stats --json
```

## Wave 1 — Sweep (~1–2 hr, low risk, high cleanup value)

Pick this if you want to close last-session loose ends before new work.

### 1.1 Reconciliation v2 (M)

**Why:** `CORE_FRAMEWORK_MASTER_SPEC.md` doesn't yet mention `msp:graph` script (added W3.4) or the 5 `msp_symbol_*` MCP tools (added W3.4). Drift was deferred from W2.1's audit and grew larger when SG shipped.

**What:**
- Update §15.1 `MSP / GKS commands` table — add `msp:graph` (6 subcommands) and `msp:master compose`
- Update §15.1 bin entries paragraph — 5 → 6 (add `msp-graph`)
- Update §16.5 MCP tool surface table — 11 → 16 (add 5 `msp_symbol_*` rows)
- Bump version `1.3.0 → 1.4.0`; update Last-updated line
- Write `AUDIT--CORE-FRAMEWORK-RECONCILE-V2.md`

**Branch:** `claude/msp-core-framework-reconcile-v2`

### 1.2 W3 spec polish (S)

**Why:** Last bits from the original CORE_FRAMEWORK audit.

**What:**
- §4.1 phase/status vocab — replace `stub/raw/verified` with current `draft/stable/superseded/deprecated` per `FRAME--PHASE-GOVERNANCE`. Note that P0–P7 model is still illustrative; reality uses 0–6 (per `BLUEPRINT--SYMBOL-GRAPH-CORE` shipped at phase 3).
- §7.3 forbidden fields — replace 3-field example with the actual 17-field allowlist; point to `.brain/msp/LLM_Contract/atomic_contract.yaml` as SSOT.

**Combine** with 1.1 if both fit one PR.

### 1.3 File upstream proposal-05 at GKS (S, external)

**Why:** PR #63 wrote the proposal at `upstream/gks-proposals/05-symbol-graph.md` but didn't open the upstream issue.

**What:** Open a GitHub issue at `Freshair129/GksV3` titled "Proposal: Symbol Graph as a first-class GKS layer" with the proposal body. Tag as enhancement.

## Wave 2 — Master Block extension (~½ day each, highest payoff)

Pick this if you want Master atoms to actually drive agent behavior in every session (not just manual CLI).

### 2.1 `msp_master_*` MCP tools (S–M)

**Why:** Today the only way to load Master atoms is `npm run msp:master compose ...` from a terminal. Agents in-session can't do it.

**What:** 3 new MCP tools in `src/mcp/tools/`:
- `msp_master_list` — `{} → { ok, masters: Array<{id, title, promoted_from, promoted_at, body_token_count}> }`
- `msp_master_load` — `{ id: string } → { ok, body: string, tokens: number }`
- `msp_master_compose` — `{ ids: string[] } → { ok, fragment: string, total_tokens: number }`

Tool count 16 → 19. Same shape as `msp_symbol_*` from W3.4.

### 2.2 `.mspconfig` per-project Master registry (S)

**Why:** Each project may want different Master atoms loaded. Today the choice is implicit (all of them). For Wave 2.3 to work, we need a config.

**What:** `.brain/msp/projects/<ns>/mspconfig.json`:
```json
{
  "master_block": ["MASTER--MSP-DOC-TO-CODE", "MASTER--ATOM-CONTRADICTION-POLICY"],
  "auto_inject": true
}
```

Reader: `src/codegen/master/config.ts`. Used by 2.3.

### 2.3 Auto-inject hook into Claude Code session start (M, **highest payoff**)

**Why:** With 2.1 + 2.2 in place, Claude Code's `SessionStart` hook can auto-compose Masters on every session — so `MASTER--MSP-DOC-TO-CODE` actually fires every time, not just when remembered.

**What:**
- Add `examples/hooks/session-start.sh` (or `.json` config)
- Calls `msp-master compose <ids from mspconfig>` and emits the fragment as a context-injection event
- Document in `CLAUDE.md` how to enable

**Test:** open fresh Claude Code session in this repo → verify it asks "atoms before code?" before any code change.

## Wave 3 — Symbol Graph Phase 2 (~1–2 days each)

Pick a sub-item if a specific concrete need surfaces. Otherwise defer.

### 3.1 Cross-file project-wide `ts.Program` (M, high value)

**Why:** Real numbers (897 symbols / 1843 edges) were ~5× below BLUEPRINT estimate (~5000 / ~20000). The cause: per-file `ts.Program` instances can't see imports across files. A single project-wide `ts.Program` would resolve them.

**Trade-off:** memory + first-build time go up. Incremental rebuilds become possible.

**What:**
- `src/symbols/parser/typescript.ts` accepts an optional `ts.Program` injected by the CLI's `build` step
- CLI builds one `ts.Program` over the full file glob, then iterates files
- Update `meta.parser_mode = 'per-file' | 'project-wide'` in JSONL
- Test: Levenshtein-style measurement of symbol/edge count delta against the per-file baseline

### 3.2 Hierarchical Leiden levels (S)

**Why:** Current `community_id` is flat. `parent_community_id` column was reserved in PR-3.

**What:** Run Leiden recursively; assign `level: 0..N` and `parent_community_id` per symbol. Surface in CLI `community --level=N` and `getCommunity` MCP tool.

### 3.3 Tree-sitter parser for Python (M)

**Why:** Multi-language scope opens up. Triggers when MSP grows a Python sub-tool or adopts a service in another language.

**What:** New file `src/symbols/parser/tree-sitter-python.ts` implementing the same `SymbolParser` interface. Add `tree-sitter` + `tree-sitter-python` to `dependencies`. Verify CI matrix still green (native module risk).

### 3.4 File-watch incremental rebuild (L)

**Why:** Today `msp:graph build` is batch-only; takes ~60s on this repo.

**What:** `chokidar`-based watcher; re-parse only changed files; merge into existing SQLite. Defer until batch becomes painful.

## Wave 4 — Cross-tool integration (~2–4 days total)

### 4.1 `linked_symbols[]` on FEAT atoms (M)

Cross-link the conceptual graph to the structural graph. Each FEAT atom gets `linked_symbols: [{ id: "src/foo.ts:bar:func" }]` so agents can navigate atom → implementation symbol.

Partial automation: a script that grep's symbol IDs from `gks/audit/AUDIT--SYMBOL-GRAPH-V1.md`'s `linked_symbols` and matches against actual SQLite — flag mismatches.

### 4.2 Cross-project Master portability test (M)

Validate the 3-tier model claim: a Master atom should load cleanly in `gitnexus` / `eva` / other MSP installations. Run `msp:master compose MASTER--MSP-DOC-TO-CODE` in those repos; confirm the fragment is interpretable without MSP-specific assumptions.

### 4.3 CLAUDE.md migration to Master atoms (L)

**Defer.** High drift risk. CLAUDE.md is the human contract; gradual extraction into Master atoms is safer than wholesale move. Expected workflow: each rule moves only when an obvious Master ID exists.

### 4.4 Visualization upgrades (S each)

- Community heatmap (Cytoscape edge thickness ∝ inter-community edges)
- 3D Cytoscape (when 5000+ symbols become unwieldy)
- Cross-graph view: atom ↔ symbol dual rendering

## Wave 5 — Long-term / research

| Item | Why interesting |
|---|---|
| Embeddings over symbols (semantic search) | natural; uses Smart Connections boundary |
| Use Symbol Graph + session episodes → auto-generate ADRs | Genesis (learned) atom flow per `FRAME--KNOWLEDGE-3-TIER` |
| GKS absorbs Symbol Graph | depends on GKS team accepting proposal-05 |
| Federated Master atoms across MSP installs | requires identity / signing layer |

## Recommended starting order

If you have **30 min**: Wave 1.3 (file upstream proposal — pure GitHub work).

If you have **1–2 hr**: Wave 1.1 + 1.2 combined (close all CORE_FRAMEWORK drift).

If you have **a half-day**: Wave 2.3 (auto-inject hook — biggest payoff per hour).

If you have **a full day**: Wave 3.1 (cross-file Symbol Graph parser) — closes the BLUEPRINT estimate gap.

## Useful commands (post-session-2026-05-09)

```bash
# Atom validation
npm run msp:index
npx tsx src/validator/cli.ts --all
npm run msp:check-links

# Master Block
npm run msp:master compose <ID1> <ID2> ...

# Symbol Graph
npm run msp:graph build
npm run msp:graph stats --json
npm run msp:graph query <name>
npm run msp:graph community --id=<n>
npm run msp:graph impact <id>
npm run msp:graph dump-jsonl

# Web UI (Symbols tab visible by default after PR #63)
npm run dev

# Run all tests
npm test
```

## Bin entries available

```
msp-validate     — validator CLI
msp-backlinks    — atom backlinks rebuild
msp-run-task     — codegen runner
msp-master       — Master Block compose
msp-mcp-server   — 16-tool MCP server
msp-graph        — Symbol Graph CLI (6 subcommands)
```

## MCP tools (16)

```
msp_validate, msp_candidate, msp_run_task,
msp_session_append, msp_episode_append, msp_backlinks_rebuild,
msp_recall, msp_remember, msp_compress,
msp_identity_get, msp_identity_set,
msp_symbol_lookup, msp_symbol_neighbors, msp_symbol_impact,
msp_symbol_community, msp_symbol_search
```
