<template>
  <!--
    全局顶部 TabBar（规格 §5.7）：只出现在一级页 home / chart / library
    右侧留出微信胶囊安全区，首页在该区左侧放搜索圆钮（slot="right"）
  -->
  <view class="m-tabbar">
    <music-status-bar />
    <view class="m-tabbar__row" :style="{ paddingRight: safeRight + 'px' }">
      <view
        v-for="item in tabs"
        :key="item.id"
        class="m-tabbar__item"
        @tap="go(item)"
      >
        <text :class="['m-tabbar__text', active === item.id ? 'is-active' : '']">
          {{ item.label }}
        </text>
        <view :class="['m-tabbar__line', active === item.id ? 'is-active' : '']" />
      </view>
      <view class="m-tabbar__spacer" />
      <slot name="right" />
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import MusicStatusBar from './music-status-bar.vue'

const props = defineProps({
  /** home | chart | library */
  active: { type: String, default: 'home' }
})

const tabs = [
  { id: 'home', label: '发现', url: '/pages/music/home/index' },
  { id: 'chart', label: '榜单', url: '/pages/music/chart/index' },
  { id: 'library', label: '我的', url: '/pages/music/library/index' }
]

const safeRight = ref(100)

onMounted(() => {
  try {
    const info = uni.getWindowInfo ? uni.getWindowInfo() : uni.getSystemInfoSync()
    // #ifdef MP-WEIXIN
    const menu = uni.getMenuButtonBoundingClientRect()
    safeRight.value = info.windowWidth - menu.left + 8
    // #endif
    // #ifndef MP-WEIXIN
    safeRight.value = 16
    // #endif
  } catch (e) {
    safeRight.value = 100
  }
})

function go(item: { id: string; url: string }) {
  if (item.id === props.active) return
  // 一级页之间切换用 reLaunch，保证导航栈干净（不留上一页）
  uni.reLaunch({ url: item.url })
}
</script>

<style lang="scss" scoped>
@import '../styles/tokens.scss';

.m-tabbar {
  width: 100%;
  flex-shrink: 0;
  background-color: $m-bg;
}

.m-tabbar__row {
  height: 96rpx;
  display: flex;
  align-items: center;
  padding-left: 32rpx;
  box-sizing: border-box;
}

.m-tabbar__item {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-right: 44rpx;
}

.m-tabbar__text {
  font-family: $m-font-cn;
  font-size: 32rpx;
  line-height: 44rpx;
  color: $m-text-3;

  &.is-active {
    font-weight: 600;
    color: $m-text-1;
  }
}

.m-tabbar__line {
  width: 36rpx;
  height: 6rpx;
  border-radius: 4rpx;
  background-color: transparent;
  margin-top: 8rpx;

  &.is-active {
    background-color: $m-primary;
  }
}

.m-tabbar__spacer {
  flex: 1;
}
</style>
