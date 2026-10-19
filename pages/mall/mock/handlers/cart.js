/**
 * @file 购物车域 mock 处理器
 *
 * 业务规则（PRD §③）：
 * - 加购即校验可售状态与库存上限，校验不通过不允许加购
 * - 购物车落服务端（跨设备同步），本地仅缓存
 * - 结算页价格以服务端实时计价为准，与加购时不一致须提示（价格变动告知）
 */

import { db, nextId } from '../db'
import { MALL_CONFIG } from '../../config'

/**
 * 联表组装购物车展示项：附加商品标题/规格/实时单价/最新库存
 * 单价取 SKU 实时价格（price），前端展示与结算均以此为唯一依据
 * @param {{id:string, goodsId:number, skuId:number, quantity:number, checked:boolean}} item
 * @returns {Object} 附加快照字段的购物车项
 */
function attachGoods(item) {
  const goods = db.goods.find((g) => g.id === item.goodsId)
  const sku = db.skus.find((s) => s.id === item.skuId)
  return {
    ...item,
    title: goods ? goods.title : '商品已失效',
    color: goods ? goods.color : '#888780',
    cover: goods ? goods.cover : '',
    spec: sku ? sku.spec : '',
    price: sku ? sku.price : 0,       // 实时单价（分）
    stock: sku ? sku.stock : 0,       // 最新可售库存
    invalid: !goods || goods.status !== 1 || !sku || sku.stock <= 0 // 失效商品置灰（PRD §5.5）
  }
}

export default {
  /**
   * 购物车列表（含已选合计：金额为服务端计算，前端只展示）
   * @returns {{list: Array<Object>, checkedCount: number, checkedAmount: number}}
   */
  'cart.list'() {
    const list = db.cart.map(attachGoods)
    const checked = list.filter((i) => i.checked && !i.invalid)
    return {
      list,
      checkedCount: checked.reduce((n, i) => n + i.quantity, 0),
      checkedAmount: checked.reduce((n, i) => n + i.quantity * i.price, 0)
    }
  },

  /**
   * 加入购物车
   * 简化约定：仅传 goodsId 不传 skuId 时，自动选择该商品第一个有库存的 SKU
   * （列表页快捷加购场景；详情页规格选择场景传明确 skuId）
   * @param {{goodsId:number, skuId?:number, quantity?:number}} params
   * @returns {{cartCount: number}} 加购后购物车总件数（供 tabBar 角标）
   * @throws 40401 SKU 不存在 / 40002 商品已下架 / 40001 超出可售库存
   */
  'cart.add'(params) {
    const goodsId = Number(params.goodsId)
    const goods = db.goods.find((g) => g.id === goodsId)
    if (!goods || goods.status !== 1) throw { code: 40002, msg: '商品已下架' }

    // 未指定 SKU 时自动选取第一个有库存的（库存模型见 db.js 头注释）
    let sku = params.skuId
      ? db.skus.find((s) => s.id === Number(params.skuId))
      : db.skus.find((s) => s.goodsId === goodsId && s.stock > 0)
    if (!sku || sku.goodsId !== goodsId) throw { code: 40401, msg: 'SKU 不存在或库存不足' }

    const quantity = Math.min(Number(params.quantity || 1), MALL_CONFIG.CART_MAX_QUANTITY)

    // 同 SKU 合并数量，且合并后不得超可售库存（加购即校验，PRD §③规则 1）
    const exist = db.cart.find((c) => c.skuId === sku.id)
    const willQty = (exist ? exist.quantity : 0) + quantity
    if (willQty > sku.stock) throw { code: 40001, msg: '超出可售库存' }

    if (exist) {
      exist.quantity = willQty
    } else {
      db.cart.push({ id: nextId('c'), goodsId, skuId: sku.id, quantity, checked: true })
    }
    return { cartCount: db.cart.reduce((n, i) => n + i.quantity, 0) }
  },

  /**
   * 修改数量（上限校验：不可超当前可售库存）
   * @param {{id:string, quantity:number}} params
   * @throws 40402 购物车项不存在 / 40001 超出可售库存
   */
  'cart.updateQty'(params) {
    const item = db.cart.find((c) => c.id === params.id)
    if (!item) throw { code: 40402, msg: '购物车项不存在' }

    const sku = db.skus.find((s) => s.id === item.skuId)
    const quantity = Number(params.quantity)
    if (!Number.isInteger(quantity) || quantity < 1) throw { code: 40007, msg: '数量不合法' }
    if (quantity > sku.stock) throw { code: 40001, msg: '超出可售库存' }

    item.quantity = quantity
    return {}
  },

  /**
   * 单项勾选/取消勾选
   * @param {{id:string, checked:boolean}} params
   */
  'cart.setChecked'(params) {
    const item = db.cart.find((c) => c.id === params.id)
    if (item) item.checked = !!params.checked
    return {}
  },

  /**
   * 全选/取消全选
   * @param {{checked:boolean}} params
   */
  'cart.checkAll'(params) {
    db.cart.forEach((c) => { c.checked = !!params.checked })
    return {}
  },

  /**
   * 删除购物车项（前端需二次确认后再调用，PRD §5.5）
   * @param {{ids:Array<string>}} params 购物车项 ID 数组
   */
  'cart.remove'(params) {
    const ids = (params.ids || []).map(Number)
    db.cart = db.cart.filter((c) => !ids.includes(c.id))
    return {}
  }
}
