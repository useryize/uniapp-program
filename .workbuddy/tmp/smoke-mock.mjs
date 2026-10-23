/**
 * mock 数据层冒烟测试：验证新增的尺码域 / 发售域 / 商品域通道
 * 运行：node .workbuddy/tmp/smoke-mock.mjs
 * 说明：mock 引擎依赖 uni 全局（无），此脚本直接调用 handler，绕过延迟层
 */
import goods from '../../pages/mall/mock/handlers/goods.js'
import size from '../../pages/mall/mock/handlers/size.js'
import drop from '../../pages/mall/mock/handlers/drop.js'
import cart from '../../pages/mall/mock/handlers/cart.js'
import order from '../../pages/mall/mock/handlers/order.js'
import { db, CATEGORIES } from '../../pages/mall/mock/db.js'

let pass = 0
let fail = 0

function check(name, fn) {
  try {
    fn()
    pass++
    console.log('  PASS  ' + name)
  } catch (e) {
    fail++
    console.log('  FAIL  ' + name + '  -> ' + (e && e.msg ? e.msg : e))
  }
}

function eq(actual, expected, label) {
  if (actual !== expected) {
    throw new Error((label || '') + ' 期望 ' + JSON.stringify(expected) + ' 实际 ' + JSON.stringify(actual))
  }
}

console.log('\n== 商品域 ==')
check('goods.list 返回上架商品', () => {
  const r = goods['goods.list']({ page: 1, pageSize: 10 })
  eq(r.list.length, 7, '上架商品数(8 条种子 - 1 条下架)')
  eq(r.hasMore, false, 'hasMore')
  if (!r.list[0].minPrice) throw new Error('缺少 minPrice')
})
check('goods.list 一级类目过滤含二级类目商品', () => {
  const r = goods['goods.list']({ categoryId: 10 })
  const ids = r.list.map((g) => g.id)
  if (!ids.includes(1) || !ids.includes(2) || !ids.includes(6)) {
    throw new Error('上装(10) 应含卫衣(11)/T恤(12) 的商品，实际 ' + ids)
  }
})
check('goods.categories 返回类目树', () => {
  const c = goods['goods.categories']()
  eq(c.length, CATEGORIES.length, '类目数')
  if (!c[1].children || c[1].children.length !== 3) throw new Error('上装应有 3 个二级类目')
})
check('goods.detail 返回双维 SKU', () => {
  const d = goods['goods.detail']({ id: 1 })
  eq(d.colors.length, 3, '颜色数')
  eq(d.sizes.length, 5, '尺码数')
  eq(d.skuList.length, 15, 'SKU 数 = 3 色 × 5 码')
  if (!d.sizeChart) throw new Error('缺少尺码表')
  const soldOut = d.skuList.filter((s) => s.stock === 0)
  if (soldOut.length !== 3) throw new Error('应有 3 个售罄码(保留展示)，实际 ' + soldOut.length)
})
check('goods.detail 下架商品报错 40401', () => {
  try {
    goods['goods.detail']({ id: 8 })
    throw new Error('本应抛错')
  } catch (e) {
    if (e.code !== 40401) throw new Error('错误码应为 40401，实际 ' + e.code)
  }
})

console.log('\n== 尺码域 ==')
check('size.recommend 按身高推荐', () => {
  const r = size['size.recommend']({ height: 175, weight: 68, fit: 'A' })
  eq(r.size, 'M', '175cm/68kg 推荐码')
  if (!r.reason) throw new Error('缺少推荐依据')
})
check('size.recommend 身高 185 推荐 XL', () => {
  const r = size['size.recommend']({ height: 185, weight: 90 })
  eq(r.size, 'XL', '185cm 推荐码')
})
check('size.recommend 非法数据报错 40008', () => {
  try {
    size['size.recommend']({ height: 50, weight: 5 })
    throw new Error('本应抛错')
  } catch (e) {
    if (e.code !== 40008) throw new Error('错误码应为 40008，实际 ' + e.code)
  }
})
check('size.chart 标记推荐行', () => {
  const c = size['size.chart']({ height: 175, weight: 68 })
  const rec = c.rows.filter((r) => r.recommend)
  eq(rec.length, 1, '推荐行数')
})
check('size.chart 无身体数据时不标记', () => {
  const c = size['size.chart']({})
  eq(c.rows.filter((r) => r.recommend).length, 0, '推荐行数')
})
check('size.profile 读写', () => {
  size['size.profile.save']({ height: 180, weight: 80, fit: 'B' })
  const p = size['size.profile.get']()
  eq(p.height, 180, '身高')
  eq(p.fit, 'B', '体型')
})

