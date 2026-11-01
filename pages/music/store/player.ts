/**
 * @file 播放器单例
 *
 * 全应用唯一的播放状态源（规格 §5.1）。所有页面读这个 reactive 对象，
 * mini-bar 与 player 页因此永远一致。
 *
 * 关键平台差异（规格 §5.2，踩过坑，别改）：
 * - 小程序只能用 BackgroundAudioManager 才能后台/锁屏播放
 * - 它的 src 赋值即自动播放 → 「暂停后继续」不能重设 src，只能 play()
 * - 它是单例，切歌必须先 stop() 再赋新 src
 * - title / singer / coverImgUrl 必填，否则锁屏信息空白
 */

import { reactive } from 'vue'
import { fetchStreamUrl } from '../api/index'
import type { Track, PlayerState, PlayMode } from '../api/types'

type AudioContext = UniApp.InnerAudioContext | UniApp.BackgroundAudioManager

const STORAGE_LAST = 'm_last_track'
const STORAGE_MODE = 'm_play_mode'
const STORAGE_DANMU = 'm_danmu_on'

/** 播放状态机（规格 §6.1） */
export const playerState = reactive<PlayerState>({
  status: 'idle',
  track: null,
  queue: [],
  index: -1,
  progress: 0,
  duration: 0,
  mode: 'order',
  danmuOn: true,
  errorMsg: ''
})

/* ---------------- 音频上下文 ---------------- */

let ctx: AudioContext | null = null
/** 防止并发切歌时旧请求覆盖新曲目 */
let loadToken = 0

function bindEvents(c: AudioContext): void {
  c.onPlay(() => {
    playerState.status = 'playing'
  })

  c.onPause(() => {
    // 小程序在切歌 stop() 时也会触发 pause，用 loading 态挡掉，避免 UI 闪回
    if (playerState.status !== 'loading') playerState.status = 'paused'
  })

  c.onStop(() => {
    playerState.status = 'paused'
  })

  c.onEnded(() => {
    next(true)
  })

  c.onTimeUpdate(() => {
    if (playerState.status === 'loading') return
    playerState.progress = c.currentTime || 0
    if (c.duration) playerState.duration = c.duration
  })

  c.onWaiting(() => {
    if (playerState.status === 'playing') playerState.status = 'loading'
  })

  c.onCanplay(() => {
    if (c.duration) playerState.duration = c.duration
  })

  c.onError((e: unknown) => {
    // 坏曲目静默跳过，不弹窗打断（规格 §10）
    playerState.errorMsg = '这首歌暂时播放不了，已跳过'
    playerState.status = 'error'
    uni.showToast({ title: '跳过一首无法播放的曲目', icon: 'none', duration: 1500 })
    setTimeout(() => next(true), 400)
    console.warn('[player] audio error', e)
  })
}

function ensureContext(): AudioContext {
  if (ctx) return ctx

  // #ifdef MP-WEIXIN
  ctx = uni.getBackgroundAudioManager()
  // #endif

  // #ifndef MP-WEIXIN
  ctx = uni.createInnerAudioContext()
  ;(ctx as UniApp.InnerAudioContext).autoplay = false
  // #endif

  bindEvents(ctx)
  return ctx
}

/* ---------------- 工具 ---------------- */

function persistMode(): void {
  try {
    uni.setStorageSync(STORAGE_MODE, playerState.mode)
    uni.setStorageSync(STORAGE_DANMU, playerState.danmuOn)
  } catch (e) {
    // 忽略
  }
}

function persistLastTrack(track: Track): void {
  try {
    // 只存元数据快照，离线也能渲染 mini-bar（规格 §8.8）
    uni.setStorageSync(STORAGE_LAST, {
      id: track.id,
      title: track.title,
      artistName: track.artistName,
      cover: track.cover,
      duration: track.duration
    })
  } catch (e) {
    // 忽略
  }
}

/** 按当前模式算下一首的索引 */
function nextIndex(step: number, manual: boolean): number {
  const { queue, index, mode } = playerState
  const len = queue.length
  if (!len) return -1

  if (mode === 'shuffle' && !manual) {
    if (len === 1) return 0
    let n = index
    while (n === index) n = Math.floor(Math.random() * len)
    return n
  }

  // single 模式只在自动续播时复用当前曲；手动切歌仍走顺序
  if (mode === 'single' && !manual) return index

  let n = index + step
  if (n >= len) n = 0
  if (n < 0) n = len - 1
  return n
}

/* ---------------- 核心动作 ---------------- */

function loadAt(i: number): void {
  const track = playerState.queue[i]
  if (!track) return
  playerState.index = i
  playerState.track = track
  playerState.duration = track.duration || 0
  playerState.progress = 0
  persistLastTrack(track)

  const token = ++loadToken
  playerState.status = 'loading'

  // 音频直链是签名地址，每次播放前现取（不可缓存，规格 §5.3）
  fetchStreamUrl(track.id)
    .then((url) => {
      if (token !== loadToken) return // 已被更新的切歌请求覆盖
      const c = ensureContext()

      // 小程序切歌必须先 stop，否则新 src 不生效
      try {
        c.stop()
      } catch (e) {
        // 首次播放时 stop 可能报错，忽略
      }

      // #ifdef MP-WEIXIN
      const bg = c as UniApp.BackgroundAudioManager
      bg.title = track.title
      bg.singer = track.artistName
      bg.coverImgUrl = track.cover
      // #endif

      c.src = url

      // #ifndef MP-WEIXIN
      c.play()
      // #endif
    })
    .catch(() => {
      if (token !== loadToken) return
      playerState.status = 'error'
      playerState.errorMsg = '播放地址获取失败'
      uni.showToast({ title: '播放地址获取失败', icon: 'none' })
    })
}

