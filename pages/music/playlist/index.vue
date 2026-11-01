<template>
  <view class="m-page">
    <music-nav :title="playlist ? playlist.name : '歌单'" />

    <scroll-view class="m-page__body" scroll-y>
      <view v-if="loading" class="m-pl__loading">
        <music-skeleton type="list" :rows="6" />
      </view>

      <view v-else class="m-pl__content">
        <!-- 头部：大封面 + 名称 / 作者 / 曲目数 -->
        <view class="m-pl__header">
          <image v-if="playlist && playlist.cover" class="m-pl__cover" :src="playlist.cover" mode="aspectFill" />
          <view v-else class="m-pl__cover m-pl__cover--empty" />

          <view class="m-pl__info">
            <text class="m-pl__name">{{ playlist ? playlist.name : '未知歌单' }}</text>
            <text class="m-pl__owner">{{ playlist ? playlist.ownerName : '' }}</text>
            <text class="m-pl__meta">{{ metaText }}</text>
          </view>
        </view>

        <!-- 操作行 -->
        <view class="m-pl__actions">
          <view class="m-pl__playall" @tap="playAll">
            <view class="m-pl__playall-tri" />
            <text class="m-pl__playall-text">播放全部</text>
          </view>
          <view class="m-pl__fav" @tap="onFav">
            <text class="m-pl__fav-text">{{ faved ? '已收藏' : '收藏' }}</text>
          </view>
        </view>

        <!-- 曲目列表 -->
        <view class="m-pl__list">
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

        <view v-if="!tracks.length" class="m-pl__empty">
          <text class="m-pl__empty-text">这个歌单暂时没有可播放的曲目</text>
        </view>

        <view class="m-pl__bottom-space" />
      </view>
    </scroll-view>

    <music-mini-bar />
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'

import MusicNav from '../components/music-nav.vue'
import MusicSkeleton from '../components/music-skeleton.vue'
import MusicTrackRow from '../components/music-track-row.vue'
import MusicMiniBar from '../components/music-mini-bar.vue'

import { fetchPlaylistDetail, fetchPlaylistTracks } from '../api/index'
import { playerState, initPlayer, playQueue, playNext, addToQueue } from '../store/player'
import { isFav, toggleFav } from '../utils/profile'
import { formatTotalDuration } from '../utils/format'

const loading = ref(true)
const playlist = ref(null)
const tracks = ref([])
const faved = ref(false)

const metaText = computed(() => {
  const total = tracks.value.reduce((sum, t) => sum + (t.duration || 0), 0)
  const n = tracks.value.length || (playlist.value?.trackCount ?? 0)
  return total ? `${n} 首 · ${formatTotalDuration(total)}` : `${n} 首`
})

onLoad(async (options) => {
  initPlayer()
  const id = options && options.id
  if (!id) {
    loading.value = false
    return
  }

  try {
    // 详情与曲目并行请求
    const [detail, list] = await Promise.all([
      fetchPlaylistDetail(id).catch(() => null),
      fetchPlaylistTracks(id)
    ])
    playlist.value = detail
    tracks.value = list
    if (tracks.value[0]) faved.value = isFav(tracks.value[0].id)
  } catch (e) {
    uni.showToast({ title: '歌单加载失败', icon: 'none' })
  } finally {
    loading.value = false
  }
})

function isCurrent(t) {
  return playerState.track && playerState.track.id === t.id
}

function onPlay(track, index) {
  // 队列仍是整个列表，这样下一首是列表里的下一首（规格 §8.4）
  playQueue(tracks.value, index)
}

function playAll() {
  if (!tracks.value.length) return
  playQueue(tracks.value, 0)
}

function onFav() {
  // 收藏落到具体曲目上，歌单级收藏当前不落库，先给明确反馈
  if (!tracks.value.length) return
  const first = tracks.value[0]
  faved.value = toggleFav(first)
  uni.showToast({
    title: faved.value ? '已收藏首曲' : '已取消收藏',
    icon: 'none',
    duration: 1200
  })
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

.m-pl__content {
  padding-top: 16rpx;
}

.m-pl__header {
  display: flex;
  align-items: flex-start;
  padding: 20rpx 32rpx 0;
}

.m-pl__cover {
  width: 220rpx;
  height: 220rpx;
  border-radius: 28rpx;
  background-color: $m-surface-hover;
  flex-shrink: 0;
}

.m-pl__cover--empty {
  background-color: $m-surface;
}

.m-pl__info {
  flex: 1;
  padding: 12rpx 0 0 28rpx;
  overflow: hidden;
}

.m-pl__name {
  display: block;
  font-family: $m-font-cn;
  font-size: 38rpx;
  font-weight: 700;
  color: $m-text-1;
  line-height: 52rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.m-pl__owner {
  display: block;
  margin-top: 12rpx;
  font-family: $m-font-num;
  font-size: 24rpx;
  color: $m-text-2;
}

.m-pl__meta {
  display: block;
  margin-top: 6rpx;
  font-family: $m-font-cn;
  font-size: 22rpx;
  color: $m-text-3;
}

.m-pl__actions {
  display: flex;
  align-items: center;
  padding: 32rpx 32rpx 0;
}

.m-pl__playall {
  height: 64rpx;
  padding: 0 28rpx;
  border-radius: 999rpx;
  background-color: $m-primary;
  display: flex;
  align-items: center;
}

.m-pl__playall-tri {
  width: 0;
  height: 0;
  border-top: 10rpx solid transparent;
  border-bottom: 10rpx solid transparent;
  border-left: 15rpx solid #0a0a0c;
  margin-right: 12rpx;
}

.m-pl__playall-text {
  font-family: $m-font-cn;
  font-size: 24rpx;
  font-weight: 600;
  color: #0a0a0c;
}

.m-pl__fav {
  margin-left: 20rpx;
  height: 64rpx;
  padding: 0 28rpx;
  border-radius: 999rpx;
  border: 1rpx solid $m-line-strong;
  display: flex;
  align-items: center;
}

.m-pl__fav-text {
  font-family: $m-font-cn;
  font-size: 24rpx;
  color: $m-text-2;
}

.m-pl__list {
  padding-top: 28rpx;
}

.m-pl__empty {
  padding: 100rpx 0;
  display: flex;
  justify-content: center;
}

.m-pl__empty-text {
  font-family: $m-font-cn;
  font-size: 24rpx;
  color: $m-text-3;
}

.m-pl__bottom-space {
  height: 180rpx;
}
</style>
