<template>
  <view class="m-page">
    <!-- 全局 TabBar（一级页），右侧胶囊安全区左侧放搜索圆钮 -->
    <music-tab-bar active="home">
      <template #right>
        <view class="m-home__search" @tap="goSearch">
          <view class="m-home__search-icon" />
        </view>
      </template>
    </music-tab-bar>

    <scroll-view class="m-page__body" scroll-y :refresher-enabled="true" :refresher-triggered="refreshing" @refresherrefresh="onRefresh">
      <view class="m-home__content">
        <!-- Banner 推荐轮播 -->
        <music-banner v-if="banners.length" :items="banners" @tap="onBannerTap" />
        <view v-else class="m-home__banner-ph" />

        <!-- 每日推荐入口条 -->
        <view class="m-home__daily">
          <music-daily-entry
            :day="daily.day"
            :month="daily.month"
            :count="daily.count"
            :reason="daily.reason"
            @open="goDaily"
            @play="playDaily"
          />
        </view>

        <!-- 曲风胶囊：首页的主开关，只刷新下方两块 -->
        <view class="m-home__chips">
          <music-genre-chips v-model="genre" :genres="GENRES" @change="onGenreChange" />
        </view>

        <!-- 主推区：首张通栏 + 4 张双列 -->
        <view class="m-home__section">
          <music-skeleton v-if="loading" type="grid" :rows="4" />
          <view v-else class="m-home__grid">
            <view
              v-for="(t, i) in featured"
              :key="t.id"
              class="m-home__card"
              :class="{ 'is-hero': i === 0 }"
              @tap="playFeatured(i)"
            >
              <image v-if="t.cover" class="m-home__cover" :class="{ 'is-hero': i === 0 }" :src="t.cover" mode="aspectFill" />
              <view v-else class="m-home__cover m-home__cover--empty" :class="{ 'is-hero': i === 0 }" />
              <view class="m-home__meta">
                <text class="m-home__title">{{ t.title }}</text>
                <text class="m-home__artist">{{ t.artistName }}</text>
                <text v-if="i === 0" class="m-home__plays">{{ playText(t) }}</text>
              </view>
            </view>
          </view>
        </view>

        <!-- 专题歌单横滑 -->
        <view class="m-home__section">
          <view class="m-home__section-head">
            <text class="m-home__section-title">专题歌单</text>
            <text class="m-home__section-more" @tap="goPlaylists">查看全部</text>
          </view>
          <scroll-view class="m-home__plrow" scroll-x :show-scrollbar="false">
            <view class="m-home__plrow-inner">
              <view
                v-for="p in playlists"
                :key="p.id"
                class="m-home__plcard"
                @tap="goPlaylist(p.id)"
              >
                <image v-if="p.cover" class="m-home__plcover" :src="p.cover" mode="aspectFill" />
                <view v-else class="m-home__plcover m-home__cover--empty" />
                <text class="m-home__plname">{{ p.name }}</text>
                <text class="m-home__plcount">{{ p.trackCount }} 首</text>
              </view>
            </view>
          </scroll-view>
        </view>

        <!-- 给吸底 mini-bar 让位 -->
        <view class="m-home__bottom-space" />
      </view>
    </scroll-view>

    <music-mini-bar />
  </view>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { onLoad } from '@dcloudio/uni-app'

import MusicTabBar from '../components/music-tab-bar.vue'
import MusicBanner from '../components/music-banner.vue'
import MusicDailyEntry from '../components/music-daily-entry.vue'
import MusicGenreChips from '../components/music-genre-chips.vue'
import MusicSkeleton from '../components/music-skeleton.vue'
import MusicMiniBar from '../components/music-mini-bar.vue'

import { fetchTrending, fetchPlaylists, clearCache } from '../api/index'
import { GENRES, genreLabel as gl } from '../data/genres'
import { buildDaily } from '../utils/daily'
import { initPlayer, playQueue } from '../store/player'
import { topGenres } from '../utils/profile'
import { dayNo, monthAbbr, formatPlayCount } from '../utils/format'

const loading = ref(true)
const refreshing = ref(false)
const genre = ref('')
const featured = ref([])
const playlists = ref([])
const banners = ref([])

const daily = reactive({
  day: dayNo(),
  month: monthAbbr(),
  count: 30,
  reason: '按本周热度生成'
})

/** 全局榜单（不受曲风胶囊影响，Banner 与每日推荐都基于它） */
let globalTracks = []
let dailyCache = null

onLoad(async () => {
  initPlayer()
  await loadAll()
})

