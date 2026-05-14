/**
 * GKS MCP Server
 * Exposes GKS knowledge tools to AI agents via Model Context Protocol.
 * Transport: stdio (default for Claude Desktop / Claude Code MCP)
 *
 * Tools exposed:
 *   gks_search   — semantic search across atoms
 *   gks_get      — get atom by ID
 *   gks_list     — list atoms with optional type filter
 *   gks_validate — run atom validator
 *   msp_propose  — propose a new atom (candidate)
 */

// TODO: implement using @modelcontextprotocol/sdk + @freshair129/gks
// Reference: https://modelcontextprotocol.io/docs/concepts/servers

console.error('GKS MCP server — not yet implemented');
process.exit(1);
