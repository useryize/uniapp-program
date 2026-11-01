<template>
  <view class="m-page">
    <music-nav title="每日推荐">
      <template #right>
        <text class="m-daily__count">{{ tracks.length }} 首</text>
      </template>
    </music-nav>

    <scroll-view
      class="m-page__body"
      scroll-y
      :refresher-enabled="true"
      :refresher-triggered="refreshing"
      @refresherrefresh="onRefresh"
    >
      <view class="m-daily__content">
        <!-- 大日期区 -->
        <view class="m-daily__hero">
          <text class="m-daily__date">{{ bigDate }}</text>
          <text class="m-daily__desc">{{ desc }}</text>
        </view>

        <!-- 播放全部 -->
        <view class="m-daily__actions">
          <view class="m-daily__playall" @tap="playAll">
            <view class="m-daily__playall-tri" />
            <text class="m-daily__playall-text">播放全部</text>
          </view>
          <text class="m-daily__note">同一天内不会变，明天 0 点更新</text>
        </view>

        <!-- 新用户引导 -->
        <view v-if="isNewUser" class="m-daily__tip">
          <text class="m-daily__tip-text">听几首后，推荐会更准</text>
        </view>

        <music-skeleton v-if="loading" type="list" :rows="5" />

        <view v-else class="m-daily__list">
          <music-track-row
            v-for="(t, i) in tracks"
            :key="t.id"
            :track="t"
            :index="i"
            :show-index="true"
            :active="isCurrent(t)"
            @tap="onPlay"
            @more="onMore"
          />
        </view>

        <view class="m-daily__bottom-space" />
      </view>
    </scroll-view>

    <music-mini-bar />
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'

import MusicNav from '../components/music-nav.vue'
import MusicSkeleton from '../components/music-skeleton.vue'
import MusicTrackRow from '../components/music-track-row.vue'
import MusicMiniBar from '../components/music-mini-bar.vue'

import { buildDaily } from '../utils/daily.js'
import { playerState, initPlayer, playQueue, playNext, addToQueue } from '../store/player.js'
import { genreLabel } from '../data/genres.js'
import { dateKey } from '../utils/format.js'

const loading = ref(true)
const refreshing = ref(false)
const tracks = ref([])
const isNewUser = ref(false)
const topGenre = ref('')
const dateStr = ref(dateKey())

const bigDate = computed(() => {
  const [y, m, d] = dateStr.value.split('-')
  return `${m} / ${d}`
})

const desc = computed(() => {
  if (isNewUser.value) return `按本周热度生成 · ${tracks.value.length} 首`
  return `根据你的收听生成 · ${tracks.value.length} 首`
})

onLoad(async () => {
  initPlayer()
  await load()
})

async function load() {
  loading.value = true
  try {
    const result = await buildDaily()
    tracks.value = result.tracks
    isNewUser.value = result.isNewUser
    topGenre.value = result.topGenre
    dateStr.value = result.date
  } catch (e) {
    uni.showToast({ title: '推荐生成失败', icon: 'none' })
  } finally {
    loading.value = false
    refreshing.value = false
  }
}

/**
 * 下拉刷新故意不刷新列表（规格 §8.2.4）
 * 这是为了守住「同一天内不变」的信任感——刷新就变，用户立刻会察觉这是随机的
 */
function onRefresh() {
  refreshing.value = true
  setTimeout(() => {
    refreshing.value = false
    uni.showToast({ title: '今天的推荐明天更新', icon: 'none', duration: 1500 })
  }, 400)
}

function isCurrent(t) {
  return playerState.track && playerState.track.id === t.id
}

function onPlay(track, index) {
  // 整 30 首入队，从该首开始
  playQueue(tracks.value, index)
}

function playAll() {
  if (!tracks.value.length) return
  playQueue(tracks.value, 0)
}

function onMore(track) {
  uni.showActionSheet({
    itemList: ['下一首播放', '加入播放列表'],
    success: ({ tapIndex }) => {
      if (tapIndex === 0) playNext(track)
      if (tapIndex === 1) addToQueue(track)
    }
  })
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

.m-daily__count {
  font-family: $m-font-cn;
  font-size: 22rpx;
  color: $m-text-3;
}

.m-daily__content {
  padding-top: 8rpx;
}

.m-daily__hero {
  padding: 20rpx 40rpx 0;
}

.m-daily__date {
  display: block;
  font-family: $m-font-num;
  font-size: 80rpx;
  font-weight: 300;
  color: #ffffff;
  line-height: 96rpx;
  letter-spacing: 2rpx;
}

.m-daily__desc {
  display: block;
  margin-top: 8rpx;
  font-family: $m-font-cn;
  font-size: 24rpx;
  color: $m-text-2;
}

.m-daily__actions {
  display: flex;
  align-items: center;
  padding: 28rpx 40rpx 0;
}

.m-daily__playall {
  height: 64rpx;
  padding: 0 32rpx;
  border-radius: 999rpx;
  background-color: $m-primary;
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.m-daily__playall-tri {
  width: 0;
  height: 0;
  border-top: 10rpx solid transparent;
  border-bottom: 10rpx solid transparent;
  border-left: 15rpx solid #0a0a0c;
  margin-right: 12rpx;
}

.m-daily__playall-text {
  font-family: $m-font-cn;
  font-size: 26rpx;
  font-weight: 600;
  color: #0a0a0c;
}

.m-daily__note {
  margin-left: 20rpx;
  font-family: $m-font-cn;
  font-size: 22rpx;
  color: $m-text-3;
}

.m-daily__tip {
  margin: 24rpx 32rpx 0;
  padding: 20rpx 24rpx;
  border-radius: 20rpx;
  background-color: $m-line-weak;
}

.m-daily__tip-text {
  font-family: $m-font-cn;
  font-size: 22rpx;
  color: $m-text-2;
}

.m-daily__list {
  padding-top: 28rpx;
}

.m-daily__bottom-space {
  height: 180rpx;
}
</style>
