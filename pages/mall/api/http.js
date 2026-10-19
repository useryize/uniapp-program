/**
 * @file 商城真实请求封装（USE_MOCK = false 时启用）
 *
 * 说明：
 * - 独立于根目录 utils/request.js（那是壁纸模块对接 Pexels 的专用封装，
 *   含固定 Authorization，商城不共用，避免互相污染）
 * - 统一响应约定：HTTP 200 且 body 为 { code: 0, data, msg } 视为成功，
 *   其余一律 reject { code, msg }——与 mock 引擎的响应结构完全一致
 * - token 由登录模块写入 Storage('mall_token')，此处自动附带
 */

import { MALL_CONFIG } from '../config'

/**
 * 发起真实 HTTP 请求
 * @param {{url:string, data?:Object, method?:'GET'|'POST'|'PUT'|'DELETE'}} options
 *   url 为相对路径（不含域名与前缀），由本层拼接 BASE_URL + API_PREFIX
 * @returns {Promise<{code:number, data:Object, msg:string}>} 统一响应结构
 * @rejects {{code:number, msg:string}} 401 登录过期 / 其他业务或网络错误
 */
export function http({ url, data = {}, method = 'GET' }) {
  const token = uni.getStorageSync('mall_token') || ''

  return new Promise((resolve, reject) => {
    uni.request({
      url: MALL_CONFIG.BASE_URL + MALL_CONFIG.API_PREFIX + url,
      data,
      method,
      header: token ? { Authorization: `Bearer ${token}` } : {},
      success: (res) => {
        // 401：登录态失效，清 token 交由页面/拦截层引导重新登录
        if (res.statusCode === 401) {
          uni.removeStorageSync('mall_token')
          reject({ code: 401, msg: '登录已过期' })
          return
        }
        if (res.statusCode === 200 && res.data && res.data.code === 0) {
          resolve(res.data)
        } else {
          reject(res.data || { code: res.statusCode, msg: '请求失败' })
        }
      },
      fail: (err) => reject({ code: -1, msg: err.errMsg || '网络异常' })
    })
  })
}
