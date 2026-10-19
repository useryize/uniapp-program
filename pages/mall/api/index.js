/**
 * @file 商城接口层统一出口 —— 页面获取数据的唯一入口
 *
 * 架构规则（对齐 docs/PRD-商城-v1.1-架构版.md §10 集成边界）：
 * 1. 页面只 import 本文件，禁止直接 import mock 或 http
 * 2. USE_MOCK = true  → 走 mock 内存服务（mock/index.js）
 *    USE_MOCK = false → 走真实接口（api/http.js）
 *    两者响应同构，页面拿到的都是解包后的纯 data，切换零改动
 * 3. channel（mock 通道）与 url（真实接口路径）一一对应，新增接口两处同步加
 * 4. 金额一律整数分；任何"价格/库存"类入参仅作展示参考，以服务端返回为准
 */

import { MALL_CONFIG } from '../config'
import { http } from './http'
import { mock } from '../mock'

/**
 * 统一调用入口：按开关路由 mock / 真实接口，并解包响应
 * @param {string} channel mock 通道名（'domain.action'）
 * @param {string} url 真实接口相对路径（USE_MOCK=false 时使用）
 * @param {Object} [params] 业务参数
 * @param {'GET'|'POST'|'PUT'|'DELETE'} [method]
 * @returns {Promise<Object>} 成功时 resolve 纯 data；失败 reject { code, msg }
 */
function call(channel, url, params = {}, method = 'GET') {
  const promise = MALL_CONFIG.USE_MOCK
    ? mock(channel, params)
    : http({ url, data: params, method })

  return promise.then((res) => {
    if (res.code !== 0) return Promise.reject(res)
    return res.data
  })
}

/** 商品域（PRD 板块①②） */
export const goodsApi = {
  /** 商品分页列表 @param {{page?:number, pageSize?:number, categoryId?:number, keyword?:string}} params */
  list: (params) => call('goods.list', '/goods/list', params),

  /** 商品详情（含 SKU 列表）@param {{id:number}} params */
  detail: (params) => call('goods.detail', '/goods/detail', params)
}

/** 购物车域（PRD 板块③） */
export const cartApi = {
  /** 购物车列表（含服务端计算的已选合计） */
  list: () => call('cart.list', '/cart/list', {}),

  /** 加购：{ goodsId, skuId?, quantity? }，skuId 缺省自动选有库存 SKU */
  add: (params) => call('cart.add', '/cart/add', params, 'POST'),

  /** 改数量：{ id, quantity }，上限为可售库存 */
  updateQty: (params) => call('cart.updateQty', '/cart/qty', params, 'POST'),

  /** 单项勾选：{ id, checked } */
  setChecked: (params) => call('cart.setChecked', '/cart/checked', params, 'POST'),

  /** 全选：{ checked } */
  checkAll: (params) => call('cart.checkAll', '/cart/check-all', params, 'POST'),

  /** 删除：{ ids: string[] }，前端需二次确认后调用 */
  remove: (params) => call('cart.remove', '/cart/remove', params, 'POST')
}

/** 订单域（PRD 板块④⑥） */
export const orderApi = {
  /**
   * 提交订单：{ items:[{skuId, quantity}], addressId, remark? }
   * 金额由服务端计算，入参中任何金额字段都会被忽略
   * @returns {{orderNo:string, payAmount:number, payExpireAt:number}}
   */
  create: (params) => call('order.create', '/order/create', params, 'POST'),

  /** 订单列表：{ status:'ALL'|'UNPAID'|'PAID'|'SHIPPED'|'FINISHED'|'CANCELED', page? } */
  list: (params) => call('order.list', '/order/list', params),

  /** 订单详情：{ orderNo } */
  detail: (params) => call('order.detail', '/order/detail', params),

  /** 取消订单（仅待付款）：{ orderNo }，取消即释放锁定库存 */
  cancel: (params) => call('order.cancel', '/order/cancel', params, 'POST'),

  /**
   * 【mock 专用】模拟微信支付回调：{ orderNo }
   * USE_MOCK=false 后此通道废弃——真实支付走 uni.requestPayment，
   * 支付结果以服务端回调为唯一依据（PRD §7.3）
   */
  mockPay: (params) => call('order.mockPay', '/order/mock-pay', params, 'POST')
}

/** 收货地址域（PRD 板块⑦） */
export const addressApi = {
  /** 地址列表（phone 需前端脱敏展示） */
  list: () => call('address.list', '/address/list', {}),

  /** 新增/编辑：{ id?, receiver, phone, region, detail, isDefault? } */
  save: (params) => call('address.save', '/address/save', params, 'POST'),

  /** 删除：{ id } */
  remove: (params) => call('address.remove', '/address/remove', params, 'POST'),

  /** 设默认：{ id } */
  setDefault: (params) => call('address.setDefault', '/address/set-default', params, 'POST')
}
