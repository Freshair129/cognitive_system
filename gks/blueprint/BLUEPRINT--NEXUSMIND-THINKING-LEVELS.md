---
id: BLUEPRINT--NEXUSMIND-THINKING-LEVELS
phase: 3
type: blueprint
status: stable
vault_id: default
tier: process
source_type: axiomatic
title: BLUEPRINT — Nexusmind Thinking Levels & Analytical Matrices
tags: [msp, ucf, blueprint, reasoning, nexusmind, decision-matrix, k-impact]
aliases: [BLUEPRINT, implementation_flow, Implementation plan]
cluster: implementation_flow
role: Implementation plan
linked_symbols:
  - file: packages/msp/src/cognitive/index.ts
crosslinks:
  references:
    - CONCEPT--NEXUSMIND-THINKING-LEVELS
    - CONCEPT--HOP-BASED-RESOLUTION
created_at: 2026-05-29T04:35:00+07:00
attributes:
  task_ids:
    - nexus-formula
    - nexus-matrix
    - nexus-utility
    - nexus-k-impact
    - nexus-routing
---

# BLUEPRINT — Nexusmind Thinking Levels

## 1. Goal

Implement the mathematical models and analytical matrix engine for Nexusmind Mode N0-N5 to evaluate cross-chain relationships, calculate node value utility, evaluate expansion decisions, and shift epistemic states (K-Impact).

## 2. Implementation Steps

### T1: Information Value Formula (`packages/msp/src/cognitive/nexusmind.ts`)
- Create the core calculation helper:
  $$V(n) = \max_{p \in \text{Paths}} \left( \prod_{e \in p} \text{Weight}(e) \cdot \lambda^{\text{hops}} \right) \cdot S_{\text{vector}}(n) \cdot S_{\text{cross}}(n)$$
- Parameters:
  - $\lambda$ (decay rate): Default 0.8.
  - $\text{Weight}(e)$: Defined in Hop-Based Resolution (e.g. `depends_on = 1.0`, `references = 0.5`).
  - $S_{\text{vector}}(n)$: Vector similarity score of the node (from retrieve results, default 0.5 if not search hit).
  - $S_{\text{cross}}(n)$: Synergy score from the Knowledge Matrix.

### T2: Knowledge & Decision Matrix Engine (`packages/msp/src/cognitive/nexusmind.ts`)
- **Knowledge Matrix ($K$):** For each traversed node $n$:
  - Dimension 1 (Main Chain Relevance): Max path weight from seed.
  - Dimension 2 (Domain Congruence): 1.0 if domain matches seed domain, 0.0 otherwise.
  - Dimension 3 (Semantic Tag Synergy): $|Tags(n) \cap Tags(seed)| / |Tags(seed)|$ (or normalized count).
  - Dimension 4 (Structural Role): 1.0 if the type supports the reasoning direction, 0.0 otherwise.
- **Decision Matrix ($D$):** For candidate nodes under N3-N5:
  - Compute Utility Value:
    $$U(n) = w_{\text{value}} \cdot V(n) - w_{\text{cost}} \cdot \text{Cost}(n)$$
    where $\text{Cost}(n) = \text{character length of body} / 1000$ (proxy for token cost).
  - If $U(n) \ge \text{threshold}$, automatically mark the node for `FULL` expansion.
  - If a node is in `RE-CANDIDATE` state, apply a penalty (e.g., multiply utility by 0.5).

### T3: K-Impact & Epistemic State Machine (`packages/msp/src/cognitive/nexusmind.ts`)
- Compute K-Impact for N4-N5:
  $$K(n) = \frac{\text{Reliability}(n) \cdot \text{Evidence}(n)}{\text{TimeDecay}}$$
  - For `status: stable` or `source_type: axiomatic` (TRUTH), $\text{TimeDecay} = 1.0$.
  - Otherwise, $\text{TimeDecay} = 1.0 + \gamma \cdot \text{age in days}$, where $\gamma$ is a decay coefficient.
- Epistemic Transitions (N5):
  - On conflict or low K-Impact, transition state to `RE-CANDIDATE`.
  - When re-candidates are evaluated:
    - If supported by new evidence -> `Promote` (e.g. `BELIEF` -> `FACT`, `FACT` -> `TRUTH`).
    - If conflicted or stale -> `Downgrade` (e.g. `FACT` -> `BELIEF`, `BELIEF` -> `BIAS`).
  - Log state mutations in a local changes log.

### T4: Nexusmind Routing integration (`packages/msp/src/cognitive/index.ts`)
- Wire N0-N5 thinking levels into `recall` and `remember`:
  - **N0 (Minimal):** Recall directly from sources without matrices or K-Impact.
  - **N1 (Low):** Standard 1D Matrix, pull only `SUMMARY` resolution.
  - **N2 (Normal):** 2D Matrix (Main Chain x Domain) to filter nodes.
  - **N3 (High):** 3D Semantic Matrix + Decision Matrix $U(n)$ calculation.
  - **N4 (Extended):** N3 + run K-Impact calculations (flag conflicts).
  - **N5 (Extreme):** Full Epistemic Matrix + Re-candidate state transitions + state mutation logging.

## 3. Verification Plan

### 3.1 Unit Tests (`packages/msp/test/cognitive/nexusmind.test.ts`)
- Verify Information Value $V(n)$ calculation matches formula expectation.
- Test Decision Matrix utility $U(n)$ and verify correct auto-expansion triggers.
- Test K-Impact decay logic and check that TRUTH nodes are immune to time decay.
- Verify epistemic transitions for N5 mode under test fixtures.
