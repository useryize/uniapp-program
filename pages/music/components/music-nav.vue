<template>
  <!--
    二级页导航：返回 + 标题 + 右侧插槽
    右侧自动让出微信胶囊安全区（规格 §5.6）——不写死 100，用胶囊实际位置算
  -->
  <view class="m-nav">
    <music-status-bar />
    <view class="m-nav__row" :style="{ paddingRight: safeRight + 'px' }">
      <view class="m-nav__back" @tap="onBack">
        <view class="m-nav__back-icon" />
      </view>
      <text v-if="title" class="m-nav__title">{{ title }}</text>
      <view class="m-nav__spacer" />
      <slot name="right" />
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import MusicStatusBar from './music-status-bar.vue'

const props = defineProps({
  title: { type: String, default: '' }
})

/** 胶囊安全区：375 基准下约 100 */
const safeRight = ref(100)

onMounted(() => {
  try {
    const info = uni.getWindowInfo ? uni.getWindowInfo() : uni.getSystemInfoSync()
    // #ifdef MP-WEIXIN
    const menu = uni.getMenuButtonBoundingClientRect()
    // 胶囊左边界到屏右的距离 + 8 缓冲
    safeRight.value = info.windowWidth - menu.left + 8
    // #endif
    // #ifndef MP-WEIXIN
    safeRight.value = 16
    // #endif
  } catch (e) {
    safeRight.value = 100
  }
})

function onBack() {
  if (getCurrentPages().length > 1) {
    uni.navigateBack()
  } else {
    uni.reLaunch({ url: '/pages/music/home/index' })
  }
}
</script>

<style lang="scss" scoped>
@import '../styles/tokens.scss';

.m-nav {
  width: 100%;
  flex-shrink: 0;
}

.m-nav__row {
  height: 88rpx;
  display: flex;
  align-items: center;
  padding-left: 32rpx;
  box-sizing: border-box;
}

.m-nav__back {
  width: 56rpx;
  height: 56rpx;
  display: flex;
  align-items: center;
  margin-right: 16rpx;
}

.m-nav__back-icon {
  width: 20rpx;
  height: 20rpx;
  border-left: 3rpx solid $m-text-1;
  border-bottom: 3rpx solid $m-text-1;
  transform: rotate(45deg);
}

.m-nav__title {
  font-family: $m-font-cn;
  font-size: 36rpx;
  font-weight: 700;
  color: $m-text-1;
  line-height: 50rpx;
}

.m-nav__spacer {
  flex: 1;
}
</style>
