/**
 * 高保真对齐断言：逐页核对代码结构与设计稿
 * 首页基线取自 Ardot 文件 739096499841184 的 Frame 2:1 图层属性。
 * 其他页面维持现有断言，待逐页按 Ardot 图层更新。
 * 断言维度：区块顺序 / 关键尺寸 / 视觉状态（通栏 vs 描边）
 * 运行：node pages/mall/tools/check-alignment.mjs
 */
import fs from 'node:fs'
import path from 'node:path'

const ROOT = 'E:/github/uniapp-program'
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8')

const pages = {
  home: read('pages/mall/index.vue'),
  category: read('pages/mall/category/index.vue'),
  search: read('pages/mall/search/index.vue'),
  detail: read('pages/mall/detail/index.vue'),
  cart: read('pages/mall/cart/index.vue'),
  confirm: read('pages/mall/confirm/index.vue'),
  pay: read('pages/mall/pay/result.vue'),
  orderList: read('pages/mall/order/list.vue'),
  orderDetail: read('pages/mall/order/detail.vue'),
  person: read('pages/mall/person/index.vue'),
  sizeGuide: read('pages/mall/size-guide/index.vue'),
  drop: read('pages/mall/drop/index.vue'),
  card: read('pages/mall/components/goods-card.vue'),
  picker: read('pages/mall/components/size-picker.vue')
}

