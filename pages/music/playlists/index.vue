<template>
  <view class="m-page">
    <music-nav title="专题歌单">
      <template #right>
        <view class="m-plaza__refresh" @tap="onRefreshBatch">
          <text class="m-plaza__refresh-text">换一批</text>
        </view>
      </template>
    </music-nav>

    <scroll-view class="m-page__body" scroll-y>
      <view class="m-plaza__content">
        <text class="m-plaza__subtitle">{{ subtitle }}</text>

        <view class="m-plaza__chips">
          <music-genre-chips v-model="genre" :genres="PLAZA_GENRES" @change="load" />
        </view>

        <music-skeleton v-if="loading" type="grid" :rows="4" />

        <view v-else-if="!list.length" class="m-plaza__empty">
          <text class="m-plaza__empty-text">这个曲风还没有专题</text>
          <view class="m-plaza__empty-btn" @tap="resetGenre">
            <text class="m-plaza__empty-btn-text">看全部</text>
          </view>
        </view>

        <view v-else class="m-plaza__grid">
          <view
            v-for="p in list"
            :key="p.id"
            class="m-plaza__card"
            @tap="goPlaylist(p.id)"
          >
            <image v-if="p.cover" class="m-plaza__cover" :src="p.cover" mode="aspectFill" />
            <view v-else class="m-plaza__cover m-plaza__cover--empty" />
            <text class="m-plaza__name">{{ p.name }}</text>
            <text class="m-plaza__meta">{{ p.trackCount }} 首 · {{ p.ownerName }}</text>
          </view>
        </view>

        <view class="m-plaza__bottom-space" />
      </view>
    </scroll-view>

    <music-mini-bar />
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'

import MusicNav from '../components/music-nav.vue'
import MusicGenreChips from '../components/music-genre-chips.vue'
import MusicSkeleton from '../components/music-skeleton.vue'
import MusicMiniBar from '../components/music-mini-bar.vue'

import { fetchPlaylists } from '../api/index'
import { PLAZA_GENRES, TIMES } from '../data/genres'
import { initPlayer } from '../store/player'
import type { Playlist } from '../api/types'

const loading = ref(true)
const genre = ref('')
const list = ref<Playlist[]>([])
/** 换一批用的时间维度轮换（规格 §8.9：不做无限滚动） */
const timeIndex = ref(0)

const subtitle = computed(() => {
  const t = TIMES[timeIndex.value]
  return `${list.value.length} 个专题 · ${t ? t.label : '本周'}更新`
})

onLoad(async () => {
  initPlayer()
  await load()
})

async function load() {
  loading.value = true
  try {
    const time = TIMES[timeIndex.value].id
    list.value = await fetchPlaylists({ time, genre: genre.value, limit: 20 })
  } catch (e) {
    uni.showToast({ title: '加载失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

function onRefreshBatch() {
  // 轮换 week → month → allTime，用户永远能拿到新内容
  timeIndex.value = (timeIndex.value + 1) % TIMES.length
  load()
}

function resetGenre() {
  genre.value = ''
  load()
}

function goPlaylist(id: string) {
  uni.navigateTo({ url: `/pages/music/playlist/index?id=${id}` })
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

.m-plaza__refresh {
  height: 44rpx;
  padding: 0 20rpx;
  border-radius: 999rpx;
  background-color: $m-line-weak;
  display: flex;
  align-items: center;
}

.m-plaza__refresh-text {
  font-family: $m-font-cn;
  font-size: 22rpx;
  color: $m-text-2;
}

.m-plaza__content {
  padding-top: 12rpx;
}

.m-plaza__subtitle {
  display: block;
  padding: 8rpx 32rpx 0;
  font-family: $m-font-cn;
  font-size: 22rpx;
  color: $m-text-3;
}

.m-plaza__chips {
  padding-top: 20rpx;
}

.m-plaza__grid {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  padding: 24rpx 32rpx 0;
}

.m-plaza__card {
  width: 331rpx;
  margin-bottom: 32rpx;
}

.m-plaza__cover {
  width: 331rpx;
  height: 224rpx;
  border-radius: 24rpx;
  background-color: $m-surface-hover;
}

.m-plaza__cover--empty {
  background-color: $m-surface;
}

.m-plaza__name {
  display: block;
  margin-top: 14rpx;
  font-family: $m-font-cn;
  font-size: 24rpx;
  font-weight: 500;
  color: $m-text-1;
  line-height: 34rpx;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.m-plaza__meta {
  display: block;
  font-family: $m-font-cn;
  font-size: 20rpx;
  color: $m-text-3;
  line-height: 28rpx;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.m-plaza__empty {
  padding: 140rpx 0;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.m-plaza__empty-text {
  font-family: $m-font-cn;
  font-size: 24rpx;
  color: $m-text-3;
}

.m-plaza__empty-btn {
  margin-top: 32rpx;
  height: 60rpx;
  padding: 0 36rpx;
  border-radius: 999rpx;
  background-color: $m-primary;
  display: flex;
  align-items: center;
}

.m-plaza__empty-btn-text {
  font-family: $m-font-cn;
  font-size: 24rpx;
  font-weight: 600;
  color: #0a0a0c;
}

.m-plaza__bottom-space {
  height: 180rpx;
}
</style>
