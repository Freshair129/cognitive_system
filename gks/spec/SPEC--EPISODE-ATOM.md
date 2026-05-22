---
id: SPEC--EPISODE-ATOM
phase: 2
type: spec
status: stable
vault_id: default
tier: process
source_type: axiomatic
title: SPEC — Episode Atom — runtime-generated dispatch record contract
tags: &a1
  - msp
  - agents
  - episode
  - spec
  - runtime
crosslinks: &a2
  references:
    - BLUEPRINT--AGENT-DISPATCHER
    - ADR--AGENT-TIER-COST-POLICY
    - CONCEPT--AGENT-TIER-ROUTING
    - ADR--BRAIN-PATH-RESOLUTION
    - ADR--EPISODE-GC-POLICY
created_at: 2026-05-14T03:00:00.000+07:00
aliases: &a3
  - SPEC
  - implementation_flow
  - Technical specification
cluster: implementation_flow
role: Technical specification
attributes:
  id: SPEC--EPISODE-ATOM
  phase: 2
  type: spec
  status: stable
  vault_id: default
  tier: process
  source_type: axiomatic
  title: SPEC — Episode Atom — runtime-generated dispatch record contract
  tags: *a1
  crosslinks: *a2
  created_at: 2026-05-14T03:00:00.000+07:00
  aliases: *a3
  cluster: implementation_flow
  role: Technical specification
  attributes:
    id: SPEC--EPISODE-ATOM
    phase: 2
    type: spec
    status: stable
    vault_id: default
    tier: process
    source_type: axiomatic
    title: SPEC — Episode Atom — runtime-generated dispatch record contract
    tags: *a1
    crosslinks: *a2
    created_at: 2026-05-14T03:00:00.000+07:00
    aliases: *a3
    cluster: implementation_flow
    role: Technical specification
    attributes:
      id: SPEC--EPISODE-ATOM
      phase: 2
      type: spec
      status: stable
      vault_id: default
      tier: process
      source_type: axiomatic
      title: SPEC — Episode Atom — runtime-generated dispatch record contract
      tags: *a1
      crosslinks: *a2
      created_at: 2026-05-14T03:00:00.000+07:00
      aliases: *a3
      cluster: implementation_flow
      role: Technical specification
      attributes:
        domain: spec
      domain: spec
      language: markdown
      is_test: false
      is_entrypoint: false
      has_secret: true
      secret_type: high_entropy_string
      leak_risk: high
      encryption_level: none
    domain: spec
    language: markdown
    is_test: false
    is_entrypoint: false
    has_secret: true
    secret_type: high_entropy_string
    leak_risk: high
    encryption_level: none
  domain: spec
  language: markdown
  is_test: false
  is_entrypoint: false
  has_secret: true
  secret_type: high_entropy_string
  leak_risk: high
  encryption_level: none
---

# SPEC — Episode Atom

## 1. What is an episode

An **episode atom** is a runtime artefact written by `packages/msp/src/agents/re
  sult-recorder.ts` after every `dispatch(task)` call. Each episode is a markdow
n   atom that captures, for one dispatcher invocation:

- the input `task` (prompt, type, severity, optional context size),
- the resolved `result` (output, tier_used, optional escalated_from),
- runtime metadata (duration_ms, optional cost_usd),
- a UTC `created_at` timestamp.

Episodes are the dispatcher's audit trail. They feed (eventually) into the Meta-
  Learning Loop's reverse path (`[[SPEC--META-LEARNING-LOOP]]` §1.1: Code → AST 
→   Symbol Graph → **Execution Trace**) and are the primary source of evidence t
hat   a dispatch actually happened.

## 2. Id pattern

```bash
EPISODE--AGENT-RUN-<isoTimestamp>
```bash

Where `<isoTimestamp>` is the result of `new Date().toISOString()` with `:` and 
  `.` replaced by `-` (Windows-safe filename). Example:

```bash
EPISODE--AGENT-RUN-2026-05-14T03-00-00-000Z
```bash

The id is unique per dispatch (millisecond precision plus the timestamp encoding
   makes collisions practically impossible within a single agent).

## 3. Required frontmatter fields

