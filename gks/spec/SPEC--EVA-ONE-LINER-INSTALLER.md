---
id: SPEC--EVA-ONE-LINER-INSTALLER
phase: 2
type: spec
status: stable
vault_id: default
tier: process
source_type: axiomatic
title: SPEC — EVA One-Liner Installer — PowerShell distribution (irm | iex)
tags: [eva, installer, powershell, distribution, infra]
aliases: [install-ps1, cloud-install]
cluster: implementation_flow
role: Technical specification
crosslinks:
  references:
    - SPEC--EVA-UNIVERSAL-CLI
created_at: 2026-05-22T04:00:00+07:00
---

# SPEC — EVA One-Liner Installer

## 1. Intent

To provide a "Zero-Friction" installation experience for EVA-CLI, matching the s
  tandards set by `claude` and `gemini`. User should be able to run a single Pow
er  Shell command to have a fully functional `eva` environment.

## 2. The Experience

### 2.1 Installation

```powershell
irm https://eva.freshair.ai/install.ps1 | iex
```bash

### 2.2 Usage

```powershell
## To start a new project
eva init ./my-vibe

## To start a session (in any project)
eva
```bash

## 3. Implementation Logic (`install.ps1`)

1. **Environment Check:** Verify Node.js >= 20 is installed.
2. **Binary Download:** Download the latest stable bundle of EVA-CLI (Core + Age
  nt).
3. **Global Path Registration:**
    * Place EVA binaries in `$HOME\.eva\bin`.
    * Add `$HOME\.eva\bin` to the User PATH environment variable.
4. **Shim Creation:** Create an `eva.cmd` or `eva.ps1` shim that points to the m
  ain entry point.
5. **GKS Initialization:** Pre-download the foundational axioms and schemas into
   a global cache.

## 4. Global Package Structure

When installed, `$HOME\.eva\` will look like:

```text
.eva/
â”œâ”€â”€ bin/
â”‚   â””â”€â”€ eva.cmd          # The global command
â”œâ”€â”€ core/                # The framework (msp + gks dist)
â”œâ”€â”€ agent/               # The agent runtime (eva-cli dist)
â””â”€â”€ config/              # Global user preferences
```bash

## 5. Deployment Strategy

1. **Hosting:** Host `install.ps1` and the zip/tar bundles on a public URL (e.g.
  , GitHub Pages or Vercel).
2. **Versioning:** The installer always pulls the "latest" stable tag from the m
  onorepo's release pipeline.

## 6. Connections

* `[[SPEC--EVA-UNIVERSAL-CLI]]` — defines the command surface.
