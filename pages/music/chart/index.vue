<template>
  <view class="m-page">
    <music-tab-bar active="chart">
      <template #right>
        <text class="m-chart__update">{{ updateText }}</text>
      </template>
    </music-tab-bar>

    <scroll-view class="m-page__body" scroll-y>
      <view class="m-chart__content">
        <!-- 时间维度：本周 / 本月 / 全时段 -->
        <view class="m-chart__segment">
          <view
            v-for="t in TIMES"
            :key="t.id"
            class="m-chart__segment-item"
            :class="{ 'is-active': time === t.id }"
            @tap="onTimeChange(t.id)"
          >
            <text class="m-chart__segment-text" :class="{ 'is-active': time === t.id }">
              {{ t.label }}
            </text>
          </view>
        </view>

        <!-- 曲风胶囊 -->
        <view class="m-chart__chips">
          <music-genre-chips v-model="genre" :genres="GENRES" @change="onGenreChange" />
        </view>

        <music-skeleton v-if="loading" type="list" :rows="6" />

        <view v-else class="m-chart__list">
          <!-- 前三名：大序号 + 主色描边卡（规格 §8.5） -->
          <view
            v-for="(t, i) in top3"
            :key="t.id"
            class="m-chart__top"
            :class="{ 'is-first': i === 0 }"
            @tap="playAt(i)"
          >
            <text class="m-chart__top-no">{{ pad(i + 1) }}</text>
            <image v-if="t.cover" class="m-chart__top-cover" :src="t.cover" mode="aspectFill" />
            <view v-else class="m-chart__top-cover m-chart__empty" />
            <view class="m-chart__top-text">
              <text class="m-chart__top-title">{{ t.title }}</text>
              <text class="m-chart__top-artist">{{ t.artistName }}</text>
            </view>
            <text class="m-chart__top-plays">{{ playText(t) }}</text>
          </view>

          <!-- 第 4 名起普通行 -->
          <music-track-row
            v-for="(t, i) in rest"
            :key="t.id"
            :track="t"
            :index="i + 3"
            :show-index="true"
            @tap="playAt(i + 3)"
            @more="onMore"
          />
        </view>

        <view v-if="!loading && !tracks.length" class="m-chart__empty">
          <text class="m-chart__empty-text">这个曲风暂时没有上榜曲目</text>
        </view>

        <view class="m-chart__bottom-space" />
      </view>
    </scroll-view>

    <music-mini-bar />
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'

import MusicTabBar from '../components/music-tab-bar.vue'
import MusicGenreChips from '../components/music-genre-chips.vue'
import MusicSkeleton from '../components/music-skeleton.vue'
import MusicTrackRow from '../components/music-track-row.vue'
import MusicMiniBar from '../components/music-mini-bar.vue'

import { fetchTrending } from '../api/index'
import { GENRES, TIMES } from '../data/genres'
import { initPlayer, playQueue, playNext, addToQueue } from '../store/player'
import { formatPlayCount, timeAgo } from '../utils/format'
import type { Track } from '../api/types'
import type { TimeOption } from '../data/genres'

const loading = ref(true)
const time = ref<TimeOption['id']>('week')
const genre = ref('')
const tracks = ref<Track[]>([])
const updatedAt = ref(Date.now())

const top3 = computed(() => tracks.value.slice(0, 3))
const rest = computed(() => tracks.value.slice(3))
const updateText = computed(() => timeAgo(updatedAt.value))

onLoad(async () => {
  initPlayer()
  await load()
})

async function load() {
  loading.value = true
  try {
    const list = await fetchTrending({ time: time.value, genre: genre.value, limit: 50 })
    tracks.value = list
    updatedAt.value = Date.now()
  } catch (e) {
    uni.showToast({ title: '榜单加载失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

function onTimeChange(id: TimeOption['id']) {
  if (id === time.value) return
  time.value = id
  // 切时间/曲风重置滚动到顶部（规格 §8.5）
  load()
}

function onGenreChange() {
  load()
}

function pad(n: number) {
  return String(n).padStart(2, '0')
}

function playText(t: Track) {
  return `${formatPlayCount(t.playCount)}`
}

function playAt(i: number) {
  // 整榜入队，从该首播放
  playQueue(tracks.value, i)
}

function onMore(track: Track) {
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

.m-chart__update {
  font-family: $m-font-cn;
  font-size: 20rpx;
  color: $m-text-3;
}

.m-chart__content {
  padding-top: 16rpx;
}

.m-chart__segment {
  margin: 0 32rpx;
  height: 68rpx;
  border-radius: 999rpx;
  background-color: $m-line-weak;
  display: flex;
  align-items: center;
  padding: 6rpx;
  box-sizing: border-box;
}

.m-chart__segment-item {
  flex: 1;
  height: 56rpx;
  border-radius: 999rpx;
  display: flex;
  align-items: center;
  justify-content: center;

  &.is-active {
    background-color: $m-surface-hover;
  }
}

.m-chart__segment-text {
  font-family: $m-font-cn;
  font-size: 24rpx;
  color: $m-text-3;

  &.is-active {
    color: $m-text-1;
    font-weight: 500;
  }
}

.m-chart__chips {
  padding-top: 20rpx;
}

.m-chart__list {
  padding-top: 20rpx;
}

.m-chart__top {
  display: flex;
  align-items: center;
  height: 128rpx;
  margin: 0 32rpx 16rpx;
  padding: 0 28rpx;
  box-sizing: border-box;
  border-radius: 28rpx;
  background-color: $m-line-weak;
  border: 1rpx solid $m-primary-20;

  &.is-first {
    background-color: $m-primary-08;
    border-color: $m-primary-40;
  }
}

.m-chart__top-no {
  width: 56rpx;
  flex-shrink: 0;
  font-family: $m-font-num;
  font-size: 40rpx;
  font-weight: 700;
  color: $m-primary;
  text-align: center;
}

.m-chart__top-cover {
  width: 88rpx;
  height: 88rpx;
  border-radius: 16rpx;
  background-color: $m-surface-hover;
  margin-left: 12rpx;
  flex-shrink: 0;
}

.m-chart__top-text {
  flex: 1;
  padding-left: 20rpx;
  overflow: hidden;
}

.m-chart__top-title {
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

.m-chart__top-artist {
  display: block;
  font-family: $m-font-num;
  font-size: 22rpx;
  color: $m-text-3;
  line-height: 30rpx;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.m-chart__top-plays {
  font-family: $m-font-num;
  font-size: 22rpx;
  color: $m-text-3;
  flex-shrink: 0;
}

.m-chart__empty {
  padding: 120rpx 0;
  display: flex;
  justify-content: center;
}

.m-chart__empty-text {
  font-family: $m-font-cn;
  font-size: 24rpx;
  color: $m-text-3;
}

.m-chart__bottom-space {
  height: 180rpx;
}
</style>