| Field | Required | Value |
|--- | --- | ---|
| `id` | yes | `[[EPISODE--AGENT-RUN]]-<isoTimestamp>` |
| `phase` | yes | `5` (runtime / code phase per `gks/concept/[[CONCEPT--TAXONOMY  -V2-3]].md`) |
| `type` | yes | `episode` |
| `status` | yes | `stable` (episodes are immutable on creation — see §5) |
| `vault_id` | yes | `default` (or project-specific if scoped) |
| `tier` | yes | `genesis` |
| `source_type` | yes | `episodic` |
| `title` | yes | Human-readable summary, e.g. `EPISODE — Agent run <stamp> (<ti  er>)` |
| `tags` | yes | `[agents, dispatch, <tier_lowercase>]` |
| `created_at` | yes | ISO 8601 UTC (`Z` suffix is acceptable for episodes since   they are machine-generated) |

### Optional fields

| Field | When | Value |
|--- | --- | ---|
| `cost_usd` | tier returned a cost figure | `number` |
| `duration_ms` | always (best practice) | `number` |
| `escalated_from` | dispatcher escalated mid-run | tier name (e.g. `T1`) |

## 4. Body contract

The body MUST include the following sections (in any order):

- **Prompt** (full text, in a fenced code block) — the unmodified `task.prompt`.
- **Output** (full text, in a fenced code block) — the unmodified `result.output  `.
- **Metadata bullets** — at minimum `tier_used`, `duration_ms`, `task.type`, `ta  sk.severity`.

It MAY include:

- a truncated prompt snippet in the header for human scanability,
- `stderr` if the underlying tier produced one,
- `escalated_from` notes when relevant.

`result-recorder.ts` is the canonical producer; downstream consumers (MLL, recal
  l) parse the body but do not rewrite it.

## 5. Lifecycle

Episodes are **immutable**. Once written, they are never edited, superseded, or 
  status-flipped. This is by design — they are evidence, not opinion.

- **No `supersedes` / `superseded_by` crosslinks** are permitted between episode  s.
- **No status transition** from `stable` is ever performed.
- Episodes MAY be **purged** in bulk under a retention policy (out of scope for   this SPEC — see future `[[SPEC--EPISODE-RETENTION]]`).

This contrasts with `ADR`, `CONCEPT`, etc., which can be superseded — for those,
   the contradiction-detection layer applies. For episodes it does not.

## 6. Storage location

Per `[[ADR--BRAIN-PATH-RESOLUTION]]` §Routing table (as amended 2026-05-14), `EP
  ISODE` atoms are **project-only**: read from and written to `<root>/gks/episod
e/  `. An episode records a task run against *this* repo — it is project-scoped 
stat  e, the reverse-path evidence the Meta-Learning Loop consumes.

The canonical write target is therefore:

```bash
<root>/gks/episode/EPISODE--AGENT-RUN-<isoTimestamp>.md
```bash

Episodes garbage-collected under the Phase F4 retention policy (`[[ADR--EPISODE-
  GC-POLICY]]`) are moved to `<root>/gks/episode/_archive/<YYYY-MM>/`.

## 7. Resolution — impl/ADR contradiction (closed 2026-05-14)

This section originally flagged a contradiction: `result-recorder.ts` wrote epis
  odes to `<root>/gks/episode/` while `[[ADR--BRAIN-PATH-RESOLUTION]]` listed `E
PI  SODE` as global-only.

**Resolved in favour of option 2 — ADR follows impl.** The Phase D runtime (`res
  ult-recorder.ts`), the Phase D integration test, and the Phase F4 GC (`episode
-g  c.ts`) had all independently treated episodes as project-local; three phases
 of   implementation agreed. `[[ADR--BRAIN-PATH-RESOLUTION]]` was amended to rou
te `EP  ISODE` to project-only, and the brain routing table (`packages/msp/src/b
rain/rou  ting-table.ts`), `global-vault.ts`, and `project-vault.ts` were update
d to match  . `result-recorder.ts` was already correct and is unchanged.

## 8. Validation

`msp/LLM_Contract/atomic_contract.yaml` declares the per-type required fields fo
  r `episode`. The validator (`packages/msp/src/validator/cli.ts`) loads that co
nt  ract and enforces §3 above. Body-content checks (§4) are not yet machine-enf
orce  d and rely on the recorder writing well-formed output.

## 9. Out of scope

- Retention policy / garbage collection — shipped in Phase F4; see `[[ADR--EPISO  DE-GC-POLICY]]`.
- Episode compression into longer-form `SUMMARY--` atoms (handled by `packages/m  sp/src/orchestrator/consolidator/`).
- Cross-machine sync of the project brain's run history.
- Encryption at rest of episode bodies (may contain sensitive prompts).

## Connections

- [[BLUEPRINT--AGENT-DISPATCHER]]
- [[ADR--AGENT-TIER-COST-POLICY]]
- [[CONCEPT--AGENT-TIER-ROUTING]]
