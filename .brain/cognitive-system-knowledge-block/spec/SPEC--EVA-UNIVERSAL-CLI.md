---
id: SPEC--EVA-UNIVERSAL-CLI
phase: 2
type: spec
status: stable
vault_id: default
tier: process
source_type: axiomatic
title: SPEC — EVA Universal CLI — the one-command entry point
tags: [eva, cli, distribution, installer, infrastructure]
aliases: [eva-command, global-cli]
cluster: implementation_flow
role: Technical specification
crosslinks:
  references:
    - CONCEPT--PRODUCTION-BOOTSTRAPPER
    - FRAMEWORK--MSP-ARCHITECTURE-V2
created_at: 2026-05-22T03:45:00+07:00
---

# SPEC — EVA Universal CLI

## 1. Overview

The `eva` command is the global entry point for the entire ecosystem. It simplif
  ies the setup and orchestration of Cognitive System projects by providing a si
ng  le, memorable command for installation, bootstrapping, and agent invocation.

## 2. Command Surface

### 2.1 `eva init [dir]`

Installs the core framework into the specified directory.

- **Action:** Runs the `bootstrap` logic (copying dist files, core axioms, and s  chemas).
- **Result:** A clean project folder ready for implementation.

### 2.2 `eva vibe`

Launches the autonomous EVA-CLI agent in the current directory.

- **Action:** Invokes the `msp-mll` or the upcoming autonomous implementation lo  op.
- **Context:** Uses the `.brain/` and `gks/` of the current project.

### 2.3 `eva status`

Checks the health of the local GKS project.

- **Action:** Runs `npx gks list` and validation checks.

## 3. Implementation Strategy

### 3.1 Global Package (`packages/eva-cli`)

Create a new thin package whose sole purpose is to provide the `eva` binary.

- **Dependencies:** `@freshair129/msp` (as a bundled dependency).
- **Distribution:** Published to npm (or private registry) as `eva-cli`.

### 3.2 Global Shim

When installed via `npm install -g eva-cli`, the `eva` command is added to the s
  ystem PATH.

## 4. Distribution Flow

1. **User:** `npm install -g @freshair129/eva-cli`
2. **User:** `eva init G:\my-project`
3. **EVA:** Creates clean layout -> copies binaries -> initializes GKS.
4. **User:** `cd G:\my-project && eva vibe`
5. **EVA:** Agent starts working on the project using the clean production core.

## 5. Success Metrics

- Zero manual file copying for new projects.
- No "design scaffolding" (plans/docs) in the target directory.
- Unified brand identity through the `eva` command.
