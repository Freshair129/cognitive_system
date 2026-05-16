//! Genesis Block — embedded graph engine for GKS.
//!
//! Phase 3.1 scaffold per BLUEPRINT--GENESIS-GRAPH-INTEGRATION:
//! - One Cargo crate that produces a `cdylib` consumable by Node via napi-rs.
//! - Two trivial sync exports (`schemaVersionSync`, `engineNameSync`) that
//!   match PROTOCOL--GENESIS-GRAPH-FFI §5 ("the only blocking calls").
//! - Storage / addNode / addEdge / query / neighbors / cypher land in P3.2+.

#![deny(clippy::all)]

use napi_derive::napi;

/// On-disk schema version recognised by this engine. Aligned with
/// `packages/gks/src/lib/schema-version.ts` (`CURRENT_SCHEMA_VERSION = '1.0.0'`).
/// Bump together when the on-disk format changes.
pub const SCHEMA_VERSION: u32 = 1;

/// Returns the schema version supported by this engine.
///
/// Per PROTOCOL--GENESIS-GRAPH-FFI §5 this is allowed to be synchronous
/// because the worst-case runtime is bounded at <1 µs (a constant return).
#[napi(js_name = "schemaVersionSync")]
pub fn schema_version_sync() -> u32 {
    SCHEMA_VERSION
}

/// Stable engine identifier. Used by integration tests + diagnostics to
/// confirm the prebuilt `.node` actually loaded the Rust crate (rather
/// than some other binding with the same shape).
#[napi(js_name = "engineNameSync")]
pub fn engine_name_sync() -> String {
    "genesis-block".to_string()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn schema_version_matches_typescript_constant() {
        // CURRENT_SCHEMA_VERSION on the TS side is '1.0.0'; the Rust crate
        // encodes only the major byte for the on-disk version header
        // (PROTOCOL--GENESIS-GRAPH-FFI §6). Keep these in lockstep.
        assert_eq!(SCHEMA_VERSION, 1);
    }

    #[test]
    fn engine_name_is_stable() {
        assert_eq!(engine_name_sync(), "genesis-block");
    }
}
