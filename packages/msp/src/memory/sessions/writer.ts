import { appendFile, mkdir } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'

import { lockSession } from './lock.js'
import { serialiseTurn, validateTurn } from './schema.js'
import type { OpenOpts, Session, SessionTurn } from './types.js'

const DEFAULT_NAMESPACE = 'evaAI'

function sessionFilePath(root: string, namespace: string, episodicId: string): string {
  return resolve(
    root,
    '.brain/msp/projects',
    namespace,
    'sessions',
    `${episodicId}.jsonl`,
  )
}

/**
 * Opens a session for appending turns. 
 * Provides cross-process integrity using file locks.
 */
export async function openSession(opts: OpenOpts): Promise<Session> {
  const namespace = opts.namespace ?? DEFAULT_NAMESPACE
  const path = sessionFilePath(opts.root, namespace, opts.episodicId)
  await mkdir(dirname(path), { recursive: true })

  // Ensure file exists so proper-lockfile can lock it
  await appendFile(path, '', 'utf8')

  let disposed = false

  return {
    async appendTurn(row: SessionTurn) {
      if (disposed) throw new Error('session closed; cannot appendTurn')
      
      const release = await lockSession(path)
      try {
        const validated = validateTurn(row)
        const line = serialiseTurn(validated)
        await appendFile(path, line + '\n', 'utf8')
      } finally {
        await release()
      }
    },
    async close() {
      disposed = true
    },
  }
}
