<template>
  <view class="tabbar">
    <view v-for="item in tabs" :key="item.key" class="tab" :class="{ active: current === item.key }" @click="go(item)">
      <text class="icon">{{ item.icon }}</text>
      <text>{{ item.label }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
defineProps<{ current: 'home' | 'find' | 'saved' }>()
const tabs = [
  { key: 'home', label: '精选', icon: '⌂', path: '/pages/wallpaper/home/index' },
  { key: 'find', label: '探索', icon: '▦', path: '/pages/wallpaper/find/index' },
  { key: 'saved', label: '收藏', icon: '♡', path: '/pages/wallpaper/saved/index' }
] as const

function go(item: typeof tabs[number]) {
  if (getCurrentPages().at(-1)?.route === item.path.slice(1)) return
  uni.redirectTo({ url: item.path })
}
</script>

<style lang="scss" scoped>
@import '../styles/tokens.scss';
.tabbar { position: fixed; z-index: 20; left: 0; right: 0; bottom: 0; height: calc(112rpx + env(safe-area-inset-bottom)); padding-bottom: env(safe-area-inset-bottom); display: flex; box-sizing: border-box; background: rgba(248,248,244,.97); border-top: 1rpx solid $wp-border; }
.tab { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 5rpx; color: $wp-muted; font-size: 20rpx; }
.tab.active { color: $wp-accent; font-weight: 700; }
.icon { font-size: 38rpx; line-height: 1; }
</style>
