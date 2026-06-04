# REQ--PLUGIN-TO-DB-AGENT-FEEDBACK
**Target:** GenesisDB Core Agent / Lead Architect
**Subject:** Architectural Requirements & Integration Feedback for Obsidian Shadow Sync Plugin

## 1. Context
The Obsidian Plugin (**Genesis Shadow Sync**) serves as the primary "Human-to-Machine" bridge for the Mark III architecture. It translates real-time Markdown vault mutations into Graph/Vector events for GenesisDB. To ensure a seamless experience, we need feedback on the following technical requirements.

## 2. Core Requirements for GenesisDB Engine

### R1: Latency Targets for JIT Context (HQL)
- **Requirement:** The \POST /v1/query/hql\ endpoint must return a 2-hop neighborhood result in **< 10ms** (P95) for a dataset of 100k nodes.
- **Reason:** To avoid UI flickering in Obsidian when the user navigates between notes.
- **Feedback Needed:** Given the current "Interior Mutability" refactor, is this target realistic on consumer hardware (12-threads) under concurrent write pressure?

### R2: WAL Durability vs. Plugin Sync Frequency
- **Requirement:** Every plugin mutation (Shadow Sync) must be acknowledged only after the WAL Group Commit completes.
- **Reason:** To prevent data loss if Obsidian crashes immediately after a save.
- **Feedback Needed:** The current Phase 13 Group Commit flushes every 5ms or 1024 events. Does the Core Agent recommend any specific batching adjustments to handle "Rapid Typing" bursts from multiple Obsidian tabs?

### R3: JSON Property Flex-Schema
- **Requirement:** The engine must accept and store arbitrary JSON objects in \props\ without pre-defined schemas.
- **Reason:** Obsidian users often use unique YAML keys for different notes.
- **Feedback Needed:** How does storing massive nested JSON in \DashMap\ affect the HNSW indexing speed or RAM saturation? Should the plugin pre-filter "unnecessary" keys before sending them to the DB?

### R4: Error State Communication
- **Requirement:** If the DB engine is under a "Rebuild Index" lock, it should return a specific HTTP 503 (Service Unavailable) status.
- **Reason:** The plugin needs to show a "Building Brain..." loading state in the Sidebar.

## 3. Proposed Data Contract (Plugin -> DB)
`json
{
  "id": "FILE-ID-STRING",
  "labels": ["NoteType"],
  "props": {
    "yaml_metadata": "...",
    "content_hash": "...",
    "k_impact_override": 0.0
  },
  "embedding": [0.1, 0.2, "..."]
}
`

## 4. Specific Questions for DB Agent
1. **Index Deferred Rebuild:** Should the plugin trigger \/v1/bulk/rebuild\ manually, or should the engine handle it automatically after X number of Shadow Sync mutations?
2. **HQL Expansion:** Does the engine plan to support "Fuzzy ID matching" in HQL to handle typos in Obsidian wikilinks?

***
**Please review these requirements and provide feedback on feasibility, performance risks, and potential API optimizations.**
