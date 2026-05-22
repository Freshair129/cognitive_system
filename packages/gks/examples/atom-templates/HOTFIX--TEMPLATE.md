---
id: HOTFIX--TEMPLATE
phase: 5
type: hotfix
status: draft
vault_id: default
tier: process
source_type: axiomatic
title: <Hotfix escape-hatch atom>
created_at: 2026-05-22T22:36:00.000+07:00
created_by: Rwang
last_modify: 2026-05-22T22:36:00.000+07:00
modify_by: Rwang
assign_to: ""
version: "0.1.0"
priority: medium
query_counter: 0
level: low
summary: "Template for HOTFIX atoms — Hotfix escape-hatch atom"
tags: [hotfix]
aliases:
  - HOTFIX
  - ops
  - Hotfix escape-hatch atom
cluster: ops
role: Hotfix escape-hatch atom
crosslinks:
  references: []
linked_symbols: []
granularity: general
salience_anchor:
  summary: ""
  anchor_phrase: ""
relationship_type: parent
conflicts_with: []
epistemic_status:
  confidence: 1.0
  source_type: axiom
  contradictions: []
attributes:
  domain: general
---

# HOTFIX — <one-line summary of what was fixed>

## Why this exists

This atom is the audit trail for a hotfix that shipped before the normal
P1–P3 atoms (`CONCEPT--`, `ADR--`, `BLUEPRINT--`) existed. It opens a
48-hour backfill window (master-spec §6.4, ADR-014).

## What was fixed

Brief description of the production symptom and the change shipped to
resolve it.

## Backfill checklist (must complete before `valid_to`)

- [ ] `CONCEPT--<NAME>` written and `stable`
- [ ] `ADR--<NAME>` written and `stable` (with `crosslinks.resolves: [HOTFIX--<sha>]`)
- [ ] `BLUEPRINT--<NAME>` written and `stable` (geography matches the actual files touched)
- [ ] `gks verify-flow FEAT--<NAME>` returns exit-0

After `valid_to`, the pre-commit hook blocks any further commit on the
affected files until every box above is checked.
