import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['test/**/*.test.ts'],
    exclude: ['node_modules/**', 'dist/**'],
    environment: 'node',
    // Turbo runs workspace suites concurrently in CI; graph fixtures can be CPU-starved.
    testTimeout: 30_000,
    hookTimeout: 30_000,
  },
})
