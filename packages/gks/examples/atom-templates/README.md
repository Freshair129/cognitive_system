# Atom Templates — Complete GKS Taxonomy (48 Types)

All **48 atomic types** from `atom_schema.yaml` now have dedicated starter templates
in this directory. Templates are organized from **largest scope** (system governance)
to **smallest scope** (episodic logs and distilled memory) across 7 hierarchical levels.

Each template is the **minimum viable shape** for that atom type:
required frontmatter + recommended frontmatter + body skeleton with
section headings. **Workflow:** copy → fill in → propose via the `msp_candidate`
MCP tool which writes to `.brain/msp/projects/<ns>/candidates/`, then human PR
review promotes to `gks/<type>/`. (For ISSUE-- — light-governance tier per
ADR-012 — you can write directly into `gks/issues/` without the candidates step.)

> **Migration note:** Legacy `gks propose-inbound` / `msp:propose` CLI commands
> were removed in Phase 3 (2026-05-09); use `msp_candidate` MCP tool instead.

---

## Hierarchical Template Index

### Level 1 — System Governance & Master Tectonic Rules (🏛️ high)

| Template | Role | Tier |
|---|---|---|
| [`MASTER--TEMPLATE.md`](./MASTER--TEMPLATE.md) | Root-level policy / genesis rule | `master` |
| [`GENESIS--TEMPLATE.md`](./GENESIS--TEMPLATE.md) | Block Manifest (v2.3+) | `master` |
| [`FRAMEWORK--TEMPLATE.md`](./FRAMEWORK--TEMPLATE.md) | Governance / architectural framework | `master` |
| [`SAFETY--TEMPLATE.md`](./SAFETY--TEMPLATE.md) | Ethical safety / AI alignment | `safety` |

### Level 2 — Strategic Goals, Context & Requirements (🎯 high/low)

| Template | Role | Level |
|---|---|---|
| [`CONCEPT--TEMPLATE.md`](./CONCEPT--TEMPLATE.md) | Strategic intent / PRD | `high` |
| [`REQ--TEMPLATE.md`](./REQ--TEMPLATE.md) | Umbrella requirement | `high` |
| [`FR--TEMPLATE.md`](./FR--TEMPLATE.md) | Functional requirement | `high` |
| [`NFR--TEMPLATE.md`](./NFR--TEMPLATE.md) | Non-functional requirement | `high` |
| [`CONSTRAINT--TEMPLATE.md`](./CONSTRAINT--TEMPLATE.md) | Hard external constraint | `high` |
| [`PERSONA--TEMPLATE.md`](./PERSONA--TEMPLATE.md) | Agent identity / role | `low` |
| [`COGNITIVE--TEMPLATE.md`](./COGNITIVE--TEMPLATE.md) | Mental model / interpretive lens | `high` |
| [`RISK--TEMPLATE.md`](./RISK--TEMPLATE.md) | Identified risk + mitigation | `low` |
| [`SLO--TEMPLATE.md`](./SLO--TEMPLATE.md) | Service-level objective | `low` |
| [`IDEA--TEMPLATE.md`](./IDEA--TEMPLATE.md) | Raw prompt / spark | `low` |

### Level 3 — Architecture Boundaries, Modules, APIs & Decision Records (🧱 high)

| Template | Role | Level |
|---|---|---|
| [`MOD--TEMPLATE.md`](./MOD--TEMPLATE.md) | Module manifest | `high` |
| [`ADR--TEMPLATE.md`](./ADR--TEMPLATE.md) | Architecture decision record | `high` |
| [`API--TEMPLATE.md`](./API--TEMPLATE.md) | OpenAPI master hub | `high` |
| [`PROTOCOL--TEMPLATE.md`](./PROTOCOL--TEMPLATE.md) | Interaction contract | `high` |
| [`POLICY--TEMPLATE.md`](./POLICY--TEMPLATE.md) | Operational policy | `high` |
| [`LLM--TEMPLATE.md`](./LLM--TEMPLATE.md) | Large reasoning engine | `high` |
| [`MCP--TEMPLATE.md`](./MCP--TEMPLATE.md) | Model Context Protocol tool | `low` |
| [`CMD--TEMPLATE.md`](./CMD--TEMPLATE.md) | Executable system command | `low` |

### Level 4 — Feature Specifications & Detailed Designs (⚙️ high/low)

| Template | Role | Level |
|---|---|---|
| [`FEAT--TEMPLATE.md`](./FEAT--TEMPLATE.md) | Feature spec | `high` |
| [`ALGO--TEMPLATE.md`](./ALGO--TEMPLATE.md) | Algorithm definition | `high` |
| [`FLOW--TEMPLATE.md`](./FLOW--TEMPLATE.md) | Data / UI flow | `low` |
| [`ENTITY--TEMPLATE.md`](./ENTITY--TEMPLATE.md) | Data schema | `low` |
| [`ENDPOINT--TEMPLATE.md`](./ENDPOINT--TEMPLATE.md) | One API path / method | `low` |
| [`ENTRYPOINT--TEMPLATE.md`](./ENTRYPOINT--TEMPLATE.md) | Auth / middleware / access logic | `low` |
| [`PARAMS--TEMPLATE.md`](./PARAMS--TEMPLATE.md) | Constants / business config | `low` |
| [`STACK--TEMPLATE.md`](./STACK--TEMPLATE.md) | Technology stack inventory | `low` |
| [`SPEC--TEMPLATE.md`](./SPEC--TEMPLATE.md) | Technical specification | `high` |
| [`SKILL--TEMPLATE.md`](./SKILL--TEMPLATE.md) | Agent capability | `low` |
| [`GUARD--TEMPLATE.md`](./GUARD--TEMPLATE.md) | Structural / behavioural guardrail | `high` |
| [`PROTO--TEMPLATE.md`](./PROTO--TEMPLATE.md) | Machine-enforced invariant | `high` |

