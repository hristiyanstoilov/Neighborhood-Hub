import { defineConfig } from 'vitest/config'
import path from 'path'
import { config } from 'dotenv'

config({ path: path.resolve(__dirname, '.env.local') })

const testDbUrl = process.env.TEST_DATABASE_URL
if (!testDbUrl) {
  throw new Error(
    '\n\nIntegration tests require TEST_DATABASE_URL.\n' +
    'Create a Neon test branch and add to .env.local:\n' +
    '  TEST_DATABASE_URL=postgresql://...\n'
  )
}

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    fileParallelism: false,
    include: ['src/**/*.integration.test.ts'],
    setupFiles: ['./src/test-integration-setup.ts'],
    env: {
      DATABASE_URL: testDbUrl,
      JWT_SECRET: 'test-secret-at-least-32-characters-long!!',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text'],
      include: ['src/lib/queries/**'],
      thresholds: { lines: 70 },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
