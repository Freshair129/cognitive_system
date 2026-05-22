---
id: ADR--MOD-FEAT-HIERARCHY
phase: 2
type: adr
status: stable
vault_id: default
tier: genesis
source_type: axiomatic
title: Feature Grouping via MOD-- Hierarchy and Domain Metadata
tags:
  - msp
  - architecture
  - taxonomy
  - hierarchy
  - domain-driven
crosslinks:
  references:
    - CONCEPT--TAXONOMY-V2-3
    - FRAMEWORK--CROSSLINKS-VOCABULARY
created_at: 2026-05-22T10:00:00+07:00
---

# ADR — Feature Grouping via MOD-- Hierarchy and Domain Metadata

## Context

The project currently has 48 `FEAT--` atoms with no strict grouping or hierarchy. They exist as standalone feature specifications. A question arose regarding how to group these features, specifically whether to introduce a 3-tier hierarchy (`DOMAIN--` → `MOD--` → `FEAT--`).

## Decision

We will adopt a **2-tier hierarchy** combined with **metadata tagging**, explicitly rejecting the creation of a new `DOMAIN--` atom type:

1. **Hierarchy (MOD-- > FEAT--)**: 
   Features will be grouped under Modules. The relationship is expressed via crosslinks:
   - `FEAT--` atoms MUST point to their parent module using `crosslinks.belongs_to: MOD--<NAME>`.
   - `MOD--` atoms MAY list their features using `crosslinks.implements: [- FEAT--<NAME>]`.

2. **Domain as Metadata**:
   To group modules and features into business domains without the overhead of standalone `DOMAIN--` atoms, we will use a `domain` key in the frontmatter metadata.

### 2.1 Example

**Module Manifest (`MOD--MEMORY.md`)**:
```yaml
id: MOD--MEMORY
type: mod
domain: knowledge-engine
crosslinks:
  implements:
    - FEAT--MEMORY-EPISODIC-WRITER
```

**Feature Spec (`FEAT--MEMORY-EPISODIC-WRITER.md`)**:
```yaml
id: FEAT--MEMORY-EPISODIC-WRITER
type: feat
domain: knowledge-engine
crosslinks:
  belongs_to: MOD--MEMORY
```

## 3. Rationale

- **Avoiding Atom Bloat**: `GENESIS--` atoms already serve as domain-level aggregators (Block Manifests). Introducing `DOMAIN--` would conflict with `GENESIS--` and violate the simplicity of Taxonomy v2.3.
- **Queryability**: Storing the domain in the frontmatter (`domain: <name>`) allows scripts and indexers to easily filter atoms by domain without needing graph traversals.
- **Clear Ownership**: The `MOD--` level perfectly encapsulates the code boundary and ownership, while `FEAT--` defines the behavioral requirements.

## Consequences

- `FRAMEWORK--CROSSLINKS-VOCABULARY` is updated to include the `belongs_to` predicate.
- Future and existing `FEAT--` atoms should incrementally adopt `belongs_to` and `domain` metadata.
