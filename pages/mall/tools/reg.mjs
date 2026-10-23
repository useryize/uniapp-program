/**
 * Node ESM 解析垫片：补齐无扩展名相对导入
 * 背景：项目源码用 vite/webpack 风格的 `from '../db'`（无 .js），
 *      Node 原生 ESM 不认，但冒烟测试要直跑 mock handler。
 * 用法：node --import ./pages/mall/tools/reg.mjs pages/mall/tools/smoke-mock.mjs
 */
import { register } from 'node:module'
import { pathToFileURL, fileURLToPath } from 'node:url'

register(pathToFileURL(fileURLToPath(new URL('./loader.mjs', import.meta.url))).href)
