/**
 * 路由可达性检查
 * 1) 扫描所有 .vue 的跳转调用，提取目标 path
 * 2) 与 pages.json 注册路径比对，报告「跳转到未注册页面」
 * 3) 检查普通页面是否误用 switchTab
 * 运行：node pages/mall/tools/check-routes.mjs
 */
import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(import.meta.dirname, '../../..')
const raw = fs.readFileSync(path.join(ROOT, 'pages.json'), 'utf8').replace(/\/\/.*$/gm, '')
const conf = JSON.parse(raw)

const registered = new Set(conf.pages.map((p) => p.path))
const tabPages = new Set((conf.tabBar?.list || []).map((t) => t.pagePath))

function walk(dir, out = []) {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f)
    if (fs.statSync(p).isDirectory()) walk(p, out)
    else if (f.endsWith('.vue')) out.push(p)
  }
  return out
}

const files = walk(path.join(ROOT, 'pages'))

let problems = 0
let checked = 0

for (const file of files) {
  const rel = path.relative(ROOT, file).replace(/\\/g, '/')
  const src = fs.readFileSync(file, 'utf8')

  // 匹配 uni.xxx({ url: '...' }) 与 navigateTo/reLaunch/switchTab/redirectTo
  const re = /uni\.(navigateTo|redirectTo|reLaunch|switchTab)\s*\(\s*\{[^}]*?url\s*:\s*[`'"]([^`'"]+)[`'"]/g
  let m
  while ((m = re.exec(src))) {
    const method = m[1]
    const url = m[2]
    if (!url.startsWith('/pages/')) continue
    checked++

    // 取 path 部分（去掉 query 与前导斜杠，与 pages.json 注册格式对齐）
    const p = url.split('?')[0].replace(/^\//, '')
    if (!registered.has(p)) {
      problems++
      console.log(`  ✗ ${rel}  ${method} -> ${p}   【页面未在 pages.json 注册】`)
      continue
    }
    if (tabPages.has(p) && method !== 'switchTab') {
      problems++
      console.log(`  ✗ ${rel}  ${method} -> ${p}   【tabBar 页必须用 switchTab】`)
    } else if (!tabPages.has(p) && method === 'switchTab') {
      problems++
      console.log(`  ✗ ${rel}  switchTab -> ${p}   【普通页面不能用 switchTab】`)
    }
  }
}

console.log('\n========================================')
console.log(`  路由检查：扫描 ${files.length} 个页面文件，${checked} 处跳转，问题 ${problems} 处`)
console.log('========================================')

// 额外：页面清单
console.log('\n已注册页面（' + conf.pages.length + '）：')
conf.pages.forEach((p, i) => {
  const tab = tabPages.has(p.path) ? '  [tabBar]' : ''
  console.log(`  ${String(i + 1).padStart(2)}. ${p.path}${tab}`)
})

process.exit(problems ? 1 : 0)
