/**
 * The shadow log records decisions, not content.
 *
 * `logShadowDecision` serialises the whole `Resource`, and the PDP needs
 * `attributes.body` to run the PII and secret regexes against. Writing that
 * body out verbatim would turn the audit log into a plaintext copy of exactly
 * the material the deny rules refused to expose — written unconditionally, on
 * every decision, including the ones that denied.
 */
import { mkdtemp, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { logShadowDecision } from '../../src/policy/shadow-log.js'
import { makeContext, makeDecision, makeResource, makeSubject } from '../../src/policy/types.js'

const SECRET = 'SSN 123-45-6789 and key sk-abcdef0123456789abcdef0123456789abcdef01'

async function logOnce(attributes: Record<string, any>): Promise<any> {
  const dir = await mkdtemp(join(tmpdir(), 'msp-shadow-log-'))
  const path = join(dir, 'policy-decisions.jsonl')
  await logShadowDecision(
    {
      trace_id: 't1',
      subject: makeSubject('user', 'u1'),
      resource: makeResource('atom', 'A', {}, attributes),
      action: 'expose-to-llm',
      context: makeContext('internal', 't1'),
      decision: makeDecision('deny', 'denied for test'),
      policy_version: 1,
    },
    path,
  )
  return JSON.parse((await readFile(path, 'utf8')).trim())
}

describe('shadow log redaction', () => {
  it('never writes the matched body to disk', async () => {
    const entry = await logOnce({ body: SECRET, classification: 'restricted' })

    expect(JSON.stringify(entry)).not.toContain('123-45-6789')
    expect(JSON.stringify(entry)).not.toContain('sk-abcdef')
    expect(entry.resource.attributes.body).toBeUndefined()
  })

  it('keeps the length so an entry can still be correlated with a hit', async () => {
    const entry = await logOnce({ body: SECRET })

    expect(entry.resource.attributes.body_length).toBe(SECRET.length)
  })

  it('leaves every other attribute intact', async () => {
    const entry = await logOnce({ body: SECRET, classification: 'restricted', has_secret: true })

    expect(entry.resource.attributes.classification).toBe('restricted')
    expect(entry.resource.attributes.has_secret).toBe(true)
  })

  it('passes through a resource that carries no body', async () => {
    const entry = await logOnce({ classification: 'public' })

    expect(entry.resource.attributes).toEqual({ classification: 'public' })
  })
})
