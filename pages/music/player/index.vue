<template>
  <view class="m-player">
    <!-- 背景：封面放大 + 模糊 + 深色遮罩（取色算法的轻量替代，切歌不闪白） -->
    <image v-if="track && track.cover" class="m-player__bg" :src="track.cover" mode="aspectFill" />
    <view class="m-player__bg-mask" />

    <music-status-bar />

    <!-- 顶栏：关闭 + 正在播放 + 弹幕开关 + 更多 -->
    <view class="m-player__nav" :style="{ paddingRight: safeRight + 'px' }">
      <view class="m-player__close" @tap="onClose">
        <view class="m-player__close-icon" />
      </view>
      <text class="m-player__nav-title">正在播放</text>
      <view class="m-player__spacer" />
      <view class="m-player__danmu" :class="{ 'is-on': playerState.danmuOn }" @tap="toggleDanmu">
        <text class="m-player__danmu-text" :class="{ 'is-on': playerState.danmuOn }">弹</text>
      </view>
      <view class="m-player__more" @tap="onMore">
        <view class="m-player__dot" />
        <view class="m-player__dot" />
        <view class="m-player__dot" />
      </view>
    </view>

    <!-- 评论弹幕层：评论挂在播放时间轴上（规格 §7） -->
    <view class="m-player__danmu-layer">
      <view
        v-for="b in bubbles"
        :key="b.key"
        class="m-player__bubble"
        :class="b.side === 'right' ? 'is-right' : ''"
        @tap="jumpToComment(b)"
      >
        <text class="m-player__bubble-text">{{ b.text }}</text>
        <text class="m-player__bubble-time">{{ b.timeText }}</text>
      </view>
    </view>

    <!-- 封面 -->
    <view class="m-player__cover-wrap" @tap="toggleDisc">
      <image
        v-if="track && track.cover"
        class="m-player__cover"
        :class="{ 'is-disc': discMode }"
        :src="track.cover"
        mode="aspectFill"
      />
      <view v-else class="m-player__cover m-player__cover--empty" />
    </view>

    <!-- 曲目信息 -->
    <view class="m-player__info">
      <text class="m-player__title">{{ track ? track.title : '暂无播放' }}</text>
      <view class="m-player__artist-row">
        <text class="m-player__artist" @tap="goArtist">{{ track ? track.artistName : '—' }}</text>
        <view class="m-player__heart" @tap="onFav">
          <view class="m-player__heart-shape" :class="{ 'is-fav': faved }" />
        </view>
      </view>
    </view>

    <!-- 进度 -->
    <view class="m-player__progress">
      <music-progress :current="playerState.progress" :duration="durationSec" @seek="onSeek" />
      <view class="m-player__times">
        <text class="m-player__time">{{ curText }}</text>
        <text class="m-player__time">{{ durText }}</text>
      </view>
    </view>

    <!-- 控制区 -->
    <view class="m-player__controls">
      <view class="m-player__mode" @tap="onMode">
        <text class="m-player__mode-text">{{ modeLabel }}</text>
      </view>

      <view class="m-player__skip" @tap="onPrev">
        <view class="m-player__prev-shape" />
      </view>

      <view class="m-player__play" @tap="onToggle">
        <view v-if="playerState.status === 'loading'" class="m-player__loading" />
        <view v-else-if="playing" class="m-player__pause">
          <view class="m-player__pause-bar" />
          <view class="m-player__pause-bar" />
        </view>
        <view v-else class="m-player__play-tri" />
      </view>

      <view class="m-player__skip" @tap="onNext">
        <view class="m-player__next-shape" />
      </view>

      <view class="m-player__queue" @tap="onQueue">
        <view class="m-player__queue-line" />
        <view class="m-player__queue-line" style="width: 24rpx" />
        <view class="m-player__queue-line" style="width: 24rpx" />
      </view>
    </view>

    <!-- 底部：评论入口 + 分享位 -->
    <view class="m-player__bottom">
      <text class="m-player__comment-entry" @tap="onComments">
        {{ comments.length ? `${comments.length} 条时间轴评论` : '暂无时间轴评论' }}
      </text>
      <view class="m-player__share" />
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'

import MusicStatusBar from '../components/music-status-bar.vue'
import MusicProgress from '../components/music-progress.vue'

import {
  playerState,
  toggle,
  next,
  prev,
  seek,
  cycleMode,
  toggleDanmu,
  pause,
  addToQueue,
  playNext,
  playQueue
} from '../store/player'
import { fetchComments } from '../api/index'
import { isFav, toggleFav, recordPlay } from '../utils/profile'
import { formatDuration } from '../utils/format'

