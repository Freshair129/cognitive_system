import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type {
  ExecuteOptions,
  ExecuteResult,
} from '../../src/genesis/types.js'

const mocks = vi.hoisted(() => ({
  executeBlockMock: vi.fn(),
}))

vi.mock('../../src/genesis/executor.js', () => ({
  executeBlock: (blockId: string, opts: ExecuteOptions) =>
    mocks.executeBlockMock(blockId, opts),
}))

import { main } from '../../src/genesis/cli.js'

interface Streams {
  stdout: string
  stderr: string
}

function captureIO(argv: string[]): { streams: Streams; restore: () => void } {
  const streams: Streams = { stdout: '', stderr: '' }
  const origArgv = process.argv
  const origStdoutWrite = process.stdout.write.bind(process.stdout)
  const origStderrWrite = process.stderr.write.bind(process.stderr)

  process.argv = ['node', '/fake/cli.js', ...argv]
  process.stdout.write = ((chunk: string | Uint8Array) => {
    streams.stdout +=
      typeof chunk === 'string' ? chunk : Buffer.from(chunk).toString('utf8')
    return true
  }) as typeof process.stdout.write
  process.stderr.write = ((chunk: string | Uint8Array) => {
    streams.stderr +=
      typeof chunk === 'string' ? chunk : Buffer.from(chunk).toString('utf8')
    return true
  }) as typeof process.stderr.write

  return {
    streams,
    restore: () => {
      process.argv = origArgv
      process.stdout.write = origStdoutWrite
      process.stderr.write = origStderrWrite
    },
  }
}

function okResult(overrides: Partial<ExecuteResult> = {}): ExecuteResult {
  return {
    block_id: 'FOO',
    output: 'mock-output',
    members_loaded: 3,
    tier_used: 'T2',
    duration_ms: 12,
    ...overrides,
  }
}

let captured: { streams: Streams; restore: () => void } | undefined

beforeEach(() => {
  mocks.executeBlockMock.mockReset()
})

afterEach(() => {
  captured?.restore()
  captured = undefined
})

describe('msp-genesis-exec CLI', () => {
  it('--help prints usage and returns 0', async () => {
    captured = captureIO(['--help'])
    const code = await main()
    expect(code).toBe(0)
    expect(captured.streams.stdout).toMatch(/msp-genesis-exec/)
    expect(captured.streams.stdout).toMatch(/Usage:/)
    expect(mocks.executeBlockMock).not.toHaveBeenCalled()
  })

  it('returns 2 when no blockId is given', async () => {
    captured = captureIO([])
    const code = await main()
    expect(code).toBe(2)
    expect(captured.streams.stderr).toMatch(/no blockId given/)
    expect(mocks.executeBlockMock).not.toHaveBeenCalled()
  })

  it('returns 2 when --prompt is missing', async () => {
    captured = captureIO(['FOO'])
    const code = await main()
    expect(code).toBe(2)
    expect(captured.streams.stderr).toMatch(/--prompt is required/)
    expect(mocks.executeBlockMock).not.toHaveBeenCalled()
  })

  it('returns 2 when --tier is invalid', async () => {
    captured = captureIO(['FOO', '--prompt=hello', '--tier=T4'])
    const code = await main()
    expect(code).toBe(2)
    expect(captured.streams.stderr).toMatch(/--tier must be one of/)
    expect(mocks.executeBlockMock).not.toHaveBeenCalled()
  })

  it('happy path: calls executeBlock and prints output', async () => {
    mocks.executeBlockMock.mockResolvedValueOnce(
      okResult({ output: 'hello world', tier_used: 'T2' }),
    )
    captured = captureIO(['IDENTITY-ENGINE', '--prompt=do the thing'])
    const code = await main()
    expect(code).toBe(0)
    expect(mocks.executeBlockMock).toHaveBeenCalledOnce()
    const [blockId, opts] = mocks.executeBlockMock.mock.calls[0]! as [
      string,
      ExecuteOptions,
    ]
    expect(blockId).toBe('IDENTITY-ENGINE')
    expect(opts.prompt).toBe('do the thing')
    expect(typeof opts.root).toBe('string')
    expect(captured.streams.stdout).toMatch(/hello world/)
    expect(captured.streams.stderr).toMatch(/block=FOO tier=T2 members=3/)
  })

  it('forwards --tier to executeBlock as opts.tier', async () => {
    mocks.executeBlockMock.mockResolvedValueOnce(
      okResult({ tier_used: 'T1' }),
    )
    captured = captureIO(['FOO', '--prompt=p', '--tier=T1'])
    const code = await main()
    expect(code).toBe(0)
    const [, opts] = mocks.executeBlockMock.mock.calls[0]! as [
      string,
      ExecuteOptions,
    ]
    expect(opts.tier).toBe('T1')
  })

  it('--json emits a valid ExecuteResult JSON document', async () => {
    mocks.executeBlockMock.mockResolvedValueOnce(
      okResult({ output: 'x', tier_used: 'T2' }),
    )
    captured = captureIO(['FOO', '--prompt=p', '--json'])
    const code = await main()
    expect(code).toBe(0)
    const parsed = JSON.parse(captured.streams.stdout) as ExecuteResult
    expect(parsed.block_id).toBe('FOO')
    expect(parsed.output).toBe('x')
    expect(parsed.tier_used).toBe('T2')
    expect(parsed.members_loaded).toBe(3)
  })

  it('returns 1 when executeBlock throws', async () => {
    mocks.executeBlockMock.mockRejectedValueOnce(new Error('manifest missing'))
    captured = captureIO(['FOO', '--prompt=p'])
    const code = await main()
    expect(code).toBe(1)
    expect(captured.streams.stderr).toMatch(/genesis-exec error/)
    expect(captured.streams.stderr).toMatch(/manifest missing/)
  })

  it('uses --root when provided', async () => {
    mocks.executeBlockMock.mockResolvedValueOnce(okResult())
    captured = captureIO(['FOO', '--prompt=p', '--root=/tmp/specific'])
    const code = await main()
    expect(code).toBe(0)
    const [, opts] = mocks.executeBlockMock.mock.calls[0]! as [
      string,
      ExecuteOptions,
    ]
    // Absolute path after resolve(); on Windows resolve() may add a drive,
    // but the trailing path component is preserved.
    expect(opts.root).toMatch(/specific$/)
  })
})
