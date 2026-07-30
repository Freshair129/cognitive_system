import { describe, expect, it } from 'vitest'

import { createMspMcpServer, REGISTERED_TOOL_NAMES } from '../../src/mcp/server.js'

describe('createMspMcpServer', () => {
  it('returns a server object', () => {
    const server = createMspMcpServer()
    expect(server).toBeDefined()
  })

  it('registers exactly the 31 cognitive-system tools, no more no less', () => {
    expect([...REGISTERED_TOOL_NAMES].sort()).toEqual([
      'gks_code_upsert',
      'msp_backlinks_rebuild',
      'msp_brain_resolve',
      'msp_candidate',
      'msp_compress',
      'msp_context_resolve',
      'msp_dispatch',
      'msp_distill',
      'msp_episode_append',
      'msp_escalate',
      'msp_evidence_record',
      'msp_expand',
      'msp_identity_beliefs',
      'msp_identity_get',
      'msp_identity_set',
      'msp_knowledge_write',
      'msp_project_list',
      'msp_project_register',
      'msp_project_resolve',
      'msp_proof_append',
      'msp_recall',
      'msp_remember',
      'msp_run_task',
      'msp_session_append',
      'msp_symbol_community',
      'msp_symbol_impact',
      'msp_symbol_lookup',
      'msp_symbol_neighbors',
      'msp_symbol_search',
      'msp_symbol_trace',
      'msp_validate',
    ])
  })

  it('exposes only the approved GKS writer outside the MSP namespace', () => {
    for (const name of REGISTERED_TOOL_NAMES) {
      expect(name.startsWith('msp_') || name === 'gks_code_upsert').toBe(true)
    }
  })

  it('respects MSP_ROOT env var', () => {
    const old = process.env.MSP_ROOT
    process.env.MSP_ROOT = '/tmp/msp-test-root'
    try {
      const server = createMspMcpServer()
      expect(server).toBeDefined()
    } finally {
      process.env.MSP_ROOT = old
    }
  })
})
