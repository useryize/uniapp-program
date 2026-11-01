/**
 * @file Audius 数据源适配器
 *
 * 只做「拼 URL + 调接口」，不含业务判断。归一化在 ../normalizer.ts，缓存与对外 API 在 ../index.ts。
 *
 * ⚠️ 关键约束（实测，见规格 §1.1）
 * 1. genre=All 返回空数组 —— 调用方传空字符串时这里直接不拼该参数
 * 2. api.audius.co 无 ICP 备案，小程序端需在后台配置域名（见 docs/域名与备案.md）
 * 3. 音频直链是 302 签名地址，短期有效，不可落库
 */

import { get, qs } from '../http'
import type {
  AudiusRawTrack,
  AudiusRawPlaylist,
  AudiusRawUser,
  AudiusRawComment,
  AudiusListResponse
} from '../normalizer'

/** 官方网关 */
const DIRECT_BASE = 'https://api.audius.co/v1'

let BASE: string = DIRECT_BASE

// #ifdef MP-WEIXIN
// 小程序 request 合法域名会校验，需在后台把 api.audius.co 加入 request 合法域名，
// 或部署中转后改成自己的域名（见 docs/域名与备案.md）。
// 调试期可在开发者工具勾选「不校验合法域名」，此时保持直连即可。
// #endif

/** Audius 要求带 app_name，随便一个稳定字符串即可 */
const APP_NAME = 'independent_music_miniapp'

type AppParams = Record<string, string | number | boolean | undefined>

const withApp = (params: AppParams = {}): AppParams => ({ app_name: APP_NAME, ...params })

export interface TrendingParams {
  time?: 'week' | 'month' | 'allTime'
  genre?: string
  limit?: number
  offset?: number
  /** 允许透传其他查询参数（Audius 侧还有若干可选筛选） */
  [key: string]: string | number | boolean | undefined
}

/* ---------------- 曲目 ---------------- */

/** 热门曲目（带 user 对象，列表页一律用 full/ 版本，省一次艺人请求） */
export async function trendingTracks(p: TrendingParams = {}): Promise<AudiusRawTrack[]> {
  const data = await get<AudiusListResponse<AudiusRawTrack>>(`${BASE}/full/tracks/trending${qs(withApp(p))}`)
  return data.data || []
}

/** 搜索曲目 */
export async function searchTracks(query: string, limit = 20): Promise<AudiusRawTrack[]> {
  const data = await get<AudiusListResponse<AudiusRawTrack>>(`${BASE}/tracks/search${qs(withApp({ query, limit }))}`)
  return data.data || []
}

/**
 * 音频流地址
 * 直接返回接口 URL，交给播放器跟随 302。
 * ⚠️ 不可缓存：签名带时间戳，短期失效（规格 §5.3）
 */
export function streamUrl(trackId: string): string {
  return `${BASE}/tracks/${trackId}/stream${qs(withApp())}`
}

/** 时间轴评论（差异化功能，返回带 track_timestamp_s） */
export async function trackComments(trackId: string, limit = 20): Promise<AudiusRawComment[]> {
  const data = await get<AudiusListResponse<AudiusRawComment>>(`${BASE}/tracks/${trackId}/comments${qs(withApp({ limit }))}`)
  return data.data || []
}

/* ---------------- 歌单 ---------------- */

/** 专题歌单推荐 */
export async function trendingPlaylists(p: TrendingParams = {}): Promise<AudiusRawPlaylist[]> {
  const data = await get<AudiusListResponse<AudiusRawPlaylist>>(`${BASE}/playlists/trending${qs(withApp(p))}`)
  return data.data || []
}

/** 歌单详情 */
export async function playlistDetail(playlistId: string): Promise<AudiusRawPlaylist | null> {
  const data = await get<AudiusListResponse<AudiusRawPlaylist>>(`${BASE}/playlists/${playlistId}${qs(withApp())}`)
  return data.data?.[0] || null
}

/** 歌单曲目 */
export async function playlistTracks(playlistId: string): Promise<AudiusRawTrack[]> {
  const data = await get<AudiusListResponse<AudiusRawTrack>>(`${BASE}/playlists/${playlistId}/tracks${qs(withApp())}`)
  return data.data || []
}

/** 搜索歌单 */
export async function searchPlaylists(query: string, limit = 20): Promise<AudiusRawPlaylist[]> {
  const data = await get<AudiusListResponse<AudiusRawPlaylist>>(`${BASE}/full/playlists/search${qs(withApp({ query, limit }))}`)
  return data.data || []
}

/* ---------------- 艺人 ---------------- */

/** 艺人信息 */
export async function userDetail(userId: string): Promise<AudiusRawUser | null> {
  const data = await get<AudiusListResponse<AudiusRawUser>>(`${BASE}/users/${userId}${qs(withApp())}`)
  return data.data?.[0] || null
}

/** 艺人作品 */
export async function userTracks(userId: string, limit = 20): Promise<AudiusRawTrack[]> {
  const data = await get<AudiusListResponse<AudiusRawTrack>>(`${BASE}/users/${userId}/tracks${qs(withApp({ limit }))}`)
  return data.data || []
}

/** 搜索艺人 */
export async function searchUsers(query: string, limit = 20): Promise<AudiusRawUser[]> {
  const data = await get<AudiusListResponse<AudiusRawUser>>(`${BASE}/users/search${qs(withApp({ query, limit }))}`)
  return data.data || []
}

/** 调试用：当前生效的 BASE（确认小程序端是否走了中转） */
export function debugBase(): string {
  return BASE
}
