/**
 * @file 页面唯一取数口
 *
 * 职责：
 * 1. 调用 source 适配器
 * 2. 用 normalizer 归一化
 * 3. 套 TTL 缓存（规格 §5.3）
 *
 * 页面只 import 这个文件，不要直接引 source/。
 */

import * as source from './source/audius.js'
import {
  normalizeTrack,
  normalizePlaylist,
  normalizeArtist,
  normalizeComment
} from './normalizer.js'

/* ---------------- TTL 缓存 ---------------- */

const CACHE_PREFIX = 'm_cache_'

/** 各接口的缓存时长（毫秒），见规格 §5.3 */
export const TTL = {
  home: 10 * 60 * 1000,
  chart: 10 * 60 * 1000,
  playlists: 10 * 60 * 1000,
  playlistDetail: 30 * 60 * 1000,
  artist: 60 * 60 * 1000,
  search: 5 * 60 * 1000
}

function readCache(key) {
  try {
    const box = uni.getStorageSync(CACHE_PREFIX + key)
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

function writeCache(key, value, ttl) {
  try {
    uni.setStorageSync(CACHE_PREFIX + key, { value, expire: Date.now() + ttl })
  } catch (e) {
    // 存储写满时静默失败，不影响主流程
  }
}

/**
 * 带缓存的取数
 * @param {string} key 缓存键
 * @param {number} ttl 有效期
 * @param {Function} loader 返回 Promise 的取数函数
 * @param {boolean} [force] 跳过缓存（下拉刷新用）
 */
async function withCache(key, ttl, loader, force = false) {
  if (!force) {
    const hit = readCache(key)
    if (hit) return hit
  }
  const value = await loader()
  writeCache(key, value, ttl)
  return value
}

/** 清缓存。prefix 为空则清整个音乐模块（下拉刷新用） */
export function clearCache(prefix = '') {
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

/**
 * 热门曲目
 * @param {{time?:string, genre?:string, limit?:number, force?:boolean}} p
 */
export function fetchTrending({ time = 'week', genre = '', limit = 20, force = false } = {}) {
  // genre 为空串时不传该参数（传 All 会返回空，见规格 §1.1）
  const key = `home_${time}_${genre || 'all'}_${limit}`
  return withCache(
    key,
    TTL.chart,
    async () => {
      const raw = await source.trendingTracks({ time, genre, limit })
      return raw.map(normalizeTrack).filter((t) => t && t.streamable && !t.isGated)
    },
    force
  )
}

/**
 * 专题歌单
 * @param {{time?:string, genre?:string, limit?:number, force?:boolean}} p
 */
export function fetchPlaylists({ time = 'week', genre = '', limit = 10, force = false } = {}) {
  const key = `pls_${time}_${genre || 'all'}_${limit}`
  return withCache(
    key,
    TTL.playlists,
    async () => {
      const raw = await source.trendingPlaylists({ time, genre, limit })
      return raw.map(normalizePlaylist).filter(Boolean)
    },
    force
  )
}

/** 歌单详情（名称 / 封面 / 曲目数） */
export function fetchPlaylistDetail(id, force = false) {
  return withCache(
    `pl_${id}`,
    TTL.playlistDetail,
    async () => normalizePlaylist(await source.playlistDetail(id)),
    force
  )
}

/** 歌单曲目 */
export function fetchPlaylistTracks(id, force = false) {
  return withCache(
    `pltracks_${id}`,
    TTL.playlistDetail,
    async () => {
      const raw = await source.playlistTracks(id)
      return raw.map(normalizeTrack).filter((t) => t && t.streamable)
    },
    force
  )
}

/** 艺人信息 */
export function fetchArtist(id, force = false) {
  return withCache(
    `artist_${id}`,
    TTL.artist,
    async () => normalizeArtist(await source.userDetail(id)),
    force
  )
}

/** 艺人作品，按播放量降序（规格 §8.7） */
export function fetchArtistTracks(id, force = false) {
  return withCache(
    `artisttr_${id}`,
    TTL.artist,
    async () => {
      const raw = await source.userTracks(id, 30)
      return raw
        .map(normalizeTrack)
        .filter((t) => t && t.streamable)
        .sort((a, b) => b.playCount - a.playCount)
    },
    force
  )
}

/**
 * 三 Tab 并行搜索（规格 §8.6：三个接口并行发起，各自独立骨架屏）
 * @returns {Promise<{tracks:Array, playlists:Array, artists:Array}>}
 */
export async function searchAll(query) {
  const q = (query || '').trim()
  if (q.length < 2) return { tracks: [], playlists: [], artists: [] }

  const key = `q_${q}`
  return withCache(key, TTL.search, async () => {
    const [tracks, playlists, artists] = await Promise.all([
      source.searchTracks(q, 20).catch(() => []),
      source.searchPlaylists(q, 20).catch(() => []),
      source.searchUsers(q, 20).catch(() => [])
    ])
    return {
      tracks: tracks.map(normalizeTrack).filter((t) => t && t.streamable),
      playlists: playlists.map(normalizePlaylist).filter(Boolean),
      artists: artists.map(normalizeArtist).filter(Boolean)
    }
  })
}

/**
 * 音频直链
 * ⚠️ 故意不缓存：签名带时间戳，短期失效（规格 §5.3）
 */
export function fetchStreamUrl(trackId) {
  return Promise.resolve(source.streamUrl(trackId))
}

/** 时间轴评论，只保留带时间戳的（无时间戳的不参与弹幕） */
export function fetchComments(trackId, limit = 30) {
  return withCache(
    `cm_${trackId}`,
    TTL.chart,
    async () => {
      const raw = await source.trackComments(trackId, limit)
      return raw
        .map(normalizeComment)
        .filter((c) => c && c.text && c.timestamp > 0)
        .sort((a, b) => a.timestamp - b.timestamp)
    }
  )
}

/** 调试用：当前生效的 BASE */
export function currentBase() {
  return source.debugBase ? source.debugBase() : ''
}
