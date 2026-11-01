/**
 * @file 本地画像（每日推荐与理由生成的数据来源）
 *
 * 全部存 storage，不依赖服务端（规格 §8.2.1）。
 * 曲风计分带 7 天半衰：隔得久的口味权重会自然降低。
 */

const KEY_PROFILE = 'm_profile'
const KEY_FAVS = 'm_favs'
const KEY_RECENT = 'm_recent'

const DECAY_DAYS = 7
const RECENT_LIMIT = 100
const FAV_LIMIT = 500

/** 生成设备随机种子：同一天不同设备看到不同推荐（规格 §8.2.1） */
function makeSeed() {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`
}

function read(key, fallback) {
  try {
    const v = uni.getStorageSync(key)
    return v === '' || v === undefined || v === null ? fallback : v
  } catch (e) {
    return fallback
  }
}

function write(key, value) {
  try {
    uni.setStorageSync(key, value)
  } catch (e) {
    // 忽略
  }
}

/** 读取画像，缺失时初始化 */
export function getProfile() {
  const p = read(KEY_PROFILE, null)
  if (p && p.deviceSeed) return p
  const fresh = { deviceSeed: makeSeed(), genreScores: {}, artistPlays: {} }
  write(KEY_PROFILE, fresh)
  return fresh
}

/**
 * 记录一次播放：曲风加分 + 艺人计数
 * @param {{genre?:string, artistId?:string, artistName?:string}} track
 */
export function recordPlay(track) {
  if (!track) return
  const p = getProfile()
  const now = Date.now()

  if (track.genre) {
    const prev = p.genreScores[track.genre] || { score: 0, ts: now }
    // 按距上次的天数做指数衰减，再累加本次
    const days = Math.max(0, (now - (prev.ts || now)) / 86400000)
    const decayed = (prev.score || 0) * Math.pow(0.5, days / DECAY_DAYS)
    p.genreScores[track.genre] = { score: decayed + 1, ts: now }
  }

  if (track.artistId) {
    const key = track.artistId
    p.artistPlays[key] = (p.artistPlays[key] || 0) + 1
  }

  write(KEY_PROFILE, p)

  // 最近播放（最多 100 条，按时间倒序，同曲去重置顶）
  const recent = read(KEY_RECENT, [])
  const filtered = recent.filter((t) => t.id !== track.id)
  filtered.unshift({
    id: track.id,
    title: track.title,
    artistName: track.artistName,
    cover: track.cover,
    duration: track.duration,
    genre: track.genre,
    playCount: track.playCount,
    streamable: true
  })
  write(KEY_RECENT, filtered.slice(0, RECENT_LIMIT))
}

/** 按权重排序取前 N 个曲风 */
export function topGenres(n = 3) {
  const p = getProfile()
  return Object.keys(p.genreScores)
    .map((g) => ({ genre: g, score: p.genreScores[g].score || 0 }))
    .sort((a, b) => b.score - a.score)
    .slice(0, n)
    .map((x) => x.genre)
}

/** 最近 7 天听过的曲目 id（用于从每日推荐里剔除） */
export function recentTrackIds(days = 7) {
  const recent = read(KEY_RECENT, [])
  // 最近播放列表没有逐条时间戳，用「最近 N 条」近似最近 N 天
  return recent.slice(0, 60).map((t) => t.id).slice(0, days * 8)
}

/** 收藏列表 */
export function getFavs() {
  return read(KEY_FAVS, [])
}

/** 是否已收藏 */
export function isFav(trackId) {
  return getFavs().some((t) => t.id === trackId)
}

/** 切换收藏，返回切换后的状态 */
export function toggleFav(track) {
  if (!track) return false
  const favs = getFavs()
  const i = favs.findIndex((t) => t.id === track.id)

  if (i >= 0) {
    favs.splice(i, 1)
    write(KEY_FAVS, favs)
    return false
  }

  favs.unshift({
    id: track.id,
    title: track.title,
    artistName: track.artistName,
    cover: track.cover,
    duration: track.duration,
    genre: track.genre,
    playCount: track.playCount,
    streamable: track.streamable !== false,
    savedAt: Date.now()
  })
  write(KEY_FAVS, favs.slice(0, FAV_LIMIT))
  return true
}

/** 最近播放列表 */
export function getRecent() {
  return read(KEY_RECENT, [])
}

/** 清空最近播放 */
export function clearRecent() {
  write(KEY_RECENT, [])
}

/** 艺人在最近播放里出现过的次数（理由文案用） */
export function artistPlayCount(artistId) {
  if (!artistId) return 0
  const p = getProfile()
  return p.artistPlays[artistId] || 0
}
