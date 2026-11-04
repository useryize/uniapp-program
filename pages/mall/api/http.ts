/**
 * @file 商城真实请求封装（USE_MOCK = false 时启用）
 *
 * 说明：
 * - 独立于壁纸模块的数据层（位于 pages/wallpaper/api/），商城不共用
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
export function http({ url, data = {}, method = 'GET' }: {
  url: string
  data?: Record<string, unknown>
  method?: UniApp.RequestOptions['method']
}) {
  const token = uni.getStorageSync('mall_token') || ''

  return new Promise<{ code: number; data: any; msg?: string }>((resolve, reject) => {
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
        const body = res.data as { code?: number; data?: unknown; msg?: string } | null
        if (res.statusCode === 200 && body && body.code === 0) {
          resolve(body as { code: number; data: any; msg?: string })
        } else {
          reject(res.data || { code: res.statusCode, msg: '请求失败' })
        }
      },
      fail: (err) => reject({ code: -1, msg: err.errMsg || '网络异常' })
    })
  })
}
