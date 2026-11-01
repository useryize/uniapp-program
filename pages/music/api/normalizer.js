/**
 * @file 原始响应 → 内部统一模型
 *
 * 页面只认这里定义的形状（规格 §9.2）。换数据源时只改 normalizer + source，
 * 页面一行不用动。
 */

/** 从 artwork 里取指定尺寸，兜底到最小可用尺寸 */
function pickCover(artwork, prefer = '480x480') {
  if (!artwork) return ''
  if (typeof artwork === 'string') return artwork
  return (
    artwork[prefer] ||
    artwork['480x480'] ||
    artwork['150x150'] ||
    artwork['1000x1000'] ||
    Object.values(artwork).find((v) => typeof v === 'string') ||
    ''
  )
}

/**
 * Track
 * @returns {{id,title,artistId,artistName,artistAvatar,cover,coverSmall,duration,playCount,genre,streamable,isGated}}
 */
export function normalizeTrack(raw) {
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

/**
 * Playlist
 * @returns {{id,name,cover,trackCount,ownerName,ownerId}}
 */
export function normalizePlaylist(raw) {
  if (!raw) return null
  const user = raw.user || {}
  return {
    id: raw.id,
    name: raw.playlist_name || raw.playlist_title || '未命名歌单',
    cover: pickCover(raw.artwork, '480x480'),
    trackCount: Number(raw.track_count) || (raw.playlist_contents || []).length || 0,
    ownerName: user.name || user.handle || 'Audius',
    ownerId: user.id || ''
  }
}

/**
 * Artist
 * @returns {{id,name,avatar,followerCount,trackCount}}
 */
export function normalizeArtist(raw) {
  if (!raw) return null
  return {
    id: raw.id,
    name: raw.name || raw.handle || '未知艺人',
    avatar: pickCover(raw.profile_picture, '480x480'),
    followerCount: Number(raw.follower_count) || 0,
    trackCount: Number(raw.track_count) || 0
  }
}

/**
 * 评论（时间轴弹幕用）
 * @returns {{id,text,timestamp,userName,avatar}}
 */
export function normalizeComment(raw) {
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
