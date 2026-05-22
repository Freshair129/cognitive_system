---
id: CONCEPT--CODING-DOMAIN-PACK
phase: 1
type: concept
status: stable
vault_id: default
tier: process
source_type: axiomatic
title: Coding Domain Pack — strategic ABAC for software engineering
tags:
  - msp
  - ucf
  - coding
  - security
crosslinks:
  references:
    - FRAMEWORK--UNIVERSAL-CONTEXT-FRAMEWORK
    - CONCEPT--ATTRIBUTE-BAG-MODEL
created_at: 2026-05-17T09:10:00+07:00
aliases:
  - CONCEPT
cluster: implementation_flow
role: Strategic intent / PRD
attributes:
  domain: concept
  language: markdown
  is_test: false
  is_entrypoint: false
  has_secret: true
  secret_type: high_entropy_string
  leak_risk: high
  encryption_level: none
---

# CONCEPT — Coding Domain Pack

## Intent

To provide granular, automated Attribute-Based Access Control (ABAC) over source code resources within the cognitive_system. This pack allows the system to distinguish between critical infrastructure code, test files, and entry points, enabling safe delegation to multi-tier agents (T1, T2, T3).

## North Star

Every source code file in the repository is automatically and accurately tagged with metadata (language, role, risk) without manual human intervention. Policies use these tags to ensure that low-tier agents only modify low-risk files (like tests) while reserving critical files for high-tier agents or humans.

## Guiding Principles

1. **Automation First:** Use fast, extension/path-based classifiers instead of slow LLM analysis for bulk tagging.
2. **Tier-Appropriate Access:** Align agent capabilities (T1/T2/T3) with the risk level of the code being accessed.
3. **Deterministic Logic:** Favour rule-based classification (e.g. `*.test.ts` is always a test) to ensure consistent security posture.

## Connections

- `[[FRAMEWORK--UNIVERSAL-CONTEXT-FRAMEWORK]]` — the engine that enforces these policies.
- `[[CONCEPT--ATTRIBUTE-BAG-MODEL]]` — the data model for the tags produced by this pack.
