---
id: ALGO--LIVE-CALL-GRAPH-SYNC
phase: 2
type: algo
status: active
vault_id: default
tier: process
source_type: axiomatic
title: Interactive Call Path Highlighting and Node Traversing Algorithm
tags:
  - algo
  - algorithm
  - call-graph
  - highlight
crosslinks:
  implements:
    - SPEC--LIVE-CALL-GRAPH
created_at: 2026-05-24T02:35:00.000+07:00
---

# ALGO — Interactive Call Path Highlighting

Algorithm for real-time edge/node highlighting and interactive panel navigation.

## 1. Neighborhood Highlighting on Hover

### 1.1 Inputs
- `targetNode`: Cytoscape node element currently hovered.
- `cy`: The active Cytoscape.js instance.

### 1.2 Step-by-Step Algorithm
1. Retrieve direct neighborhood of `targetNode`:
   - `connectedEdges = targetNode.openNeighborhood('edge')`
   - `connectedNodes = targetNode.openNeighborhood('node').union(targetNode)`
2. Add parents of connected nodes to prevent file boundaries from fading:
   - `parentNodes = connectedNodes.parents()`
   - `highlightNodes = connectedNodes.union(parentNodes)`
3. Apply styling states:
   - For all elements in `cy`:
     - If element is in `highlightNodes` or `connectedEdges`:
       - Remove class `'faded'`.
       - If element is an edge or is the `targetNode`, add class `'highlighted'`.
     - Else:
       - Add class `'faded'`.
       - Remove class `'highlighted'`.

### 1.3 Time Complexity
- **Worst Case:** O(V + E) where V is the number of vertices and E is the number of edges, as Cytoscape checks the containment and class list of all active elements in the viewport.

---

## 2. Interactive Navigation via Detail Card Links

### 2.1 Inputs
- `destinationId`: The unique ID of the node clicked inside the Caller/Callee list.
- `cy`: The active Cytoscape.js instance.

### 2.2 Algorithm
1. Query node by ID: `node = cy.$('#' + destinationId)`.
2. Check if node exists. If null -> abort.
3. Trigger click event on `node` programmatically to update the details panel metadata.
4. Pan the graph viewport to center the target node:
   - `cy.animate({ center: { eles: node }, zoom: 1.5 }, { duration: 500 })`.
5. Apply highlighting to the newly selected node.