/** 断言集：{ name, page, checks: [[描述, 条件]] } */
const suites = [
  {
    name: '首页 · 区块顺序与形态',
    page: 'home',
    checks: [
      ['品牌栏在 Hero 之前', /brand-bar[\s\S]*?hero-img-wrap/.test(pages.home)],
      ['Hero 图片与文案分属两个区块（图下独立黑底区）', /hero-img-wrap[\s\S]*?<\/view>[\s\S]*?hero-copy/.test(pages.home)],
      ['入口区为两行两列，列间距 10px', (pages.home.match(/class="entry-row"/g) || []).length === 2 && /\.entry-row\s*\{[^}]*gap: 20rpx/.test(pages.home)],
      ['入口区共 4 个格子', (pages.home.match(/class="entry[ "]/g) || []).length === 4],
      ['Hero 总高 360px，使用 Ardot 原图', /\.hero\s*\{[^}]*height: 720rpx/.test(pages.home) && pages.home.includes('/static/mall/ardot/hero.jpg')],
      ['入口区内边距 16px、卡片高 56px', /\.entries\s*\{[^}]*padding: 32rpx/.test(pages.home) && /\.entry\s*\{[^}]*height: 112rpx/.test(pages.home)],
      ['秒杀与推荐商品图高 160px', (pages.home.match(/:cover-height="320"/g) || []).length === 2],
      ['含「联名专区」入口', pages.home.includes('联名专区')],
      ['FLASH SALE 区块为黑底通栏', /\.flash-block\s*\{[^}]*background-color: \$rz-ink/.test(pages.home)],
      ['倒计时数字为白底黑字', /\.cd-num\s*\{[^}]*background-color: \$rz-white/.test(pages.home)]
    ]
  },
  {
    name: '分类页 · 类目栏与商品卡',
    page: 'category',
    checks: [
      ['左侧类目栏为白底', /\.cat-rail\s*\{[^}]*background-color: \$rz-white/.test(pages.category)],
      ['类目项无分隔线', !/\.cat-cell\s*\{[^}]*border-bottom/.test(pages.category)],
      ['商品网格为两列', /\.cat-cell-item\s*\{[^}]*width: 251rpx/.test(pages.category)],
      ['封面高度传 251（保持 1:1）', /:cover-height="251"/.test(pages.category)],
      ['排序项选中态为黑色加粗', /\.sort-item\.active\s*\{[^}]*color: \$rz-ink/.test(pages.category)]
    ]
  },
  {
    name: '商品卡 · 角标位置与封面比例',
    page: 'card',
    checks: [
      ['角标独立成行（不在 .cover 内）', /<\/view>\s*<!-- 角标[\s\S]*?tag-row/.test(pages.card)],
      ['封面高度由调用方传入', /coverHeight/.test(pages.card)],
      ['卡片有 4rpx 硬描边', /\.goods-card\s*\{[^}]*border: 4rpx solid \$rz-ink/.test(pages.card)]
    ]
  },
  {
    name: '详情页 · 底部固定区与吸底规格条',
    page: 'detail',
    checks: [
      ['底部为竖排（flex-direction: column）', /\.footer-bar\s*\{[^}]*flex-direction: column/.test(pages.detail)],
      ['规格条在底部区内（非独立 fixed）', /\.float-spec[\s\S]*?footer-bar/.test(pages.detail) || /footer-bar[\s\S]*?float-spec/.test(pages.detail)],
      ['加购与购买为两个全宽按钮', /\.footer-btn\s*\{[^}]*height: 88rpx/.test(pages.detail)],
      ['底部栏使用黑色顶边', /\.footer-bar\s*\{[^}]*border-top: 4rpx solid \$rz-ink/.test(pages.detail)],
      ['含尺码推荐条', /rec-bar/.test(pages.detail)],
      ['尺码推荐条为浅黄底', /\.rec-bar\s*\{[^}]*background-color: \$rz-warn-bg/.test(pages.detail)],
      ['规格面板为可滚动（scroll-view + scroll-y）', /sku-scroll/.test(pages.detail) && /scroll-y/.test(pages.detail)],
      ['面板高度 1080rpx', /height: 1080rpx/.test(pages.detail)]
    ]
  },
  {
    name: '购物车 · 凑单提示与改规格',
    page: 'cart',
    checks: [
      ['含凑单提示条', /ship-tip/.test(pages.cart)],
      ['凑单门槛取服务端常量', /FREE_SHIPPING_THRESHOLD/.test(pages.cart)],
      ['规格行标注「点击修改」', /点击修改/.test(pages.cart)],
      ['调用改规格接口', /cartApi\.updateSku/.test(pages.cart)],
      ['商品项为白底无描边', /\.cart-item\s*\{[^}]*background-color: \$rz-white/.test(pages.cart) && !/\.cart-item\s*\{[^}]*border: 4rpx/.test(pages.cart)]
    ]
  },
  {
    name: '结算页 · 通栏区块',
    page: 'confirm',
    checks: [
      ['地址卡为白底细边', /\.address-card\s*\{[^}]*background-color: \$rz-white/.test(pages.confirm) && /\.address-card\s*\{[^}]*border: 2rpx solid \$rz-line/.test(pages.confirm)],
      ['商品清单无描边（通栏）', /\.goods-block\s*\{[^}]*\}/.test(pages.confirm) && !/\.goods-block\s*\{[^}]*border: 4rpx/.test(pages.confirm)],
      ['配送/备注行无描边', !/\.row-block\s*\{[^}]*border: 4rpx/.test(pages.confirm)],
      ['金额明细无描边', !/\.amount-block\s*\{[^}]*border: 4rpx/.test(pages.confirm)],
      ['含优惠券行', /优惠券/.test(pages.confirm)],
      ['提交按钮为酸性黄', /\.footer-submit\s*\{[^}]*background-color: \$rz-acid/.test(pages.confirm)]
    ]
  },
  {
    name: '支付结果 · 三态形态',
    page: 'pay',
    checks: [
      ['含待支付/成功/异常三态', /pending/.test(pages.pay) && /success/.test(pages.pay) && /error/.test(pages.pay)],
      ['异常态用令牌色而非硬编码', /\.error-icon\s*\{[^}]*background-color: \$rz-danger-bg/.test(pages.pay)],
      ['成功态图标为酸性黄底', /\.success-icon\s*\{[^}]*background-color: \$rz-acid/.test(pages.pay)],
      ['主按钮为酸性黄黑框', /\.btn-primary\s*\{[^}]*background-color: \$rz-acid/.test(pages.pay)]
    ]
  },
  {
    name: '订单列表 / 详情 · 硬边与通栏',
    page: 'orderList',
    checks: [
      ['Tab 选中态为黑底', /\.tab-item\.active\s*\{[^}]*background-color: \$rz-ink/.test(pages.orderList)],
      ['订单卡为白底无描边', /\.order-card\s*\{[^}]*background-color: \$rz-white/.test(pages.orderList) && !/\.order-card\s*\{[^}]*border: 4rpx/.test(pages.orderList)],
      ['待付款状态为价格红', /status-unpaid/.test(pages.orderList)]
    ]
  },
  {
    name: '订单详情 · 黑底状态区',
    page: 'orderDetail',
    checks: [
      ['状态区为黑底通栏', /\.status-block\s*\{[^}]*background-color: \$rz-ink/.test(pages.orderDetail)],
      ['状态标题为白色大字', /\.status-text\s*\{[^}]*color: \$rz-white/.test(pages.orderDetail)],
      ['信息卡无描边（通栏）', !/\.card\s*\{[^}]*border: 4rpx/.test(pages.orderDetail)],
      ['实付金额为价格红大字', /\.pay-amount\s*\{[^}]*color: \$rz-price/.test(pages.orderDetail)]
    ]
  },
  {
    name: '个人中心 · 面板连续 + 4 列宫格',
    page: 'person',
    checks: [
      ['面板无描边', !/\.panel\s*\{[^}]*border: 4rpx/.test(pages.person)],
      ['相邻面板连续（margin-top:0）', /\.panel \+ \.panel\s*\{[^}]*margin-top: 0/.test(pages.person)],
      ['功能宫格为 4 列', /\.func-item\s*\{[^}]*width: 25%/.test(pages.person)],
      ['发售提醒为黑底通栏', /\.drop-card\s*\{[^}]*background-color: \$rz-ink/.test(pages.person)],
      ['尺码档案用滑块图标', /slider\.png/.test(pages.person)],
      ['设置用太阳图标', /setting\.png/.test(pages.person)]
    ]
  },
  {
    name: '尺码助手 · 结构与黑底导航',
    page: 'sizeGuide',
    checks: [
      ['引导语在白底区（不在黑底头部）', /guide-intro/.test(pages.sizeGuide) && !/guide-head/.test(pages.sizeGuide)],
      ['录入面板无描边（通栏）', !/\.panel\s*\{[^}]*border: 4rpx/.test(pages.sizeGuide)],
      ['推荐卡为黑底', /\.result-card\s*\{[^}]*background-color: \$rz-ink/.test(pages.sizeGuide)],
      ['推荐卡含「查看完整尺码表」', /查看完整尺码表/.test(pages.sizeGuide)],
      ['体型三选一（Y/A/B）', /偏瘦 Y/.test(pages.sizeGuide) && /标准 A/.test(pages.sizeGuide) && /偏胖 B/.test(pages.sizeGuide)]
    ]
  },
  {
    name: '发售日历 · 三态与倒计时',
    page: 'drop',
    checks: [
      ['三态渲染', /dc-soon/.test(pages.drop) && /dc-live/.test(pages.drop) && /dc-soldout/.test(pages.drop)],
      ['待售为黄底', /\.dc-soon\s*\{[^}]*background-color: \$rz-acid/.test(pages.drop)],
      ['在售为红底', /\.dc-live\s*\{[^}]*background-color: \$rz-price/.test(pages.drop)],
      ['含剩余库存', /remain/.test(pages.drop)],
      ['含倒计时', /countdown/.test(pages.drop)]
    ]
  },
  {
    name: '尺码选择器 · 售罄保留三态',
    page: 'picker',
    checks: [
      ['渲染全部尺码（无 v-if 过滤售罄）', /v-for="s in sizes"/.test(pages.picker) && !/v-if="[^"]*stock\s*===?\s*0/.test(pages.picker)],
      ['售罄有置灰底', /\.size-item\.disabled\s*\{[^}]*background-color: \$rz-grey-100/.test(pages.picker)],
      ['售罄有文字划线', /line-through/.test(pages.picker)],
      ['售罄有半透明遮罩', /soldout-mask/.test(pages.picker)],
      ['选中态为黑底黄字', /\.size-item\.active\s*\{[^}]*background-color: \$rz-ink/.test(pages.picker)]
    ]
  }
]

let total = 0
let pass = 0
const fails = []

for (const suite of suites) {
  console.log(`\n■ ${suite.name}`)
  for (const [label, ok] of suite.checks) {
    total++
    if (ok) {
      pass++
      console.log('   ✓ ' + label)
    } else {
      fails.push(`${suite.name} → ${label}`)
      console.log('   ✗ ' + label)
    }
  }
}

console.log('\n========================================')
console.log(`  高保真对齐断言：${pass} / ${total} 通过${fails.length ? '，' + fails.length + ' 项未对齐' : '，全部对齐'}`)
console.log('========================================')
if (fails.length) {
  console.log('\n未对齐明细：')
  fails.forEach((f) => console.log('  - ' + f))
  process.exit(1)
}
