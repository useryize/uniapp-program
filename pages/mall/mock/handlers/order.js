/**
 * @file 订单域 mock 处理器
 *
 * 落地 PRD 硬规则（docs/PRD-商城-v1.1-架构版.md §6/§7），是最能体现
 * "mock = 内存版服务端" 的文件。切换真实接口后，以下规则由服务端实现，
 * 前端代码不变：
 *  - 金额全部服务端实时计价（§7.1），前端传值不参与计算
 *  - 下单锁库存：可售 stock -> 锁定 locked（§7.2），取消/超时释放
 *  - 订单快照：标题/规格/单价/地址下单时固化（§7.1 规则 3）
 *  - 待付款 15 分钟超时关单（§6.2），payExpireAt 为唯一时钟
 *  - 支付以"回调"为唯一生效依据（§7.3）：mock 用 order.mockPay 模拟回调
 */

import { db, nextId, ORDER_STATUS } from '../db'
import { MALL_CONFIG } from '../../config'

/**
 * 结算明细构建：服务端计价 + 条件锁库存（PRD §7.2 规则 3）
 * 真实环境此函数内为数据库原子更新（UPDATE sku SET stock=stock-n WHERE stock>=n），
 * mock 阶段直接改内存；「禁止超卖后补偿」= 校验失败直接抛错拒绝下单
 * @param {Array<{skuId:number, quantity:number}>} items 结算项（金额字段即使前端传了也忽略）
 * @returns {Array<Object>} 订单明细快照（含标题/规格/单价固化）
 * @throws 40401 SKU 不存在 / 40002 已下架 / 40001 库存不足
 */
function buildOrderItems(items) {
  return items.map(({ skuId, quantity }) => {
    const sku = db.skus.find((s) => s.id === Number(skuId))
    if (!sku) throw { code: 40401, msg: 'SKU 不存在' }

    const goods = db.goods.find((g) => g.id === sku.goodsId)
    if (!goods || goods.status !== 1) throw { code: 40002, msg: '商品已下架' }

    const qty = Number(quantity)
    if (!Number.isInteger(qty) || qty < 1) throw { code: 40007, msg: '购买数量不合法' }
    // 条件扣减：可售不足直接失败，绝不出现"超卖了再补偿"
    if (sku.stock < qty) throw { code: 40001, msg: `「${goods.title}」库存不足` }

    sku.stock -= qty   // 可售 -> 锁定
    sku.locked += qty

    // 订单快照：以下字段下单时固化，商品后续改价改名不影响历史订单（PRD §7.1 规则 3）
    return {
      skuId: sku.id,
      goodsId: goods.id,
      titleSnapshot: goods.title,
      specSnapshot: sku.spec,
      coverSnapshot: goods.cover,
      colorSnapshot: goods.color, // mock 占位色块，真实接口无此字段
      price: sku.price,           // 实时价格，非前端传值
      quantity: qty,
      subtotal: sku.price * qty
    }
  })
}

/**
 * 计算运费：满额免邮，否则固定运费
 * 规则待业务确认（PRD Q7），mock 按 config 常量假定
 * @param {number} totalAmount 商品合计（分）
 * @returns {number} 运费（分）
 */
function calcFreight(totalAmount) {
  return totalAmount >= MALL_CONFIG.FREE_SHIPPING_THRESHOLD ? 0 : MALL_CONFIG.FREIGHT
}

