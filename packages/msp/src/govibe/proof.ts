import { randomUUID } from 'node:crypto'
import { promises as fs } from 'node:fs'
import path from 'node:path'

import { lock } from 'proper-lockfile'
import { canonicalJson, sha256 } from './canonical.js'
import { assertSafeId, isInside, resolveWorkspaceRoot } from './paths.js'

const FORBIDDEN = ['symbols', 'nodes', 'edges', 'communities', 'processes', 'provenance_ref'] as const
const ALLOWED = new Set([
  'record_id', 'run_id', 'provenance', 'evidence', 'verification', 'actor',
  'timestamp', 'source_hash', 'knowledge_ref',
  'govibe_batch',
])

export type ProofInput = {
  record_id: string
  run_id: string
  provenance: { type: string; source_ref: string }
  evidence: Array<{ ref: string; source_hash?: string }>
  verification: { verdict: 'pass' | 'fail' | 'inconclusive'; method?: string }
  actor: string
  timestamp: string
  source_hash: string
  knowledge_ref?: string
  govibe_batch?: Record<string, unknown>
} & Record<string, unknown>

export async function appendProof(args: {
  serverRoot: string
  workspaceRoot?: string
  record: ProofInput
}): Promise<{ proof_ref: string; record_hash: string; idempotent: boolean }> {
  const workspace = await resolveWorkspaceRoot(args.serverRoot, args.workspaceRoot)
  assertSafeId(args.record.record_id)
  assertSafeId(args.record.run_id, 'run_id')
  for (const field of FORBIDDEN) {
    if (field in args.record) throw new Error(`MSP proof payload cannot contain GKS-owned field: ${field}`)
  }
  for (const field of Object.keys(args.record)) {
    if (!ALLOWED.has(field)) throw new Error(`unknown proof field: ${field}`)
  }
  if (!args.record.actor?.trim()) throw new Error('actor is required')
  if (!args.record.provenance?.type || !args.record.provenance?.source_ref) {
    throw new Error('provenance type and source_ref are required')
  }
  if (!Array.isArray(args.record.evidence)) throw new Error('evidence must be an array')
  if (!['pass', 'fail', 'inconclusive'].includes(args.record.verification?.verdict)) {
    throw new Error('verification verdict must be pass, fail, or inconclusive')
  }
  if (!/^[a-f0-9]{64}$/i.test(args.record.source_hash)) throw new Error('source_hash must be SHA-256')
  const instant = new Date(args.record.timestamp)
  if (Number.isNaN(instant.valueOf())) throw new Error('timestamp must be ISO-8601')

  const directory = path.join(workspace, '.brain', 'msp', 'proof')
  await fs.mkdir(directory, { recursive: true })
  const realDirectory = await fs.realpath(directory)
  const realWorkspace = await fs.realpath(workspace)
  if (!isInside(realWorkspace, realDirectory)) throw new Error('proof directory resolves outside workspace')

  const day = instant.toISOString().slice(0, 10)
  const payload = { schema: 'msp-proof/v1', ...args.record }
  const body = canonicalJson(payload)
  const recordHash = sha256(body)
  const prefix = `${day}--${args.record.record_id}--`
  const filename = `${prefix}${recordHash}.json`
  const target = path.join(realDirectory, filename)
  const release = await lock(realDirectory, {
    realpath: true,
    stale: 10_000,
    update: 5_000,
    retries: { retries: 5, minTimeout: 100 },
  })
  try {
    const existing = (await fs.readdir(realDirectory)).filter((entry) => entry.startsWith(prefix))
    if (existing.length > 0) {
      if (existing.length === 1 && existing[0] === filename) {
        const stat = await fs.lstat(target)
        if (!stat.isFile() || stat.isSymbolicLink()) throw new Error('proof target must be a regular file')
        const stored = await fs.readFile(target)
        if (sha256(stored) !== recordHash) throw new Error(`proof record content hash mismatch: ${args.record.record_id}`)
        return { proof_ref: `msp:proof/${filename}`, record_hash: recordHash, idempotent: true }
      }
      throw new Error(`proof record already exists with a different hash: ${args.record.record_id}`)
    }

    const temporary = path.join(realDirectory, `.${filename}.${randomUUID()}.tmp`)
    await fs.writeFile(temporary, body, { flag: 'wx', mode: 0o600 })
    try {
      await fs.link(temporary, target)
    } finally {
      await fs.unlink(temporary).catch(() => undefined)
    }
    return { proof_ref: `msp:proof/${filename}`, record_hash: recordHash, idempotent: false }
  } finally {
    await release()
  }
}
