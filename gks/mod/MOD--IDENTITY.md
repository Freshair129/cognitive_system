---
id: MOD--IDENTITY
phase: 2
type: mod
status: stable
vault_id: default
tier: process
source_type: axiomatic
title: Identity Module — Genesis Block for the "Soul" Passport
tags:
  - msp
  - identity
  - genesis
  - module
  - composition
crosslinks:
  composes:
    - CONCEPT--IDENTITY-LAYER
    - PROTOCOL--IDENTITY-API
    - ALGO--IDENTITY-RESOLUTION
  implements:
    - FEAT--IDENTITY-LAYER
    - FEAT--SECURITY-SECRET-PACK
    - FEAT--SESSION-LOCK-WINDOWS
    - FEAT--STEP-UP-AUTH-PIN
created_at: 2026-05-11T10:28:00.000Z
aliases:
  - MOD
  - implementation_flow
  - Module manifest
cluster: implementation_flow
role: Module manifest
attributes:
  domain: identity
  language: markdown
  is_test: false
  is_entrypoint: false
  has_secret: false
  leak_risk: low
  encryption_level: none
---

# MODULE — Identity (Genesis Block)

The Identity module is a **Genesis Block** that defines the "soul" half of the MSP passport. It ensures an agent's name, role, voice, and preferences travel with them across any cognitive harness.

## 1. Composition

This module is a functional knowledge unit composed of:

- **Concept**: `[[CONCEPT--IDENTITY-LAYER]]` (The "why" — persistent persona).
- **Protocol**: `[[PROTOCOL--IDENTITY-API]]` (The "how" — programmatic interface).
- **Algorithm**: `[[ALGO--IDENTITY-RESOLUTION]]` (The "logic" — global vs local resolution).

## 2. Integration

- **Implements**: `[[FEAT--IDENTITY-LAYER]]`, `[[FEAT--SECURITY-SECRET-PACK]]`, `[[FEAT--SESSION-LOCK-WINDOWS]]`, `[[FEAT--STEP-UP-AUTH-PIN]]`.
- **Governed by**: `[[ADR--IDENTITY-STORAGE-SHAPE]]` (durable JSON storage).
- **Observable via**: `[[AUDIT--IDENTITY-LAYER]]`.

## 3. Canonical Location

Source code: `src/identity/`.
