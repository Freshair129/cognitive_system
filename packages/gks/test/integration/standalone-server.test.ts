import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { spawn, ChildProcess } from 'node:child_process'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { existsSync } from 'node:fs'

// `genesis-db-server` is an OPTIONAL native binary. The napi crate's bin targets
// are gated out of the default `napi build` (they can't link napi as standalone
// executables on Linux), so this binary only exists where it was explicitly built
// (typically Windows local dev). Locate it across platforms + hoist locations;
// skip the suite when it isn't present rather than failing the whole run.
function findServerBinary(): string | null {
  const exe = process.platform === 'win32' ? '.exe' : ''
  const rel = `node_modules/@freshair129/gks-genesis-block-native/target/release/genesis-db-server${exe}`
  const candidates = [resolve(process.cwd(), rel), resolve(process.cwd(), '../..', rel)]
  return candidates.find((p) => existsSync(p)) ?? null
}
const serverBinary = findServerBinary()

describe.skipIf(!serverBinary)('GenesisDB Standalone Server Integration', () => {
  let serverProcess: ChildProcess | null = null
  let tempDir = ''
  const port = 3007
  const baseUrl = `http://localhost:${port}`

  beforeAll(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'genesis-server-test-'))
    const binaryPath = serverBinary!
    console.log(`[TEST] Spawning server at ${binaryPath}`)
    serverProcess = spawn(binaryPath, [], {
      env: {
        ...process.env,
        GENESIS_PORT: port.toString(),
        GENESIS_DATA_DIR: tempDir,
        RUST_LOG: 'info'
      },
      stdio: 'inherit'
    })

    // Poll /v1/status until ready
    let ready = false
    for (let i = 0; i < 60; i++) { // Increase to 30s total
      try {
        const res = await fetch(`${baseUrl}/v1/status`)
        if (res.ok) {
          ready = true
          break
        }
      } catch (e) {
        // server not up yet
      }
      await new Promise(r => setTimeout(r, 500))
    }
    
    if (!ready) throw new Error('Server failed to start in time')
  }, 60000) // 60s timeout

  afterAll(async () => {
    if (serverProcess) {
      serverProcess.kill()
    }
    await rm(tempDir, { recursive: true, force: true })
  })

  it('performs end-to-end hybrid search over the network', async () => {
    const addRes = await fetch(`${baseUrl}/v1/node/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: 'NODE--REMOTE',
        labels: ['Standalone'],
        props: { status: 'stable' },
        embedding: [0.5, 0.5, 0.5, 0.5]
      })
    })
    
    expect(addRes.ok).toBe(true)
    const node = await addRes.json()
    expect(node.id).toBe('NODE--REMOTE')

    const searchRes = await fetch(`${baseUrl}/v1/search/hybrid`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query_vector: [0.5, 0.5, 0.5, 0.5],
        k: 1,
        alpha: 0.0
      })
    })

    expect(searchRes.ok).toBe(true)
    const results = await searchRes.json()
    expect(results).toHaveLength(1)
    expect(results[0].node.id).toBe('NODE--REMOTE')
  })
})
