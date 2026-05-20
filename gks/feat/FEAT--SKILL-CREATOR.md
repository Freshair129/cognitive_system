---
id: FEAT--SKILL-CREATOR
phase: 2
type: feat
status: active
tier: process
source_type: axiomatic
vault_id: default
title: "FEAT — Skill Creator — automated distillation engine and candidate flow"
tags:
  - msp
  - mll
  - skill
  - automation
crosslinks: {"implements":["CONCEPT--SKILL-CREATOR"],"references":["FEAT--SEMANTIC-CONTRADICTION-JUDGE"]}
created_at: 2026-05-18T11:20:00+07:00
cluster: implementation_flow
role: "Feature spec"
aliases:
  - FEAT
  - implementation_flow
---

# FEAT — Skill Creator

## Context

This feature implements the first stage of the Meta-Learning Loop (MLL). It introduces a distillation engine that scans successful execution episodes and uses T3 reasoning to extract reusable skills.

## Requirements

1. **Episode Distillation Engine:**
   - Query the knowledge graph for successful `EPISODE--` atoms.
   - Use T3 agents (Claude) to summarize the core pattern/logic that led to success.
   - Output structured `SKILL--` candidates in the designated staging area.
2. **Stability Verification:**
   - Implement `check_stability()` using multi-model consensus (MLL Spec §4).
   - Require a minimum similarity score (e.g., 0.85) for a skill to be marked as stable.
3. **Candidate Management:**
   - Save candidates to `.brain/msp/projects/default/candidates/`.
   - Maintain linkage back to the source episodes.

## API Contract (CLI)

Command: `msp-mll distill --limit=<n>`

- **Flags:**
  - `--limit`: Number of recent successful episodes to analyze.
  - `--min-satisfaction`: Filter episodes by a minimum satisfaction score (if available).

## Verification Criteria

- The engine correctly parses a set of refactoring episodes and proposes a `SKILL--CODE-REFACTORING` atom.
- The stability check correctly flags definitions where multiple LLMs disagree on the core principle.
- Candidate files follow the YAML schema defined in `SPEC--MLL.md`.
