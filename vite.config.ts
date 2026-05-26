import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig(({ mode }) => {
  // Load environment variables
  const env = loadEnv(mode, process.cwd(), '')
  
  // Get device service configuration from environment or use defaults
  const deviceHost = env.VITE_DEVICE_HOST || 'localhost'
  const devicePort = env.VITE_DEVICE_PORT || '8080'
  const deviceBaseUrl = `http://${deviceHost}:${devicePort}`

  return {
    plugins: [vue()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@plc/hmi-types': path.resolve(__dirname, '../shared-types/src'),
        '@plc/components': path.resolve(__dirname, '../shared-components/src'),
      },
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor': ['vue', 'pinia', 'vue-router'],
            'charts': ['echarts'],
            'utils': ['axios', 'lodash-es']
          }
        }
      },
      chunkSizeWarningLimit: 500
    },
    server: {
      port: 3000,
      proxy: {
        '/api': {
          target: deviceBaseUrl,
          changeOrigin: true,
          secure: false,
          // Handle CORS preflight requests
          configure: (proxy, options) => {
            proxy.on('proxyReq', (proxyReq, req, res) => {
              // Add CORS headers to proxied requests
              proxyReq.setHeader('Origin', deviceBaseUrl)
            })
          }
        }
      }
    }
  }
})
