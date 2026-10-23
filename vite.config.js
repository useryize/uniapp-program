import { defineConfig } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'

// 仅用于本地样式走查（H5 预览），不参与小程序构建
export default defineConfig({
  plugins: [uni()],
  server: {
    host: '127.0.0.1',
    port: 5180,
    strictPort: false
  }
})
