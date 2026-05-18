import { lock, unlock, check } from 'proper-lockfile'
import { appendFile } from 'node:fs/promises'

/**
 * Utility for determining and acquiring a lock for session files.
 * Provides cross-platform write integrity, specifically for Windows.
 */

export interface LockOptions {
  stale?: number
  retries?: number
  minTimeout?: number
}

const DEFAULT_LOCK_OPTS: LockOptions = {
  stale: 10000,
  retries: 5,
  minTimeout: 100,
}

/**
 * Acquires a lock for the specified file and returns a release function.
 */
export async function lockSession(
  filePath: string,
  opts: LockOptions = DEFAULT_LOCK_OPTS,
): Promise<() => Promise<void>> {
  // proper-lockfile requires the file to exist
  try {
    await appendFile(filePath, '', 'utf8')
  } catch (err) {
    // Ignore errors here, as the actual locking logic will handle missing files if they are critical
  }

  let releaseFunc: () => Promise<void>
  
  try {
    releaseFunc = await lock(filePath, {
      stale: opts.stale,
      retries: {
        retries: opts.retries,
        minTimeout: opts.minTimeout,
      },
      onStale: (err) => {
        console.warn(`[lock] Stale lock detected for ${filePath}: ${(err as Error).message}`)
      }
    })
  } catch (err) {
    throw new Error(`Failed to acquire session lock for ${filePath}: ${(err as Error).message}`)
  }

  return async () => {
    try {
      await releaseFunc()
    } catch (err) {
      console.error(`[lock] Failed to release lock for ${filePath}: ${(err as Error).message}`)
    }
  }
}
