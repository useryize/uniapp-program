<template>
  <view class="m-page">
    <music-nav :title="artist ? artist.name : '艺人'" />

    <scroll-view class="m-page__body" scroll-y>
      <view class="m-artist__content">
        <!-- 头部：圆形头像 + 艺名 + 统计 -->
        <view class="m-artist__header">
          <image v-if="artist && artist.avatar" class="m-artist__avatar" :src="artist.avatar" mode="aspectFill" />
          <view v-else class="m-artist__avatar m-artist__avatar--empty" />

          <view class="m-artist__info">
            <text class="m-artist__name">{{ artist ? artist.name : '加载中' }}</text>
            <text class="m-artist__stats">{{ statText }}</text>
          </view>
        </view>

        <!-- 操作行 -->
        <view class="m-artist__actions">
          <view class="m-artist__playall" @tap="playAll">
            <view class="m-artist__tri" />
            <text class="m-artist__playall-text">播放全部</text>
          </view>
          <view class="m-artist__follow" @tap="onFollow">
            <text class="m-artist__follow-text">关注</text>
          </view>
        </view>

        <music-skeleton v-if="loading" type="list" :rows="4" />

        <view v-else class="m-artist__list">
          <music-track-row
            v-for="(t, i) in tracks"
            :key="t.id"
            :track="t"
            :index="i"
            :active="isCurrent(t)"
            :show-index="false"
            @tap="onPlay"
            @more="onMore"
          />
        </view>

        <view v-if="!loading && !tracks.length" class="m-artist__empty">
          <text class="m-artist__empty-text">这位艺人还没有可播放的作品</text>
        </view>

        <view class="m-artist__bottom-space" />
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

import { fetchArtist, fetchArtistTracks } from '../api/index'
import { playerState, initPlayer, playQueue, playNext, addToQueue } from '../store/player'
import { formatFollowerCount } from '../utils/format'

const loading = ref(true)
const artist = ref(null)
const tracks = ref([])

const statText = computed(() => {
  if (!artist.value) return ''
  const followers = formatFollowerCount(artist.value.followerCount)
  const n = tracks.value.length || artist.value.trackCount || 0
  return `${followers} · ${n} 首作品`
})

onLoad(async (options) => {
  initPlayer()
  const id = options && options.id
  if (!id) {
    loading.value = false
    return
  }

  try {
    // 艺人信息与作品并行请求（规格 §8.7）
    const [info, list] = await Promise.all([fetchArtist(id), fetchArtistTracks(id)])
    artist.value = info
    tracks.value = list
  } catch (e) {
    uni.showToast({ title: '艺人信息加载失败', icon: 'none' })
  } finally {
    loading.value = false
  }
})

function isCurrent(t) {
  return playerState.track && playerState.track.id === t.id
}

function onPlay(track, index) {
  playQueue(tracks.value, index)
}

function playAll() {
  if (!tracks.value.length) return
  playQueue(tracks.value, 0)
}

/**
 * 关注按钮只做 UI，点击明确降级（规格 §8.7）
 * Audius 的用户关系需要 OAuth PKCE，只读场景下做不了
 */
function onFollow() {
  uni.showToast({ title: '登录功能开发中', icon: 'none', duration: 1500 })
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

.m-artist__content {
  padding-top: 16rpx;
}

.m-artist__header {
  display: flex;
  align-items: center;
  padding: 20rpx 40rpx 0;
}

.m-artist__avatar {
  width: 176rpx;
  height: 176rpx;
  border-radius: 999rpx;
  background-color: $m-surface-hover;
  flex-shrink: 0;
}

.m-artist__avatar--empty {
  background-color: $m-surface;
}

.m-artist__info {
  flex: 1;
  padding-left: 32rpx;
  overflow: hidden;
}

.m-artist__name {
  display: block;
  font-family: $m-font-num;
  font-size: 40rpx;
  font-weight: 700;
  color: $m-text-1;
  line-height: 52rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.m-artist__stats {
  display: block;
  margin-top: 10rpx;
  font-family: $m-font-cn;
  font-size: 24rpx;
  color: $m-text-3;
}

.m-artist__actions {
  display: flex;
  align-items: center;
  padding: 32rpx 40rpx 0;
}

.m-artist__playall {
  height: 64rpx;
  padding: 0 28rpx;
  border-radius: 999rpx;
  background-color: $m-primary;
  display: flex;
  align-items: center;
}

.m-artist__tri {
  width: 0;
  height: 0;
  border-top: 10rpx solid transparent;
  border-bottom: 10rpx solid transparent;
  border-left: 15rpx solid #0a0a0c;
  margin-right: 12rpx;
}

.m-artist__playall-text {
  font-family: $m-font-cn;
  font-size: 24rpx;
  font-weight: 600;
  color: #0a0a0c;
}

.m-artist__follow {
  margin-left: 20rpx;
  height: 64rpx;
  padding: 0 32rpx;
  border-radius: 999rpx;
  border: 1rpx solid $m-line-strong;
  display: flex;
  align-items: center;
}

.m-artist__follow-text {
  font-family: $m-font-cn;
  font-size: 24rpx;
  color: $m-text-2;
}

.m-artist__list {
  padding-top: 28rpx;
}

.m-artist__empty {
  padding: 120rpx 0;
  display: flex;
  justify-content: center;
}

.m-artist__empty-text {
  font-family: $m-font-cn;
  font-size: 24rpx;
  color: $m-text-3;
}

.m-artist__bottom-space {
  height: 180rpx;
}
</style>
