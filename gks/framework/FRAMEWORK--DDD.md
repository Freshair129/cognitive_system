---
id: FRAMEWORK--DDD
phase: 0
type: framework
status: stable
vault_id: default
tier: genesis
source_type: axiomatic
title: Documentation-Driven Development (DDD) — governance and change enforcement framework
tags:
  - msp
  - governance
  - framework
  - ddd
  - doc-first
crosslinks:
  references:
    - FRAMEWORK--PHASE-GOVERNANCE
    - FRAMEWORK--SCOPE-CREEP-PREVENTION
created_at: 2026-05-24T22:40:00.000+07:00
aliases:
  - DDD Framework
  - Documentation-Driven Development
  - Doc-to-Code Framework
cluster: implementation_flow
role: Governance / architectural framework
attributes:
  domain: framework
  language: markdown
  is_test: false
  is_entrypoint: false
  has_secret: false
  leak_risk: low
  encryption_level: none
---

# FRAMEWORK — Documentation-Driven Development (DDD)

## 1. Intent

To establish a software engineering model where all code modifications, refactors, and feature additions are treated as downstream consequences of written specifications. Documentation is the authoritative Single Source of Truth (SSOT); code is merely the implementation of that truth.

## 2. The Role of `MASTER--` (The Immutable Governance Index)

In this framework, files with the `MASTER--` prefix serve as the **Immutable Governance Index**. They store the core, non-negotiable architectural rules and directives that govern the development cycle.

- **Immutability:** The contents of the `MASTER--` index are strictly frozen and must never be modified by AI agents during normal operations.
- **Pre-execution Context (Preamble):** All files in the `MASTER--` index are compiled and loaded as part of the system prompts/preamble before any task execution or code analysis begins. They act as absolute "instincts" that override local agent reasoning.
- **Strict Promotion Path:** AI agents are forbidden from self-promoting any concept or rule to `MASTER--`. Promoting an atom to the Master tier requires explicit human review and approval based on proven cross-context stability.

## 3. The DDD Lifecycle (The Doc-to-Code Gate)

Every change follows a strict sequence of gates. No phase may be bypassed without explicit permission:

```
┌─────────────────────────────────┐
│ 1. Documentation Phase (Doc)    │  Specify requirements, architecture, and API
└────────────────┬────────────────┘
                 │
                 ▼
┌─────────────────────────────────┐
│ 2. Approval Phase (Boss Review) │  STOP execution; request human confirmation
└────────────────┬────────────────┘
                 │
                 ▼
┌─────────────────────────────────┐
│ 3. Implementation Phase (Code)  │  Write code and tests matching the approved spec
└────────────────┬────────────────┘
                 │
                 ▼
┌─────────────────────────────────┐
│ 4. Verification Phase (Audit)   │  Run validation, tests, and write walkthrough
└─────────────────────────────────┘
```

### Directives for Execution:
1.  **Doc First, Wait for Approval:** Always output the proposed design, spec, or changes in markdown format first. End the turn, ask for review, and wait for explicit approval before writing or editing code.
2.  **Sync Docs Before Updates:** If a bug is discovered or requirements shift during implementation, the specification document must be updated first. You must wait for approval on the updated documentation before modifying any code.
3.  **No Spec, No Code:** Any code created or modified without a pre-existing spec is an authority violation.

## 4. Enforcement Rules

- **Zero-Bypass Validation:** Any build, commit, or push pipeline must validate that all modified code files map directly to active, stable specification atoms.
- **Dangling Link Prevention:** The documentation indexer must verify that all cross-references (`crosslinks.references`) are valid and resolved.

## Connections

- [[FRAMEWORK--PHASE-GOVERNANCE]]
- [[FRAMEWORK--SCOPE-CREEP-PREVENTION]]
