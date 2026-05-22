---
id: SPEC--USAGE-ATOM
phase: 2
type: spec
status: stable
vault_id: default
tier: process
source_type: axiomatic
title: SPEC — Usage Atom — daily cost-aggregation atom contract
tags: &a1
  - msp
  - agents
  - usage
  - cost
  - spec
  - runtime
linked_symbols: &a4
  - file: src/validator/cli.ts
crosslinks: &a2
  references:
    - CONCEPT--COST-TRACKING
    - SPEC--EPISODE-ATOM
    - ADR--AGENT-TIER-COST-POLICY
    - BLUEPRINT--COST-TRACKING
created_at: 2026-05-14T03:45:00.000+07:00
aliases: &a3
  - SPEC
  - implementation_flow
  - Technical specification
cluster: implementation_flow
role: Technical specification
attributes:
  id: SPEC--USAGE-ATOM
  phase: 2
  type: spec
  status: stable
  vault_id: default
  tier: process
  source_type: axiomatic
  title: SPEC — Usage Atom — daily cost-aggregation atom contract
  tags: *a1
  linked_symbols: *a4
  crosslinks: *a2
  created_at: 2026-05-14T03:45:00.000+07:00
  aliases: *a3
  cluster: implementation_flow
  role: Technical specification
  attributes:
    id: SPEC--USAGE-ATOM
    phase: 2
    type: spec
    status: stable
    vault_id: default
    tier: process
    source_type: axiomatic
    title: SPEC — Usage Atom — daily cost-aggregation atom contract
    tags: *a1
    linked_symbols: *a4
    crosslinks: *a2
    created_at: 2026-05-14T03:45:00.000+07:00
    aliases: *a3
    cluster: implementation_flow
    role: Technical specification
    attributes:
      id: SPEC--USAGE-ATOM
      phase: 2
      type: spec
      status: stable
      vault_id: default
      tier: process
      source_type: axiomatic
      title: SPEC — Usage Atom — daily cost-aggregation atom contract
      tags: *a1
      linked_symbols: *a4
      crosslinks: *a2
      created_at: 2026-05-14T03:45:00.000+07:00
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

# SPEC — Usage Atom

## 1. What is a usage atom

A **usage atom** is a runtime artefact written by `packages/msp/src/agents/usage
  -recorder.ts` after every `dispatch(task)` call. Each usage atom is a daily bu
ck  et — one file per (vault, ISO date) — capturing:

- total `cost_usd` across all dispatches that day,
- per-tier call counts and per-tier cost subtotals,
- the top-N most-expensive episodes (by `[[EPISODE--AGENT-RUN]]-*` id reference)  ,
- last-updated timestamp.

Where `[[SPEC--EPISODE-ATOM]]` is per-call evidence, USAGE atoms are per-day agg
  regate. They are the readout layer for `[[ADR--AGENT-TIER-COST-POLICY]]` enfor
ce  ment.

## 2. Id pattern

```bash
USAGE--<bucket>-<isoDate>
```bash

Bucket is currently `DAILY`; the SPEC reserves room for `HOURLY` / `WEEKLY` buck
  ets without re-versioning. `<isoDate>` is `YYYY-MM-DD` (UTC date the bucket co
ve  rs).

Example:

```bash
USAGE--DAILY-2026-05-14
```bash

The id is unique per (bucket, date) — exactly one atom per day per vault.

## 3. Required frontmatter fields

| Field | Required | Value |
|--- | --- | ---|
| `id` | yes | `USAGE--<bucket>-<isoDate>` |
| `phase` | yes | `5` (runtime / code phase per `gks/concept/[[CONCEPT--TAXONOMY  -V2-3]].md`) |
| `type` | yes | `usage` |
| `status` | yes | `stable` (see §5 — body is rewritten, frontmatter is not) |
| `vault_id` | yes | `default` (or project-specific if scoped) |
| `tier` | yes | `genesis` |
| `source_type` | yes | `episodic` |
| `title` | yes | Human-readable summary, e.g. `USAGE — Daily cost bucket 2026-0  5-14` |
| `tags` | yes | `[agents, usage, cost, <bucket_lowercase>]` |
| `created_at` | yes | ISO 8601 UTC of the first dispatch that opened the bucket   |

### Optional fields

| Field | When | Value |
|--- | --- | ---|
| `updated_at` | always (best practice) | ISO 8601 UTC of the most recent record  ed dispatch |
| `total_cost_usd` | always (best practice) | rolling sum across all dispatches   in the bucket |
| `call_count` | always (best practice) | rolling count of dispatches in the buc  ket |

## 4. Body contract

The body MUST contain a fenced `json` summary block delimited by HTML comment ma
  rkers so it can be parsed and rewritten safely:

<!-- USAGE-SUMMARY-START -->
```json
{
  "total_cost_usd": 0.0234,
  "call_count": 12,
  "by_tier": {
    "T1": { "count": 8, "cost_usd": 0 },
    "T2": { "count": 3, "cost_usd": 0.0034 },
    "T3": { "count": 1, "cost_usd": 0.02 }
  },
  "top_episodes": [
    { "id": "[[EPISODE--AGENT-RUN-2026-05-14T03-00-00-000Z]]", "cost_usd": 0.02,   "tier": "T3" }
  ],
  "updated_at": "2026-05-14T14:00:00.000Z"
}
```bash
<!-- USAGE-SUMMARY-END -->

The body MAY include human-readable headers and prose around the summary block, 
  but the markers MUST appear exactly once. The recorder parses everything betwe
en   them as JSON.

## 5. Lifecycle

USAGE atoms have a **two-phase lifecycle**:

1. **Open** (first dispatch of the day): file does not exist, recorder creates i
  t with full frontmatter + empty summary + first call's data.
2. **Append** (subsequent dispatches): recorder reads the JSON block, mutates to
  tals + counts + top-N list, rewrites the JSON block in place. Frontmatter is *
*n  ot** touched after open (except optional `updated_at` if present).

After UTC midnight the next dispatch opens a new bucket. The previous day's USAG
  E atom becomes immutable de-facto — though there is no enforcement; the record
er   only ever touches today's date.

USAGE atoms MAY be **purged** in bulk under a retention policy (out of scope for
   this SPEC — see future `SPEC--USAGE-RETENTION`).

## 6. Storage location

Usage atoms are project-scoped. The canonical write target is:

```bash
<root>/gks/usage/[[USAGE--DAILY]]-<isoDate>.md
```bash

Where `<root>` is the dispatcher's invocation root (typically `process.cwd()` at
   dispatch time). This mirrors `EPISODE--AGENT-RUN-*`'s current project-local l
oc  ation (see `SPEC--EPISODE-ATOM` §7 — the same ADR-vs-impl tension applies to
 USA  GE; we follow current impl).

## 7. Validation

`msp/LLM_Contract/atomic_contract.yaml` declares per-type required fields for `u
  sage`. The validator (`packages/msp/src/validator/cli.ts`) loads that contract
 a  nd enforces §3 above. Body-content checks (§4 JSON markers) are not yet mach
ine-  enforced and rely on the recorder writing well-formed output.

## 8. Out of scope

- Retention policy / garbage collection.
- Cross-machine roll-up (a future `USAGE--MONTHLY` could aggregate dailies).
- Real-time cost streaming (a writer of USAGE atoms is best-effort; readers must   tolerate up-to-one-call lag).
- Per-vault budget alerts — that's the cost-policy layer's job, not this SPEC's.

## Connections

- [[CONCEPT--COST-TRACKING]]
- [[BLUEPRINT--COST-TRACKING]]