/** 用整个列表替换队列并从指定位置开始播放 */
export function playQueue(tracks: Track[], startIndex = 0): void {
  if (!Array.isArray(tracks) || !tracks.length) return
  playerState.queue = tracks.slice()
  loadAt(Math.min(Math.max(0, startIndex), tracks.length - 1))
}

/** 单曲播放（不改变队列语义，插入到队首） */
export function playTrack(track: Track): void {
  if (!track) return
  const exist = playerState.queue.findIndex((t) => t.id === track.id)
  if (exist >= 0) {
    loadAt(exist)
    return
  }
  playerState.queue = [track, ...playerState.queue]
  loadAt(0)
}

/** 播放 / 暂停 */
export function toggle(): void {
  const c = ensureContext()
  if (playerState.status === 'playing') {
    c.pause()
    playerState.status = 'paused'
    return
  }
  if (playerState.status === 'paused') {
    c.play()
    playerState.status = 'playing'
    return
  }
  // idle / error 时重新装载当前曲
  if (playerState.track) loadAt(playerState.index)
}

/** 暂停 */
export function pause(): void {
  if (playerState.status === 'playing') {
    ensureContext().pause()
    playerState.status = 'paused'
  }
}

/** 切歌 */
export function next(manual = true): void {
  const i = nextIndex(1, manual)
  if (i >= 0) loadAt(i)
}

/** 上一首 */
export function prev(): void {
  const i = nextIndex(-1, true)
  if (i >= 0) loadAt(i)
}

/** 跳转进度 */
export function seek(seconds: number): void {
  const c = ensureContext()
  const target = Math.min(Math.max(0, Number(seconds) || 0), playerState.duration || 0)
  c.seek(target)
  playerState.progress = target
}

/** 切换播放模式：order → shuffle → single → order */
export function cycleMode(): void {
  const order: PlayMode[] = ['order', 'shuffle', 'single']
  const i = order.indexOf(playerState.mode)
  playerState.mode = order[(i + 1) % order.length]
  persistMode()
  const label: Record<PlayMode, string> = { order: '列表循环', shuffle: '随机播放', single: '单曲循环' }
  uni.showToast({ title: label[playerState.mode], icon: 'none', duration: 1000 })
}

/** 弹幕开关（状态持久化，规格 §8.3 验收项） */
export function toggleDanmu(): void {
  playerState.danmuOn = !playerState.danmuOn
  persistMode()
}

/** 追加到队列末尾 */
export function addToQueue(track: Track): void {
  if (!track) return
  if (playerState.queue.some((t) => t.id === track.id)) {
    uni.showToast({ title: '已在播放列表中', icon: 'none' })
    return
  }
  playerState.queue.push(track)
  uni.showToast({ title: '已加入播放列表', icon: 'none' })
}

/** 下一首播放：插到当前曲后面 */
export function playNext(track: Track): void {
  if (!track) return
  const rest = playerState.queue.filter((t) => t.id !== track.id)
  const at = Math.min(playerState.index + 1, rest.length)
  rest.splice(at, 0, track)
  playerState.queue = rest
  uni.showToast({ title: '已设为下一首播放', icon: 'none' })
}

/** 从队列移除 */
export function removeFromQueue(index: number): void {
  if (index < 0 || index >= playerState.queue.length) return
  const removingCurrent = index === playerState.index
  playerState.queue.splice(index, 1)

  if (!playerState.queue.length) {
    ensureContext().stop()
    playerState.status = 'idle'
    playerState.track = null
    playerState.index = -1
    playerState.progress = 0
    return
  }

  if (removingCurrent) {
    loadAt(Math.min(index, playerState.queue.length - 1))
  } else if (index < playerState.index) {
    playerState.index -= 1
  }
}

/** 初始化：恢复上次的模式设置与「上次播放的曲目」（不自动播） */
export function initPlayer(): void {
  try {
    const mode = uni.getStorageSync(STORAGE_MODE) as PlayMode | ''
    if (mode) playerState.mode = mode

    const danmu = uni.getStorageSync(STORAGE_DANMU)
    if (danmu !== '' && danmu !== undefined && danmu !== null) playerState.danmuOn = !!danmu

    const last = uni.getStorageSync(STORAGE_LAST) as Partial<Track> | ''
    if (last && last.id) {
      // 恢复到 paused 态，不自动播（规格 §10 E7）
      playerState.track = {
        id: last.id,
        title: last.title || '',
        artistId: last.artistId || '',
        artistName: last.artistName || '',
        artistAvatar: last.artistAvatar || '',
        cover: last.cover || '',
        coverSmall: last.coverSmall || last.cover || '',
        duration: last.duration || 0,
        playCount: last.playCount || 0,
        genre: last.genre || '',
        streamable: true,
        isGated: false
      }
      playerState.duration = last.duration || 0
      playerState.status = 'paused'
    }
  } catch (e) {
    // 忽略
  }
}

/** 是否正在播放 */
export function isPlaying(): boolean {
  return playerState.status === 'playing'
}

/** 是否已有可显示的当前曲 */
export function hasCurrent(): boolean {
  return !!playerState.track
}
