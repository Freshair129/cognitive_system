# FEEDBACK--DB-AGENT-TO-PLUGIN
**From:** GenesisDB Core Agent / Lead Architect
**To:** Obsidian Plugin Development Team
**Subject:** Response to REQ--PLUGIN-TO-DB-AGENT-FEEDBACK (Mark III Alignment)

## 1. Executive Summary
The Core Engine team has reviewed your requirements. We generally approve of the **Shadow Sync** model. However, we have specific technical reservations regarding **R1 (Latency)** and **R3 (JSON Saturation)** that must be addressed via specific optimizations.

## 2. Response to Core Requirements

### R1: Latency Targets (HQL)
- **Verdict:** **REALISTIC BUT CONDITIONAL**. 
- **Feedback:** On the Mark III "Interior Mutability" core, a 2-hop traversal currently hits ~1ms. However, if the result set involves large JSON payloads (from R3), the overhead shifts from "Graph Traversal" to "JSON Serialization". 
- **Recommendation:** The plugin should only request specific fields (Projection) rather than the entire node object if performance degrades beyond 10ms.

### R2: WAL Durability vs. Sync Frequency
- **Verdict:** **APPROVED**. 
- **Feedback:** The current 5ms window in Group Commit is optimal for "Rapid Typing". 5ms is faster than human key-press intervals (~50-100ms).
- **Recommendation:** Do not increase batch size. 1024 events per batch is a safe ceiling for local NVMe.

### R3: JSON Property Flex-Schema
- **Verdict:** **CONCERN RAISED**.
- **Feedback:** GenesisDB stores properties in a \DashMap\. While this is fast, storing massive nested YAML blobs (as raw strings or Value objects) increases RAM fragmentation and slows down the \compute_impact\ (K-Impact) calculations.
- **Action Required:** The Plugin **MUST** pre-filter "Heavy Assets" (e.g., base64 images or long prose bodies) before sending to \/v1/node/add\. GenesisDB is a Knowledge Graph, not a raw document store.

### R4: Error State Communication
- **Verdict:** **APPROVED**.
- **Feedback:** We will update the Standalone Server to return \503 Service Unavailable\ during an active \ebuild_index\ operation.

## 3. Answers to Specific Questions

1. **Index Deferred Rebuild:** **ENGINE PREFERENCE.** The engine should NOT handle auto-rebuild after every sync to avoid "CPU Jitter". We recommend the Plugin triggers \/v1/bulk/rebuild\ only when the user is idle (> 10 seconds of no typing) or manually via a UI button.
2. **HQL Expansion (Fuzzy ID):** **PLANNED.** Fuzzy ID matching is on the roadmap for Phase 14.2.

## 4. Final Verdict: PROCEED WITH OPTIMIZATION
The engine is ready to support the plugin. Please ensure the "Pre-filtering" logic is implemented in the Plugin to keep the DB RAM footprint lean.

**Certified by:** GenesisDB Core Architect (อาหวัง)
**Date:** 2026-06-02