console.log('\n== 发售域 ==')
check('drop.list 三态齐全', () => {
  const l = drop['drop.list']({})
  const types = l.map((d) => d.type)
  if (!types.includes('soon') || !types.includes('live') || !types.includes('soldout')) {
    throw new Error('缺少发售状态，实际 ' + types)
  }
  const live = l.find((d) => d.type === 'live')
  eq(live.remain, 88, '在售剩余库存')
})
check('drop.list 按状态筛选', () => {
  const l = drop['drop.list']({ type: 'soon' })
  eq(l.length, 1, '即将发售数')
  eq(l[0].type, 'soon', '类型')
})
check('drop.subscribe 回执', () => {
  const r = drop['drop.subscribe']({ goodsId: 1 })
  eq(r.subscribed, true, '订阅结果')
})

console.log('\n== 交易链路回归（购物车→下单→支付） ==')
check('加购 → 列表 → 结算 → 支付 全链路', () => {
  const detail = goods['goods.detail']({ id: 1 })
  const sku = detail.skuList.find((s) => s.stock > 0)
  cart['cart.add']({ goodsId: 1, skuId: sku.id, quantity: 2 })
  const cl = cart['cart.list']()
  eq(cl.list.length, 1, '购物车项数')
  eq(cl.checkedCount, 2, '已选件数')
  if (!cl.checkedAmount) throw new Error('缺少合计金额')

  const created = order['order.create']({
    items: [{ skuId: sku.id, quantity: 2 }],
    addressId: 1,
    remark: '冒烟测试'
  })
  if (!created.orderNo) throw new Error('缺少订单号')
  if (!created.payAmount) throw new Error('缺少应付金额')
  const paid = order['order.mockPay']({ orderNo: created.orderNo })
  eq(paid.orderNo, created.orderNo, '支付订单号')
  const od = order['order.detail']({ orderNo: created.orderNo })
  eq(od.status, 'PAID', '订单状态')
  if (!od.items[0].specSnapshot) throw new Error('缺少规格快照')
})

console.log('\n== 边界 ==')
check('购物车改规格（换尺码）', () => {
  const detail = goods['goods.detail']({ id: 1 })
  const skuA = detail.skuList.find((s) => s.stock > 0 && s.size === 'M')
  const skuB = detail.skuList.find((s) => s.stock > 0 && s.size === 'L' && s.colorId === skuA.colorId)
  if (!skuA || !skuB) throw new Error('缺少可用于换码的 SKU')
  cart['cart.add']({ goodsId: 1, skuId: skuA.id, quantity: 1 })
  const item = cart['cart.list']().list.find((i) => i.skuId === skuA.id)
  cart['cart.updateSku']({ id: item.id, skuId: skuB.id, quantity: 1 })
  const after = cart['cart.list']().list.find((i) => i.id === item.id)
  eq(after.skuId, skuB.id, '换码后 skuId')
  eq(after.spec.includes('L'), true, '规格文案含新尺码')
})
check('购物车改规格到售罄码报错 40001', () => {
  const detail = goods['goods.detail']({ id: 1 })
  const soldOut = detail.skuList.find((s) => s.stock === 0)
  const item = cart['cart.list']().list[0]
  try {
    cart['cart.updateSku']({ id: item.id, skuId: soldOut.id, quantity: 1 })
    throw new Error('本应抛错')
  } catch (e) {
    if (e.code !== 40001) throw new Error('错误码应为 40001，实际 ' + e.code)
  }
})
check('加购超库存报错 40001', () => {
  const detail = goods['goods.detail']({ id: 1 })
  const sku = detail.skuList.find((s) => s.stock > 0)
  try {
    cart['cart.add']({ goodsId: 1, skuId: sku.id, quantity: 9999 })
    throw new Error('本应抛错')
  } catch (e) {
    if (e.code !== 40001) throw new Error('错误码应为 40001，实际 ' + e.code)
  }
})
check('下单未选地址报错 40004', () => {
  const detail = goods['goods.detail']({ id: 1 })
  const sku = detail.skuList.find((s) => s.stock > 0)
  try {
    order['order.create']({ items: [{ skuId: sku.id, quantity: 1 }], addressId: 999 })
    throw new Error('本应抛错')
  } catch (e) {
    if (e.code !== 40004) throw new Error('错误码应为 40004，实际 ' + e.code)
  }
})

console.log('\n========================================')
console.log('  通过 ' + pass + ' / 失败 ' + fail)
console.log('========================================')
process.exit(fail ? 1 : 0)
