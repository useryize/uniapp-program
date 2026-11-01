/**
 * @file 格式化工具
 */

/** 秒 → m:ss */
export function formatDuration(sec) {
  const s = Math.max(0, Math.floor(Number(sec) || 0))
  const m = Math.floor(s / 60)
  const r = s % 60
  return `${m}:${r < 10 ? '0' : ''}${r}`
}

/** 秒 → h:mm:ss（歌单总时长） */
export function formatTotalDuration(sec) {
  const s = Math.max(0, Math.floor(Number(sec) || 0))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  if (h <= 0) return `${m} 分钟`
  return `${h} 小时 ${m} 分`
}

/**
 * 播放量 → 1.9k / 2.4 万
 * Audius 的 play_count 是六位数级别，中文语境用「万」更顺
 */
export function formatPlayCount(n) {
  const v = Number(n) || 0
  if (v >= 10000) {
    const w = v / 10000
    return `${w >= 10 ? Math.round(w) : w.toFixed(1).replace(/\.0$/, '')} 万`
  }
  if (v >= 1000) return `${(v / 1000).toFixed(1).replace(/\.0$/, '')}k`
  return String(v)
}

/** 关注者数量：1.2 万位关注者 */
export function formatFollowerCount(n) {
  const v = Number(n) || 0
  if (v >= 10000) return `${(v / 10000).toFixed(1).replace(/\.0$/, '')} 万位关注者`
  return `${v} 位关注者`
}

/** Date → YYYY-MM-DD（每日推荐的 seed 依赖它，必须本地时区） */
export function dateKey(d = new Date()) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** 日号：01 */
export function dayNo(d = new Date()) {
  return String(d.getDate()).padStart(2, '0')
}

/** 月份英文缩写：NOV */
const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
export function monthAbbr(d = new Date()) {
  return MONTHS[d.getMonth()]
}

/** 相对时间：10 分钟前更新 */
export function timeAgo(ts) {
  const diff = Math.max(0, Date.now() - Number(ts || 0))
  const min = Math.floor(diff / 60000)
  if (min < 1) return '刚刚更新'
  if (min < 60) return `${min} 分钟前更新`
  const h = Math.floor(min / 60)
  if (h < 24) return `${h} 小时前更新`
  return `${Math.floor(h / 24)} 天前更新`
}

/** 文本截断（曲名过长时） */
export function ellipsis(str, max = 24) {
  const s = String(str || '')
  return s.length > max ? `${s.slice(0, max)}…` : s
}
