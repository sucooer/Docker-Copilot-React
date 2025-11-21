import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react({
    jsxRuntime: 'automatic'
  })],
  server: {
    port: 12713,
    host: true
  },
  build: {
    // 确保静态资源被正确复制
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        // 确保静态文件被正确处理
        assetFileNames: (assetInfo) => {
          if (assetInfo.name && assetInfo.name.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
            return 'images/[name].[hash][extname]'
          }
          return 'assets/[name].[hash][extname]'
        }
      }
    }
  },
  esbuild: {
    loader: 'jsx',
    include: /src\/.*\.[jt]sx?$/,
    exclude: []
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: {
        '.js': 'jsx'
      }
    }
  }
})