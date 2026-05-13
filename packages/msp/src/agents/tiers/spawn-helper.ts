import { spawn } from 'node:child_process'
import { sep } from 'node:path'
import type { RunOpts, RunResult } from './types.js'

/**
 * On Windows, bare binary names like `qwen` need a shell to resolve the
 * `.cmd` / `.exe` / `.bat` extension via PATHEXT. But `shell: true` mangles
 * quoted arguments (see Node DEP0190). So we only enable shell mode for bare
 * names; absolute paths and names with extensions go through the safe direct
 * spawn (no arg quoting issues).
 */
function needsShellOnWindows(bin: string): boolean {
  if (process.platform !== 'win32') return false
  // Already an absolute or relative path → spawn directly.
  if (bin.includes('/') || bin.includes(sep)) return false
  // Already has an extension → spawn directly (Node can resolve via PATH).
  if (/\.[a-z0-9]+$/i.test(bin)) return false
  return true
}

/**
 * Spawn an external CLI binary, capture stdout/stderr, and enforce a timeout.
 *
 * Cross-platform:
 *  - On Windows for bare binary names (no path / no extension), uses
 *    `shell: true` so `.cmd` shims resolve via PATHEXT.
 *  - On POSIX (and Windows with explicit paths/extensions), uses `shell: false`.
 *
 * Defensive behavior:
 *  - On ENOENT (binary missing) → returns `{ ok:false, exit_code:-1 }`. No throw.
 *    Note: on Windows with `shell: true`, cmd.exe surfaces "not recognized" as
 *    exit code 1 rather than firing an `error` event, so missing-CLI returns
 *    `{ ok:false, exit_code:1 }` in that path. Callers should treat any non-zero
 *    `exit_code` as failure.
 *  - On timeout → kills the child and returns `{ ok:false, exit_code:-1, output:'timeout' }`.
 *  - `stderr` is included on the result iff `opts.capture_stderr === true`.
 */
export async function runCli(
  bin: string,
  args: readonly string[],
  opts: RunOpts,
): Promise<RunResult> {
  return new Promise<RunResult>((resolve) => {
    const useShell = needsShellOnWindows(bin)
    const child = spawn(bin, args, {
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: useShell,
      windowsHide: true,
    })

    let stdout = ''
    let stderr = ''
    let settled = false
    let timedOut = false

    const settle = (result: RunResult): void => {
      if (settled) return
      settled = true
      if (timer) clearTimeout(timer)
      resolve(result)
    }

    const timer = setTimeout(() => {
      timedOut = true
      try {
        child.kill('SIGKILL')
      } catch {
        // Best effort — child may have already exited.
      }
      settle({
        ok: false,
        output: 'timeout',
        stderr: opts.capture_stderr ? stderr : undefined,
        exit_code: -1,
      })
    }, opts.timeout_ms)

    child.stdout?.on('data', (chunk: Buffer | string) => {
      stdout += typeof chunk === 'string' ? chunk : chunk.toString('utf8')
    })

    child.stderr?.on('data', (chunk: Buffer | string) => {
      stderr += typeof chunk === 'string' ? chunk : chunk.toString('utf8')
    })

    child.on('error', () => {
      // ENOENT (binary not installed) or other spawn failure. Only fires when
      // `shell: false`; with `shell: true` on Windows, cmd.exe reports failure
      // via exit code 1 instead.
      settle({
        ok: false,
        output: '',
        stderr: opts.capture_stderr ? stderr : undefined,
        exit_code: -1,
      })
    })

    child.on('close', (code: number | null) => {
      if (timedOut) return // settle() already called in timer handler
      const exitCode = typeof code === 'number' ? code : -1
      settle({
        ok: exitCode === 0,
        output: stdout,
        stderr: opts.capture_stderr ? stderr : undefined,
        exit_code: exitCode,
      })
    })
  })
}