async function loadAll() {
  loading.value = true
  try {
    const [tracks, pls] = await Promise.all([
      fetchTrending({ time: 'week', limit: 20 }),
      fetchPlaylists({ time: 'week', limit: 10 })
    ])
    globalTracks = tracks
    featured.value = tracks.slice(0, 5)
    playlists.value = pls

    await Promise.all([buildBannerData(), prepareDaily()])
  } catch (e) {
    uni.showToast({ title: '内容加载失败，下拉重试', icon: 'none' })
  } finally {
    loading.value = false
    refreshing.value = false
  }
}

/** Banner 四张的取数规则写死，不做运营后台（规格 §8.1.1） */
async function buildBannerData() {
  const tops = topGenres(1)
  const topGenre = tops[0] || 'Electronic'
  const list = []

  const first = globalTracks[0]
  if (first) {
    list.push({
      type: '本周新上榜',
      title: first.title,
      reason: `本周榜第 1 位 · ${formatPlayCount(first.playCount)}次播放`,
      cover: first.cover,
      action: { kind: 'queue', tracks: globalTracks, index: 0 }
    })
  }

  const p1 = playlists.value[0]
  if (p1) {
    list.push({
      type: '专题歌单',
      title: p1.name,
      reason: `${p1.trackCount} 首 · ${p1.ownerName}`,
      cover: p1.cover,
      action: { kind: 'playlist', id: p1.id }
    })
  }

  try {
    const [topTrack] = await fetchTrending({ time: 'week', genre: topGenre, limit: 3 })
    if (topTrack) {
      list.push({
        type: `${gl(topGenre)}精选`,
        title: topTrack.title,
        reason: `因为你常听 ${gl(topGenre)}`,
        cover: topTrack.cover,
        action: { kind: 'genre', tracks: null, genre: topGenre }
      })
    }
  } catch (e) {
    // 曲风取数失败就不放这张，Banner 少一张不影响
  }

  const p2 = playlists.value[1]
  if (p2) {
    list.push({
      type: '编辑推荐',
      title: p2.name,
      reason: `${p2.trackCount} 首 · ${p2.ownerName}`,
      cover: p2.cover,
      action: { kind: 'playlist', id: p2.id }
    })
  }

  banners.value = list
}

/** 每日推荐只在此处预热数量与理由文案，列表本身进 daily 页才生成 */
async function prepareDaily() {
  if (dailyCache) return
  try {
    const result = await buildDaily()
    dailyCache = result
    daily.count = result.tracks.length
    daily.reason = result.isNewUser
      ? '按本周热度生成'
      : `因为你常听 ${gl(result.topGenre)}`
  } catch (e) {
    daily.reason = '按本周热度生成'
  }
}

function onGenreChange(g) {
  // 只刷新主推区与歌单，不整页重载、不动滚动位置（规格 §8.1）
  loadGenreSection(g)
}

async function loadGenreSection(g) {
  try {
    const tracks = await fetchTrending({ time: 'week', genre: g, limit: 20 })
    featured.value = tracks.slice(0, 5)
  } catch (e) {
    uni.showToast({ title: '切换失败，请重试', icon: 'none' })
  }
}

async function onRefresh() {
  refreshing.value = true
  // Banner 与每日推荐不参与刷新（按天固定，规格 §8.1）
  clearCache('home_')
  clearCache('pls_')
  await loadGenreSection(genre.value)
  refreshing.value = false
}

/* ---------------- 交互 ---------------- */

function playText(t) {
  return `${formatPlayCount(t.playCount)}次播放 · ${gl(t.genre) || '精选'}`
}

function playFeatured(i) {
  // 整体入队，从点的这首开始（不是单曲入队）
  playQueue(featured.value, i)
}

async function onBannerTap(item) {
  const a = item.action || {}
  if (a.kind === 'playlist') {
    goPlaylist(a.id)
    return
  }
  if (a.kind === 'queue') {
    playQueue(a.tracks, a.index || 0)
    return
  }
  if (a.kind === 'genre') {
    try {
      const tracks = await fetchTrending({ time: 'week', genre: a.genre, limit: 20 })
      if (tracks.length) playQueue(tracks, 0)
    } catch (e) {
      uni.showToast({ title: '播放失败', icon: 'none' })
    }
  }
}

async function playDaily() {
  try {
    const result = dailyCache || (await buildDaily())
    dailyCache = result
    if (!result.tracks.length) {
      uni.showToast({ title: '今天的推荐还没准备好', icon: 'none' })
      return
    }
    // 整列入队立即播放，不跳页（规格 §8.1.2）
    playQueue(result.tracks, 0)
  } catch (e) {
    uni.showToast({ title: '播放失败', icon: 'none' })
  }
}