### Level 5 — Implementation Plans & Action Tasks (📋 low)

| Template | Role | Level |
|---|---|---|
| [`BLUEPRINT--TEMPLATE.md`](./BLUEPRINT--TEMPLATE.md) | Implementation plan | `low` |
| [`HOTFIX--TEMPLATE.md`](./HOTFIX--TEMPLATE.md) | Hotfix escape-hatch atom | `low` |
| [`SLM--TEMPLATE.md`](./SLM--TEMPLATE.md) | Small execution engine | `low` |

### Level 6 — Verification & Post-Mortem Logs (🔍 low)

| Template | Role | Level |
|---|---|---|
| [`AUDIT--TEMPLATE.md`](./AUDIT--TEMPLATE.md) | Test results / quality report | `low` |
| [`INC--TEMPLATE.md`](./INC--TEMPLATE.md) | Incident post-mortem | `low` |
| [`ISSUE--TEMPLATE.md`](./ISSUE--TEMPLATE.md) | Live issue tracker | `low` |
| [`RUNBOOK--TEMPLATE.md`](./RUNBOOK--TEMPLATE.md) | Operational response guide | `low` |

### Level 7 — Episodic Logs & Distilled Memory (🧠 low)

| Template | Role | Level |
|---|---|---|
| [`NARRATIVE--TEMPLATE.md`](./NARRATIVE--TEMPLATE.md) | Cross-session pattern / arc | `low` |
| [`BELIEF--TEMPLATE.md`](./BELIEF--TEMPLATE.md) | Distilled long-term belief | `low` |
| [`INSIGHT--TEMPLATE.md`](./INSIGHT--TEMPLATE.md) | Session-derived observation | `low` |
| [`FACT--TEMPLATE.md`](./FACT--TEMPLATE.md) | Retain-derived fact | `low` |
| [`RULE--TEMPLATE.md`](./RULE--TEMPLATE.md) | Derived behavioural rule | `low` |
| [`USAGE--TEMPLATE.md`](./USAGE--TEMPLATE.md) | Usage metrics rollup | `low` |
| [`EPISODE--TEMPLATE.md`](./EPISODE--TEMPLATE.md) | Execution episode log | `low` |

---

## New Frontmatter Fields (v2.5)

All templates now include these additional fields (registered in `atom_schema.yaml`):

| Field | Type | Description |
|---|---|---|
| `version` | string | Revision version (e.g. `0.1.0`) |
| `created_by` | string | Creator user/agent identifier |
| `last_modify` | string | Last modification timestamp (ISO-8601) |
| `modify_by` | string | Last modifier identifier |
| `assign_to` | string | Direct assignee for execution/review |
| `priority` | string | `low` / `medium` / `high` / `urgent` |
| `query_counter` | integer | Read metrics counter (runtime-updated) |
| `level` | string | `high` (conceptual) / `low` (execution) |
| `summary` | string | Concise summary (10–300 chars) |
| `epistemic_status` | object | `confidence` (0.0–1.0), `source_type`, `contradictions` |
| `granularity` | string | `universal` / `general` / `specific` |
| `salience_anchor` | object | `summary` + `anchor_phrase` for memory-like retrieval |
| `relationship_type` | string | `parent` / `child` hierarchical role |
| `conflicts_with` | array | Atom IDs or claims that conflict |

---

## Conventions

- **`id`** must match `^[A-Z][A-Z0-9_]*--[A-Z0-9][A-Z0-9_-]*$`
- **`phase`** must be an integer 0-6 (validator-enforced range)
- **`type`** must match the prefix lowercased (`ADR-- → type: adr`)
- **`status`** must be one of: `stub` / `raw` / `draft` / `active` / `stable` / `deprecated` / `superseded` / `partial`
- **`linked_symbols`** + **`geography`** — see ADR-010 for cross-reference semantics
- **`aliases[0]`** must match the UPPERCASE type prefix

## See also

- [`atom_schema.yaml`](../../../../atom_schema.yaml) — canonical schema (SSOT)
- [`docs/KNOWLEDGE-TYPES.md`](../../docs/KNOWLEDGE-TYPES.md) — full type reference
- [`docs/adr/012-extended-taxonomy.md`](../../docs/adr/012-extended-taxonomy.md) — why this list exists
- [`docs/adr/010-reverse-citation-lookup.md`](../../docs/adr/010-reverse-citation-lookup.md) — `linked_symbols` semantics