const safeRight = ref(100)
const discMode = ref(false)
const comments = ref([])
const bubbles = ref([])
const faved = ref(false)

const track = computed(() => playerState.track)
const playing = computed(() => playerState.status === 'playing')
const durationSec = computed(() => playerState.duration || track.value?.duration || 0)
const curText = computed(() => formatDuration(playerState.progress))
const durText = computed(() => formatDuration(durationSec.value))
const modeLabel = computed(
  () => ({ order: '列表循环', shuffle: '随机播放', single: '单曲循环' }[playerState.mode] || '列表循环')
)

onLoad(async () => {
  try {
    const info = uni.getWindowInfo ? uni.getWindowInfo() : uni.getSystemInfoSync()
    // #ifdef MP-WEIXIN
    const menu = uni.getMenuButtonBoundingClientRect()
    safeRight.value = info.windowWidth - menu.left + 8
    // #endif
    // #ifndef MP-WEIXIN
    safeRight.value = 16
    // #endif
  } catch (e) {
    safeRight.value = 100
  }

  if (track.value) {
    faved.value = isFav(track.value.id)
    await loadComments()
  }
})

async function loadComments() {
  if (!track.value) return
  try {
    comments.value = await fetchComments(track.value.id, 30)
  } catch (e) {
    comments.value = []
  }
}

/* ---------------- 弹幕 ---------------- */

const shownIds = new Set()
let lastSec = -1

watch(
  () => track.value && track.value.id,
  async (id) => {
    shownIds.clear()
    lastSec = -1
    bubbles.value = []
    if (id) {
      faved.value = isFav(id)
      await loadComments()
    }
  }
)

watch(
  () => Math.floor(playerState.progress),
  (sec) => {
    if (sec === lastSec) return
    lastSec = sec
    if (!playerState.danmuOn || !comments.value.length) return
    emitDueComments(sec)
  }
)

/** 提前 1.5 秒触发，同屏最多 3 条（规格 §7.2） */
function emitDueComments(sec) {
  const due = comments.value.filter(
    (c) => !shownIds.has(c.id) && c.timestamp > sec - 0.5 && c.timestamp <= sec + 1.5
  )
  if (!due.length) return

  due.forEach((c) => {
    if (bubbles.value.length >= 3) return
    shownIds.add(c.id)
    const key = `${c.id}_${Date.now()}`
    const side = bubbles.value.length % 2 === 0 ? 'left' : 'right'
    bubbles.value.push({ key, id: c.id, text: c.text, timeText: formatDuration(c.timestamp), side })

    const timer = setTimeout(() => {
      bubbles.value = bubbles.value.filter((b) => b.key !== key)
    }, 4200)
    timers.push(timer)
  })
}

const timers = []
onUnmounted(() => timers.forEach((t) => clearTimeout(t)))

/** 点弹幕：暂停并定位到该条评论的时间点（规格 §7.3） */
function jumpToComment(b) {
  const target = comments.value.find((c) => c.id === b.id)
  if (!target) return
  pause()
  seek(target.timestamp)
}

/* ---------------- 交互 ---------------- */

function onClose() {
  if (getCurrentPages().length > 1) uni.navigateBack()
  else uni.reLaunch({ url: '/pages/music/home/index' })
}

function onToggle() {
  if (playerState.status === 'error') {
    uni.showToast({ title: '这首歌无法播放', icon: 'none' })
    return
  }
  if (track.value) recordPlay(track.value)
  toggle()
}

function onPrev() {
  prev()
}

function onNext() {
  next()
}

function onSeek(sec) {
  seek(sec)
}

function onMode() {
  cycleMode()
}

function toggleDisc() {
  discMode.value = !discMode.value
}

function onFav() {
  if (!track.value) return
  faved.value = toggleFav(track.value)
  uni.showToast({ title: faved.value ? '已收藏' : '已取消收藏', icon: 'none', duration: 1000 })
}

function goArtist() {
  if (!track.value || !track.value.artistId) return
  // 播放不中断（规格 §8.3）
  uni.navigateTo({ url: `/pages/music/artist/index?id=${track.value.artistId}` })
}

function onMore() {
  if (!track.value) return
  uni.showActionSheet({
    itemList: ['下一首播放', '加入播放列表', '复制曲目 ID'],
    success: ({ tapIndex }) => {
      if (tapIndex === 0) playNext(track.value)
      if (tapIndex === 1) addToQueue(track.value)
      if (tapIndex === 2) {
        uni.setClipboardData({ data: track.value.id })
      }
    }
  })
}

