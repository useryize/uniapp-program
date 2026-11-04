<template>
  <view class="page">
    <WallpaperHeader title="画间">
      <view class="search-button" @click="goExplore">⌕</view>
    </WallpaperHeader>

    <view class="content">
      <view class="issue-line"><text>{{ today }}</text><text>今日一张 / DAILY DROP</text></view>

      <view v-if="loading" class="loading">正在挑选今天的壁纸…</view>
      <view v-else-if="error" class="error"><text>{{ error }}</text><text class="retry" @click="load(true)">重新加载</text></view>
      <template v-else>
        <view v-if="hero" class="hero" @click="openDetail(hero, items)">
          <image class="hero-image" :src="hero.thumbnailUrl" mode="aspectFill" />
          <view class="hero-shade" />
          <view class="hero-copy"><text class="hero-kicker">WALL OF THE DAY · CC0</text><text class="hero-name">{{ hero.title }}</text></view>
          <text class="hero-open">全屏预览 ↗</text>
        </view>
        <view class="hero-note"><text>今日主题：在自然里慢下来</text><text>01 / {{ items.length }}</text></view>

        <view class="section"><text class="section-title">按氛围探索</text><text class="section-caption">找到与你今天相配的色彩</text></view>
        <scroll-view class="category-scroll" scroll-x><view class="category-row"><text v-for="category in categories" :key="category" class="category" @click="goCategory(category)">{{ category }}</text></view></scroll-view>

        <view class="section"><text class="section-title">编辑合集</text><text class="section-caption">精挑细选的屏幕风景</text></view>
        <view v-if="collectionCover" class="collection" @click="goCategory('城市')"><image :src="collectionCover.thumbnailUrl" mode="aspectFill" /><view class="collection-shade" /><view class="collection-copy"><text>COLLECTION · 城市</text><text class="collection-name">暮色与城市 →</text></view></view>

        <view class="section section-row"><view><text class="section-title">正在流行</text><text class="section-caption">本周值得保存的画面</text></view><text class="more" @click="goExplore">查看全部 →</text></view>
        <scroll-view class="featured-scroll" scroll-x><view class="featured-row"><view v-for="item in items.slice(1)" :key="item.id" class="featured-card" @click="openDetail(item, items)"><image :src="item.thumbnailUrl" mode="aspectFill" lazy-load /><text>{{ item.title }}</text></view></view></scroll-view>
      </template>
    </view>
    <WallpaperTabbar current="home" />
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { onLoad, onPullDownRefresh } from '@dcloudio/uni-app'
import { wallpaperApi, type Wallpaper, type WallpaperCategory } from '../api/index'
import WallpaperHeader from '../components/wallpaper-header.vue'
import WallpaperTabbar from '../components/wallpaper-tabbar.vue'

const items = ref<Wallpaper[]>([])
const loading = ref(true)
const error = ref('')
const categories: WallpaperCategory[] = ['自然', '城市', '抽象', '花植']
const hero = computed(() => items.value[0])
const collectionCover = computed(() => items.value.find(item => item.category === '城市'))
const today = new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })

async function load(refresh = false) {
  loading.value = true
  error.value = ''
  try {
    items.value = await wallpaperApi.featured(refresh)
    if (!items.value.length) error.value = '暂无可展示的壁纸，请稍后再试'
  } catch {
    error.value = '壁纸加载失败，请检查网络后重试'
  } finally {
    loading.value = false
    uni.stopPullDownRefresh()
  }
}

function openDetail(item: Wallpaper, list: Wallpaper[]) {
  wallpaperApi.setPreviewList(list)
  uni.navigateTo({ url: `/pages/wallpaper/detail/index?id=${encodeURIComponent(item.id)}` })
}
function goExplore() { uni.redirectTo({ url: '/pages/wallpaper/find/index' }) }
function goCategory(category: WallpaperCategory) {
  uni.redirectTo({ url: `/pages/wallpaper/find/index?category=${encodeURIComponent(category)}` })
}

onLoad(() => { load() })
onPullDownRefresh(() => { load(true) })
</script>

<style lang="scss" scoped>
@import '../styles/tokens.scss';
.page { min-height: 100vh; box-sizing: border-box; background: $wp-bg; padding-bottom: calc(140rpx + env(safe-area-inset-bottom)); }
.search-button { width: 58rpx; height: 58rpx; border-radius: 50%; background: #E9EEEB; display: flex; align-items: center; justify-content: center; color: $wp-accent; font-size: 38rpx; }
.content { padding: 0 $wp-page-pad; }
.issue-line { display: flex; justify-content: space-between; padding: 18rpx 0 24rpx; border-top: 1rpx solid $wp-border; color: $wp-muted; font-size: 18rpx; letter-spacing: 1rpx; }
.hero { position: relative; height: 660rpx; overflow: hidden; border-radius: 10rpx; background: $wp-image-fallback; }
.hero-image { width: 100%; height: 100%; }
.hero-shade { position: absolute; inset: 40% 0 0; background: linear-gradient(transparent, rgba(16,41,43,.8)); }
.hero-copy { position: absolute; bottom: 42rpx; left: 32rpx; display: flex; flex-direction: column; color: white; }
.hero-kicker { font-size: 19rpx; letter-spacing: 2rpx; }
.hero-name { margin-top: 11rpx; font-size: 48rpx; font-weight: 700; }
.hero-open { position: absolute; bottom: 46rpx; right: 26rpx; color: white; border: 1rpx solid rgba(255,255,255,.8); border-radius: 50rpx; padding: 12rpx 16rpx; font-size: 19rpx; }
.hero-note { display: flex; justify-content: space-between; margin-top: 18rpx; color: $wp-muted; font-size: 20rpx; }
.section { display: flex; flex-direction: column; margin-top: 44rpx; }
.section-title { font-size: 34rpx; color: $wp-text; font-weight: 700; }
.section-caption { margin-top: 6rpx; font-size: 20rpx; color: $wp-muted; }
.category-scroll, .featured-scroll { width: 100%; white-space: nowrap; }
.category-row, .featured-row { display: flex; gap: 14rpx; padding: 24rpx 0 4rpx; }
.category { flex: none; border: 1rpx solid $wp-border; border-radius: 50rpx; padding: 14rpx 24rpx; font-size: 22rpx; color: $wp-text; }
.collection { position: relative; height: 270rpx; margin-top: 22rpx; overflow: hidden; border-radius: 12rpx; background: $wp-image-fallback; }
.collection image { width: 100%; height: 100%; }
.collection-shade { position: absolute; inset: 20% 0 0; background: linear-gradient(transparent, rgba(9,33,38,.8)); }
.collection-copy { position: absolute; left: 28rpx; bottom: 26rpx; color: white; display: flex; flex-direction: column; gap: 10rpx; font-size: 18rpx; letter-spacing: 2rpx; }
.collection-name { font-size: 36rpx; font-weight: 700; letter-spacing: 0; }
.section-row { flex-direction: row; justify-content: space-between; align-items: end; }
.section-row > view { display: flex; flex-direction: column; }
.more { color: $wp-accent; font-size: 21rpx; }
.featured-card { flex: none; width: 214rpx; display: flex; flex-direction: column; gap: 10rpx; color: $wp-text; font-size: 22rpx; }
.featured-card image { width: 214rpx; height: 292rpx; border-radius: 8rpx; background: $wp-image-fallback; }
.loading, .error { padding: 100rpx 30rpx; display: flex; flex-direction: column; align-items: center; gap: 22rpx; color: $wp-muted; font-size: 24rpx; text-align: center; }
.retry { color: $wp-accent; font-weight: 700; }
</style>
