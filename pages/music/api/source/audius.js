/**
 * @file Audius 数据源适配器
 *
 * 只做「把 Audius 的字段翻译成内部模型」和「拼 URL」，不含业务判断。
 * 归一化在 ../normalizer.js，缓存与对外 API 在 ../index.js。
 *
 * ⚠️ 关键约束（实测，见规格 §1.1）
 * 1. `genre=All` 返回空数组 —— 调用方传空字符串时这里直接不拼该参数
 * 2. `api.audius.co` 无 ICP 备案，小程序端必须走自建中转（见下方 BASE）
 * 3. 音频直链是 302 签名地址，短期有效，不可落库
 */

import { get, qs } from '../http.js'

/** 官方网关。H5 / 开发环境直连可用 */
const DIRECT_BASE = 'https://api.audius.co/v1'

/**
 * 自建中转地址（小程序端用）。
 * 部署后把这里改成自己的备案域名，路径结构与官方一致即可。
 */
let BASE = DIRECT_BASE

// #ifdef MP-WEIXIN
// ⚠️ 小程序 request 合法域名会实时校验 ICP 备案，api.audius.co 未备案会被拦。
//
// 【调试期】保持下面注释状态（直连），并在微信开发者工具勾选
//   详情 → 本地设置 → 不校验合法域名、web-view、TLS 版本以及 HTTPS 证书
//   注意：仅开发者工具和手机调试模式有效，真机预览/正式版一律校验。
//
// 【上线前】备案并部署中转服务后，取消注释并改成自己的域名：
//   BASE = 'https://api.yourdomain.com/v1/audius'
//   同时在 api/index.js 里给封面图接 IMG_PROXY（见 docs/域名与备案.md §5）
//
// BASE = 'https://api.yourdomain.com/v1/audius'
// #endif

/** Audius 要求带 app_name，随便一个稳定字符串即可 */
const APP_NAME = 'independent_music_miniapp'

const withApp = (params = {}) => ({ app_name: APP_NAME, ...params })

/* ---------------- 曲目 ---------------- */

/**
 * 热门曲目（带 user 对象，列表页一律用 full/ 版本，省一次艺人请求）
 * @param {{time?:string, genre?:string, limit?:number, offset?:number}} p
 */
export async function trendingTracks(p = {}) {
  const data = await get(`${BASE}/full/tracks/trending${qs(withApp(p))}`)
  return data.data || []
}

/** 搜索曲目 */
export async function searchTracks(query, limit = 20) {
  const data = await get(`${BASE}/tracks/search${qs(withApp({ query, limit }))}`)
  return data.data || []
}

/**
 * 音频流地址
 * 直接返回接口 URL，交给播放器跟随 302。
 * ⚠️ 不可缓存：签名带时间戳，短期失效（规格 §5.3）
 */
export function streamUrl(trackId) {
  return `${BASE}/tracks/${trackId}/stream${qs(withApp())}`
}

/** 时间轴评论（差异化功能，返回带 track_timestamp_s） */
export async function trackComments(trackId, limit = 20) {
  const data = await get(`${BASE}/tracks/${trackId}/comments${qs(withApp({ limit }))}`)
  return data.data || []
}

/* ---------------- 歌单 ---------------- */

/** 专题歌单推荐 */
export async function trendingPlaylists(p = {}) {
  const data = await get(`${BASE}/playlists/trending${qs(withApp(p))}`)
  return data.data || []
}

/** 歌单详情 */
export async function playlistDetail(playlistId) {
  const data = await get(`${BASE}/playlists/${playlistId}${qs(withApp())}`)
  return data.data || null
}

/** 歌单曲目 */
export async function playlistTracks(playlistId) {
  const data = await get(`${BASE}/playlists/${playlistId}/tracks${qs(withApp())}`)
  return data.data || []
}

/** 搜索歌单 */
export async function searchPlaylists(query, limit = 20) {
  const data = await get(`${BASE}/full/playlists/search${qs(withApp({ query, limit }))}`)
  return data.data || []
}

/* ---------------- 艺人 ---------------- */

/** 艺人信息 */
export async function userDetail(userId) {
  const data = await get(`${BASE}/users/${userId}${qs(withApp())}`)
  return data.data || null
}

/** 艺人作品 */
export async function userTracks(userId, limit = 20) {
  const data = await get(`${BASE}/users/${userId}/tracks${qs(withApp({ limit }))}`)
  return data.data || []
}

/** 搜索艺人 */
export async function searchUsers(query, limit = 20) {
  const data = await get(`${BASE}/users/search${qs(withApp({ query, limit }))}`)
  return data.data || []
}

/** 调试用：当前生效的 BASE（确认小程序端是否走了中转） */
export function debugBase() {
  return BASE
}
