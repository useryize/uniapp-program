<template>
  <!--
    Banner 推荐轮播（规格 §8.1.1）
    ⚠️ Audius 只有 1000×1000 方图，没有横幅图。禁止把方图 cover 裁成横幅。
    解法：同一张图放大铺底 + 模糊 + 深色遮罩，左侧再放一张清晰的方图。
  -->
  <view class="m-banner">
    <swiper
      class="m-banner__swiper"
      :autoplay="autoplay"
      :interval="4500"
      :duration="420"
      circular
      @change="onChange"
    >
      <swiper-item v-for="(item, i) in items" :key="i">
        <view class="m-banner__card" @tap="$emit('tap', item)">
          <!-- 底层：同一封面放大 + 模糊 -->
          <image class="m-banner__bg" :src="item.cover" mode="aspectFill" />
          <view class="m-banner__mask" />

          <!-- 左：清晰方图 -->
          <image class="m-banner__cover" :src="item.cover" mode="aspectFill" />

          <!-- 右：类型胶囊 → 标题 → 理由 -->
          <view class="m-banner__text">
            <view class="m-banner__tag">
              <text class="m-banner__tag-text">{{ item.type }}</text>
            </view>
            <text class="m-banner__title">{{ item.title }}</text>
            <text class="m-banner__reason">{{ item.reason }}</text>
          </view>
        </view>
      </swiper-item>
    </swiper>

    <!-- 指示器：4 条短横线（圆点在深色底上存在感太弱） -->
    <view class="m-banner__dots">
      <view
        v-for="(item, i) in items"
        :key="i"
        class="m-banner__dot"
        :class="{ 'is-active': i === current }"
      />
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { BannerItem } from '../api/types'

withDefaults(defineProps<{ items?: BannerItem[]; autoplay?: boolean }>(), {
  items: () => [],
  autoplay: true
})

defineEmits<{ tap: [item: BannerItem] }>()

const current = ref(0)

function onChange(e: { detail: { current: number } }) {
  current.value = e.detail.current
}
</script>

<style lang="scss" scoped>
@import '../styles/tokens.scss';

.m-banner {
  position: relative;
  width: 100%;
  height: 240rpx;
}

.m-banner__swiper {
  width: 100%;
  height: 240rpx;
}

.m-banner__card {
  position: relative;
  width: 100%;
  height: 240rpx;
  border-radius: 28rpx;
  overflow: hidden;
}

.m-banner__bg {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  filter: blur(20px);
  transform: scale(1.2);
}

.m-banner__mask {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(10, 10, 12, 0.62);
}

.m-banner__cover {
  position: absolute;
  left: 32rpx;
  top: 32rpx;
  width: 176rpx;
  height: 176rpx;
  border-radius: 24rpx;
  background-color: $m-surface-hover;
}

.m-banner__text {
  position: absolute;
  left: 232rpx;
  top: 32rpx;
  right: 24rpx;
  display: flex;
  flex-direction: column;
}

.m-banner__tag {
  align-self: flex-start;
  height: 38rpx;
  padding: 0 16rpx;
  border-radius: 999rpx;
  border: 1rpx solid rgba(0, 224, 184, 0.55);
  display: flex;
  align-items: center;
}

.m-banner__tag-text {
  font-family: $m-font-cn;
  font-size: 20rpx;
  font-weight: 500;
  color: $m-primary;
  line-height: 26rpx;
}

.m-banner__title {
  margin-top: 16rpx;
  font-family: $m-font-cn;
  font-size: 36rpx;
  font-weight: 700;
  color: #ffffff;
  line-height: 48rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.m-banner__reason {
  margin-top: 8rpx;
  font-family: $m-font-cn;
  font-size: 22rpx;
  color: $m-text-2;
  line-height: 30rpx;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.m-banner__dots {
  position: absolute;
  left: 32rpx;
  bottom: 20rpx;
  display: flex;
  align-items: center;
}

.m-banner__dot {
  width: 12rpx;
  height: 6rpx;
  border-radius: 4rpx;
  background-color: rgba(255, 255, 255, 0.28);
  margin-right: 8rpx;

  &.is-active {
    width: 32rpx;
    background-color: $m-primary;
  }
}
</style>
