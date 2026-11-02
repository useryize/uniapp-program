<template>
  <view class="m-page">
    <music-tab-bar active="library" />

    <scroll-view class="m-page__body" scroll-y>
      <view class="m-lib__content">
        <!-- 收藏 / 最近播放 -->
        <view class="m-lib__tabs">
          <view
            v-for="t in tabs"
            :key="t.id"
            class="m-lib__tab"
            @tap="current = t.id"
          >
            <text class="m-lib__tab-text" :class="{ 'is-active': current === t.id }">
              {{ t.label }}
            </text>
            <view class="m-lib__tab-line" :class="{ 'is-active': current === t.id }" />
          </view>
        </view>

        <view v-if="!list.length" class="m-lib__empty">
          <text class="m-lib__empty-title">{{ current === 'favs' ? '还没有收藏' : '还没有播放记录' }}</text>
          <text class="m-lib__empty-desc">去发现页听几首，这里会记住你喜欢的</text>
          <view class="m-lib__empty-btn" @tap="goHome">
            <text class="m-lib__empty-btn-text">去发现</text>
          </view>
        </view>

        <view v-else class="m-lib__list">
          <view
            v-for="(t, i) in list"
            :key="t.id"
            class="m-lib__row"
            :class="{ 'is-offline': t.streamable === false }"
            @tap="onPlay(i)"
          >
            <image v-if="t.cover" class="m-lib__cover" :src="t.cover" mode="aspectFill" />
            <view v-else class="m-lib__cover m-lib__cover--empty" />

            <view class="m-lib__text">
              <text class="m-lib__title">{{ t.title }}</text>
              <text class="m-lib__artist">
                {{ t.streamable === false ? '已下架 · 点按可移除' : t.artistName }}
              </text>
            </view>

            <view v-if="current === 'favs'" class="m-lib__heart" @tap.stop="onUnfav(t)">
              <view class="m-lib__heart-shape" />
            </view>
          </view>
        </view>

        <view class="m-lib__bottom-space" />
      </view>
    </scroll-view>

    <music-mini-bar />
  </view>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { onShow } from '@dcloudio/uni-app'

import MusicTabBar from '../components/music-tab-bar.vue'
import MusicMiniBar from '../components/music-mini-bar.vue'

import { initPlayer, playQueue } from '../store/player'
import { getFavs, getRecent, toggleFav, recordPlay } from '../utils/profile'
import type { Track, TrackSnapshot } from '../api/types'

const tabs = [
  { id: 'favs', label: '收藏' },
  { id: 'recent', label: '最近播放' }
]

const current = ref('favs')
const favs = ref<TrackSnapshot[]>([])
const recent = ref<TrackSnapshot[]>([])

const list = computed(() => (current.value === 'favs' ? favs.value : recent.value))

function refresh() {
  favs.value = getFavs()
  recent.value = getRecent()
}

onShow(() => {
  initPlayer()
  refresh()
})

watch(current, refresh)

function onPlay(i: number) {
  const track = list.value[i]
  if (!track) return

  // 已下架的曲目：提示移除，不进入播放（规格 §8.8）
  if (track.streamable === false) {
    uni.showModal({
      title: '这首歌已下架',
      content: '已从收藏中移除该曲目',
      showCancel: false,
      success: () => {
        toggleFav(track)
        refresh()
      }
    })
    return
  }

  // 队列用整份列表，这样下一首仍是列表里的下一首
  const queue: Track[] = list.value.map((item) => ({
    ...item,
    artistId: '',
    artistAvatar: '',
    coverSmall: item.cover,
    streamable: item.streamable !== false,
    isGated: false
  }))
  playQueue(queue, i)
  recordPlay(queue[i])
}

function onUnfav(track: TrackSnapshot) {
  toggleFav(track)
  refresh()
}

function goHome() {
  uni.reLaunch({ url: '/pages/music/home/index' })
}
</script>

<style lang="scss" scoped>
@import '../styles/tokens.scss';

.m-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: $m-bg;
}

.m-page__body {
  flex: 1;
  overflow: hidden;
}

.m-lib__content {
  padding-top: 8rpx;
}

.m-lib__tabs {
  display: flex;
  align-items: center;
  padding: 20rpx 32rpx 8rpx;
}

.m-lib__tab {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-right: 52rpx;
}

.m-lib__tab-text {
  font-family: $m-font-cn;
  font-size: 28rpx;
  color: $m-text-3;
  line-height: 38rpx;

  &.is-active {
    color: $m-text-1;
    font-weight: 600;
  }
}

.m-lib__tab-line {
  width: 36rpx;
  height: 6rpx;
  border-radius: 4rpx;
  background-color: transparent;
  margin-top: 8rpx;

  &.is-active {
    background-color: $m-primary;
  }
}

.m-lib__list {
  padding-top: 20rpx;
}

.m-lib__row {
  display: flex;
  align-items: center;
  height: 104rpx;
  padding: 0 32rpx;
  box-sizing: border-box;

  &.is-offline {
    opacity: 0.45;
  }
}

.m-lib__cover {
  width: 80rpx;
  height: 80rpx;
  border-radius: 16rpx;
  background-color: $m-surface-hover;
  flex-shrink: 0;
  margin-right: 24rpx;
}

.m-lib__cover--empty {
  background-color: $m-surface-hover;
}

.m-lib__text {
  flex: 1;
  overflow: hidden;
}

.m-lib__title {
  display: block;
  font-family: $m-font-num;
  font-size: 26rpx;
  font-weight: 600;
  color: $m-text-1;
  line-height: 34rpx;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.m-lib__artist {
  display: block;
  font-family: $m-font-num;
  font-size: 22rpx;
  color: $m-text-3;
  line-height: 30rpx;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.m-lib__heart {
  width: 44rpx;
  height: 44rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

/* 用 CSS 画的心形：两个圆 + 一个旋转方块，避免引图标字体 */
.m-lib__heart-shape {
  position: relative;
  width: 24rpx;
  height: 22rpx;
  transform: rotate(-45deg);
  background-color: $m-accent;

  &::before,
  &::after {
    content: '';
    position: absolute;
    width: 24rpx;
    height: 24rpx;
    border-radius: 999rpx;
    background-color: $m-accent;
  }

  &::before {
    top: -12rpx;
    left: 0;
  }

  &::after {
    top: 0;
    left: 12rpx;
  }
}

.m-lib__empty {
  padding: 160rpx 64rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.m-lib__empty-title {
  font-family: $m-font-cn;
  font-size: 30rpx;
  font-weight: 600;
  color: $m-text-1;
}

.m-lib__empty-desc {
  margin-top: 16rpx;
  font-family: $m-font-cn;
  font-size: 24rpx;
  color: $m-text-3;
  text-align: center;
}

.m-lib__empty-btn {
  margin-top: 40rpx;
  height: 64rpx;
  padding: 0 40rpx;
  border-radius: 999rpx;
  background-color: $m-primary;
  display: flex;
  align-items: center;
}

.m-lib__empty-btn-text {
  font-family: $m-font-cn;
  font-size: 24rpx;
  font-weight: 600;
  color: #0a0a0c;
}

.m-lib__bottom-space {
  height: 180rpx;
}
</style>
