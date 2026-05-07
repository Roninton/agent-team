import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: './src/shared/__test__/setup.ts',
    include: [
      // 只处理 shared 层测试
      // client 和 server 测试分别使用各自的配置文件运行
      'src/shared/**/__test__/**/*.{test,spec}.ts',
    ],
    exclude: [
      'node_modules', 
      'dist',
      // 排除 extension 历史遗留代码
      'src/extension/**',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: [
        // 只统计主项目代码
        'src/server/src/**/*.ts',
        'src/client/src/**/*.{ts,tsx}',
        // Shared 工具函数
        'src/shared/utils/**/*.ts',
      ],
      exclude: [
        // 排除测试文件
        'src/**/__test__/**',
        'src/**/*.d.ts',
        // 排除入口文件
        'src/server/src/main.ts',
        // 排除 extension 历史遗留代码
        'src/extension/**',
        // 排除 shared 类型定义（类型不需覆盖率统计）
        'src/shared/types/**',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80
      }
    }
  }
})
