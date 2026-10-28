import { defineConfig } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'

// 本项目为根目录结构（非 src/ 布局），需把 uni-app 的输入目录指向项目根
process.env.UNI_INPUT_DIR = process.env.UNI_INPUT_DIR || process.cwd()

export default defineConfig({
  plugins: [uni()]
})
