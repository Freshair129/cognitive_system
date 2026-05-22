---
id: SLM--TEMPLATE
phase: 5
type: slm
status: draft
vault_id: default
tier: process
source_type: axiomatic
title: <Small execution engine>
created_at: 2026-05-22T22:36:00.000+07:00
created_by: Rwang
last_modify: 2026-05-22T22:36:00.000+07:00
modify_by: Rwang
assign_to: ""
version: "0.1.0"
priority: medium
query_counter: 0
level: low
summary: "Template for SLM atoms — Small execution engine"
tags: [slm]
aliases:
  - SLM
  - agent_governance
  - Small execution engine
cluster: agent_governance
role: Small execution engine
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

# SLM — <Model Name>

## Role & Tier

- **Intelligence Tier:** Execution / Codegen / Summarization / Formatting
- **Preferred Phase:** P5 (Code), P3.5 (Microtasks)

## Configuration

- **Model ID:** `e.g., qwen2.5-coder-7b`
- **Runner:** <Ollama / vLLM / Local / API>
- **Quantization:** <e.g. Q4_K_M>
- **Temperature:** <e.g. 0.1 for precise coding>

## Specialized Domain

- **Languages:** [Typescript, Python, Rust, etc.]
- **Frameworks:** [Next.js, Prisma, etc.]

## Performance

- **Tokens/sec (TPS):** <Value>
- **Context Window:** <e.g. 32k>
- **Memory Footprint:** <e.g. 8GB VRAM>

## Verification

- **Benchmark:** <Reference to HumanEval / similar result>
- **Audit ID:** AUDIT--<performance-report>