export default {
  /**
   * 提交订单（创建订单 + 锁定库存，PRD §③规则 5 / §④）
   * @param {{items:Array<{skuId:number, quantity:number}>, addressId:number|string, remark?:string}} params
   *   注意：items 中任何金额字段一律忽略，以服务端计价为准（§7.1 规则 1）
   * @returns {{orderNo: string, payAmount: number, payExpireAt: number}}
   * @throws 40003 结算商品为空 / 40004 未选地址 / 明细构建中的库存与下架错误
   */
  'order.create'(params) {
    const items = params.items || []
    if (!items.length) throw { code: 40003, msg: '结算商品不能为空' }

    const address = db.addresses.find((a) => a.id === Number(params.addressId))
    if (!address) throw { code: 40004, msg: '请选择收货地址' }

    const orderItems = buildOrderItems(items)

    // 金额构成（PRD §9 设计要点 4）：商品小计 + 运费 - 优惠合计（V1 恒 0，结构必须预留）
    const totalAmount = orderItems.reduce((n, i) => n + i.subtotal, 0)
    const freight = calcFreight(totalAmount)
    const discountAmount = 0

    const orderNo = nextId('NO')
    const now = Date.now()

    db.orders.unshift({
      orderNo,
      status: ORDER_STATUS.UNPAID,
      items: orderItems,
      totalAmount,                     // 商品小计
      freight,                         // 运费
      discountAmount,                  // 优惠合计（预留结构，V1 恒 0）
      payAmount: totalAmount + freight - discountAmount, // 实付 = 服务端唯一口径
      remark: String(params.remark || '').slice(0, 200),
      addressSnapshot: { ...address }, // 地址快照固化
      createTime: now,
      payExpireAt: now + MALL_CONFIG.ORDER_PAY_TIMEOUT, // 15 分钟，库存锁定与支付截止同一时钟（§7.3 规则 4）
      payTime: null,
      shipTime: null,
      finishTime: null
    })

    return { orderNo, payAmount: totalAmount + freight - discountAmount, payExpireAt: now + MALL_CONFIG.ORDER_PAY_TIMEOUT }
  },

  /**
   * 订单分页列表（按状态筛选，PRD §5.7）
   * @param {{status?:string, page?:number, pageSize?:number}} params
   *   status: 'ALL' 或 ORDER_STATUS 之一
   * @returns {{list: Array<Object>, hasMore: boolean}}
   */
  'order.list'(params) {
    const { status = 'ALL', page = 1, pageSize = 10 } = params
    let list = db.orders
    if (status !== 'ALL') list = list.filter((o) => o.status === status)

    const start = (page - 1) * pageSize
    return { list: list.slice(start, start + pageSize), hasMore: start + pageSize < list.length }
  },

  /**
   * 订单详情（含状态时间轴数据源）
   * @param {{orderNo:string}} params
   * @throws 40403 订单不存在
   */
  'order.detail'(params) {
    const order = db.orders.find((o) => o.orderNo === params.orderNo)
    if (!order) throw { code: 40403, msg: '订单不存在' }
    return order
  },

  /**
   * 取消订单（仅待付款可取消；终态不可逆，PRD §6.2）
   * 取消即释放锁定库存：locked -> stock（PRD §7.2 规则 2）
   * @param {{orderNo:string}} params
   * @throws 40403 订单不存在 / 40005 当前状态不可取消
   */
  'order.cancel'(params) {
    const order = db.orders.find((o) => o.orderNo === params.orderNo)
    if (!order) throw { code: 40403, msg: '订单不存在' }
    if (order.status !== ORDER_STATUS.UNPAID) throw { code: 40005, msg: '当前状态不可取消' }

    order.status = ORDER_STATUS.CANCELED
    order.items.forEach((i) => {
      const sku = db.skus.find((s) => s.id === i.skuId)
      if (sku) { sku.stock += i.quantity; sku.locked -= i.quantity }
    })
    return {}
  },

  /**
   * 【mock 专用】模拟"微信支付回调"——真实接口无此通道
   * USE_MOCK=false 后此通道废弃，改走 uni.requestPayment + 服务端回调（§7.3）
   *
   * 覆盖 PRD 竞态规则（§7.3 规则 3）：
   * 超时后才"支付成功"的，真实环境 = 订单已取消 + 支付回执到达，
   * 服务端必须自动全额原路退款且不复活订单；mock 阶段直接抛错演示该场景
   *
   * @param {{orderNo:string}} params
   * @throws 40403 订单不存在 / 40005 状态异常 / 40006 已超时（竞态场景）
   */
  'order.mockPay'(params) {
    const order = db.orders.find((o) => o.orderNo === params.orderNo)
    if (!order) throw { code: 40403, msg: '订单不存在' }
    if (order.status !== ORDER_STATUS.UNPAID) throw { code: 40005, msg: '订单状态异常' }

    // 竞态校验：支付回执晚于 payExpireAt 到达
    if (Date.now() > order.payExpireAt) {
      throw { code: 40006, msg: '订单已超时（真实环境：自动原路退款，不复活订单，见 PRD §7.3）' }
    }

    order.status = ORDER_STATUS.PAID
    order.payTime = Date.now()
    // 支付成功：锁定库存转实扣（locked 清零，货权正式占用）
    order.items.forEach((i) => {
      const sku = db.skus.find((s) => s.id === i.skuId)
      if (sku) sku.locked -= i.quantity
    })
    return { orderNo: order.orderNo, paidAt: order.payTime }
  }
}
