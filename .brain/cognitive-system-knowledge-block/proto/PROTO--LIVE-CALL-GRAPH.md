---
id: PROTO--LIVE-CALL-GRAPH
phase: 2
type: proto
status: active
vault_id: default
tier: safety
source_type: axiomatic
title: Verification Protocol and Invariants for Call Graph Integration
tags:
  - proto
  - verification
  - validation
  - invariants
crosslinks:
  implements:
    - SPEC--LIVE-CALL-GRAPH
created_at: 2026-05-24T02:35:00.000+07:00
---

# PROTO — Verification Protocol and Invariants

This protocol specifies the UI layout integrity rules and data correctness invariants for the Live Call Graph view.

## 1. UI Integration Invariants

- **Center Panel Dimensions:** 
  - The Live Call Graph view container (`#callgraph-view`) must occupy exactly the remaining vertical and horizontal space inside the dashboard's `<main>` area.
  - It must have `overflow: hidden` to prevent secondary layout scrollbars.
- **Cytoscape Container Size:**
  - `#cy-container` must fill 100% of its parent wrapper's width and height.
- **Card Border Alignment:**
  - When `#callgraph-view` is active, the container element must retain card border and shadow settings to preserve the dark dashboard dashboard aesthetic:
    - `bg-bg-secondary border border-border rounded-xl shadow-lg`

---

## 2. Graph Struct Invariants

- **Integrity Rule 1: No Ghost Calls**
  - For every edge in the dataset `{ source, target }`, both the `source` node and `target` node must exist in the node collection.
- **Integrity Rule 2: Package Membership**
  - All nodes must specify a valid `pkg` attribute matching one of: `['msp', 'gks', 'ui']`.
- **Integrity Rule 3: File Containment**
  - Every symbol node of type `function` must have a valid `parent` reference pointing to a parent node of type `file`.

---

## 3. Sync Action Verification Protocol

Whenever the user clicks "Sync Tree-sitter" (`refreshCallGraph()`):
1. **Interactive State:** Disable the Sync button during execution and display an active spinner/loader text ("Syncing...").
2. **Terminal Feed:** Trigger simulated system outputs sequentially into `#terminal-output`.
3. **Graph Update:** Call `cy.layout()` to re-center nodes and apply correct positioning values.
4. **Cleanup:** Restore button state and close the details panel (`#cy-info-panel`) to prevent stale details mapping.
