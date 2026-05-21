# BLUEPRINT--GENESIS-BLOCK-BRIDGE

- **ID:** BLUEPRINT--GENESIS-BLOCK-BRIDGE
- **Status:** draft
- **Author:** Rwang (T2 Agent)
- **Stakeholders:** Claude (T3), Boss
- **Date:** 2026-05-21
- **Ref:** [[CONCEPT--GENESIS-BLOCK-RUNTIME]], [[SPEC--K-IMPACT]], [[FEAT--GENESIS-BLOCK-NATIVE]]

## 1. Objective
Transform `msp-genesis-exec` from a static file loader into an impact-aware execution engine. This bridge enables the runtime to leverage the high-performance Rust graph engine and K-Impact scores to dynamically assemble the most relevant cognitive context for the agent.

## 2. Core Features

### 2.1 Impact-Aware Context Expansion
Instead of relying solely on the hardcoded `members` list in a `GENESIS--` manifest, the bridge will:
1. **Load Seeds:** Load all atoms explicitly listed in the manifest.
2. **Graph Crawl:** Perform a 1-hop `neighbors()` query from each seed node.
3. **Inject Support:** Automatically include any neighbor atom if its `K-Impact` score is ≥ **0.80** (High Impact threshold).
4. **Benefit:** Ensures that `MASTER--` rules or critical `CONCEPT--` atoms are always present if referenced, even if not explicitly listed.

### 2.2 Ranked Prompt Assembly
When assembling the final prompt for the LLM:
- **Sorting:** Within each dimension (Cognitive, Algo, Concept, Runbook, Params), atoms are sorted by `K-Impact` descending.
- **Pruning:** If the total context exceeds the target token budget (e.g., 24k tokens), the lowest-impact atoms are pruned first.

## 3. Integration Architecture

### 3.1 Bridge Layer (`packages/msp/src/genesis/bridge.ts`)
- **Factory:** Uses `createGenesisGraphBackend` to obtain a `GenesisGraphBackendApi` instance.
- **Execution Hook:** Intercepts `executeBlock` calls to perform graph-based member resolution instead of simple file reading.

### 3.2 Workflow Update
1. `msp-genesis-exec` invokes `bridge.resolveMembers(blockId)`.
2. Bridge opens `GenesisDatabase` (respecting OS locks).
3. Bridge performs resolution (Seeds + High-Impact Neighbors).
4. Bridge returns a `LoadedMembers` object populated with prioritized data.
5. Standard `executor.ts` continues with `composePrompt`.

## 4. Operational Guardrails
- **Sync Integrity:** If the native engine is unavailable, the bridge falls back to the existing Pure-TS `loader.ts` logic.
- **Read-Only Safely:** The runtime opens the database in `readOnly: true` mode to prevent accidental mutations during execution.

## 5. Verification Plan
- **Integration Test:** Execute a block with missing critical dependencies; verify the bridge automatically injects them via the graph.
- **Latency Test:** Ensure the graph-based resolution adds < 50ms overhead to the total execution time.
