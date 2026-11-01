<template>
  <view class="m-page">
    <music-status-bar />

    <!-- 搜索框 -->
    <view class="m-search__bar" :style="{ paddingRight: safeRight + 'px' }">
      <view class="m-search__input-wrap">
        <view class="m-search__icon" />
        <input
          class="m-search__input"
          v-model="keyword"
          :focus="autoFocus"
          placeholder="搜索歌曲、歌单、艺人"
          placeholder-class="m-search__ph"
          confirm-type="search"
          @input="onInput"
          @confirm="onConfirm"
        />
        <view v-if="keyword" class="m-search__clear" @tap="clearKeyword">
          <view class="m-search__clear-x" />
        </view>
      </view>
      <text class="m-search__cancel" @tap="onCancel">取消</text>
    </view>

    <scroll-view class="m-page__body" scroll-y>
      <!-- 未输入：历史 + 曲风 -->
      <view v-if="!keyword" class="m-search__idle">
        <view v-if="history.length" class="m-search__block">
          <view class="m-search__block-head">
            <text class="m-search__block-title">搜索历史</text>
            <text class="m-search__block-clear" @tap="clearHistory">清空</text>
          </view>
          <view class="m-search__tags">
            <view
              v-for="h in history"
              :key="h"
              class="m-search__tag"
              @tap="pickKeyword(h)"
            >
              <text class="m-search__tag-text">{{ h }}</text>
            </view>
          </view>
        </view>

        <view class="m-search__block">
          <view class="m-search__block-head">
            <text class="m-search__block-title">热门曲风</text>
          </view>
          <view class="m-search__tags">
            <view
              v-for="g in hotGenres"
              :key="g.id"
              class="m-search__tag"
              @tap="pickKeyword(g.id)"
            >
              <text class="m-search__tag-text">{{ g.label }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 输入后：三 Tab -->
      <view v-else class="m-search__result">
        <view class="m-search__tabs">
          <view
            v-for="t in tabs"
            :key="t.id"
            class="m-search__tab"
            @tap="tab = t.id"
          >
            <text class="m-search__tab-text" :class="{ 'is-active': tab === t.id }">
              {{ t.label }} {{ counts[t.id] }}
            </text>
            <view class="m-search__tab-line" :class="{ 'is-active': tab === t.id }" />
          </view>
        </view>

        <view v-if="searching" class="m-search__loading">
          <music-skeleton type="list" :rows="4" />
        </view>

        <view v-else-if="!currentList.length" class="m-search__empty">
          <text class="m-search__empty-text">没有找到「{{ keyword }}」相关的{{ tabLabel }}</text>
          <text class="m-search__empty-desc">换个关键词，或者试试搜曲风</text>
        </view>

        <!-- 歌曲 -->
        <view v-else-if="tab === 'tracks'" class="m-search__list">
          <music-track-row
            v-for="(t, i) in results.tracks"
            :key="t.id"
            :track="t"
            :index="i"
            @tap="onPlayTrack"
            @more="onMore"
          />
        </view>

        <!-- 歌单 -->
        <view v-else-if="tab === 'playlists'" class="m-search__list">
          <view
            v-for="p in results.playlists"
            :key="p.id"
            class="m-search__plrow"
            @tap="goPlaylist(p.id)"
          >
            <image v-if="p.cover" class="m-search__plcover" :src="p.cover" mode="aspectFill" />
            <view v-else class="m-search__plcover m-search__empty-cover" />
            <view class="m-search__pltext">
              <text class="m-search__plname">{{ p.name }}</text>
              <text class="m-search__plmeta">{{ p.trackCount }} 首 · {{ p.ownerName }}</text>
            </view>
          </view>
        </view>

        <!-- 艺人 -->
        <view v-else class="m-search__list">
          <view
            v-for="a in results.artists"
            :key="a.id"
            class="m-search__arow"
            @tap="goArtist(a.id)"
          >
            <image v-if="a.avatar" class="m-search__avatar" :src="a.avatar" mode="aspectFill" />
            <view v-else class="m-search__avatar m-search__empty-cover" />
            <view class="m-search__pltext">
              <text class="m-search__plname">{{ a.name }}</text>
              <text class="m-search__plmeta">{{ a.followerCount }} 位关注者</text>
            </view>
          </view>
        </view>

        <view class="m-search__bottom-space" />
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'

import MusicStatusBar from '../components/music-status-bar.vue'
import MusicSkeleton from '../components/music-skeleton.vue'
import MusicTrackRow from '../components/music-track-row.vue'

import { searchAll } from '../api/index.js'
import { GENRES } from '../data/genres.js'
import { initPlayer, playQueue, playNext, addToQueue } from '../store/player.js'

const STORAGE_Q = 'm_search_history'

const keyword = ref('')
const tab = ref('tracks')
const searching = ref(false)
const results = ref({ tracks: [], playlists: [], artists: [] })
const history = ref([])
const safeRight = ref(100)
const autoFocus = ref(true)

let timer = null

const tabs = [
  { id: 'tracks', label: '歌曲' },
  { id: 'playlists', label: '歌单' },
  { id: 'artists', label: '艺人' }
]

const hotGenres = GENRES.filter((g) => g.id).slice(0, 6)

const counts = computed(() => ({
  tracks: results.value.tracks.length,
  playlists: results.value.playlists.length,
  artists: results.value.artists.length
}))

const currentList = computed(() => results.value[tab.value] || [])

const tabLabel = computed(
  () => ({ tracks: '歌曲', playlists: '歌单', artists: '艺人' }[tab.value] || '内容')
)

onLoad(() => {
  initPlayer()
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
  history.value = uni.getStorageSync(STORAGE_Q) || []
})

/** 300ms 防抖，少于 2 字符不请求（规格 §8.6） */
function onInput() {
  if (timer) clearTimeout(timer)
  const q = keyword.value.trim()
  if (q.length < 2) {
    results.value = { tracks: [], playlists: [], artists: [] }
    searching.value = false
    return
  }
  searching.value = true
  timer = setTimeout(() => runSearch(q), 300)
}

async function runSearch(q) {
  try {
    results.value = await searchAll(q)
  } catch (e) {
    uni.showToast({ title: '搜索失败', icon: 'none' })
  } finally {
    searching.value = false
  }
}

function onConfirm() {
  const q = keyword.value.trim()
  if (q.length < 2) return
  if (timer) clearTimeout(timer)
  searching.value = true
  runSearch(q)
  saveHistory(q)
}

function pickKeyword(word) {
  keyword.value = word
  onConfirm()
}

function saveHistory(q) {
  const list = history.value.filter((x) => x !== q)
  list.unshift(q)
  history.value = list.slice(0, 8)
  uni.setStorageSync(STORAGE_Q, history.value)
}

function clearHistory() {
  uni.showModal({
    title: '清空搜索历史',
    content: '确定清空全部搜索记录吗？',
    success: ({ confirm }) => {
      if (!confirm) return
      history.value = []
      uni.removeStorageSync(STORAGE_Q)
    }
  })
}

function clearKeyword() {
  keyword.value = ''
  results.value = { tracks: [], playlists: [], artists: [] }
}

function onCancel() {
  if (getCurrentPages().length > 1) uni.navigateBack()
  else uni.reLaunch({ url: '/pages/music/home/index' })
}

function onPlayTrack(track, index) {
  playQueue(results.value.tracks, index)
}

function onMore(track) {
  uni.showActionSheet({
    itemList: ['下一首播放', '加入播放列表'],
    success: ({ tapIndex }) => {
      if (tapIndex === 0) playNext(track)
      if (tapIndex === 1) addToQueue(track)
    }
  })
}

function goPlaylist(id) {
  uni.navigateTo({ url: `/pages/music/playlist/index?id=${id}` })
}

function goArtist(id) {
  uni.navigateTo({ url: `/pages/music/artist/index?id=${id}` })
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

.m-search__bar {
  height: 96rpx;
  display: flex;
  align-items: center;
  padding-left: 32rpx;
  box-sizing: border-box;
}

.m-search__input-wrap {
  flex: 1;
  height: 64rpx;
  border-radius: 999rpx;
  background-color: $m-line-weak;
  display: flex;
  align-items: center;
  padding: 0 24rpx;
}

.m-search__icon {
  width: 20rpx;
  height: 20rpx;
  border: 3rpx solid $m-text-2;
  border-radius: 999rpx;
  position: relative;
  flex-shrink: 0;

  &::after {
    content: '';
    position: absolute;
    right: -7rpx;
    bottom: -7rpx;
    width: 9rpx;
    height: 3rpx;
    background-color: $m-text-2;
    transform: rotate(45deg);
  }
}

.m-search__input {
  flex: 1;
  margin-left: 16rpx;
  font-family: $m-font-cn;
  font-size: 26rpx;
  color: $m-text-1;
  height: 64rpx;
  line-height: 64rpx;
}

.m-search__ph {
  color: $m-text-3;
  font-size: 26rpx;
}

.m-search__clear {
  width: 36rpx;
  height: 36rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.m-search__clear-x {
  width: 20rpx;
  height: 20rpx;
  position: relative;

  &::before,
  &::after {
    content: '';
    position: absolute;
    left: 0;
    top: 9rpx;
    width: 20rpx;
    height: 2rpx;
    background-color: $m-text-3;
  }

  &::before {
    transform: rotate(45deg);
  }

  &::after {
    transform: rotate(-45deg);
  }
}

.m-search__cancel {
  margin-left: 20rpx;
  font-family: $m-font-cn;
  font-size: 26rpx;
  color: $m-text-2;
  flex-shrink: 0;
}

/* 未输入状态 */
.m-search__idle {
  padding-top: 20rpx;
}

.m-search__block {
  padding: 20rpx 32rpx 0;
}

.m-search__block-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.m-search__block-title {
  font-family: $m-font-cn;
  font-size: 28rpx;
  font-weight: 600;
  color: $m-text-1;
}

.m-search__block-clear {
  font-family: $m-font-cn;
  font-size: 22rpx;
  color: $m-text-3;
}

.m-search__tags {
  display: flex;
  flex-wrap: wrap;
  margin-top: 20rpx;
}

.m-search__tag {
  height: 60rpx;
  padding: 0 24rpx;
  border-radius: 999rpx;
  background-color: $m-line-weak;
  display: flex;
  align-items: center;
  margin: 0 16rpx 16rpx 0;
}

.m-search__tag-text {
  font-family: $m-font-cn;
  font-size: 24rpx;
  color: $m-text-2;
}

/* 结果区 */
.m-search__tabs {
  display: flex;
  align-items: center;
  padding: 16rpx 32rpx 0;
}

.m-search__tab {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-right: 52rpx;
}

.m-search__tab-text {
  font-family: $m-font-cn;
  font-size: 28rpx;
  color: $m-text-3;
  line-height: 38rpx;

  &.is-active {
    color: $m-text-1;
    font-weight: 600;
  }
}

.m-search__tab-line {
  width: 44rpx;
  height: 6rpx;
  border-radius: 4rpx;
  background-color: transparent;
  margin-top: 8rpx;

  &.is-active {
    background-color: $m-primary;
  }
}

.m-search__list {
  padding-top: 20rpx;
}

.m-search__plrow,
.m-search__arow {
  display: flex;
  align-items: center;
  height: 104rpx;
  padding: 0 32rpx;
}

.m-search__plcover {
  width: 80rpx;
  height: 80rpx;
  border-radius: 16rpx;
  background-color: $m-surface-hover;
  flex-shrink: 0;
  margin-right: 24rpx;
}

.m-search__avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 999rpx;
  background-color: $m-surface-hover;
  flex-shrink: 0;
  margin-right: 24rpx;
}

.m-search__empty-cover {
  background-color: $m-surface;
}

.m-search__pltext {
  flex: 1;
  overflow: hidden;
}

.m-search__plname {
  display: block;
  font-family: $m-font-cn;
  font-size: 26rpx;
  font-weight: 600;
  color: $m-text-1;
  line-height: 34rpx;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.m-search__plmeta {
  display: block;
  font-family: $m-font-cn;
  font-size: 22rpx;
  color: $m-text-3;
  line-height: 30rpx;
}

.m-search__empty {
  padding: 160rpx 64rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.m-search__empty-text {
  font-family: $m-font-cn;
  font-size: 26rpx;
  color: $m-text-2;
  text-align: center;
}

.m-search__empty-desc {
  margin-top: 16rpx;
  font-family: $m-font-cn;
  font-size: 22rpx;
  color: $m-text-3;
}

.m-search__bottom-space {
  height: 180rpx;
}
</style>
