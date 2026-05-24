import { lock } from 'proper-lockfile'
import { appendFile, readFile, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { SessionLockedError } from './types.js'

/**
 * Utility for determining and acquiring a lock for session files.
 * Provides cross-platform write integrity, specifically for Windows.
 */

export interface LockOptions {
  stale?: number
  update?: number | boolean
  retries?: number
  minTimeout?: number
  onStale?: (err: Error) => void
}

const DEFAULT_LOCK_OPTS: LockOptions = {
  stale: 10000,
  update: false,
  retries: 5,
  minTimeout: 100,
}

function isPidAlive(pid: number): boolean {
  try {
    process.kill(pid, 0)
    return true
  } catch (err: any) {
    return err.code === 'EPERM'
  }
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
    // Ignore errors here
  }

  let releaseFunc: () => Promise<void>
  
  try {
    const lockOpts: any = {
      stale: opts.stale,
      update: opts.update,
      retries: {
        retries: opts.retries,
        minTimeout: opts.minTimeout,
      },
    };
    if (opts.onStale) {
      lockOpts.onStale = opts.onStale;
    } else {
      lockOpts.onStale = (err: any) => {
        console.warn(`[lock] Stale lock detected for ${filePath}: ${(err as Error).message}`)
      };
    }
    releaseFunc = await lock(filePath, lockOpts);
  } catch (err: any) {
    if (err.code === 'ELOCKED') {
      let holderPid = 0
      const lockPath = `${filePath}.lock`
      try {
        const metaText = await readFile(join(lockPath, 'lock.json'), 'utf8')
        const meta = JSON.parse(metaText)
        if (meta && typeof meta.pid === 'number') {
          holderPid = meta.pid
        }
      } catch {
        try {
          const rawText = await readFile(lockPath, 'utf8')
          const parsedPid = parseInt(rawText.trim(), 10)
          if (Number.isFinite(parsedPid)) {
            holderPid = parsedPid
          }
        } catch {
          // Ignore
        }
      }

      // If the holder PID is dead, manually clean up the lock and retry!
      if (holderPid > 0 && !isPidAlive(holderPid)) {
        try {
          await rm(lockPath, { recursive: true, force: true })
          return await lockSession(filePath, opts)
        } catch {
          // Ignore removal error and throw SessionLockedError
        }
      }

      throw new SessionLockedError(holderPid, lockPath)
    }
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

