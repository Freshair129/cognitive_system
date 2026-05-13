import { describe, expect, it } from 'vitest'
import { runCli } from '../../../src/agents/tiers/spawn-helper.js'

const NODE = process.execPath
const DEFAULT_TIMEOUT = 5000

describe('runCli (spawn-helper)', () => {
  it('returns ok:true and exit_code 0 when the child succeeds', async () => {
    const result = await runCli(NODE, ['-e', 'process.exit(0)'], {
      timeout_ms: DEFAULT_TIMEOUT,
      capture_stderr: true,
    })
    expect(result.ok).toBe(true)
    expect(result.exit_code).toBe(0)
  })

  it('returns ok:false and exit_code 1 when the child exits non-zero', async () => {
    const result = await runCli(NODE, ['-e', 'process.exit(1)'], {
      timeout_ms: DEFAULT_TIMEOUT,
      capture_stderr: true,
    })
    expect(result.ok).toBe(false)
    expect(result.exit_code).toBe(1)
  })

  it('captures stdout into output', async () => {
    const result = await runCli(
      NODE,
      ['-e', 'process.stdout.write("hello-stdout")'],
      { timeout_ms: DEFAULT_TIMEOUT, capture_stderr: true },
    )
    expect(result.ok).toBe(true)
    expect(result.output).toContain('hello-stdout')
  })

  it('captures stderr when capture_stderr is true', async () => {
    const result = await runCli(
      NODE,
      ['-e', 'process.stderr.write("hello-stderr")'],
      { timeout_ms: DEFAULT_TIMEOUT, capture_stderr: true },
    )
    expect(result.ok).toBe(true)
    expect(result.stderr).toContain('hello-stderr')
  })

  it('omits stderr (undefined) when capture_stderr is false', async () => {
    const result = await runCli(
      NODE,
      ['-e', 'process.stderr.write("hello-stderr")'],
      { timeout_ms: DEFAULT_TIMEOUT, capture_stderr: false },
    )
    expect(result.ok).toBe(true)
    expect(result.stderr).toBeUndefined()
  })

  it('returns ok:false for a nonexistent binary (no throw)', async () => {
    const result = await runCli(
      '__definitely_not_a_real_binary_xyz__',
      ['--version'],
      { timeout_ms: DEFAULT_TIMEOUT, capture_stderr: true },
    )
    // POSIX (and Windows with `shell: false`) raises ENOENT → exit_code -1.
    // Windows with `shell: true` runs cmd.exe which reports "not recognized"
    // via a non-zero exit code (typically 1 or 9009). Both must yield ok:false.
    expect(result.ok).toBe(false)
    expect(result.exit_code).not.toBe(0)
  })

  it('kills a long-running child once the timeout elapses', async () => {
    const start = Date.now()
    const result = await runCli(
      NODE,
      ['-e', 'setTimeout(()=>{},10000)'],
      { timeout_ms: 200, capture_stderr: true },
    )
    const elapsed = Date.now() - start
    expect(result.ok).toBe(false)
    expect(result.exit_code).toBe(-1)
    expect(result.output).toBe('timeout')
    // Generous bound for CI; kill must happen well under 10s child sleep.
    expect(elapsed).toBeLessThan(2000)
  })
})