function onQueue() {
  if (!playerState.queue.length) {
    uni.showToast({ title: '播放列表是空的', icon: 'none' })
    return
  }
  const list = playerState.queue.slice(0, 8).map((t, i) => {
    const mark = i === playerState.index ? '▶ ' : ''
    return `${mark}${t.title}`
  })
  uni.showActionSheet({
    itemList: list,
    success: ({ tapIndex }) => {
      // 复用 playQueue 切歌，保证索引与状态同步
      playQueue(playerState.queue, tapIndex)
    }
  })
}

function onComments() {
  if (!comments.value.length) {
    uni.showToast({ title: '这首歌还没有时间轴评论', icon: 'none' })
    return
  }
  uni.showActionSheet({
    itemList: comments.value.slice(0, 8).map((c) => `${formatDuration(c.timestamp)} ${c.text}`),
    success: ({ tapIndex }) => {
      const target = comments.value[tapIndex]
      if (target) {
        pause()
        seek(target.timestamp)
      }
    }
  })
}
</script>

<style lang="scss" scoped>
@import '../styles/tokens.scss';

.m-player {
  position: relative;
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background-color: $m-bg;
}

.m-player__bg {
  position: absolute;
  left: -10%;
  top: -10%;
  width: 120%;
  height: 120%;
  filter: blur(40px);
  opacity: 0.55;
}

