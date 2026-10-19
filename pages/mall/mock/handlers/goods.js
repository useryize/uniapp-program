/**
 * @file 商品域 mock 处理器
 *
 * 通道命名规范：`domain.action`（如 goods.list），
 * 与 api/index.js 中的 url 一一对应；新增接口时 api 与 handler 同步添加。
 */

import { db } from '../db'

export default {
  /**
   * 商品分页列表（PRD §5.3：列表必须分页，禁止全量返回）
   * @param {{page?:number, pageSize?:number, categoryId?:number, keyword?:string}} params
   *   - page/pageSize  分页参数，page 从 1 开始
   *   - categoryId     类目筛选（可选）
   *   - keyword        标题模糊搜索（可选）
   * @returns {{list: Array<Object>, total: number, hasMore: boolean}}
   *   list 每项附带 minPrice（该商品最低 SKU 价，服务端计算，前端不可传价）
   */
  'goods.list'(params) {
    const { page = 1, pageSize = 10, categoryId, keyword } = params

    // 仅上架商品对用户可见；下架商品从公开入口移除（PRD §①规则 4）
    let list = db.goods.filter((g) => g.status === 1)

    if (categoryId) list = list.filter((g) => g.categoryId === Number(categoryId))
    if (keyword) list = list.filter((g) => g.title.includes(String(keyword)))

    const total = list.length
    const start = (page - 1) * pageSize
    const pageList = list.slice(start, start + pageSize).map((g) => {
      const skuPrices = db.skus.filter((s) => s.goodsId === g.id).map((s) => s.price)
      return { ...g, minPrice: Math.min(...skuPrices) }
    })

    return { list: pageList, total, hasMore: start + pageSize < total }
  },

  /**
   * 商品详情（含 SKU 列表，供详情页规格选择器联动价格与库存）
   * @param {{id:number}} params 商品 ID
   * @returns {Object} 商品全量字段 + skuList
   * @throws {{code:number, msg:string}} 40401 商品不存在或已下架
   */
  'goods.detail'(params) {
    const goods = db.goods.find((g) => g.id === Number(params.id))
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
