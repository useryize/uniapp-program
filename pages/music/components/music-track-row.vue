<template>
  <!-- 曲目行（规格 §3.2）：歌单 / 榜单 / 搜索 / 艺人 / 每日推荐共用 -->
  <view class="m-row" :class="{ 'is-active': active }" @tap="$emit('tap', track, index)">
    <text v-if="showIndex" class="m-row__index" :style="{ color: active ? activeColor : '' }">
      {{ indexText }}
    </text>

    <image
      v-if="track.coverSmall || track.cover"
      class="m-row__cover"
      :src="track.coverSmall || track.cover"
      mode="aspectFill"
    />
    <view v-else class="m-row__cover m-row__cover--empty" />

    <view class="m-row__text">
      <text class="m-row__title" :style="{ color: active ? activeColor : '' }">
        {{ track.title }}
      </text>
      <text class="m-row__artist" :style="{ color: active ? activeColor : '' }">
        {{ track.artistName }}
      </text>
    </view>

    <view v-if="track.reason" class="m-row__tag" :class="{ 'is-strong': track.personalized }">
      <text class="m-row__tag-text" :class="{ 'is-strong': track.personalized }">
        {{ track.reason }}
      </text>
    </view>

    <text v-if="duration" class="m-row__duration">{{ durationText }}</text>

    <view class="m-row__more" @tap.stop="$emit('more', track, index)">
      <view class="m-row__dot" />
      <view class="m-row__dot" />
      <view class="m-row__dot" />
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { formatDuration } from '../utils/format'
import type { Track, RecommendedTrack } from '../api/types'

type DisplayTrack = Track & Partial<Pick<RecommendedTrack, 'reason' | 'personalized'>>

const props = withDefaults(defineProps<{
  track: DisplayTrack
  index?: number
  showIndex?: boolean
  showDuration?: boolean
  active?: boolean
}>(), {
  index: 0,
  showIndex: false,
  showDuration: true,
  active: false
})

defineEmits<{ tap: [track: Track, index: number]; more: [track: Track, index: number] }>()

const activeColor = '#00E0B8'

const indexText = computed(() => String(props.index + 1).padStart(2, '0'))
const durationText = computed(() => formatDuration(props.track.duration))
const duration = computed(() => props.showDuration)
</script>

<style lang="scss" scoped>
@import '../styles/tokens.scss';

.m-row {
  display: flex;
  align-items: center;
  height: 104rpx;
  padding: 0 32rpx;
  box-sizing: border-box;
}

.m-row__index {
  width: 40rpx;
  flex-shrink: 0;
  font-family: $m-font-num;
  font-size: 26rpx;
  font-weight: 500;
  color: $m-text-3;
  text-align: center;
  margin-right: 8rpx;
}

.m-row__cover {
  width: 80rpx;
  height: 80rpx;
  border-radius: 16rpx;
  flex-shrink: 0;
  background-color: $m-surface-hover;
  margin-right: 24rpx;
}

.m-row__text {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  overflow: hidden;
}

.m-row__title {
  font-family: $m-font-num;
  font-size: 26rpx;
  font-weight: 600;
  color: $m-text-1;
  line-height: 34rpx;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.m-row__artist {
  font-family: $m-font-num;
  font-size: 22rpx;
  color: $m-text-3;
  line-height: 30rpx;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.m-row__tag {
  flex-shrink: 0;
  height: 40rpx;
  padding: 0 16rpx;
  border-radius: 999rpx;
  border: 1rpx solid $m-line-strong;
  display: flex;
  align-items: center;
  margin-left: 12rpx;

  &.is-strong {
    border-color: $m-primary-40;
    background-color: $m-primary-08;
  }
}

.m-row__tag-text {
  font-family: $m-font-cn;
  font-size: 20rpx;
  color: $m-text-2;

  &.is-strong {
    color: $m-primary;
  }
}

.m-row__duration {
  flex-shrink: 0;
  font-family: $m-font-num;
  font-size: 22rpx;
  color: $m-text-3;
  margin-left: 16rpx;
}

.m-row__more {
  width: 44rpx;
  height: 44rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-left: 4rpx;
}

.m-row__dot {
  width: 6rpx;
  height: 6rpx;
  border-radius: 999rpx;
  background-color: $m-text-4;

  & + & {
    margin-left: 4rpx;
  }
}
</style>
