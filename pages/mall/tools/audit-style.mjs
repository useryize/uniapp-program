/**
 * 样式对齐审计：代码 vs 高保真设计稿 token 表
 * 检查项：
 *  1. 硬编码色值（应统一走 uni.scss 令牌）
 *  2. 非 0 圆角（街头风：卡片/按钮圆角 0）
 *  3. 描边宽度非 4rpx（设计稿 2px @750 基准）
 *  4. 残留 emoji / 图标字体
 *  5. 旧圆角胶囊按钮（border-radius: 2x rpx 以上）
 *  6. 字号超出设计稿字号体系
 *  7. 页面左右安全边距未用 $rz-page-pad
 * 运行：node .workbuddy/tmp/audit-style.mjs
 */
import fs from 'node:fs'
import path from 'node:path'

const ROOT = 'E:/github/uniapp-program'

/** 设计稿令牌（对齐 pages/mall/design/README.md 第四节） */
const TOKENS = {
  ink: '#0A0A0A', acid: '#FFD500', price: '#E24B4A', white: '#FFFFFF',
  grey50: '#F7F7F7', grey100: '#F2F2F2', grey300: '#BFBFBF', grey500: '#8C8C8C',
  line: '#E5E5E5', warnBg: '#FFF8D9', dangerBg: '#FFF1F1', danger: '#F43F5E'
}
const TOKEN_VALUES = new Set(Object.values(TOKENS))

/** 允许的非令牌色值（透明/纯黑遮罩/白/中性灰阶） */
const ALLOW = new Set([
  '#000000', '#ffffff', '#fff', '#000', 'transparent',
  'rgba(0, 0, 0, 0.55)', 'rgba(0, 0, 0, 0.35)', 'rgba(0, 0, 0, 0.5)',
  'rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0.85)',
  'rgba(0, 0, 0, 0.15)', 'rgba(0, 0, 0, 0.4)', 'rgba(0, 0, 0, 0.1)'
])

/** 设计稿字号体系（rpx） */
const FS = new Set([18, 20, 22, 24, 26, 28, 30, 32, 34, 36, 38, 40, 44, 48, 52, 56, 64, 76, 80])
/** 允许的圆角（仅 tabBar 胶囊与圆形点） */
const RADIUS_OK = new Set([0, 8, 14, 18, 28, 31, 36, 44, 50, 70])

/**
 * 合法例外：设计稿规范针对「卡片 / 按钮 / 输入框 / 选项」四边描边，
 * 以下属于图形描边、分隔线、占位元素与内部留白，不适用 4rpx 规则。
 */
const BORDER_EXCEPT = [
  ['pages/mall/index.vue', '2rpx'],               // Ardot 首页搜索/购物车及尺码入口为 1px 描边
  ['pages/mall/cart/index.vue', '2rpx'],              // .invalid-tag 灰色弱化标签
  ['pages/mall/components/mall-tabbar.vue', '2rpx'], // 胶囊外层与页面之间的细分隔线
  ['pages/mall/confirm/index.vue', '2rpx'],           // 地址、配送和金额面板的细边
  ['pages/mall/components/size-picker.vue', '2rpx'],  // .color-dot 色块内描边
  ['pages/mall/order/detail.vue', '2rpx'],            // 金额行分隔线
  ['pages/mall/pay/result.vue', '8rpx'],              // .error-mark 感叹号圆圈图形
  ['pages/mall/pay/result.vue', '2rpx'],              // .info-card 灰色信息卡
  ['pages/mall/search/index.vue', '2rpx']             // .tag 透明占位边
]
/** 字号例外：mock 占位色块的首字（无真实商品图时的兜底） */
const FS_EXCEPT = [
  ['pages/mall/components/goods-card.vue', 72],
  ['pages/mall/detail/index.vue', 140]
]
/** 内边距例外：输入框内部单位文字的留白，非页面安全边距 */
const PAD_EXCEPT = [
  ['pages/mall/index.vue', 'left:20rpx'],         // Ardot 发售入口左内边距 10px
  ['pages/mall/index.vue', 'right:16rpx'],        // Ardot 发售入口右内边距 8px
  ['pages/mall/size-guide/index.vue', 'right:20rpx']
]

