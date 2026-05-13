import { runCli } from './spawn-helper.js'
import type { RunOpts, RunResult, TierAdapter } from './types.js'

const BIN = 'claude'
const HEALTHCHECK_TIMEOUT_MS = 3000

export const claudeAdapter: TierAdapter = {
  name: 'T3',
  async healthcheck(): Promise<boolean> {
    const result = await runCli(BIN, ['--version'], {
      timeout_ms: HEALTHCHECK_TIMEOUT_MS,
      capture_stderr: false,
    })
    return result.exit_code === 0
  },
  async run(prompt: string, opts: RunOpts): Promise<RunResult> {
    return runCli(BIN, ['--print', prompt], opts)
  },
}
