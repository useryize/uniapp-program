/**
 * @file HTTP 请求封装
 *
 * 只负责「发请求 + 统一错误对象」，不做缓存（缓存在 api/index.ts）。
 */

import type { ApiError } from './types'

/** 默认超时 8s（Audius 实测均值 2.5s，留 3 倍余量） */
const DEFAULT_TIMEOUT = 8000

export interface RequestOptions {
  timeout?: number
  /** 失败重试次数，默认 1（即最多请求 2 次） */
  retries?: number
}

/**
 * 发起 GET 请求
 * @throws {ApiError} 携带 code / msg
 */
export function get<T = unknown>(url: string, { timeout = DEFAULT_TIMEOUT, retries = 1 }: RequestOptions = {}): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    let attempt = 0

    const run = (): void => {
      uni.request({
        url,
        method: 'GET',
        timeout,
        header: { Accept: 'application/json' },
        success: (res) => {
          if (res.statusCode >= 200 && res.statusCode < 300 && res.data) {
            resolve(res.data as T)
            return
          }
          const err: ApiError = new Error(`HTTP ${res.statusCode}`)
          err.code = res.statusCode
          err.msg = res.statusCode === 429 ? '请求太频繁，稍后再试' : '内容加载失败'
          if (attempt < retries) {
            attempt += 1
            setTimeout(run, 600 * attempt)
          } else {
            reject(err)
          }
        },
        fail: (e) => {
          const err: ApiError = new Error(e.errMsg || '网络异常')
          err.code = -1
          err.msg = e.errMsg || '网络异常，请检查网络设置'
          if (attempt < retries) {
            attempt += 1
            setTimeout(run, 600 * attempt)
          } else {
            reject(err)
          }
        }
      })
    }

    run()
  })
}

export type QueryValue = string | number | boolean | undefined | null

/** 拼接查询串，自动跳过 undefined / null / 空字符串 */
export function qs(params: Record<string, QueryValue> = {}): string {
  const parts: string[] = []
  Object.keys(params).forEach((k) => {
    const v = params[k]
    if (v === undefined || v === null || v === '') return
    parts.push(`${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
  })
  return parts.length ? `?${parts.join('&')}` : ''
}
