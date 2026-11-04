<template>
  <view class="page">
    <WallpaperHeader title="探索壁纸" />
    <view class="intro">从颜色、心情或关键词开始，找一张适合手机的壁纸。</view>
    <view class="search"><text class="search-icon">⌕</text><input v-model="keyword" confirm-type="search" placeholder="海岸、山峦、花影…" @input="onSearchInput" @confirm="resetSearch" /><text v-if="keyword" class="clear" @click="clearKeyword">×</text></view>

    <scroll-view class="category-scroll" scroll-x><view class="category-row"><text v-for="item in categories" :key="item" class="category" :class="{ active: category === item }" @click="selectCategory(item)">{{ item }}</text></view></scroll-view>

    <view class="tools"><view class="sorts"><text v-for="item in sorts" :key="item.key" :class="{ active: sort === item.key }" @click="selectSort(item.key)">{{ item.name }}</text></view><text class="filter" @click="toneSheet = true">{{ tone === '全部' ? '色调筛选' : tone }} ⌄</text></view>

    <view v-if="items.length" class="grid"><WallpaperCard v-for="item in items" :key="item.id" :wallpaper="item" @select="openDetail" /></view>
    <view v-if="loading" class="state">正在加载壁纸…</view>
    <view v-else-if="error" class="state"><text>{{ error }}</text><text class="state-action" @click="load(true)">重试</text></view>
    <view v-else-if="!items.length" class="state"><text>没有找到匹配的 CC0 竖屏图片</text><text class="state-action" @click="clearFilters">清除筛选</text></view>
    <view v-else-if="!cursor" class="end">已经看到全部结果</view>

    <view v-if="toneSheet" class="sheet-mask" @click="toneSheet = false"><view class="sheet" @click.stop><text class="sheet-title">筛选色调</text><text class="sheet-desc">按 Commons 搜索词近似筛选</text><view class="tone-list"><text v-for="item in tones" :key="item" :class="{ active: tone === item }" @click="tone = item">{{ item }}</text></view><view class="sheet-actions"><text @click="tone = '全部'">重置</text><text class="apply" @click="applyTone">查看结果</text></view></view></view>
    <WallpaperTabbar current="find" />
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onLoad, onReachBottom, onPullDownRefresh, onUnload } from '@dcloudio/uni-app'
import { wallpaperApi, type Wallpaper, type WallpaperCategory, type WallpaperTone, type WallpaperSort } from '../api/index'
import WallpaperHeader from '../components/wallpaper-header.vue'
import WallpaperCard from '../components/wallpaper-card.vue'
import WallpaperTabbar from '../components/wallpaper-tabbar.vue'

const categories: WallpaperCategory[] = ['全部', '自然', '城市', '抽象', '花植']
const tones: WallpaperTone[] = ['全部', '青绿', '蓝色', '暖橙', '深色', '粉色', '米白']
const sorts: Array<{ key: WallpaperSort; name: string }> = [
  { key: 'featured', name: '精选' }, { key: 'new', name: '最新' }, { key: 'dark', name: '深色' }
]
const items = ref<Wallpaper[]>([])
const category = ref<WallpaperCategory>('全部')
const tone = ref<WallpaperTone>('全部')
const sort = ref<WallpaperSort>('featured')
const keyword = ref('')
const cursor = ref<string | undefined>()
const loading = ref(false)
const error = ref('')
const toneSheet = ref(false)
let generation = 0
let searchTimer: ReturnType<typeof setTimeout> | undefined

async function load(reset = false) {
  if (loading.value && !reset) return
  if (!reset && !cursor.value) return
  if (reset) { generation += 1; cursor.value = undefined; items.value = []; error.value = '' }
  const run = generation
  loading.value = true
  try {
    const result = await wallpaperApi.search({ category: category.value, keyword: keyword.value, tone: tone.value, sort: sort.value, cursor: cursor.value })
    if (run !== generation) return
    const seen = new Set(items.value.map(item => item.id))
    items.value = [...items.value, ...result.items.filter(item => !seen.has(item.id))]
    cursor.value = result.nextCursor
  } catch {
    if (run === generation) error.value = '加载失败，请检查网络或域名配置'
  } finally {
    if (run === generation) loading.value = false
    uni.stopPullDownRefresh()
  }
}

