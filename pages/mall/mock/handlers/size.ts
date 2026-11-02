/**
 * @file 尺码域 mock 处理器（服装电商核心域）
 *
 * 业务规则（对齐设计稿「尺码决策链」与交互规格说明书 §P1）：
 * - 尺码推荐：由身高/体重/体型推算推荐码，服务端计算并给出依据
 * - 尺码表：随商品维度返回，推荐行由服务端标记（前端不做区间比较）
 * - 尺码档案：用户侧持久化数据，跨商品复用推荐结果，降低退换货率
 *
 * 真实环境由服务端实现，前端调用方式不变。
 */

import { db } from '../db'

/**
 * 体型枚举：影响胸围放量的修正量（cm）
 * Y 偏瘦 / A 标准 / B 偏胖
 */
const FIT_OFFSET = { Y: -4, A: 0, B: 4 }

/**
 * 尺码行匹配：按身高命中区间最接近的一行
 * 规则：从上往下遍历，命中第一个「身高 <= 行身高」的行
 * @param {Array} rows 尺码表行
 * @param {number} height 身高 cm
 * @returns {Object|null} 命中的尺码行
 */
function matchByHeight(rows, height) {
  let hit = null
  for (const row of rows) {
    if (height <= Number(row.height)) return row
    hit = row
  }
  return hit
}

/**
 * 尺码推荐计算（模块级，供 recommend / chart 复用）
 * @param {number} height 身高 cm
 * @param {number} weight 体重 kg
 * @param {string} fit 体型 Y/A/B
 * @returns {{size:string, reason:string, chart:Object, range:string}}
 * @throws 40008 身体数据不合法
 */
function calcRecommend(height, weight, fit) {
  if (!height || !weight || height < 100 || height > 220 || weight < 25 || weight > 200) {
    throw { code: 40008, msg: '请填写正确的身高体重' }
  }

  const chart = db.goods[0].sizeChart
  const row = matchByHeight(chart.rows, height) || chart.rows[0]
  const size = row.size
  const [wMin, wMax] = row.weight.split('-').map(Number)
  const wInRange = weight >= wMin && weight <= wMax

  const reasons = [`身高 ${height}cm 落在 ${size} 码区间`]
  reasons.push(wInRange ? `体重 ${weight}kg 符合该码` : `体重 ${weight}kg 略偏${weight > wMax ? '大' : '小'}，建议参考胸围`)
  if (FIT_OFFSET[fit]) {
    reasons.push(FIT_OFFSET[fit] > 0 ? '偏胖体型已放宽 4cm 胸围' : '偏瘦体型已收紧 4cm 胸围')
  }

  return { size, reason: reasons.join('，'), chart, range: `${row.height}cm / ${row.weight}kg` }
}

export default {
  /**
   * 尺码推荐
   * @param {{height:number, weight:number, fit?:'Y'|'A'|'B'}} params 身体数据
   * @returns {{size:string, reason:string, chart:Object, range:string}}
   * @throws 40008 身体数据不合法
   */
  'size.recommend'(params) {
    const fit = ['Y', 'A', 'B'].includes(params.fit) ? params.fit : 'A'
    return calcRecommend(Number(params.height), Number(params.weight), fit)
  },

  /**
   * 尺码表（含服务端标记的推荐行）
   * @param {{goodsId?:number, height?:number, weight?:number, fit?:string}} params
   * @returns {{unit:string, rows:Array<Object>, recommendSize:string}}
   */
  'size.chart'(params) {
    const goods = params.goodsId ? db.goods.find((g) => g.id === Number(params.goodsId)) : db.goods[0]
    const chart = goods ? goods.sizeChart : db.goods[0].sizeChart

    // 有身体数据时标记推荐行，否则不标记
    let recommendSize = ''
    if (params.height && params.weight) {
      try {
        recommendSize = calcRecommend(Number(params.height), Number(params.weight), params.fit || 'A').size
      } catch (e) {
        recommendSize = ''
      }
    }

    return {
      unit: chart.unit,
      recommendSize,
      rows: chart.rows.map((r) => ({ ...r, recommend: r.size === recommendSize }))
    }
  },

  /**
   * 读取用户尺码档案
   * @returns {{height:number, weight:number, fit:string, updatedAt:number}}
   */
  'size.profile.get'() {
    return { ...db.sizeProfile }
  },

  /**
   * 保存用户尺码档案
   * @param {{height:number, weight:number, fit?:string}} params
   * @returns {Object} 保存后的档案
   * @throws 40008 身体数据不合法
   */
  'size.profile.save'(params) {
    const height = Number(params.height)
    const weight = Number(params.weight)
    if (!height || !weight || height < 100 || height > 220 || weight < 25 || weight > 200) {
      throw { code: 40008, msg: '请填写正确的身高体重' }
    }
    db.sizeProfile = {
      height,
      weight,
      fit: ['Y', 'A', 'B'].includes(params.fit) ? params.fit : 'A',
      updatedAt: Date.now()
    }
    return { ...db.sizeProfile }
  }
}
