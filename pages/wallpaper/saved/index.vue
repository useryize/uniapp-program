<template>
  <view class="page">
    <WallpaperHeader title="我的收藏" />
    <view class="intro">你喜欢的画面，都在这里。</view>
    <view v-if="items.length" class="grid"><WallpaperCard v-for="item in items" :key="item.id" :wallpaper="item" @select="openDetail" /></view>
    <view v-else class="empty"><text class="heart">♡</text><text class="empty-title">还没有收藏</text><text>去探索页找一张喜欢的壁纸吧</text><text class="action" @click="goExplore">开始探索</text></view>
    <WallpaperTabbar current="saved" />
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { wallpaperApi, type Wallpaper } from '../api/index'
import WallpaperHeader from '../components/wallpaper-header.vue'
import WallpaperCard from '../components/wallpaper-card.vue'
import WallpaperTabbar from '../components/wallpaper-tabbar.vue'

const items = ref<Wallpaper[]>([])
onShow(() => { items.value = wallpaperApi.favorites() })
function openDetail(item: Wallpaper) {
  wallpaperApi.setPreviewList(items.value)
  uni.navigateTo({ url: `/pages/wallpaper/detail/index?id=${encodeURIComponent(item.id)}` })
}
function goExplore() { uni.redirectTo({ url: '/pages/wallpaper/find/index' }) }
</script>

<style lang="scss" scoped>
@import '../styles/tokens.scss';
.page { min-height: 100vh; box-sizing: border-box; padding-bottom: calc(140rpx + env(safe-area-inset-bottom)); background: $wp-bg; }
.intro { padding: 14rpx $wp-page-pad 18rpx; color: $wp-muted; font-size: 22rpx; }
.grid { padding: 20rpx $wp-page-pad; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 28rpx 16rpx; }
.empty { min-height: 66vh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 15rpx; color: $wp-muted; font-size: 22rpx; }
.heart { font-size: 76rpx; color: $wp-accent; }
.empty-title { font-size: 31rpx; color: $wp-text; font-weight: 700; }
.action { margin-top: 20rpx; padding: 18rpx 40rpx; background: $wp-accent; border-radius: 50rpx; color: white; }
</style>
