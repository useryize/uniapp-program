<template>
  <!-- 迷你播放条（规格 §3.2）：除 player 页外所有页面吸底，是全应用播放状态的锚点 -->
  <view v-if="track" class="m-minibar-wrap">
    <view class="m-minibar" @tap="openPlayer">
      <view class="m-minibar__line">
        <view class="m-minibar__line-fill" :style="{ width: percent + '%' }" />
      </view>
      <view class="m-minibar__row">
        <image
          v-if="track.coverSmall || track.cover"
          class="m-minibar__cover"
          :src="track.coverSmall || track.cover"
          mode="aspectFill"
        />
        <view v-else class="m-minibar__cover m-minibar__cover--empty" />

        <view class="m-minibar__text">
          <text class="m-minibar__title">{{ track.title }}</text>
          <text class="m-minibar__artist">{{ track.artistName }}</text>
        </view>

        <view class="m-minibar__btn" @tap.stop="onToggle">
          <view v-if="playing" class="m-minibar__pause">
            <view class="m-minibar__pause-bar" />
            <view class="m-minibar__pause-bar" />
          </view>
          <view v-else class="m-minibar__play" />
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed } from 'vue'
import { playerState, toggle } from '../store/player.js'

const track = computed(() => playerState.track)
const playing = computed(() => playerState.status === 'playing')

const percent = computed(() => {
  const d = playerState.duration || track.value?.duration || 0
  if (!d) return 0
  return Math.min(100, (playerState.progress / d) * 100)
})

function onToggle() {
  toggle()
}

function openPlayer() {
  uni.navigateTo({ url: '/pages/music/player/index' })
}
</script>

<style lang="scss" scoped>
@import '../styles/tokens.scss';

.m-minibar-wrap {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 90;
  background-color: $m-bg;
  padding-bottom: env(safe-area-inset-bottom);
}

.m-minibar {
  background-color: rgba(21, 21, 25, 0.92);
  border-top: 1rpx solid $m-line-weak;
  backdrop-filter: blur(20px);
}

.m-minibar__line {
  height: 4rpx;
  background-color: rgba(255, 255, 255, 0.1);
}

.m-minibar__line-fill {
  height: 100%;
  background-color: $m-primary;
  transition: width 0.25s linear;
}

.m-minibar__row {
  height: 112rpx;
  display: flex;
  align-items: center;
  padding: 0 24rpx;
}

.m-minibar__cover {
  width: 76rpx;
  height: 76rpx;
  border-radius: 16rpx;
  flex-shrink: 0;
  background-color: $m-surface-hover;
}

.m-minibar__text {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding-left: 20rpx;
  overflow: hidden;
}

.m-minibar__title {
  font-family: $m-font-num;
  font-size: 24rpx;
  font-weight: 600;
  color: $m-text-1;
  line-height: 32rpx;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.m-minibar__artist {
  font-family: $m-font-num;
  font-size: 20rpx;
  color: $m-text-3;
  line-height: 26rpx;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.m-minibar__btn {
  width: 64rpx;
  height: 64rpx;
  border-radius: 999rpx;
  background-color: $m-primary;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.m-minibar__pause {
  display: flex;
  align-items: center;
}

.m-minibar__pause-bar {
  width: 6rpx;
  height: 22rpx;
  border-radius: 2rpx;
  background-color: #0a0a0c;

  & + & {
    margin-left: 8rpx;
  }
}

.m-minibar__play {
  width: 0;
  height: 0;
  border-top: 11rpx solid transparent;
  border-bottom: 11rpx solid transparent;
  border-left: 16rpx solid #0a0a0c;
  margin-left: 4rpx;
}
</style>
