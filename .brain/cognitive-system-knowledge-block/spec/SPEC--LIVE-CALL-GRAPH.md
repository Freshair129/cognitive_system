---
id: SPEC--LIVE-CALL-GRAPH
phase: 2
type: spec
status: active
vault_id: default
tier: process
source_type: axiomatic
title: Live Call Graph UI and Mock Database Specification
tags:
  - spec
  - symbol-graph
  - call-graph
  - cytoscape
crosslinks:
  references:
    - FEAT--LIVE-CALL-GRAPH-DASHBOARD
    - ALGO--SYMBOLS-CALL-GRAPH-TRAVERSAL
created_at: 2026-05-24T02:37:00.000+07:00
---

# SPEC — Live Call Graph

Technical specification for the Live Call Graph interface and in-memory mock storage simulation.

## 1. Graph Data Model Spec

### 1.1 Node Properties
Each Cytoscape node must contain the following fields in its `data` dictionary:
- `id` (string): Unique identifier (e.g. `fn-calculateDrift`).
- `label` (string): Human-readable display label (e.g. `calculateDrift`).
- `type` (string): Either `'file'` (parent compound node) or `'function'` (child symbol node).
- `pkg` (string): Package name (`'msp'`, `'gks'`, or `'ui'`) to determine coloration.
- `parent` (string, optional): ID of the file parent node (for child symbol nodes).
- `file` (string): Absolute/relative file path to display in the metadata details panel.

### 1.2 Edge Properties
Each Cytoscape edge must contain:
- `id` (string): Unique ID (e.g. `edge-syncState-calculateDrift`).
- `source` (string): ID of caller node.
- `target` (string): ID of callee node.
- `type` (string): `'calls'`.

---

## 2. Cytoscape Stylesheet Spec

### 2.1 Package Node Colors
- `pkg: msp` -> border / text `#78f4bf`, parent background: `rgba(120, 244, 191, 0.1)`
- `pkg: gks` -> border / text `#60a5fa`, parent background: `rgba(96, 165, 250, 0.1)`
- `pkg: ui` -> border / text `#c084fc`, parent background: `rgba(192, 132, 252, 0.1)`

### 2.2 Hover & Highlighting Classes
- `.faded`:
  - `opacity`: `0.2` (nodes) / `0.1` (edges).
- `.highlighted`:
  - `line-color`: `#78f4bf`
  - `target-arrow-color`: `#78f4bf`
  - `width`: `4px`
  - `opacity`: `1.0`

---

## 3. Mock Database & Sync Logic Spec

### 3.1 SQLite Simulation Schema
The simulated in-memory SQLite database is queried for calls. It holds:
- `symbols` (id, name, type, file_path, package)
- `calls` (caller_id, callee_id)

### 3.2 Sync Execution Logs (Terminal Output)
When executing `Sync Tree-sitter`, the system logs sequential outputs to the terminal:
1. `[SYS] Connecting to in-memory SQLite Database...`
2. `[SYS] Dropping existing symbol indices.`
3. `[SYS] Running Tree-sitter queries over workspace targets: gks/, msp/, ui/`
4. `[SYS] Found 5 files and 5 cross-file call relationships.`
5. `[SYS] Inserted 10 nodes and 4 directed edges into sqlite_master.`
6. `[SYS] Tree-sitter AST extraction and Call Graph sync completed successfully.`

---

## 4. UI Invariants

- **Details Panel Visibility:** The panel `#cy-info-panel` starts hidden and appears only when a node is clicked. It must slide or fade in from the right edge.
- **Node Panning/Zooming boundaries:** Graph viewport must auto-fit nodes upon sync initialization and tab view activation.

---

## 5. Graph Depth Filtering Spec

### 5.1 Depth Calculation
- The traversal origin (root node) is defined as `App` (the entry point of the UI package).
- For any function/symbol node, its depth is computed as the length of the shortest path (number of hops) from `App` to that node.
- A breadth-first search (BFS) algorithm starting from `App` is used to calculate depth for all nodes.

### 5.2 Filter Actions
- When the user selects a depth constraint $D$ (e.g. `1`, `2`, `3`):
  1. Remove or hide all symbol nodes where `computedDepth > D`.
  2. Remove or hide all edges whose source or target node is hidden.
  3. For parent compound nodes (representing packages/directories), hide them if and only if all of their children are hidden.
  4. Trigger a layout recalculation (`cose`) to arrange the remaining visible graph nodes nicely.
  5. Fit the viewport (`cy.fit()`) to ensure the subset of nodes is centered and visible.
- When `All` is selected, restore the original nodes and edges and trigger the layout.
