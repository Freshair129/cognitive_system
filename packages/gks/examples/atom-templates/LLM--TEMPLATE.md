---
id: LLM--TEMPLATE
phase: 2
type: llm
status: draft
vault_id: default
tier: process
source_type: axiomatic
title: <Large reasoning engine>
created_at: 2026-05-22T22:36:00.000+07:00
created_by: Rwang
last_modify: 2026-05-22T22:36:00.000+07:00
modify_by: Rwang
assign_to: ""
version: "0.1.0"
priority: medium
query_counter: 0
level: high
summary: "Template for LLM atoms — Large reasoning engine"
tags: [llm]
aliases:
  - LLM
  - agent_governance
  - Large reasoning engine
cluster: agent_governance
role: Large reasoning engine
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

# LLM — <Model Name>

## Role & Tier

- **Intelligence Tier:** Reasoning / Planning / Complex Mapping
- **Preferred Phase:** P1 (Concept), P2 (ADR), P3 (Blueprint)

## Configuration

- **Model ID:** `e.g., gemini-1.5-pro`
- **Temperature:** <e.g. 0.0 for deterministic planning>
- **Top P:** <Value>
- **Max Tokens:** <Value>

## System Prompt / Personality

- **Instruction:** <Brief summary of the core personality/role>
- **Safety Constraints:** <Reference to SAFETY-- or GUARD-->

## Known Capabilities

- [ ] Multilingual reasoning
- [ ] Long-context window (1M+ tokens)
- [ ] Tool use (MCP)
- [ ] Image/Video multimodal

## Limitations

- Cost per 1M tokens: $<Value>
- Latency: <High/Medium>
- Tokens per minute (TPM): <Value>
