---
id: SPEC--GENESIS-OBSIDIAN-PLUGIN
type: spec
status: draft
title: "Genesis Obsidian Plugin: The Shadow Sync Bridge"
summary: Specification for the Obsidian plugin that connects the local Markdown vault to the GenesisDB (Mark III) engine, enabling Just-In-Time Context rendering and hybrid data syncing.
---

# SPEC--GENESIS-OBSIDIAN-PLUGIN

## 1. Context & Motivation
Obsidian is the ultimate human-friendly Personal Knowledge Management (PKM) tool, but it lacks the computational power to perform complex graph traversals and semantic vector searches natively at scale. GenesisDB (Mark III) solves this, but requires a seamless bridge to interact with Obsidian's UI and file system.

## 2. Architecture: HTTP Bridge vs. NAPI-RS
**Decision:** We will use a **Local HTTP REST Bridge** to communicate between the Obsidian Plugin and the GenesisDB Standalone Server (Axum).
**Why:** Loading native \.node\ modules (NAPI-RS) directly inside Obsidian's Electron environment is notoriously brittle across different OS updates and Obsidian versions. An HTTP Bridge (hitting \localhost:3000\) guarantees 100% stability and keeps the plugin lightweight.

## 3. Core Features (Phase 1 MVP)

### Feature A: The Shadow Sync (Vault -> DB)
- **Trigger:** Hook into Obsidian's \pp.vault.on('modify')\ and \pp.vault.on('create')\.
- **Action:** 
  1. Parse the Markdown file's YAML Frontmatter (to get ID, Type, Status).
  2. Parse any \json:genesis\ code blocks for properties/embeddings.
  3. Send a \POST /v1/node/add\ request to the GenesisDB server.
- **Benefit:** Every note saved in Obsidian instantly updates the GenesisDB WAL (Zero additional files created).

### Feature B: The JIT Context View (DB -> UI)
- **UI Component:** A Custom Sidebar Pane in Obsidian (Right-side panel).
- **Trigger:** Updates when the user changes the active leaf/file (\pp.workspace.on('file-open')\).
- **Action:** 
  1. Read the active file's ID.
  2. Send HQL Query: \TRAVERSE FROM <FileID> DEPTH 2\ via \POST /v1/query/hql\.
  3. Render the returned JSON directly into the sidebar as a clean, hierarchical Virtual Document.
- **Benefit:** The user sees a real-time, 2-hop contextual neighborhood of the current note without cluttering the actual markdown file.

## 4. Implementation Plan
1. Scaffold basic Obsidian plugin (\manifest.json\, \main.ts\, \	sconfig.json\).
2. Implement HTTP client to ping GenesisDB server health.
3. Build the \ShadowSync\ listener class.
4. Build the \JITContextView\ ItemView class.
