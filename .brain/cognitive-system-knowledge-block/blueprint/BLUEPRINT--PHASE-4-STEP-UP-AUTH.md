---
id: BLUEPRINT--PHASE-4-STEP-UP-AUTH
phase: 3
type: blueprint
status: stable
vault_id: default
tier: process
source_type: axiomatic
title: "BLUEPRINT — UCF Phase 4: Step-up Authentication"
tags:
  - msp
  - ucf
  - auth
  - security
crosslinks:
  references:
    - CONCEPT--STEP-UP-AUTH
    - FEAT--STEP-UP-AUTH-PIN
  implements:
    - FEAT--STEP-UP-AUTH-PIN
created_at: 2026-06-05T08:10:00+07:00
linked_symbols:
  - file: packages/msp/src/policy/step-up.ts
  - file: packages/msp/src/policy/pep.ts
  - file: packages/msp/src/policy/pdp.ts
aliases:
  - BLUEPRINT
cluster: implementation_flow
role: Implementation plan
attributes:
  domain: security
---

# BLUEPRINT — UCF Phase 4: Step-up Authentication

## Context
Advanced operations (like deleting atoms) require higher confidence than a standard session token. Step-up auth triggers a PIN challenge when the PDP returns a `request-step-up-auth` obligation.

## Implementation Details

### 1. Step-up Provider
Implement `PinProvider` to manage challenge/verify cycles.
- **Geography**: `packages/msp/src/policy/step-up.ts`
- **TTL**: 5 minutes.

### 2. PDP Obligations
Extend `evaluatePolicy` to support `on_deny` hooks.
- **Geography**: `packages/msp/src/policy/pdp.ts`

### 3. PEP Integration
Update the Enforcement Point to detect obligations and signal `requiresStepUp` to the consumer.
- **Geography**: `packages/msp/src/policy/pep.ts`

## Verification
- Unit tests for PIN verification.
- Integration tests in `test-ucf-phase-4.ts`.
