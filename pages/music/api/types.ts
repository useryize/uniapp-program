/**
 * @file 音乐模块数据模型（单一事实来源）
 *
 * 页面、api、store 全部从这里 import 类型，不在各处重复定义。
 * 对应规格 §9.2「统一内部模型」。
 */

/* ---------------- 领域模型 ---------------- */

/** 曲目 */
export interface Track {
  id: string
  title: string
  artistId: string
  artistName: string
  artistAvatar: string
  /** 480x480 主封面 */
  cover: string
  /** 150x150 缩略兜底 */
  coverSmall: string
  /** 秒 */
  duration: number
  playCount: number
  genre: string
  /** 是否可播，false 时列表置灰跳过 */
  streamable: boolean
  /** 是否付费门禁，true 时直接过滤掉 */
  isGated: boolean
}

/** 带推荐理由的曲目（每日推荐专用） */
export interface RecommendedTrack extends Track {
  reason: string
  /** 是否属于用户 top 曲风，决定理由标签用主色还是灰 */
  personalized: boolean
}

/** 歌单 */
export interface Playlist {
  id: string
  name: string
  cover: string
  trackCount: number
  ownerName: string
  ownerId: string
}

/** 艺人 */
export interface Artist {
  id: string
  name: string
  avatar: string
  followerCount: number
  trackCount: number
}

/** 时间轴评论 */
export interface TrackComment {
  id: string
  text: string
  /** 评论挂载的播放位置（秒），0 表示不参与弹幕 */
  timestamp: number
  userName: string
  avatar: string
}

/* ---------------- 播放器 ---------------- */

/** 播放状态机（规格 §6.1） */
export type PlayerStatus = 'idle' | 'loading' | 'playing' | 'paused' | 'error'

/** 播放模式（规格 §6.2）：列表循环 / 随机 / 单曲 */
export type PlayMode = 'order' | 'shuffle' | 'single'

export interface PlayerState {
  status: PlayerStatus
  track: Track | null
  queue: Track[]
  index: number
  progress: number
  duration: number
  mode: PlayMode
  danmuOn: boolean
  errorMsg: string
}

/* ---------------- 本地画像 ---------------- */

/** 曲风计分（带时间戳做 7 天半衰） */
export interface GenreScore {
  score: number
  ts: number
}

export interface Profile {
  deviceSeed: string
  genreScores: Record<string, GenreScore>
  artistPlays: Record<string, number>
}

/** 收藏 / 最近播放里存的元数据快照（离线也能渲染） */
export interface TrackSnapshot {
  id: string
  title: string
  artistName: string
  cover: string
  duration: number
  genre: string
  playCount: number
  /** 下架后置为 false，列表置灰 */
  streamable?: boolean
  savedAt?: number
}

/* ---------------- 业务返回 ---------------- */

export interface DailyResult {
  date: string
  tracks: RecommendedTrack[]
  isNewUser: boolean
  topGenre: string
}

export interface SearchResult {
  tracks: Track[]
  playlists: Playlist[]
  artists: Artist[]
}

/** 内部统一错误对象（与 http.ts 一致） */
export interface ApiError extends Error {
  code?: number | string
  msg?: string
}

/* ---------------- 页面辅助 ---------------- */

/** 首页 Banner 卡片 */
export interface BannerItem {
  type: string
  title: string
  reason: string
  cover: string
  action:
    | { kind: 'queue'; tracks: Track[]; index: number }
    | { kind: 'playlist'; id: string }
    | { kind: 'genre'; genre: string }
}

/** 弹幕气泡 */
export interface DanmuBubble {
  key: string
  id: string
  text: string
  timeText: string
  side: 'left' | 'right'
}

/** 曲风 / 时间维度的选项 */
export interface GenreOption {
  id: string
  label: string
}
