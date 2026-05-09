import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

import { afterEach, describe, expect, it } from 'vitest'

import { handler, name } from '../../../src/mcp/tools/propose.js'

const tmpRoots: string[] = []
afterEach(async () => {
  for (const dir of tmpRoots.splice(0)) {
    await rm(dir, { recursive: true, force: true })
  }
})

describe('msp_propose tool (deprecated — Phase 2)', () => {
  it('has the right name', () => {
    expect(name).toBe('msp_propose')
  })

  it('writes to candidates/ instead of inbound/ (Phase 2 delegation)', async () => {
    const root = await mkdtemp(join(tmpdir(), 'msp-propose-phase2-'))
    tmpRoots.push(root)

    const result = await handler({ root })({
      id: 'CONCEPT--TEST-PROPOSE-DELEGATES',
      title: 'phase 2 delegation smoke',
      body: 'placeholder',
      phase: 1,
      type: 'concept',
    })
    const payload = JSON.parse(result.content[0]!.text)
    expect(payload.proposed_id).toBe('CONCEPT--TEST-PROPOSE-DELEGATES')
    expect(payload.candidate_path).toBe(
      resolve(root, '.brain/msp/projects/evaAI/candidates/CONCEPT--TEST-PROPOSE-DELEGATES.md'),
    )
    // back-compat alias for clients still reading inbound_path
    expect(payload.inbound_path).toBe(payload.candidate_path)
    expect(payload._deprecation_notice).toMatch(/msp_candidate/)
  })

  it('honours args.root over ctx.root (no wrapper-script lookup needed)', async () => {
    const stranger = await mkdtemp(join(tmpdir(), 'msp-propose-stranger-'))
    const projectRoot = await mkdtemp(join(tmpdir(), 'msp-propose-root-'))
    tmpRoots.push(stranger, projectRoot)

    const result = await handler({ root: stranger })({
      id: 'CONCEPT--TEST-PROPOSE-ARGS-ROOT',
      title: 'args.root override',
      body: 'placeholder',
      phase: 1,
      type: 'concept',
      root: projectRoot,
    })
    const payload = JSON.parse(result.content[0]!.text)
    expect(payload.candidate_path.startsWith(projectRoot)).toBe(true)
    expect(payload.candidate_path.startsWith(stranger)).toBe(false)
  })

  it('rejects malformed proposed_id (validation delegated to CandidateWriter)', async () => {
    const root = await mkdtemp(join(tmpdir(), 'msp-propose-bad-id-'))
    tmpRoots.push(root)
    await expect(
      handler({ root })({
        id: 'concept--lower',
        title: 't',
        body: 'b',
        phase: 1,
        type: 'concept',
      }),
    ).rejects.toThrow(/Invalid proposed_id/)
  })
})