.m-player__bg-mask {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(180deg, rgba(10, 10, 12, 0.45) 0%, rgba(10, 10, 12, 0.82) 55%, #0a0a0c 100%);
}

.m-player__nav {
  position: relative;
  z-index: 2;
  height: 88rpx;
  display: flex;
  align-items: center;
  padding-left: 32rpx;
  box-sizing: border-box;
}

.m-player__close {
  width: 56rpx;
  height: 56rpx;
  display: flex;
  align-items: center;
}

.m-player__close-icon {
  width: 20rpx;
  height: 20rpx;
  border-right: 3rpx solid #ffffff;
  border-bottom: 3rpx solid #ffffff;
  transform: rotate(45deg);
  margin-top: -8rpx;
}

.m-player__nav-title {
  margin-left: 8rpx;
  font-family: $m-font-cn;
  font-size: 24rpx;
  color: $m-text-2;
}

.m-player__spacer {
  flex: 1;
}

.m-player__danmu {
  height: 44rpx;
  padding: 0 18rpx;
  border-radius: 999rpx;
  border: 1rpx solid $m-line-strong;
  display: flex;
  align-items: center;
  margin-right: 20rpx;

  &.is-on {
    border-color: rgba(0, 224, 184, 0.5);
    background-color: rgba(0, 224, 184, 0.14);
  }
}

.m-player__danmu-text {
  font-family: $m-font-cn;
  font-size: 22rpx;
  color: $m-text-2;

  &.is-on {
    color: $m-primary;
  }
}

.m-player__more {
  width: 52rpx;
  height: 52rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.m-player__dot {
  width: 8rpx;
  height: 8rpx;
  border-radius: 999rpx;
  background-color: #ffffff;

  & + & {
    margin-left: 6rpx;
  }
}

/* 弹幕层 */
.m-player__danmu-layer {
  position: relative;
  z-index: 3;
  height: 88rpx;
  flex-shrink: 0;
}

.m-player__bubble {
  position: absolute;
  left: 40rpx;
  top: 4rpx;
  max-width: 480rpx;
  height: 56rpx;
  padding: 0 20rpx;
  border-radius: 999rpx;
  background-color: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;

  &.is-right {
    left: auto;
    right: 40rpx;
    top: 40rpx;
  }
}

.m-player__bubble-text {
  font-family: $m-font-cn;
  font-size: 22rpx;
  color: #ffffff;
  max-width: 380rpx;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.m-player__bubble-time {
  margin-left: 10rpx;
  font-family: $m-font-num;
  font-size: 18rpx;
  color: $m-primary;
}

/* 封面 */
.m-player__cover-wrap {
  position: relative;
  z-index: 2;
  display: flex;
  justify-content: center;
  padding: 8rpx 0 0;
}

.m-player__cover {
  width: 590rpx;
  height: 590rpx;
  border-radius: 32rpx;
  background-color: $m-surface-hover;
  transform: rotate(0deg);
  transition: border-radius 0.35s ease, transform 0.6s ease;

  &.is-disc {
    border-radius: 999rpx;
    transform: scale(0.86);
  }
}

.m-player__cover--empty {
  background-color: $m-surface;
}

/* 信息 */
.m-player__info {
  position: relative;
  z-index: 2;
  padding: 36rpx 40rpx 0;
}

.m-player__title {
  display: block;
  font-family: $m-font-num;
  font-size: 44rpx;
  font-weight: 700;
  color: #ffffff;
  line-height: 56rpx;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.m-player__artist-row {
  margin-top: 10rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.m-player__artist {
  font-family: $m-font-num;
  font-size: 26rpx;
  color: $m-text-2;
}

.m-player__heart {
  width: 48rpx;
  height: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.m-player__heart-shape {
  position: relative;
  width: 22rpx;
  height: 20rpx;
  transform: rotate(-45deg);
  background-color: $m-text-4;

  &.is-fav {
    background-color: $m-accent;
  }

  &::before,
  &::after {
    content: '';
    position: absolute;
    width: 22rpx;
    height: 22rpx;
    border-radius: 999rpx;
    background-color: inherit;
  }

  &::before {
    top: -11rpx;
    left: 0;
  }

  &::after {
    top: 0;
    left: 11rpx;
  }
}

/* 进度 */
.m-player__progress {
  position: relative;
  z-index: 2;
  padding: 28rpx 40rpx 0;
}

.m-player__times {
  display: flex;
  justify-content: space-between;
  padding-top: 4rpx;
}

.m-player__time {
  font-family: $m-font-num;
  font-size: 22rpx;
  color: $m-text-3;
}

/* 控制区 */
.m-player__controls {
  position: relative;
  z-index: 2;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 68rpx;
}

.m-player__mode {
  width: 80rpx;
  height: 56rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.m-player__mode-text {
  font-family: $m-font-cn;
  font-size: 18rpx;
  color: $m-text-2;
}

.m-player__skip {
  width: 72rpx;
  height: 72rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 上一首：两个左向三角 + 竖条 */
.m-player__prev-shape {
  position: relative;
  width: 0;
  height: 0;
  border-top: 20rpx solid transparent;
  border-bottom: 20rpx solid transparent;
  border-right: 26rpx solid #ffffff;

  &::after {
    content: '';
    position: absolute;
    top: -20rpx;
    left: 2rpx;
    width: 0;
    height: 0;
    border-top: 20rpx solid transparent;
    border-bottom: 20rpx solid transparent;
    border-right: 26rpx solid #ffffff;
  }
}

.m-player__next-shape {
  position: relative;
  width: 0;
  height: 0;
  border-top: 20rpx solid transparent;
  border-bottom: 20rpx solid transparent;
  border-left: 26rpx solid #ffffff;

  &::after {
    content: '';
    position: absolute;
    top: -20rpx;
    left: 24rpx;
    width: 0;
    height: 0;
    border-top: 20rpx solid transparent;
    border-bottom: 20rpx solid transparent;
    border-left: 26rpx solid #ffffff;
  }
}

.m-player__play {
  width: 120rpx;
  height: 120rpx;
  border-radius: 999rpx;
  background-color: $m-primary;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 12rpx 40rpx rgba(0, 224, 184, 0.3);
}

.m-player__play-tri {
  width: 0;
  height: 0;
  border-top: 20rpx solid transparent;
  border-bottom: 20rpx solid transparent;
  border-left: 30rpx solid #0a0a0c;
  margin-left: 8rpx;
}

.m-player__pause {
  display: flex;
  align-items: center;
}

.m-player__pause-bar {
  width: 8rpx;
  height: 40rpx;
  border-radius: 4rpx;
  background-color: #0a0a0c;

  & + & {
    margin-left: 12rpx;
  }
}

.m-player__loading {
  width: 36rpx;
  height: 36rpx;
  border: 4rpx solid rgba(10, 10, 12, 0.25);
  border-top-color: #0a0a0c;
  border-radius: 999rpx;
  animation: m-spin 0.8s linear infinite;
}

@keyframes m-spin {
  to {
    transform: rotate(360deg);
  }
}

.m-player__queue {
  width: 56rpx;
  height: 56rpx;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
}

.m-player__queue-line {
  width: 40rpx;
  height: 3rpx;
  border-radius: 2rpx;
  background-color: $m-text-2;
  margin-bottom: 8rpx;

  &:last-child {
    margin-bottom: 0;
  }
}

/* 底部 */
.m-player__bottom {
  position: relative;
  z-index: 2;
  height: 88rpx;
  padding: 0 40rpx;
  padding-bottom: env(safe-area-inset-bottom);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.m-player__comment-entry {
  font-family: $m-font-cn;
  font-size: 22rpx;
  color: $m-text-3;
}

.m-player__share {
  width: 28rpx;
  height: 28rpx;
  border-top: 3rpx solid $m-text-3;
  border-right: 3rpx solid $m-text-3;
  transform: rotate(-45deg);
}
</style>
