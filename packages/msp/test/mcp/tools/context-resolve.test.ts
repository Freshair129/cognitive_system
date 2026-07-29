import { promises as fs } from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { globalRoot } from '../../../src/brain/global-vault.js'
import { handler } from '../../../src/mcp/tools/context-resolve.js'

describe('msp_context_resolve tool', () => {
  let root: string
  let profile: string
  let oldProfile: string | undefined
  let oldXdg: string | undefined

  beforeEach(async () => {
    root = await fs.mkdtemp(path.join(os.tmpdir(), 'msp-context-workspace-'))
    profile = await fs.mkdtemp(path.join(os.tmpdir(), 'msp-context-profile-'))
    oldProfile = process.env.USERPROFILE
    oldXdg = process.env.XDG_DATA_HOME
    process.env.USERPROFILE = profile
    process.env.XDG_DATA_HOME = profile
    await fs.mkdir(path.join(root, 'gks'), { recursive: true })
  })

  afterEach(async () => {
    if (oldProfile === undefined) delete process.env.USERPROFILE
    else process.env.USERPROFILE = oldProfile
    if (oldXdg === undefined) delete process.env.XDG_DATA_HOME
    else process.env.XDG_DATA_HOME = oldXdg
    await fs.rm(root, { recursive: true, force: true })
    await fs.rm(profile, { recursive: true, force: true })
  })

  async function writeJson(target: string, value: unknown): Promise<void> {
    await fs.mkdir(path.dirname(target), { recursive: true })
    await fs.writeFile(target, JSON.stringify(value))
  }

  it('merges global and workspace references with authority and project precedence', async () => {
    const globalState = path.join(globalRoot(), 'state')
    await writeJson(path.join(globalState, 'security.json'), { key: 'policy', scope: 'security' })
    await writeJson(path.join(globalState, 'project.json'), { key: 'project', scope: 'project' })
    await writeJson(path.join(root, '.brain', 'state', 'security.json'), { key: 'policy', scope: 'project' })
    await writeJson(path.join(root, '.brain', 'state', 'project.json'), { key: 'project', scope: 'project' })

    const result = await handler({ root })({ mode: 'covibe' })
    const parsed = JSON.parse(result.content[0]!.text)

    expect(result.isError).toBeUndefined()
    expect(parsed.global_state_refs.map((ref: { key: string }) => ref.key)).toEqual(['policy'])
    expect(parsed.workspace_state_refs.map((ref: { key: string }) => ref.key)).toEqual(['project'])
    expect(parsed.policy_decisions).toEqual(expect.arrayContaining([
      expect.objectContaining({ decision: 'shadow', reason: 'workspace_project_precedence' }),
      expect.objectContaining({ decision: 'deny', reason: 'workspace_cannot_override_global_authority' }),
    ]))
  })

  it('denies unpromoted global private memory in CoDev mode', async () => {
    const globalState = path.join(globalRoot(), 'state')
    await writeJson(path.join(globalState, 'private.json'), {
      key: 'private-memory', scope: 'session', privacy: 'private', promoted: false, redacted: false,
    })

    const result = await handler({ root })({ mode: 'codev' })
    const parsed = JSON.parse(result.content[0]!.text)

    expect(parsed.global_state_refs).toEqual([])
    expect(parsed.policy_decisions).toContainEqual(expect.objectContaining({
      decision: 'deny', reason: 'global_private_memory',
    }))
  })

  it('does not let an unattested caller select CoVibe to expose private memory', async () => {
    const globalState = path.join(globalRoot(), 'state')
    await writeJson(path.join(globalState, 'private.json'), {
      key: 'private-memory', scope: 'session', privacy: 'private', promoted: false, redacted: false,
    })
    const result = await handler({ root })({ mode: 'covibe' })
    const parsed = JSON.parse(result.content[0]!.text)
    expect(parsed.effective_mode).toBe('codev')
    expect(parsed.global_state_refs).toEqual([])
    expect(parsed.policy_decisions).toContainEqual(expect.objectContaining({
      reason: 'covibe_mode_not_attested_by_subject',
    }))
  })

  it('returns hashes for valid GKS references and rejects traversal', async () => {
    await fs.writeFile(path.join(root, 'gks', 'knowledge.json'), '{"ok":true}\n')
    const valid = await handler({ root })({ mode: 'covibe', knowledge_refs: ['knowledge.json'] })
    const parsed = JSON.parse(valid.content[0]!.text)
    expect(parsed.knowledge_refs[0]).toMatchObject({ ref: 'gks:knowledge.json' })
    expect(parsed.knowledge_refs[0].source_hash).toMatch(/^[a-f0-9]{64}$/)

    const invalid = await handler({ root })({ mode: 'covibe', knowledge_refs: ['../secret.json'] })
    expect(invalid.isError).toBe(true)
    expect(invalid.content[0]!.text).toMatch(/escapes workspace GKS/)
  })

  it('ignores state records with unknown scopes instead of treating them as project state', async () => {
    await writeJson(path.join(root, '.brain', 'state', 'invalid.json'), {
      key: 'policy', scope: 'Security',
    })
    const result = await handler({ root })({ mode: 'covibe' })
    const parsed = JSON.parse(result.content[0]!.text)
    expect(parsed.workspace_state_refs).toEqual([])
    expect(parsed.diagnostics).toEqual(expect.arrayContaining([
      expect.stringMatching(/invalid scope/),
    ]))
  })

  it('does not let non-project workspace state shadow a Global project record', async () => {
    await writeJson(path.join(globalRoot(), 'state', 'project.json'), {
      key: 'project', scope: 'project',
    })
    await writeJson(path.join(root, '.brain', 'state', 'session.json'), {
      key: 'project', scope: 'session',
    })
    const result = await handler({ root })({ mode: 'codev' })
    const parsed = JSON.parse(result.content[0]!.text)
    expect(parsed.global_state_refs.map((ref: { key: string }) => ref.key)).toEqual(['project'])
    expect(parsed.workspace_state_refs).toEqual([])
  })

  it('distinguishes missing state roots from existing empty roots', async () => {
    const missing = await handler({ root })({ mode: 'codev' })
    const missingParsed = JSON.parse(missing.content[0]!.text)
    expect(missingParsed.diagnostics).toEqual(expect.arrayContaining([
      expect.stringMatching(/global state root is missing/),
      expect.stringMatching(/workspace state root is missing/),
    ]))

    await fs.mkdir(path.join(globalRoot(), 'state'), { recursive: true })
    await fs.mkdir(path.join(root, '.brain', 'state'), { recursive: true })
    const empty = await handler({ root })({ mode: 'codev' })
    expect(JSON.parse(empty.content[0]!.text).diagnostics).toEqual([])
  })
})
