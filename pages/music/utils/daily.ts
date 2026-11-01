/**
 * @file 每日推荐算法（确定性抽样）
 *
 * 设计要点（规格 §8.2）：「每日推荐」的实质不是算法多聪明，而是三件事——
 *   ① 每天不一样  ② 同一天不变  ③ 听过的会消失
 * 只需本地数据即可达成，不需要服务端。
 *
 * 关键：seed = hash(dateKey + deviceSeed)，与请求时刻无关。
 * 所以同一天内退出重进多少次，结果逐条一致。
 */

import { fetchTrending } from '../api/index'
import { dateKey } from './format'
import { genreLabel } from '../data/genres'
import { getProfile, topGenres, recentTrackIds, getFavs, artistPlayCount } from './profile'
import type { Track, RecommendedTrack, DailyResult } from '../api/types'

const TARGET_COUNT = 30

/** FNV-1a 字符串哈希 → 32 位无符号整数 */
function hash(str: string): number {
  let h = 2166136261
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/** mulberry32：同一 seed 得到同一串随机数 */
function rng(seed: number): () => number {
  let a = seed
  return function next(): number {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** 用 seed 做 Fisher-Yates，返回新数组（不改原数组） */
function shuffleSeeded<T>(list: T[], seed: number): T[] {
  const arr = list.slice()
  const rand = rng(seed)
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1))
    const tmp = arr[i]
    arr[i] = arr[j]
    arr[j] = tmp
  }
  return arr
}

/** 按 id 去重，保持先出现的顺序 */
function uniqById(list: Track[]): Track[] {
  const seen = new Set<string>()
  const out: Track[] = []
  list.forEach((t) => {
    if (!t || seen.has(t.id)) return
    seen.add(t.id)
    out.push(t)
  })
  return out
}

export interface BuildDailyOptions {
  force?: boolean
}

/**
 * 构建当日推荐
 * @param options.force 跳过接口缓存（下拉刷新不改变结果，仅调试用）
 */
export async function buildDaily({ force = false }: BuildDailyOptions = {}): Promise<DailyResult> {
  const profile = getProfile()
  const today = dateKey()
  const tops = topGenres(3)
  const isNewUser = tops.length === 0

  // 新用户没有画像，按全局热度均衡分配（规格 §8.2.4）
  const genres: string[] = isNewUser ? [] : tops

  /* 1. 候选池：top3 曲风 × (week + month) + 全局 week */
  const poolMap: Record<string, Track[]> = {}

  const fetchBucket = async (genre: string, time: 'week' | 'month'): Promise<Track[]> => {
    try {
      return await fetchTrending({ time, genre, limit: 20, force })
    } catch (e) {
      return []
    }
  }

  if (isNewUser) {
    poolMap._global = uniqById([...(await fetchBucket('', 'week')), ...(await fetchBucket('', 'month'))])
  } else {
    const jobs: Promise<{ key: string; list: Track[] }>[] = []
    genres.forEach((g, i) => {
      jobs.push(fetchBucket(g, 'week').then((list) => ({ key: g, list })))
      // top1 额外补一个月维度，候选不够时才有得挑
      if (i === 0) jobs.push(fetchBucket(g, 'month').then((list) => ({ key: g, list })))
    })
    jobs.push(fetchBucket('', 'week').then((list) => ({ key: '_global', list })))

    const results = await Promise.all(jobs)
    results.forEach(({ key, list }) => {
      poolMap[key] = poolMap[key] ? poolMap[key].concat(list) : list.slice()
    })
    Object.keys(poolMap).forEach((k) => {
      poolMap[k] = uniqById(poolMap[k])
    })
  }

  /* 2. 过滤：听过的、收藏的、不可播的全部剔除 */
  const recent = new Set(recentTrackIds())
  const favs = new Set(getFavs().map((t) => t.id))
  const usable = (t: Track): boolean => !!t && t.streamable && !t.isGated && !recent.has(t.id) && !favs.has(t.id)

  Object.keys(poolMap).forEach((k) => {
    poolMap[k] = poolMap[k].filter(usable)
  })

  /* 3. 配额：top1 40% / top2 25% / top3 15% / 全局 20% */
  const quotas: Array<{ key: string; n: number }> = isNewUser
    ? [{ key: '_global', n: TARGET_COUNT }]
    : [
        { key: genres[0], n: 12 },
        { key: genres[1], n: 8 },
        { key: genres[2], n: 4 },
        { key: '_global', n: 6 }
      ]

  const seedBase = hash(today + profile.deviceSeed)
  const picked: Track[] = []
  const used = new Set<string>()

  quotas.forEach(({ key, n }, qi) => {
    const bucket = (poolMap[key] || []).filter((t) => !used.has(t.id))
    if (!bucket.length) return

    // 每个桶用 seed 的派生值，保证桶之间互不干扰但又都确定
    const shuffled = shuffleSeeded(bucket, seedBase + qi * 7919)
    shuffled.slice(0, n).forEach((t) => {
      if (used.has(t.id)) return
      used.add(t.id)
      picked.push(t)
    })
  })

  /* 4. 兜底：不足 30 首用全局榜补齐；仍不足就显示实际数量，不凑数 */
  if (picked.length < TARGET_COUNT) {
    const rest = uniqById(Object.keys(poolMap).reduce<Track[]>((acc, k) => acc.concat(poolMap[k]), [])).filter(
      (t) => !used.has(t.id)
    )
    const shuffled = shuffleSeeded(rest, seedBase + 99991)
    shuffled.slice(0, TARGET_COUNT - picked.length).forEach((t) => {
      used.add(t.id)
      picked.push(t)
    })
  }

  /* 5. 理由生成：按优先级取第一条命中（规格 §8.2.2） */
  const top1 = genres[0] || ''
  const withReason: RecommendedTrack[] = picked.map((t) => {
    const n = artistPlayCount(t.artistId)
    let reason = ''

    if (top1 && t.genre === top1) {
      reason = `因为你常听 ${genreLabel(t.genre)}`
    } else if (n > 0) {
      reason = `你听过 ${t.artistName} 的 ${n} 首`
    } else if (t.playCount > 0) {
      reason = '本周新上榜'
    } else {
      reason = '今天值得一听'
    }

    // 标记是否属于个性化曲风，决定标签用主色还是灰色
    const personalized = !!top1 && t.genre === top1
    return { ...t, reason, personalized }
  })

  return {
    date: today,
    tracks: withReason,
    isNewUser,
    topGenre: top1
  }
}
