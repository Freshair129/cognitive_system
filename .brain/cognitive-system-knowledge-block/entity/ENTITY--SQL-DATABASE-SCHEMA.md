---
id: ENTITY--SQL-DATABASE-SCHEMA
phase: 2
type: entity
status: active
vault_id: default
tier: process
source_type: axiomatic
title: SQL Database Schema (Graph & Vector) ERD
tags:
  - database
  - schema
  - sql
  - erd
crosslinks:
  references:
    - SPEC--GENESIS-GRAPH-BACKEND
created_at: 2026-05-24T19:35:00.000+07:00
aliases:
  - ENTITY
  - Data schema
cluster: implementation_flow
role: Data schema
attributes:
  domain: entity
  language: markdown
---

# ENTITY — SQL Database Schema (Graph & Vector) ERD

## Schema definition

### 1. Graph Tables (gks_graph)

#### Table: `gks_graph_node`
Stores the vertices (symbols, files, and framework entities).
* `id` (text, Primary Key): Unique identifier of the node.
* `labels` (text[]): Array of labels associated with the node (e.g., `Symbol`, `File`, `Concept`).
* `props` (jsonb): Dynamic properties payload.
* `created_at` (timestamptz): Node insertion timestamp.

#### Table: `gks_graph_edge`
Stores directed edges and bi-temporal relationship states.
* `id` (text, Primary Key): Unique edge identifier.
* `from_node` (text, Foreign Key): Referencing `gks_graph_node.id` (Source).
* `to_node` (text, Foreign Key): Referencing `gks_graph_node.id` (Target).
* `rel` (text): Relationship type (e.g., `Calls`, `Imports`, `Inherits`).
* `props` (jsonb): Dynamic properties.
* `valid_from` (timestamptz): Lower bound of valid time range.
* `valid_to` (timestamptz, Nullable): Upper bound of valid time range (NULL if currently active).
* `recorded_at` (timestamptz): System write time.
* `superseded_by` (text, Foreign Key): Self-reference to `gks_graph_edge.id` to track logical updates.

---

### 2. Vector Tables (gks_vector)

#### Table: `gks_vector`
Stores embedded document chunks for semantic search.
* `id` (text, Primary Key): Document/chunk unique identifier.
* `store` (text): Namespace partition identifier (e.g., `atomic`, `episodic`).
* `source` (text): Origin file path or URI.
* `chunk_id` (text): Parent document's chunk grouping key.
* `text` (text): Raw text contents.
* `vector` (vector(dim)): The high-dimensional float array embedding.
* `metadata` (jsonb): Filterable attributes (e.g., `tenant_id`, `session_id`).
* `created_at` (timestamptz): Time of insertion.

#### Table: `gks_vector_manifest`
Stores metadata configuration per logical store.
* `store` (text, Primary Key): Store namespace identifier.
* `embedder_model` (text): Embedding model used.
* `dimension` (int): Dimension of the embedding vectors.
* `doc_count` (int): Number of document rows in the store.
* `last_updated` (timestamptz): Time of the last store update.
* `file_hashes` (jsonb): Source file path to MD5 hash mappings.
* `schema_version` (int): Internal schema compatibility version.

## Relations

```mermaid
erDiagram
    gks_graph_node {
        text id PK
        text_array labels
        jsonb props
        timestamptz created_at
    }

    gks_graph_edge {
        text id PK
        text from_node FK
        text to_node FK
        text rel
        jsonb props
        timestamptz valid_from
        timestamptz valid_to
        timestamptz recorded_at
        text superseded_by FK
    }

    gks_vector {
        text id PK
        text store
        text source
        text chunk_id
        text text
        vector vector
        jsonb metadata
        timestamptz created_at
    }

    gks_vector_manifest {
        text store PK
        text embedder_model
        int dimension
        int doc_count
        timestamptz last_updated
        jsonb file_hashes
        int schema_version
    }

    gks_graph_node ||--o{ gks_graph_edge : "acts as from_node"
    gks_graph_node ||--o{ gks_graph_edge : "acts as to_node"
    gks_graph_edge |o--o| gks_graph_edge : "superseded_by"
```

## Source
- `[[SPEC--GENESIS-GRAPH-BACKEND]]`
