---
id: FEAT--SCHEMA-VISUALIZER
phase: 2
type: feat
status: active
vault_id: default
tier: process
source_type: axiomatic
title: Schema Visualizer — Interactive Database ERD in developer command center
tags:
  - database
  - schema
  - erd
  - web-ui
  - cytoscape
  - feat
created_at: 2026-05-24T05:55:00.000+07:00
---

# FEAT — Schema Visualizer

## User-facing behaviour

A new **Database** (or **Schema**) tab is introduced in the main view switcher of the CoDev developer command center (`codev_dashboard.html`).

When active, it displays:
- **Left Database Sidebar:** Includes navigation menus for database management:
  - *Database Management:* "Schema Visualizer" (active), "Tables", "Functions", "Triggers", "Enumerated Types", "Extensions", "Indexes", "Publications".
  - *Configuration:* "Roles", "Policies", "Settings".
  - *Platform:* "Replication", "Backups", "Migrations", "Wrappers", "Database Webhooks".
  - *Tools:* "Security Advisor", "Performance Advisor", "Query Performance".
- **Top Actions Bar:** Includes a Schema Selector (default "schema public"), a "Copy as SQL" action button, and an "Auto layout" button.
- **Interactive ERD Canvas:** An interactive zoomable, panning workspace featuring draggable table representations and connecting SVG relationship lines.
- **Status/Legend Bar:** Bottom legend displaying field constraints: Primary Key key icon, Identity hash icon, Unique diamond icon, Nullable circle icon, and Non-Nullable filled circle icon.

## Visual Design & Aesthetics

### Table Node Cards
- Dark premium card style with glassmorphism matching the dashboard theme.
- Top header with table name and helper actions.
- List of attributes showing field name, type, and icon badges for constraints.

### Relationships (Crow's Foot Notation)
- SVG connector paths drawing straight or curved bezier paths between table keys (e.g. `orders.order_id` to `transactions.order_id`).

## Verification
- Switch to the "Database" view -> verify layout structures (sidebar + actions bar + canvas).
- Drag the `orders` table card -> verify connecting SVG lines update in real-time.
- Hover over relationship lines -> verify source/target tables and endpoints are highlighted.
