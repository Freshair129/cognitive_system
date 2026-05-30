import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtemp, rm, unlink } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { createGenesisGraphBackend } from '../../src/memory/graph/genesis-graph.js'

describe('GenesisDB HNSW Durability (WAL Replay)', () => {
  let dir = ''
  
  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'gks-durability-test-'))
    process.env.GKS_FORCE_NATIVE_TEST = 'true'
  })
  
  afterEach(async () => {
    await rm(dir, { recursive: true, force: true })
    delete process.env.GKS_FORCE_NATIVE_TEST
  })

  it('reconstructs HNSW index from JSONL when .bin is missing', async () => {
    // 1. Setup and add data
    {
      const backend = createGenesisGraphBackend({ path: dir })
      await backend.load()
      await backend.addNode({
        id: 'NODE--WAL',
        labels: ['Concept'],
        props: { embedding: [0.1, 0.2, 0.3, 0.4] }
      })
      // Force compaction to ensure it's in the compacted JSONL too
      await backend.compact()
    }

    // 2. Simulate catastrophic failure: Delete the binary snapshot
    const binPath = join(dir, 'genesis-graph.bin')
    await unlink(binPath)
    console.log('Simulated failure: Deleted binary snapshot at', binPath)

    // 3. Reopen: This should trigger JSONL replay
    {
      const backend = createGenesisGraphBackend({ path: dir })
      await backend.load()

      // 4. Verify semantic search still works
      const results = await backend.hybridSearch({
        queryVector: [0.1, 0.2, 0.3, 0.4],
        k: 1,
        alpha: 0.0
      })

      expect(results).toHaveLength(1)
      expect(results[0].node.id).toBe('NODE--WAL')
      console.log('✓ Successfully reconstructed HNSW from WAL replay.')
    }
  })
})