function resetSearch() { if (searchTimer) clearTimeout(searchTimer); load(true) }
function onSearchInput() { if (searchTimer) clearTimeout(searchTimer); searchTimer = setTimeout(resetSearch, 350) }
function clearKeyword() { keyword.value = ''; resetSearch() }
function selectCategory(item: WallpaperCategory) { category.value = item; resetSearch() }
function selectSort(item: WallpaperSort) { sort.value = item; resetSearch() }
function applyTone() { toneSheet.value = false; resetSearch() }
function clearFilters() { category.value = '全部'; tone.value = '全部'; sort.value = 'featured'; keyword.value = ''; resetSearch() }
function openDetail(item: Wallpaper) {
  wallpaperApi.setPreviewList(items.value)
  uni.navigateTo({ url: `/pages/wallpaper/detail/index?id=${encodeURIComponent(item.id)}` })
}

onLoad((options) => {
  const incoming = decodeURIComponent(String(options?.category || '全部'))
  if (categories.includes(incoming as WallpaperCategory)) category.value = incoming as WallpaperCategory
  load(true)
})
onReachBottom(() => { load() })
onPullDownRefresh(() => { load(true) })
onUnload(() => { if (searchTimer) clearTimeout(searchTimer) })
</script>

<style lang="scss" scoped>
@import '../styles/tokens.scss';
.page { min-height: 100vh; box-sizing: border-box; padding-bottom: calc(140rpx + env(safe-area-inset-bottom)); background: $wp-bg; }
.intro { padding: 14rpx $wp-page-pad 22rpx; color: $wp-muted; font-size: 22rpx; }
.search { margin: 0 $wp-page-pad; height: 82rpx; border-radius: 12rpx; background: #EDF1ED; display: flex; align-items: center; padding: 0 22rpx; gap: 13rpx; }
.search input { flex: 1; min-width: 0; color: $wp-text; font-size: 24rpx; }
.search-icon { font-size: 38rpx; color: $wp-accent; }
.clear { font-size: 32rpx; color: $wp-muted; padding: 8rpx; }
.category-scroll { white-space: nowrap; width: 100%; }
.category-row { display: flex; gap: 12rpx; padding: 26rpx $wp-page-pad 18rpx; }
.category { flex: none; padding: 12rpx 23rpx; border: 1rpx solid $wp-border; border-radius: 50rpx; color: $wp-text; font-size: 22rpx; }
.category.active { background: $wp-accent; color: white; border-color: $wp-accent; }
.tools { margin: 0 $wp-page-pad; display: flex; align-items: center; justify-content: space-between; border-bottom: 1rpx solid $wp-border; }
.sorts { display: flex; gap: 24rpx; }
.sorts text { padding: 17rpx 0; color: $wp-muted; font-size: 23rpx; }
.sorts text.active { border-bottom: 4rpx solid $wp-accent; color: $wp-accent; font-weight: 700; }
.filter { padding: 10rpx 18rpx; border: 1rpx solid $wp-border; border-radius: 40rpx; font-size: 20rpx; color: $wp-accent; }
.grid { padding: 26rpx $wp-page-pad; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 28rpx 16rpx; }
.state { min-height: 320rpx; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 20rpx; padding: 40rpx; color: $wp-muted; text-align: center; font-size: 23rpx; }
.state-action { color: $wp-accent; font-weight: 700; }
.end { padding: 30rpx; text-align: center; color: $wp-muted; font-size: 20rpx; }
.sheet-mask { position: fixed; z-index: 40; inset: 0; background: rgba(13,31,32,.55); display: flex; align-items: flex-end; }
.sheet { width: 100%; box-sizing: border-box; padding: 36rpx $wp-page-pad calc(48rpx + env(safe-area-inset-bottom)); background: $wp-bg; border-radius: 30rpx 30rpx 0 0; }
.sheet-title { display: block; color: $wp-text; font-size: 32rpx; font-weight: 700; }
.sheet-desc { display: block; margin-top: 7rpx; color: $wp-muted; font-size: 21rpx; }
.tone-list { display: flex; flex-wrap: wrap; gap: 16rpx; margin-top: 34rpx; }
.tone-list text { min-width: 110rpx; text-align: center; border: 1rpx solid $wp-border; border-radius: 50rpx; padding: 15rpx 20rpx; color: $wp-text; font-size: 22rpx; }
.tone-list text.active { background: $wp-accent; border-color: $wp-accent; color: white; }
.sheet-actions { display: flex; gap: 16rpx; margin-top: 44rpx; }
.sheet-actions text { flex: 1; padding: 20rpx; border: 1rpx solid $wp-border; border-radius: 12rpx; text-align: center; color: $wp-text; font-size: 24rpx; }
.sheet-actions .apply { background: $wp-accent; color: white; border-color: $wp-accent; }
</style>
