/**
 * @file HTTP 请求封装 + 本地缓存
 *
 * - 统一超时、重试、错误结构
 * - Storage 缓存：按 key + TTL 存储，避免重复消耗免费额度
 *   （缓存策略见 docs/接口选型方案.md §七）
 */

/** 默认超时 12s（小程序端网络波动较大） */
const DEFAULT_TIMEOUT = 12000

/**
 * 发起 GET 请求
 * @param {string} url 完整 URL
 * @param {Object} [options]
 * @param {number} [options.timeout] 超时毫秒
 * @param {number} [options.retries] 失败重试次数
 * @returns {Promise<any>} 解析后的 JSON
 * @throws {Error} 携带 code / msg
 */
export function get(url, { timeout = DEFAULT_TIMEOUT, retries = 1 } = {}) {
  return new Promise((resolve, reject) => {
    let attempt = 0

    const run = () => {
      uni.request({
        url,
        method: 'GET',
        timeout,
        header: { Accept: 'application/json' },
        success: (res) => {
          if (res.statusCode === 200 && res.data) {
            resolve(res.data)
          } else {
            const err = new Error(`HTTP ${res.statusCode}`)
            err.code = res.statusCode
            err.msg = `请求失败（${res.statusCode}）`
            if (attempt < retries) {
              attempt += 1
              setTimeout(run, 600 * attempt)
            } else {
              reject(err)
            }
          }
        },
        fail: (err) => {
          const e = new Error(err.errMsg || '网络异常')
          e.code = -1
          e.msg = err.errMsg || '网络异常，请检查网络设置'
          if (attempt < retries) {
            attempt += 1
            setTimeout(run, 600 * attempt)
          } else {
            reject(e)
          }
        }
      })
    }

    run()
  })
}

/**
 * 读缓存
 * @param {string} key 缓存键
 * @returns {any|null} 未命中返回 null
 */
export function cacheGet(key) {
  try {
    const raw = uni.getStorageSync(key)
    if (!raw) return null
    const item = typeof raw === 'string' ? JSON.parse(raw) : raw
    if (!item || typeof item.t !== 'number') return null
    if (Date.now() - item.t > (item.ttl || 0)) {
      uni.removeStorageSync(key)
      return null
    }
    return item.d
  } catch (e) {
    return null
  }
}

/**
 * 写缓存
 * @param {string} key 缓存键
 * @param {any} data 数据
 * @param {number} ttl 有效期毫秒
 */
export function cacheSet(key, data, ttl) {
  try {
    uni.setStorageSync(key, JSON.stringify({ t: Date.now(), ttl, d: data }))
  } catch (e) {
    // 存储失败不阻断主流程
  }
}

/**
 * 带缓存的 GET
 * @param {string} url 完整 URL
 * @param {string} cacheKey 缓存键
 * @param {number} ttl 缓存有效期毫秒
 * @param {Object} [options] get() 的选项
 * @returns {Promise<any>}
 */
export async function getCached(url, cacheKey, ttl, options = {}) {
  const hit = cacheGet(cacheKey)
  if (hit !== null) return hit
  const data = await get(url, options)
  cacheSet(cacheKey, data, ttl)
  return data
}
