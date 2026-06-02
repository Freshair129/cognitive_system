---
id: FEAT--SEMANTIC-CONTRADICTION-JUDGE
phase: 2
type: feat
domain: governance
status: active
tier: process
source_type: axiomatic
vault_id: default
title: "FEAT — Semantic Contradiction Judge — graph-contextualized evaluation CLI"
tags:
  - msp
  - validator
  - contradiction
  - judge
crosslinks: {"implements":["CONCEPT--SEMANTIC-CONTRADICTION-JUDGE"],"references":["FEAT--CLASSIFIER-PLUGINS"]}
created_at: 2026-05-18T10:50:00+07:00
cluster: implementation_flow
role: "Feature spec"
aliases:
  - FEAT
  - implementation_flow
---

# FEAT — Semantic Contradiction Judge

## Context

This feature implements the core logic for the "Machine Judge" (Layer 4 detection). It provides a CLI tool that automates the process of finding related knowledge and asking a T3 agent to check for logical consistency.

## Requirements

1. **Graph-Driven Context Retrieval:**
   - Use `GenesisGraphBackend.neighbors()` to find stable atoms within N hops.
   - Support filtering by `domain` and `type` to focus on the most relevant canon.
2. **T3 Evaluation Interface:**
   - Integrate with `packages/msp/src/agents/dispatch.ts` to invoke the T3 tier (Claude).
   - Use a standardized structured prompt for contradiction detection.
3. **Structured Reporting:**
   - Output findings in a human-readable format for CLI users.
   - Provide JSON output for CI integration and PR commenting bots.
4. **Efficiency:**
   - Truncate bodies and limit the number of neighbor atoms to stay within token budgets.

## API Contract (CLI)

Command: `msp-judge check <atomPath>`

- **Flags:**
  - `--hops`: Number of hops for graph traversal (default: 2).
  - `--limit`: Max number of neighbor atoms to evaluate (default: 5).
  - `--json`: Output as JSON.

## Verification Criteria

- A new ADR that directly contradicts an existing stable ADR in the same domain is flagged by the judge.
- The output cites specific conflicting passages from both atoms.
- The tool gracefully handles cases where no relevant neighbors are found.
- The operation completes within a reasonable timeout for CI (e.g. 60s).
