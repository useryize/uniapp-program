<template>
  <view class="wx-nav" :style="{ paddingTop: header.top }">
    <view class="nav-row" :style="{ paddingRight: header.rightInset }">
      <view class="nav-left" @click="onBack">
        <view class="nav-back" />
      </view>
      <text class="nav-title">{{ title }}</text>
      <view class="nav-right">
        <slot name="right" />
      </view>
    </view>
  </view>
</template>

<script setup>
/**
 * 二级页导航栏（返回 + 标题 + 右侧插槽）
 * 在状态栏下与微信胶囊同排显示导航操作
 */
import { getWeatherHeaderLayout } from '../utils/header.js'

const header = getWeatherHeaderLayout()
defineProps({
  title: { type: String, default: '' },
  /** 返回时是否返回上一页（false 则用默认兜底） */
  fallbackUrl: { type: String, default: '/pages/weather/home/index' }
})

const onBack = () => {
  const pages = getCurrentPages()
  if (pages.length > 1) {
    uni.navigateBack()
  } else {
    uni.redirectTo({ url: '/pages/weather/home/index' })
  }
}
</script>

<style lang="scss" scoped>
@import '../styles/tokens.scss';

.wx-nav {
  box-sizing: content-box;
  background: $wx-bg;
}

.nav-row {
  display: flex;
  align-items: center;
  height: 88rpx;
  padding: 0 $wx-page-pad;
}

.nav-left {
  width: 60rpx;
  height: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.nav-back {
  width: 20rpx;
  height: 20rpx;
  border-left: 4rpx solid $wx-text-1;
  border-bottom: 4rpx solid $wx-text-1;
  transform: rotate(45deg);
  margin-left: 8rpx;
}

.nav-title {
  flex: 1;
  min-width: 0;
  text-align: left;
  font-size: $wx-fs-nav;
  font-weight: 600;
  color: $wx-text-1;
  overflow: hidden;
  white-space: nowrap;
}

.nav-right {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  flex-shrink: 0;
}
</style>
