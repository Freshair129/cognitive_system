---
id: FEAT--LIVE-CALL-GRAPH-DASHBOARD
phase: 2
type: feat
status: active
vault_id: default
tier: process
source_type: axiomatic
title: Live Call Graph Dashboard View — Cytoscape integration in developer command center
tags:
  - covibe
  - symbol-graph
  - call-graph
  - web-ui
  - cytoscape
  - feat
crosslinks:
  belongs_to: MOD--COVIBE-DASHBOARD
  references:
    - CONCEPT--SYMBOL-GRAPH
    - ALGO--SYMBOLS-CALL-GRAPH-TRAVERSAL
created_at: 2026-05-24T02:35:00.000+07:00
---

# FEAT — Live Call Graph Dashboard View

## User-facing behaviour

A new **Call Graph** tab is introduced in the main view switcher of the CoDev developer command center (`codev_dashboard.html`), alongside the existing "Roadmap" and "AST" buttons. 

When active, it displays:
- **Toolbar:** Top bar displaying active SQLite DB status ("SQLite DB: in-memory (active)"), a **Depth Selector** dropdown for filtering graph depth, and a "Sync Tree-sitter" action button.
- **Graph Workspace:** An interactive 2D canvas utilizing Cytoscape.js to visualize package-grouped call connections.
- **Floating Details Card:** Displays signature, file location, inbound callers list, and outbound calls list for the clicked node.

## UI & Graph Design

### Node Visuals
- Grouped inside parent nodes (files) to show containment boundaries.
- Rounded ellipse shape for function/symbol nodes.
- Colors mapped to source code packages:
  - `packages/msp` -> Green (`#78f4bf`)
  - `packages/gks` -> Blue (`#60a5fa`)
  - `apps/web` -> Purple (`#c084fc`)

### Edge Visuals
- Directed arrows representing caller-to-callee connections.
- Normal width: 2px, opacity 0.6.
- Highlighted width: 4px, opacity 1.0, color `#78f4bf` (green glow).

### Interactivity
- **Hover:** Neighbors of the hovered node remain bright; all other nodes and edges fade down (opacity 0.2/0.1) for high-contrast tracing.
- **Click:** Pops up the floating detail card. Clickable lists of callers and callees inside the card allow immediate pan-and-focus selection on other nodes in the network.

## Verification

- Click the "Call Graph" tab switcher button -> verify display container and layout bounds.
- Hover on `calculateDrift` function node -> verify connected nodes (`syncState`, `addNode`) stay bright while others dim.
- Click `calculateDrift` node -> verify floating details panel pops up with correct caller and callee links.
- Click "Sync Tree-sitter" -> verify simulated terminal log output stream.
