/**
 * @file 商品域 mock 处理器
 *
 * 通道命名规范：`domain.action`，
 * 与 api/index.js 中的 url 一一对应；新增接口 api 与 handler 同步加。
 */

import { db, CATEGORIES } from '../db'

/**
 * 收集类目及其全部后代 id（一级类目过滤时需包含其下二级类目商品）
 * @param {number} categoryId 类目 id
 * @returns {Array<number>} 类目 id 集合
 */
function categoryScope(categoryId) {
  const scope = [Number(categoryId)]
  const parent = CATEGORIES.find((c) => c.id === Number(categoryId))
  if (parent && parent.children) {
    parent.children.forEach((c) => scope.push(c.id))
  }
  return scope
}

export default {
  /**
   * 商品分页列表（PRD §5.3：列表必须分页，禁止全量返回）
   * @param {{page?:number, pageSize?:number, categoryId?:number, keyword?:string}} params
   *   - page/pageSize  分页参数，page 从 1 开始
   *   - categoryId     类目筛选（一级类目含其下二级），可选
   *   - keyword        标题模糊搜索，可选
   * @returns {{list: Array<Object>, total: number, hasMore: boolean}}
   *   list 每项附带 minPrice（该商品最低 SKU 价，服务端计算，前端不可传价）
   */
  'goods.list'(params) {
    const { page = 1, pageSize = 10, categoryId, keyword } = params

    // 仅上架商品对用户可见；下架商品从公开入口移除（PRD §①规则 4）
    let list = db.goods.filter((g) => g.status === 1)

    if (categoryId) {
      const scope = categoryScope(categoryId)
      list = list.filter((g) => scope.includes(g.categoryId))
    }
    if (keyword) list = list.filter((g) => g.title.includes(String(keyword)))

    const total = list.length
    const start = (page - 1) * pageSize
    const pageList = list.slice(start, start + pageSize).map((g) => {
      const skuPrices = db.skus.filter((s) => s.goodsId === g.id).map((s) => s.price)
      return { ...g, minPrice: skuPrices.length ? Math.min(...skuPrices) : 0 }
    })
    return { list: pageList, total, hasMore: start + pageSize < total }
  },

  /**
   * 类目树（分类页左侧栏 + 右侧过滤）
   * @returns {Array<Object>} 含 children 二级类目
   */
  'goods.categories'() {
    return CATEGORIES
  },

  /**
   * 商品详情（含 SKU 列表，供详情页规格选择器联动价格与库存）
   * 支持两种定位方式：{ id } 商品 ID，或 { skuId }（结算页直购场景反查商品）
   * @param {{id?:number, skuId?:number}} params
   * @returns {Object} 商品全量字段 + skuList
   * @throws {code:40401, msg:'商品不存在或已下架'}
   */
  'goods.detail'(params) {
    let goods
    if (params.skuId) {
      // 直购场景：由 SKU 反查所属商品
      const sku = db.skus.find((s) => s.id === Number(params.skuId))
      goods = sku && db.goods.find((g) => g.id === sku.goodsId)
    } else {
      goods = db.goods.find((g) => g.id === Number(params.id))
    }
    // 下架商品对详情页不可达（PRD §①规则 4：仅历史订单链接可达，mock 阶段直接拒绝）
    if (!goods || goods.status !== 1) {
      throw { code: 40401, msg: '商品不存在或已下架' }
    }
    return {
      ...goods,
      skuList: db.skus.filter((s) => s.goodsId === goods.id)
    }
  }
}
