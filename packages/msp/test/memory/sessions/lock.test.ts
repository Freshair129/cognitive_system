import { mkdtemp, readFile, utimes, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { lockSession } from '../../../src/memory/sessions/lock.js'

async function freshLockPath(): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), 'msp-lock-'))
  // proper-lockfile creates a .lock directory by default, 
  // but our utility expects a file path to lock against.
  const filePath = join(dir, 'session.jsonl')
  await writeFile(filePath, '')
  return filePath
}

describe('lockSession', () => {
  it('acquires and releases a lock', async () => {
    const path = await freshLockPath()
    const release = await lockSession(path)
    expect(typeof release).toBe('function')
    
    // Attempting to lock again should fail
    await expect(lockSession(path, { retries: 0 })).rejects.toThrow()
    
    await release()
    
    // Should be able to lock again after release
    const release2 = await lockSession(path)
    await release2()
  })

  it('handles stale locks automatically', async () => {
    const path = await freshLockPath()
    
    // Acquire a lock with a stale threshold of 2 seconds
    const release = await lockSession(path, { stale: 2000 })
    
    // Shift mtime of lock path 3 seconds in the past to force staleness
    const lockPath = `${path}.lock`
    const past = new Date(Date.now() - 3000)
    await utimes(lockPath, past, past)
    
    // Should be able to acquire again even without explicit release
    const release2 = await lockSession(path, { stale: 2000 })
    expect(typeof release2).toBe('function')
    
    await release2()
    // Explicitly release the first one (might fail if already taken over, but the utility handles it)
    await release().catch(() => {}) 
  })
})
