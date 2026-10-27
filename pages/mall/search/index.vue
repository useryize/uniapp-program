<!--
  搜索页（pages/mall/search/index）
  交互规格：docs/交互规格说明书-商城M1-M2.md §P7
  规则（PRD §②）：
  - 输入防抖 300ms；历史仅存本地、上限 10 条、可清空（隐私要求）
  - 无结果空态 + 清空筛选；搜索无结果率是板块②健康指标（目标 ≤15%）
  服装电商要点（对齐设计稿）：
  - 结果为横向行式卡片，突出规格与价格（尺码决策前置）
-->
<template>
  <view class="search">
    <!-- 搜索栏 -->
    <view class="search-bar">
      <view class="search-input-wrap">
        <image class="search-icon" src="/static/mall/icons/search.png" mode="aspectFit" />
        <input
          class="search-input"
          v-model="keyword"
          placeholder="搜索卫衣 / 联名款 / 工装裤"
          placeholder-class="search-ph"
          confirm-type="search"
          focus
          @input="onInput"
          @confirm="onSearch"
        />
        <view v-if="keyword" class="search-clear" @click="clearKeyword">
          <image class="search-clear-img" src="/static/mall/icons/close.png" mode="aspectFit" />
        </view>
      </view>
      <text class="search-submit" @click="onSearch">搜索</text>
      <view class="search-back" @click="goBack">
        <image class="search-back-img" src="/static/mall/icons/back.png" mode="aspectFit" />
      </view>
    </view>

    <!-- 搜索历史（无关键词时展示） -->
    <view v-if="!keyword && history.length" class="block">
      <view class="block-head">
        <text class="block-title">搜索历史</text>
        <text class="block-action" @click="onClearHistory">清空</text>
      </view>
      <view class="tag-row">
        <view v-for="word in history" :key="word" class="tag" @click="onHistoryTap(word)">
          <text class="tag-text">{{ word }}</text>
        </view>
      </view>
    </view>

    <!-- 热门搜索 -->
    <view v-if="!keyword && hotWords.length" class="block">
      <view class="block-head">
        <text class="block-title">热门搜索</text>
        <text class="block-en">HOT</text>
      </view>
      <view class="tag-row">
        <view
          v-for="(word, i) in hotWords"
          :key="word"
          class="tag"
          :class="{ 'tag-hot': i === 0 }"
          @click="onHistoryTap(word)"
        >
          <text class="tag-text" :class="{ 'tag-hot-text': i === 0 }">{{ word }}</text>
        </view>
      </view>
    </view>

    <!-- 搜索结果 -->
    <view v-if="keyword" class="result">
      <view class="result-head">
        <text class="result-title">“{{ keyword }}” 的搜索结果</text>
        <text class="result-count">共 {{ total }} 件</text>
      </view>

      <view v-if="searched && !resultList.length" class="empty">
        <view class="empty-art">
          <image class="empty-img" src="/static/mall/icons/search.png" mode="aspectFit" />
        </view>
        <text class="empty-text">没有找到相关商品</text>
        <view class="empty-btn" @click="clearKeyword">
          <text class="empty-btn-text">清空筛选</text>
        </view>
      </view>

      <view v-else class="result-list">
        <view v-for="g in resultList" :key="g.id" class="row-item" @click="goDetail(g)">
          <view class="row-cover" :style="{ backgroundColor: g.color }">
            <image v-if="g.cover" class="row-cover-img" :src="g.cover" mode="aspectFill" />
            <text v-else class="row-cover-fallback">{{ g.title.slice(0, 1) }}</text>
          </view>
          <view class="row-info">
            <text class="row-name">{{ g.title }}</text>
            <text class="row-spec">{{ g.description }}  ·  已售 {{ g.sales }}</text>
            <text class="row-price">¥{{ fen2yuan(g.minPrice) }}</text>
          </view>
        </view>
      </view>

      <view v-if="resultList.length" class="load-tip">
        <text class="load-text">{{ loading ? '加载中...' : hasMore ? '上拉加载更多' : '— 没有更多了 —' }}</text>
      </view>
    </view>
  </view>
