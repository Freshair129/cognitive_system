import { appendFile, mkdir } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import {
  type Action,
  type Decision,
  type RequestContext,
  type Resource,
  type Subject,
} from './types.js'

export interface ShadowLogEntry {
  t: string
  trace_id: string
  subject: Subject
  resource: Resource
  action: Action
  context: RequestContext
  decision: Decision
  policy_version: number
}

/**
 * Strip the resource's content before it is written to disk.
 *
 * `attributes.body` carries the text the PDP matched against — the atom
 * snippet, or its full rendered body on the cognitive path. Logging it
 * verbatim would make this file a plaintext copy of exactly the PII and
 * credentials the deny rules just refused to expose, written unconditionally
 * on every decision. The log's job is which rule decided what about which
 * resource; the content itself is not part of that.
 *
 * `body_length` is kept so an entry can still be correlated with a hit.
 */
function redactBody(resource: Resource): Resource {
  const { body, ...rest } = resource.attributes
  if (body === undefined) return resource
  return {
    ...resource,
    attributes: {
      ...rest,
      body_length: typeof body === 'string' ? body.length : 0,
    },
  }
}

/**
 * Append an entry to the shadow policy log.
 */
export async function logShadowDecision(
  entry: Omit<ShadowLogEntry, 't'>,
  logPath: string,
): Promise<void> {
  const fullEntry: ShadowLogEntry = {
    t: new Date().toISOString(),
    ...entry,
    resource: redactBody(entry.resource),
  }

  try {
    await mkdir(dirname(logPath), { recursive: true })
    await appendFile(logPath, JSON.stringify(fullEntry) + '\n', 'utf8')
  } catch (err) {
    console.error(`[policy] failed to write shadow log: ${(err as Error).message}`)
  }
}
