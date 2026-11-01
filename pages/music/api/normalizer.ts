/**
 * @file 原始响应 → 内部统一模型
 *
 * 页面只认 types.ts 里定义的形状。换数据源时只改这里 + source，页面一行不用动。
 */

import type { Track, Playlist, Artist, TrackComment } from './types'

/* ---------------- Audius 原始结构（只声明用到的字段） ---------------- */

interface AudiusArtwork {
  '150x150'?: string
  '480x480'?: string
  '1000x1000'?: string
  [key: string]: string | undefined
}

interface AudiusUser {
  id?: string
  name?: string
  handle?: string
  profile_picture?: AudiusArtwork | string
  follower_count?: number
  track_count?: number
}

export interface AudiusRawTrack {
  id: string
  title?: string
  user?: AudiusUser
  user_id?: string
  artwork?: AudiusArtwork | string
  duration?: number
  play_count?: number
  genre?: string
  is_streamable?: boolean
  is_stream_gated?: boolean
}

export interface AudiusRawPlaylist {
  id: string
  playlist_name?: string
  playlist_title?: string
  user?: AudiusUser
  artwork?: AudiusArtwork | string
  track_count?: number
  playlist_contents?: unknown[]
}

export interface AudiusRawUser {
  id: string
  name?: string
  handle?: string
  profile_picture?: AudiusArtwork | string
  follower_count?: number
  track_count?: number
}

export interface AudiusRawComment {
  id: string
  message?: string
  track_timestamp_s?: number | string
  user?: AudiusUser
}

/** Audius 列表接口的统一信封 */
export interface AudiusListResponse<T> {
  data: T[]
}

/* ---------------- 归一化 ---------------- */

/** 从 artwork 里取指定尺寸，兜底到最小可用尺寸 */
function pickCover(artwork: AudiusArtwork | string | undefined, prefer: keyof AudiusArtwork = '480x480'): string {
  if (!artwork) return ''
  if (typeof artwork === 'string') return artwork
  const preferred = artwork[prefer]
  if (preferred) return preferred
  const fallbacks = [artwork['480x480'], artwork['150x150'], artwork['1000x1000']]
  for (const url of fallbacks) {
    if (url) return url
  }
  return Object.values(artwork).find((v): v is string => typeof v === 'string') || ''
}

export function normalizeTrack(raw: AudiusRawTrack | null | undefined): Track | null {
  if (!raw) return null
  const user = raw.user || {}
  return {
    id: raw.id,
    title: raw.title || '未命名曲目',
    artistId: user.id || raw.user_id || '',
    artistName: user.name || user.handle || '未知艺人',
    artistAvatar: pickCover(user.profile_picture, '150x150'),
    cover: pickCover(raw.artwork, '480x480'),
    coverSmall: pickCover(raw.artwork, '150x150'),
    duration: Number(raw.duration) || 0,
    playCount: Number(raw.play_count) || 0,
    genre: raw.genre || '',
    // is_streamable 为 false 时前端直接跳过，不给用户制造一个点了没反应的按钮
    streamable: raw.is_streamable !== false,
    isGated: !!raw.is_stream_gated
  }
}

export function normalizePlaylist(raw: AudiusRawPlaylist | null | undefined): Playlist | null {
  if (!raw) return null
  const user = raw.user || {}
  return {
    id: raw.id,
    name: raw.playlist_name || raw.playlist_title || '未命名歌单',
    cover: pickCover(raw.artwork, '480x480'),
    trackCount: Number(raw.track_count) || (raw.playlist_contents?.length ?? 0),
    ownerName: user.name || user.handle || 'Audius',
    ownerId: user.id || ''
  }
}

export function normalizeArtist(raw: AudiusRawUser | null | undefined): Artist | null {
  if (!raw) return null
  return {
    id: raw.id,
    name: raw.name || raw.handle || '未知艺人',
    avatar: pickCover(raw.profile_picture, '480x480'),
    followerCount: Number(raw.follower_count) || 0,
    trackCount: Number(raw.track_count) || 0
  }
}

/** 评论（时间轴弹幕用） */
export function normalizeComment(raw: AudiusRawComment | null | undefined): TrackComment | null {
  if (!raw) return null
  const user = raw.user || {}
  return {
    id: raw.id,
    text: (raw.message || '').trim(),
    // 评论挂载的播放位置（秒），没有则不参与弹幕
    timestamp: Number(raw.track_timestamp_s) || 0,
    userName: user.name || user.handle || '听众',
    avatar: pickCover(user.profile_picture, '150x150')
  }
}