function goDaily() {
  uni.navigateTo({ url: '/pages/music/daily/index' })
}

function goPlaylist(id) {
  uni.navigateTo({ url: `/pages/music/playlist/index?id=${id}` })
}

function goPlaylists() {
  uni.navigateTo({ url: '/pages/music/playlists/index' })
}

function goSearch() {
  uni.navigateTo({ url: '/pages/music/search/index' })
}
</script>

<style lang="scss" scoped>
@import '../styles/tokens.scss';

.m-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: $m-bg;
}

.m-page__body {
  flex: 1;
  overflow: hidden;
}

.m-home__content {
  padding-bottom: 40rpx;
}

.m-home__search {
  width: 60rpx;
  height: 60rpx;
  border-radius: 999rpx;
  background-color: $m-line-weak;
  display: flex;
  align-items: center;
  justify-content: center;
}

.m-home__search-icon {
  width: 22rpx;
  height: 22rpx;
  border: 3rpx solid #ffffff;
  border-radius: 999rpx;
  position: relative;

  &::after {
    content: '';
    position: absolute;
    right: -8rpx;
    bottom: -8rpx;
    width: 10rpx;
    height: 3rpx;
    background-color: #ffffff;
    transform: rotate(45deg);
  }
}

.m-home__banner-ph {
  height: 240rpx;
  margin: 0 32rpx;
  border-radius: 28rpx;
  background-color: $m-surface;
}

.m-home__daily {
  padding: 20rpx 32rpx 0;
}

.m-home__chips {
  padding-top: 24rpx;
}

.m-home__section {
  padding: 24rpx 32rpx 0;
}

.m-home__grid {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
}

.m-home__card {
  width: 331rpx;
  margin-bottom: 24rpx;

  &.is-hero {
    width: 100%;
    display: flex;
    align-items: center;
    background-color: $m-line-weak;
    border-radius: 28rpx;
    padding: 24rpx;
    box-sizing: border-box;
    margin-bottom: 24rpx;
  }
}

.m-home__cover {
  width: 331rpx;
  height: 160rpx;
  border-radius: 24rpx;
  background-color: $m-surface-hover;

  &.is-hero {
    width: 144rpx;
    height: 144rpx;
    border-radius: 24rpx;
    flex-shrink: 0;
  }
}

.m-home__meta {
  padding-top: 14rpx;

  .m-home__card.is-hero & {
    padding: 0 0 0 24rpx;
    flex: 1;
    overflow: hidden;
  }
}

.m-home__title {
  display: block;
  font-family: $m-font-num;
  font-size: 26rpx;
  font-weight: 600;
  color: $m-text-1;
  line-height: 34rpx;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;

  .m-home__card.is-hero & {
    font-size: 32rpx;
    line-height: 42rpx;
  }
}

.m-home__artist {
  display: block;
  font-family: $m-font-num;
  font-size: 22rpx;
  color: $m-text-3;
  line-height: 30rpx;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.m-home__plays {
  display: block;
  margin-top: 6rpx;
  font-family: $m-font-cn;
  font-size: 20rpx;
  color: $m-text-3;
  line-height: 28rpx;
}

.m-home__section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20rpx;
}

.m-home__section-title {
  font-family: $m-font-cn;
  font-size: 30rpx;
  font-weight: 700;
  color: $m-text-1;
}

.m-home__section-more {
  font-family: $m-font-cn;
  font-size: 22rpx;
  color: $m-text-3;
}

.m-home__plrow {
  width: 100%;
  white-space: nowrap;
}

.m-home__plrow-inner {
  display: inline-flex;
}

.m-home__plcard {
  width: 296rpx;
  margin-right: 24rpx;
  flex-shrink: 0;
}

.m-home__plcover {
  width: 296rpx;
  height: 180rpx;
  border-radius: 24rpx;
  background-color: $m-surface-hover;
}

.m-home__plname {
  display: block;
  margin-top: 14rpx;
  font-family: $m-font-cn;
  font-size: 24rpx;
  font-weight: 500;
  color: $m-text-1;
  line-height: 34rpx;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.m-home__plcount {
  display: block;
  font-family: $m-font-cn;
  font-size: 20rpx;
  color: $m-text-3;
  line-height: 28rpx;
}

.m-home__bottom-space {
  height: 180rpx;
}
</style>
