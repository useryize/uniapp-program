/**
 * @file 曲风常量表
 *
 * ⚠️ 实测坑：「全部」必须省略 genre 参数，传 All 会返回空数组（规格 §1.1）。
 * 因此 GENRES 里「全部」的 id 是空字符串，取数时 if (!genre) 就不带参数。
 */

import type { GenreOption } from '../api/types'

/** 首页 / 榜单横滑展示的曲风 */
export const GENRES: GenreOption[] = [
  { id: '', label: '全部' },
  { id: 'Lo-Fi', label: 'Lo-Fi' },
  { id: 'Electronic', label: 'Electronic' },
  { id: 'Hip-Hop/Rap', label: 'Hip-Hop' },
  { id: 'Ambient', label: 'Ambient' },
  { id: 'House', label: 'House' },
  { id: 'Jazz', label: 'Jazz' },
  { id: 'Classical', label: 'Classical' },
  { id: 'Drum & Bass', label: 'Drum&Bass' },
  { id: 'Rock', label: 'Rock' },
  { id: 'Techno', label: 'Techno' },
  { id: 'R&B/Soul', label: 'R&B' }
]

/** 歌单广场的筛选条（比首页少，避免横向过长） */
export const PLAZA_GENRES: GenreOption[] = [
  { id: '', label: '全部' },
  { id: 'Lo-Fi', label: 'Lo-Fi' },
  { id: 'Electronic', label: 'Electronic' },
  { id: 'Jazz', label: 'Jazz' },
  { id: 'Ambient', label: 'Ambient' },
  { id: 'Hip-Hop/Rap', label: 'Hip-Hop' }
]

/** 时间维度 */
export interface TimeOption {
  id: 'week' | 'month' | 'allTime'
  label: string
}

export const TIMES: TimeOption[] = [
  { id: 'week', label: '本周' },
  { id: 'month', label: '本月' },
  { id: 'allTime', label: '全时段' }
]

/** id → 中文展示名（榜单标题、理由文案用） */
export const GENRE_LABEL: Record<string, string> = GENRES.reduce<Record<string, string>>((acc, g) => {
  if (g.id) acc[g.id] = g.label
  return acc
}, {})

/** 取曲风的展示名，未知曲风原样返回 */
export function genreLabel(id: string): string {
  return GENRE_LABEL[id] || id || '精选'
}
