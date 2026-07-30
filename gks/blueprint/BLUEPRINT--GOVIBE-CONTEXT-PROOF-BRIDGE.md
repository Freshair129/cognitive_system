---
id: BLUEPRINT--GOVIBE-CONTEXT-PROOF-BRIDGE
version: 2.0.0
phase: 3
type: blueprint
tier: process
status: stable
enforcement_state: active
created_at: 2026-07-29T00:00:00+07:00
created_by: ATHER
last_update: 2026-07-30T13:35:00+07:00
delivery_from: owner-approved GoVibe capability absorption plan
superseded_by: null
vault_id: GKS-CORE
source_type: axiomatic
title: GoVibe Context and Proof Bridge Blueprint
summary: Specifies deterministic paths, validation, and independent GKS/MSP MCP handlers consumed by GoVibe.
tags: [govibe, msp, gks, blueprint, mcp]
domain: agent-runtime
priority: P0
scale_level: L1
linked_symbols:
  - file: packages/msp/src/mcp/server.ts
crosslinks:
  references: [ADR--GOVIBE-EXTERNAL-MCP-PORTS]
  implements: [FEAT--GOVIBE-CONTEXT-PROOF-BRIDGE]
aliases: [BLUEPRINT--]
cluster: implementation_flow
role: Implementation blueprint
---

# BLUEPRINT--GOVIBE-CONTEXT-PROOF-BRIDGE

## Paths

| Data | Canonical path | Owner |
|---|---|---|
| Global Brain state | `%USERPROFILE%/.brain/state/` or `$XDG_DATA_HOME/brain/state/` | MSP |
| Workspace Brain state | `<workspace>/.brain/state/` | MSP |
| Workspace proof | `<workspace>/.brain/msp/proof/YYYY-MM-DD--<record-id>--<hash>.json` | MSP |
| Workspace code knowledge | GKS `GraphStore` at `<workspace>/.brain/msp/projects/<project>/graph/graph.jsonl` | GKS via MSP |
| Executable skills | `.govibe/skills/<id>/<version>/SKILL.md` | GoVibe |

All caller-supplied workspace paths are resolved to absolute paths. A target outside the declared workspace is rejected.

## `msp_context_resolve`

Input:

- `workspace_root`: optional; defaults to MCP server root.
- `mode`: `covibe` or `codev`.
- `state_keys`: optional allowlist of logical state keys.
- `knowledge_refs`: optional references to validate against workspace GKS.

Resolution:

1. Enumerate JSON state records under Global and Workspace state roots.
2. Hash each file with SHA-256 and return reference metadata, not raw file bodies.
3. Deny Global records marked `private` when mode is `codev` unless both `promoted` and `redacted` are true.
4. For duplicate project-scoped keys, return the Workspace reference and record the shadowed Global reference in policy decisions.
5. Global identity/security records remain authoritative.
6. Validate requested knowledge references inside `<workspace>/gks`.

## `gks_code_upsert`

Input conforms to `govibe-knowledge-batch/v1`. The handler requires schema
version, idempotency key, run/stage identity, source snapshot hash,
`provenance_ref`, and no proof fields. It maps atoms/symbols/relations/context
snapshots into the existing GKS writer and returns `knowledge_ref` plus hash.

## `msp_evidence_record`

Input conforms to `govibe-proof-batch/v1`. It requires schema version,
idempotency key, run/stage identity, source snapshot hash, actual verification
state, and optional `knowledge_ref`. It rejects GKS collections and maps into
the existing immutable proof writer.

## Verification

```powershell
npm test --workspace=packages/msp -- --run test/brain test/mcp/tools/context-resolve.test.ts test/mcp/tools/knowledge-write.test.ts test/mcp/tools/proof-append.test.ts
npm run typecheck --workspace=packages/msp
node scripts/msp/init-brain.mjs --dry-run
```

## Failure Semantics

- Invalid ownership payload: fail closed with `isError`.
- Missing Brain root: return an empty source plus a diagnostic; do not invent state.
- Unsafe path or symlink escape: fail closed.
- Existing knowledge ID with a different hash: reject as tampering; do not overwrite.
- Proof append failure: do not report success or a proof reference.

## Changelog

| Version | Date | Summary |
|---|---|---|
| 2.0.0 | 2026-07-30 | Added independent `gks_code_upsert` and `msp_evidence_record` compatibility contracts. |
| 1.0.0 | 2026-07-29 | Defined the initial MSP facade bridge. |
