import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { spawn, ChildProcess } from 'node:child_process'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

describe('GenesisDB Standalone Server Integration', () => {
  let serverProcess: ChildProcess | null = null
  let tempDir = ''
  const port = 3006
  const baseUrl = `http://localhost:${port}`

  beforeAll(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'genesis-server-test-'))
    
    // Correctly resolve binary path from workspace root
    const binaryPath = resolve(process.cwd(), '../../packages/gks/native/genesis-block/target/release/genesis-db-server.exe')
    
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
    for (let i = 0; i < 40; i++) {
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
    // 1. Add a node
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

    // 2. Search for it
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
    expect(results[0].node.labels).toContain('Standalone')
  })
})