</template>

<script setup>
/** 搜索页逻辑（Vue3 setup） */
import { ref } from 'vue'
import { onPullDownRefresh, onReachBottom, onUnload } from '@dcloudio/uni-app'
import { goodsApi } from '../api/index.js'
import { fen2yuan } from '../utils/format.js'

const HISTORY_KEY = 'mall_search_history'
const HISTORY_MAX = 10
const DEBOUNCE_MS = 300

/** 关键词与结果 */
const keyword = ref('')
const resultList = ref([])
const total = ref(0)
const page = ref(0)
const hasMore = ref(true)
const loading = ref(false)
/** 是否已执行过搜索（区分"未搜索"与"无结果"） */
const searched = ref(false)

/** 搜索历史（仅本地存储，PRD §②规则 4） */
const history = ref(uni.getStorageSync(HISTORY_KEY) || [])
/** 热词（mock 静态占位，真实环境服务端下发） */
const hotWords = ['oversize 卫衣', 'STREET KING', '落肩连帽', '男女同款', '秋冬新品']

let debounceTimer = null

/**
 * 输入防抖 300ms
 */
function onInput() {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    if (keyword.value) doSearch(1)
  }, DEBOUNCE_MS)
}

/** 主动搜索（点搜索按钮或回车） */
function onSearch() {
  if (debounceTimer) clearTimeout(debounceTimer)
  if (!keyword.value) return
  doSearch(1)
  saveHistory(keyword.value)
}

/**
 * 执行搜索
 * @param {number} next 页码
 */
async function doSearch(next) {
  if (loading.value) return
  loading.value = true
  searched.value = true
  try {
    const data = await goodsApi.list({ keyword: keyword.value, page: next, pageSize: 10 })
    resultList.value = next === 1 ? data.list : resultList.value.concat(data.list)
    total.value = data.total
    page.value = next
    hasMore.value = data.hasMore
  } catch (e) {
    uni.showToast({ title: e.msg || '搜索失败', icon: 'none' })
  } finally {
    loading.value = false
    if (next === 1) uni.stopPullDownRefresh()
  }
}

/** 点击历史/热词 */
function onHistoryTap(word) {
  keyword.value = word
  onSearch()
}

/** 清空关键词 */
function clearKeyword() {
  keyword.value = ''
  resultList.value = []
  searched.value = false
  total.value = 0
  hasMore.value = true
}

/**
 * 保存搜索历史（上限 10 条，去重后最新的在前）
 */
function saveHistory(word) {
  const next = [word, ...history.value.filter((w) => w !== word)].slice(0, HISTORY_MAX)
  history.value = next
  uni.setStorageSync(HISTORY_KEY, next)
}

/** 清空搜索历史 */
function onClearHistory() {
  history.value = []
  uni.removeStorageSync(HISTORY_KEY)
}

function goDetail(goods) {
  uni.navigateTo({ url: `/pages/mall/detail/index?id=${goods.id}` })
}

function goBack() {
  uni.navigateBack()
}

onPullDownRefresh(() => {
  if (keyword.value) doSearch(1)
  else uni.stopPullDownRefresh()
})

onReachBottom(() => {
  if (keyword.value && hasMore.value) doSearch(page.value + 1)
})

onUnload(() => {
  if (debounceTimer) clearTimeout(debounceTimer)
})
</script>

<style lang="scss" scoped>
@import "../styles/tokens.scss";
.search {
  min-height: 100vh;
  background-color: $rz-white;
}

/* ---- 搜索栏 ---- */
.search-bar {
  display: flex;
  align-items: center;
  gap: 16rpx;
  height: 112rpx;
  padding: 0 24rpx;
  background-color: $rz-white;
}

