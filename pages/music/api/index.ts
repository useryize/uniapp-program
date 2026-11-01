/**
 * @file 页面唯一取数口
 *
 * 职责：调 source 适配器 → normalizer 归一化 → 套 TTL 缓存（规格 §5.3）。
 * 页面只 import 这个文件，不要直接引 source/。
 */

import * as source from './source/audius'
import type { TrendingParams } from './source/audius'
import { normalizeTrack, normalizePlaylist, normalizeArtist, normalizeComment } from './normalizer'
import type { Track, Playlist, Artist, TrackComment, SearchResult } from './types'

/* ---------------- TTL 缓存 ---------------- */

const CACHE_PREFIX = 'm_cache_'

/** 各接口缓存时长（毫秒），见规格 §5.3 */
export const TTL = {
  chart: 10 * 60 * 1000,
  playlists: 10 * 60 * 1000,
  playlistDetail: 30 * 60 * 1000,
  artist: 60 * 60 * 1000,
  search: 5 * 60 * 1000
} as const

interface CacheBox<T> {
  value: T
  expire: number
}

function readCache<T>(key: string): T | null {
  try {
    const box = uni.getStorageSync(CACHE_PREFIX + key) as CacheBox<T> | ''
    if (!box || !box.expire) return null
    if (Date.now() > box.expire) {
      uni.removeStorageSync(CACHE_PREFIX + key)
      return null
    }
    return box.value
  } catch (e) {
    return null
  }
}

function writeCache<T>(key: string, value: T, ttl: number): void {
  try {
    const box: CacheBox<T> = { value, expire: Date.now() + ttl }
    uni.setStorageSync(CACHE_PREFIX + key, box)
  } catch (e) {
    // 存储写满时静默失败，不影响主流程
  }
}

async function withCache<T>(key: string, ttl: number, loader: () => Promise<T>, force = false): Promise<T> {
  if (!force) {
    const hit = readCache<T>(key)
    if (hit !== null) return hit
  }
  const value = await loader()
  writeCache(key, value, ttl)
  return value
}

/** 清缓存。prefix 为空则清整个音乐模块 */
export function clearCache(prefix = ''): void {
  try {
    const info = uni.getStorageInfoSync()
    info.keys
      .filter((k) => k.indexOf(CACHE_PREFIX + prefix) === 0)
      .forEach((k) => uni.removeStorageSync(k))
  } catch (e) {
    // 忽略
  }
}

/* ---------------- 对外 API ---------------- */

export interface FetchOptions extends TrendingParams {
  force?: boolean
}

/**
 * 热门曲目
 * genre 为空串时不传该参数（传 All 会返回空，见规格 §1.1）
 */
export function fetchTrending({ time = 'week', genre = '', limit = 20, force = false }: FetchOptions = {}): Promise<Track[]> {
  const key = `home_${time}_${genre || 'all'}_${limit}`
  return withCache<Track[]>(
    key,
    TTL.chart,
    async () => {
      const raw = await source.trendingTracks({ time, genre, limit })
      return raw
        .map(normalizeTrack)
        .filter((t): t is Track => !!t && t.streamable && !t.isGated)
    },
    force
  )
}

/** 专题歌单 */
export function fetchPlaylists({ time = 'week', genre = '', limit = 10, force = false }: FetchOptions = {}): Promise<Playlist[]> {
  const key = `pls_${time}_${genre || 'all'}_${limit}`
  return withCache<Playlist[]>(
    key,
    TTL.playlists,
    async () => {
      const raw = await source.trendingPlaylists({ time, genre, limit })
      return raw.map(normalizePlaylist).filter((p): p is Playlist => !!p)
    },
    force
  )
}

/** 歌单详情 */
export function fetchPlaylistDetail(id: string, force = false): Promise<Playlist | null> {
  return withCache<Playlist | null>(`pl_${id}`, TTL.playlistDetail, async () => normalizePlaylist(await source.playlistDetail(id)), force)
}

/** 歌单曲目 */
export function fetchPlaylistTracks(id: string, force = false): Promise<Track[]> {
  return withCache<Track[]>(
    `pltracks_${id}`,
    TTL.playlistDetail,
    async () => {
      const raw = await source.playlistTracks(id)
      return raw.map(normalizeTrack).filter((t): t is Track => !!t && t.streamable)
    },
    force
  )
}

/** 艺人信息 */
export function fetchArtist(id: string, force = false): Promise<Artist | null> {
  return withCache<Artist | null>(`artist_${id}`, TTL.artist, async () => normalizeArtist(await source.userDetail(id)), force)
}

/** 艺人作品，按播放量降序（规格 §8.7） */
export function fetchArtistTracks(id: string, force = false): Promise<Track[]> {
  return withCache<Track[]>(
    `artisttr_${id}`,
    TTL.artist,
    async () => {
      const raw = await source.userTracks(id, 30)
      return raw
        .map(normalizeTrack)
        .filter((t): t is Track => !!t && t.streamable)
        .sort((a, b) => b.playCount - a.playCount)
    },
    force
  )
}

/** 三 Tab 并行搜索（规格 §8.6：三个接口并行发起） */
export async function searchAll(query: string): Promise<SearchResult> {
  const q = (query || '').trim()
  if (q.length < 2) return { tracks: [], playlists: [], artists: [] }

  return withCache<SearchResult>(`q_${q}`, TTL.search, async () => {
    const [tracks, playlists, artists] = await Promise.all([
      source.searchTracks(q, 20).catch(() => []),
      source.searchPlaylists(q, 20).catch(() => []),
      source.searchUsers(q, 20).catch(() => [])
    ])
    return {
      tracks: tracks.map(normalizeTrack).filter((t): t is Track => !!t && t.streamable),
      playlists: playlists.map(normalizePlaylist).filter((p): p is Playlist => !!p),
      artists: artists.map(normalizeArtist).filter((a): a is Artist => !!a)
    }
  })
}

/**
 * 音频直链
 * ⚠️ 故意不缓存：签名带时间戳，短期失效（规格 §5.3）
 */
export function fetchStreamUrl(trackId: string): Promise<string> {
  return Promise.resolve(source.streamUrl(trackId))
}

/** 时间轴评论，只保留带时间戳的 */
export function fetchComments(trackId: string, limit = 30): Promise<TrackComment[]> {
  return withCache<TrackComment[]>(
    `cm_${trackId}`,
    TTL.chart,
    async () => {
      const raw = await source.trackComments(trackId, limit)
      return raw
        .map(normalizeComment)
        .filter((c): c is TrackComment => !!c && !!c.text && c.timestamp > 0)
        .sort((a, b) => a.timestamp - b.timestamp)
    }
  )
}

/** 调试用：当前生效的 BASE */
export function currentBase(): string {
  return source.debugBase()
}