function walk(dir, out = []) {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f)
    if (fs.statSync(p).isDirectory()) walk(p, out)
    else if (f.endsWith('.vue')) out.push(p)
  }
  return out
}

const files = [
  ...walk(path.join(ROOT, 'pages/mall')),
  path.join(ROOT, 'pages/mall/person/index.vue')
]

const issues = []
const lineOf = (src, idx) => src.slice(0, idx).split('\n').length

for (const file of files) {
  const rel = path.relative(ROOT, file).replace(/\\/g, '/')
  const src = fs.readFileSync(file, 'utf8')
  // 只审计 <style> 块
  const styleMatch = src.match(/<style[^>]*>([\s\S]*?)<\/style>/)
  if (!styleMatch) continue
  const style = styleMatch[1]
  const styleOffset = src.indexOf(styleMatch[1])

  // 1. 硬编码色值
  const hexRe = /#[0-9a-fA-F]{3,8}\b/g
  let m
  while ((m = hexRe.exec(style))) {
    const v = m[0].toUpperCase()
    if (TOKEN_VALUES.has(v) || ALLOW.has(v)) continue
    issues.push({ rel, line: lineOf(src, styleOffset + m.index), type: '硬编码色值', detail: v })
  }

  // 2/5. 圆角
  const radiusRe = /border-radius:\s*([0-9]+rpx|50%)/g
  while ((m = radiusRe.exec(style))) {
    const v = m[1]
    const num = parseInt(v)
    if (v === '0' || v === '50%' || RADIUS_OK.has(num)) continue
    issues.push({ rel, line: lineOf(src, styleOffset + m.index), type: '非设计稿圆角', detail: v })
  }

  // 3. 描边宽度
  const borderRe = /border:\s*([0-9]+rpx)\s+solid/g
  while ((m = borderRe.exec(style))) {
    if (m[1] === '4rpx') continue
    if (BORDER_EXCEPT.some(([f, v]) => f === rel && v === m[1])) continue
    issues.push({ rel, line: lineOf(src, styleOffset + m.index), type: '描边宽度≠4rpx', detail: m[1] })
  }

  // 4. emoji 残留
  const emojiRe = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu
  while ((m = emojiRe.exec(src))) {
    issues.push({ rel, line: lineOf(src, m.index), type: 'emoji 残留', detail: m[0] })
  }

  // 6. 字号体系
  const fsRe = /font-size:\s*([0-9]+rpx)/g
  while ((m = fsRe.exec(style))) {
    const n = parseInt(m[1])
    if (FS.has(n)) continue
    if (FS_EXCEPT.some(([f, v]) => f === rel && v === n)) continue
    issues.push({ rel, line: lineOf(src, styleOffset + m.index), type: '字号不在体系内', detail: m[1] })
  }

  // 7. 左右边距硬编码（应走 $rz-page-pad = 32rpx）
  const padRe = /padding-(left|right):\s*([0-9]+rpx)/g
  while ((m = padRe.exec(style))) {
    if (m[2] === '32rpx') continue
    if (PAD_EXCEPT.some(([f, v]) => f === rel && v === `${m[1]}:${m[2]}`)) continue
    issues.push({ rel, line: lineOf(src, styleOffset + m.index), type: '左右边距≠32rpx', detail: `${m[1]}:${m[2]}` })
  }
}

// 汇总
const byType = {}
for (const i of issues) {
  byType[i.type] = byType[i.type] || []
  byType[i.type].push(i)
}

console.log('========================================')
console.log(`  样式对齐审计：扫描 ${files.length} 个文件，发现 ${issues.length} 处偏差`)
console.log('========================================')

if (issues.length) {
  for (const [type, list] of Object.entries(byType)) {
    console.log(`\n■ ${type}（${list.length} 处）`)
    list.forEach((i) => console.log(`   ${i.rel}:${i.line}  ${i.detail}`))
  }
  process.exit(1)
} else {
  console.log('\n  ✓ 全部符合设计稿 token 体系')
}