.search-back {
  width: 48rpx;
  height: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.search-back-img {
  width: 30rpx;
  height: 30rpx;
}

.search-input-wrap {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12rpx;
  height: 72rpx;
  padding: 0 20rpx;
  background-color: $rz-grey-100;
  min-width: 0;
}

.search-icon {
  width: 26rpx;
  height: 26rpx;
  opacity: 0.5;
  flex-shrink: 0;
}

.search-input {
  flex: 1;
  font-size: 28rpx;
  color: $rz-ink;
  height: 72rpx;
  min-width: 0;
}

.search-ph {
  color: $rz-grey-500;
  font-size: 26rpx;
}

.search-clear {
  width: 36rpx;
  height: 36rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: $rz-grey-300;
  border-radius: 18rpx;
  flex-shrink: 0;
}

.search-clear-img {
  width: 18rpx;
  height: 18rpx;
}

.search-submit {
  font-size: 28rpx;
  font-weight: 700;
  color: $rz-ink;
  flex-shrink: 0;
}

/* ---- 历史 / 热词 ---- */
.block {
  background-color: $rz-white;
  margin-top: 16rpx;
  padding: 28rpx $rz-page-pad;
}

.block-head {
  display: flex;
  align-items: baseline;
  gap: 16rpx;
  margin-bottom: 20rpx;
}

.block-title {
  font-size: 32rpx;
  font-weight: 900;
  color: $rz-ink;
}

.block-en {
  font-size: 20rpx;
  font-weight: 700;
  letter-spacing: 2rpx;
  color: $rz-price;
}

.block-action {
  margin-left: auto;
  font-size: 24rpx;
  color: $rz-grey-500;
}

.tag-row {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.tag {
  padding: 12rpx 24rpx;
  background-color: $rz-grey-100;
  border: 2rpx solid transparent;
}

.tag-hot {
  background-color: $rz-acid;
  border-color: $rz-ink;
}

.tag-text {
  font-size: 24rpx;
  color: $rz-ink;
}

.tag-hot-text {
  font-weight: 700;
}

/* ---- 结果 ---- */
.result {
  margin-top: 16rpx;
}

.result-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  padding: 24rpx $rz-page-pad 16rpx;
  background-color: $rz-white;
}

.result-title {
  font-size: 28rpx;
  font-weight: 700;
  color: $rz-ink;
}

.result-count {
  font-size: 24rpx;
  color: $rz-grey-500;
}

.result-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
  padding: 20rpx 24rpx 0;
}

.row-item {
  display: flex;
  align-items: center;
  gap: 20rpx;
  padding: 20rpx;
  background-color: $rz-white;
  border: 4rpx solid $rz-ink;
}

.row-cover {
  width: 144rpx;
  height: 144rpx;
  overflow: hidden;
  flex-shrink: 0;
}

.row-cover-img {
  width: 100%;
  height: 100%;
}

.row-cover-fallback {
  font-size: 56rpx;
  color: rgba(255, 255, 255, 0.85);
}

.row-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  min-width: 0;
}

.row-name {
  font-size: 28rpx;
  font-weight: 700;
  color: $rz-ink;
  line-height: 1.4;
}

.row-spec {
  font-size: 22rpx;
  color: $rz-grey-500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.row-price {
  font-size: 34rpx;
  font-weight: 900;
  color: $rz-price;
}

/* ---- 空态 ---- */
.empty {
  padding-top: 120rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20rpx;
}

.empty-art {
  width: 120rpx;
  height: 120rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: $rz-grey-100;
}

.empty-img {
  width: 56rpx;
  height: 56rpx;
  opacity: 0.35;
}

.empty-text {
  font-size: 28rpx;
  color: $rz-grey-500;
}

.empty-btn {
  width: 220rpx;
  height: 76rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 4rpx solid $rz-ink;
  background-color: $rz-white;
}

.empty-btn-text {
  font-size: 28rpx;
  font-weight: 700;
  color: $rz-ink;
}

.load-tip {
  padding: 32rpx 0;
  text-align: center;
}

.load-text {
  font-size: 24rpx;
  color: $rz-grey-500;
}
</style>
