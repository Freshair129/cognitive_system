---
id: RUNBOOK--COVIBE-BACKLOG-SYNC
phase: 6
type: runbook
status:
  - active
vault_id: default
tier: process
source_type: axiomatic
title: SOP for Covibe UI Backlog to GKS Sync via WebSocket
tags:
  - msp
  - websocket
  - backlog
  - covibe
crosslinks:
  references:
    - BLUEPRINT--COVIBE-SYNC-PROTOTYPE
    - FRAMEWORK--MSP-ARCHITECTURE-V2
created_at: 2026-05-22T20:10:00.000+07:00
aliases:
  - Backlog Sync SOP
  - Covibe UI Integration
cluster: operations
role: Operational SOP
attributes:
  domain: operations
  language: markdown
  is_test: false
  is_entrypoint: false
  has_secret: false
  leak_risk: low
  encryption_level: none
---

# RUNBOOK — Covibe Backlog to GKS Sync

This runbook outlines the standard operating procedure for integrating and running the WebSocket-based sync between the Covibe UI (`covibe_roadmap.html`) and the MSP agent dispatch system.

## 1. Overview

The Covibe UI has "Backlog" tasks with unique IDs (e.g., `data-task-id="BLUEPRINT--COVIBE-SYNC-PROTOTYPE"`). 
When a user clicks "Let Agent Do This" in the UI, the frontend opens a WebSocket connection to the MSP agent server running on `ws://127.0.0.1:8787` and sends a task execution payload.

MSP then looks up the `task_ids` mapping inside the GKS atomic index (`atomic_index.jsonl`) to resolve which Markdown blueprint corresponds to the UI task. It then dispatches the correct agent (via `packages/msp/src/agents/dispatch.ts`) and streams the terminal output back to the UI.

## 2. Prerequisites

1. Node.js environment with the `@freshair129/msp` workspace correctly built.
2. The `ws` dependency installed in `packages/msp/package.json`.
3. An active `atomic_index.jsonl` updated via `npm run msp:index`.

## 3. Starting the WebSocket Server

The WebSocket agent server is part of the main MSP orchestrator entry point.

To start the server:
```bash
npm run dev --workspace=packages/msp
# OR
node packages/msp/dist/index.js start-ws-server
```
*Note: The exact command depends on how the entrypoint (`packages/msp/src/index.ts`) is configured to boot the WS server.*

By default, the server listens on port `8787`.

## 4. Troubleshooting UI to Server Connection

### Symptom: UI says "Connection refused"
- **Root Cause**: The MSP WebSocket server is not running or is running on a different port.
- **Action**: Verify the server is running. Check port `8787` usage (`netstat -ano | findstr 8787` on Windows).

### Symptom: "Task ID ... not found in GKS index"
- **Root Cause**: The UI sent a task ID that does not exist in any GKS atom's `attributes.task_ids` array.
- **Action**: 
  1. Add the task ID to the relevant atom (e.g. `BLUEPRINT--...`).
  2. Run `npm run msp:index` from the project root.
  3. Try again.

### Symptom: Agent output is not streaming to UI
- **Root Cause**: Process spawn issues or stdout pipe buffering.
- **Action**: Ensure `spawn-helper.ts` is capturing `stdout` and `stderr` using `data` events, and sending `agent_output` WS messages to the connected client.

## 5. Security & Isolation
- The WebSocket server is intended for **local development only** (bound to `127.0.0.1`). Do not expose to `0.0.0.0` unless authenticated.
- Incoming task payloads are validated against the `atomic_index.jsonl`.
