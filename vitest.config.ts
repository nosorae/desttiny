// vitest.config.ts
import path from 'path'

import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    server: {
      deps: {
        // @gracefullight/saju는 extensionless ESM import를 사용하므로
        // Vite가 직접 변환하도록 inline 처리
        inline: ['@gracefullight/saju', 'luxon'],
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
})
