/**
 * 设计稿交互规则覆盖检查
 * 逐条验证设计稿「服装电商 8 条关键规则」在代码中的落地情况
 * 运行：node .workbuddy/tmp/check-design-rules.mjs
 */
import fs from 'node:fs'
import path from 'node:path'

const ROOT = 'E:/github/uniapp-program'
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8')

const detail = read('pages/mall/detail/index.vue')
const cart = read('pages/mall/cart/index.vue')
const sizeGuide = read('pages/mall/size-guide/index.vue')
const drop = read('pages/mall/drop/index.vue')
const sizePicker = read('pages/mall/components/size-picker.vue')
const index = read('pages/mall/index.vue')
const person = read('pages/mall/person/index.vue')
const db = read('pages/mall/mock/db.js')
const goodsHandler = read('pages/mall/mock/handlers/goods.js')
const sizeHandler = read('pages/mall/mock/handlers/size.js')

const rules = [
  {
    no: 1,
    name: '尺码推荐条 + 尺码表入口出现在详情页 / 规格面板 / 购物车 三处',
    checks: [
      ['详情页有尺码推荐条', /rec-bar/.test(detail)],
      ['详情页有尺码助手入口', /goSizeGuide/.test(detail)],
      ['规格面板有尺码助手入口', /sku-helper/.test(detail)],
      ['购物车有尺码档案/改规格入口', /openSpec/.test(cart)],
      ['尺码助手页存在', sizeGuide.length > 0]
    ]
  },
  {
    no: 2,
    name: '售罄尺码保留展示 + 置灰划线（不隐藏）',
    checks: [
      ['尺码选择器渲染所有尺码（含售罄）', /v-for="s in sizes"/.test(sizePicker)],
      ['售罄有 disabled 样式类', /disabled/.test(sizePicker)],
      ['售罄有删除线样式', /line-through/.test(sizePicker)],
      ['售罄有半透明遮罩', /soldout-mask/.test(sizePicker)],
      ['售罄码未被 v-if 过滤掉', !/v-if="[^"]*stock/.test(sizePicker)],
      ['mock 中确有 stock=0 的尺码', /isTailSize \? 0/.test(db)]
    ]
  },
  {
    no: 3,
    name: '规格入口悬浮吸底，页面下滑仍可见',
    checks: [
      ['详情页有固定定位的规格条', /position: fixed/.test(detail) && /float-spec/.test(detail)]
    ]
  },
  {
    no: 4,
    name: '规格面板为可滑动大面板，含尺码助手，底部双按钮',
    checks: [
      ['面板用 scroll-view 可滚动', /sku-scroll/.test(detail) && /scroll-y/.test(detail)],
      ['面板高度 > 500rpx', /height: 1080rpx/.test(detail)],
      ['底部有加购 + 立即购买双按钮', /sku-btn-ghost/.test(detail) && /sku-btn-primary/.test(detail)]
    ]
  },
  {
    no: 5,
    name: '关闭面板再打开回显已选规格；颜色切换即时刷新主图',
    checks: [
      ['尺码选择器支持外部回填（watch）', /watch\(/.test(sizePicker)],
      ['详情页传入已选 colorId/size', /:color-id="colorId"/.test(detail) && /:size="selectedSize"/.test(detail)],
      ['购物车改规格时回显当前规格', /回显当前已选规格/.test(cart)],
      ['颜色选择器含主图联动位（颜色名 + 色块）', /color-dot/.test(sizePicker)]
    ]
  },
  {
    no: 6,
    name: '购物车内可直接改规格 + 凑单提示',
    checks: [
      ['购物车规格行显示「点击修改」', /点击修改/.test(cart)],
      ['购物车调用改规格接口', /cartApi\.updateSku/.test(cart)],
      ['有凑单提示条', /ship-tip/.test(cart)],
      ['凑单提示用服务端口径的免邮门槛', /FREE_SHIPPING_THRESHOLD/.test(cart)]
    ]
  },
  {
    no: 7,
    name: '限量款三态：即将发售(倒计时+订阅) / 正在发售(库存+抢购) / 已售罄(到货提醒)',
    checks: [
      ['发售页有三态渲染', /soon/.test(drop) && /live/.test(drop) && /soldout/.test(drop)],
      ['有待开售倒计时', /countdown/.test(drop)],
      ['有剩余库存展示', /remain/.test(drop)],
      ['有订阅提醒动作', /dropApi\.subscribe/.test(drop)],
      ['mock 数据含三态数据', /type: 'soon'/.test(db) && /type: 'live'/.test(db) && /type: 'soldout'/.test(db)]
    ]
  },
  {
    no: 8,
    name: '用户尺码档案持久化，跨商品复用推荐结果',
    checks: [
      ['有档案读写 handler', /size\.profile\.get/.test(sizeHandler) && /size\.profile\.save/.test(sizeHandler)],
      ['详情页读取档案做推荐', /sizeApi\.profile/.test(detail)],
      ['尺码助手页回填并保存档案', /sizeApi\.saveProfile/.test(sizeGuide)],
      ['个人中心有尺码档案入口', /尺码档案/.test(person)],
      ['推荐由服务端计算', /calcRecommend/.test(sizeHandler)]
    ]
  }
]

let total = 0
let passed = 0
let failed = 0

for (const r of rules) {
  console.log(`\n规则 ${r.no}：${r.name}`)
  for (const [label, ok] of r.checks) {
    total++
    if (ok) {
      passed++
      console.log('   ✓ ' + label)
    } else {
      failed++
      console.log('   ✗ ' + label)
    }
  }
}

console.log('\n========================================')
console.log(`  设计稿规则覆盖：${passed} / ${total} 通过${failed ? '，' + failed + ' 项未落地' : '，全部落地'}`)
console.log('========================================')
process.exit(failed ? 1 : 0)
