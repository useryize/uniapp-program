/**
 * @file 发售日历域 mock 处理器（潮牌限量款）
 *
 * 业务规则（对齐设计稿「发售机制链」）：
 * - 三态：即将发售(soon) / 正在发售(live) / 已售罄(soldout)
 * - 即将发售 → 展示倒计时，可订阅开售提醒
 * - 正在发售 → 展示剩余库存，可直接抢购
 * - 已售罄 → 展示补货/到货提醒入口
 *
 * 真实环境由服务端实现（限量库存、抽签资格、订阅推送均为服务端职责）。
 */

import { db } from '../db'

export default {
  /**
   * 发售列表（按发售时间正序）
   * @param {{type?:'soon'|'live'|'soldout'}} params 状态筛选，缺省返回全部
   * @returns {Array<Object>} 发售项（附商品封面、标题、价格、倒计时基准）
   */
  'drop.list'(params) {
    let list = db.drops
    if (params.type) list = list.filter((d) => d.type === params.type)

    return list.map((d) => {
      const goods = db.goods.find((g) => g.id === d.goodsId)
      const skus = db.skus.filter((s) => s.goodsId === d.goodsId)
      return {
        id: d.id,
        goodsId: d.goodsId,
        type: d.type,
        title: d.title,
        cover: goods ? goods.cover : '',
        price: skus.length ? Math.min(...skus.map((s) => s.price)) : 0,
        originPrice: goods ? goods.originPrice : 0,
        startAt: d.startAt,
        endAt: d.endAt,
        limit: d.limit,
        sold: d.sold,
        remain: Math.max(0, d.limit - d.sold)
      }
    })
  },

  /**
   * 订阅发售提醒 / 到货提醒
   * mock 阶段仅回执（真实环境走微信订阅消息）
   * @param {{goodsId:number, type?:string}} params
   * @returns {{subscribed:boolean, goodsId:number}}
   */
  'drop.subscribe'(params) {
    const goodsId = Number(params.goodsId)
    if (!db.goods.find((g) => g.id === goodsId)) throw { code: 40401, msg: '商品不存在' }
    return { subscribed: true, goodsId }
  }
}
