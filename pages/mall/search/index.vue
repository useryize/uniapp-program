<!--
  搜索页（pages/mall/search/index）
  交互规格：docs/交互规格说明书-商城M1-M2.md §P7
  规则（PRD §②）：
  - 输入防抖 300ms；历史仅存本地、上限 10 条、可清空（隐私要求）
  - 无结果空态 + 清空筛选；搜索无结果率是板块②健康指标（目标 ≤15%）
-->
<template>
  <view class="search-page">
    <!-- 搜索栏 -->
    <view class="search-bar">
      <text class="search-icon">🔍</text>
      <input
        class="search-input"
        v-model="keyword"
        placeholder="搜索商品"
        confirm-type="search"
        focus
        @input="onInput"
        @confirm="onSearch"
      />
      <text v-if="keyword" class="search-clear" @click="clearKeyword">✕</text>
    </view>

    <!-- 搜索历史（无关键词时展示） -->
    <view v-if="!keyword && history.length" class="history-block">
      <view class="history-header">
        <text class="block-title">搜索历史</text>
        <text class="history-clear" @click="onClearHistory">清空</text>
      </view>
      <view class="history-list">
        <view v-for="word in history" :key="word" class="history-tag" @click="onHistoryTap(word)">
          <text>{{ word }}</text>
        </view>
      </view>
    </view>

    <!-- 热词占位（真实环境来自服务端配置，PRD §②） -->
    <view v-if="!keyword && hotWords.length" class="history-block">
      <text class="block-title">热门搜索</text>
      <view class="history-list">
        <view v-for="word in hotWords" :key="word" class="history-tag hot" @click="onHistoryTap(word)">
          <text>{{ word }}</text>
        </view>
      </view>
    </view>

    <!-- 搜索结果：复用商品卡组件 -->
    <view v-if="keyword" class="result-list">
      <view v-if="searched && !resultList.length" class="empty">
        <text class="empty-text">没有找到「{{ keyword }}」相关商品</text>
        <view class="empty-btn" @click="clearKeyword"><text>清空搜索</text></view>
      </view>

      <view v-else class="goods-grid">
        <goods-card
          v-for="goods in resultList"
          :key="goods.id"
          class="goods-cell"
          :goods="goods"
          @tap="goDetail"
          @add="onAddCart"
        />
      </view>

      <view v-if="resultList.length" class="load-tip">
        <text>{{ loading ? '加载中...' : hasMore ? '上拉加载更多' : '— 没有更多了 —' }}</text>
      </view>
    </view>
  </view>
</template>

<script setup>
/** 搜索页逻辑（Vue3 setup） */
import { ref } from 'vue'
import { onPullDownRefresh, onReachBottom, onUnload } from '@dcloudio/uni-app'
import { goodsApi, cartApi } from '../api/index.js'
import GoodsCard from '../components/goods-card.vue'

const HISTORY_KEY = 'mall_search_history'
const HISTORY_MAX = 10
const DEBOUNCE_MS = 300

/** 关键词与结果 */
const keyword = ref('')
const resultList = ref([])
const page = ref(0)
const hasMore = ref(true)
const loading = ref(false)
/** 是否已执行过搜索（区分"未搜索"与"无结果"） */
const searched = ref(false)

/** 搜索历史（仅本地存储，PRD §②规则 4） */
const history = ref(uni.getStorageSync(HISTORY_KEY) || [])
/** 热词（mock 静态占位，真实环境服务端下发） */
const hotWords = ['蓝牙耳机', '保温杯', 'T恤', '背包']

let debounceTimer = null

/**
 * 输入防抖 300ms（PRD §5.3：防抖 + 丢弃过期请求由重置分页天然覆盖）
 */
function onInput() {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    if (keyword.value.trim()) doSearch(true)
    else resetResult()
  }, DEBOUNCE_MS)
}

/** 键盘确认立即搜索 */
function onSearch() {
  clearTimeout(debounceTimer)
  if (keyword.value.trim()) doSearch(true)
}

/** 点历史/热词直接搜索 */
function onHistoryTap(word) {
  keyword.value = word
  doSearch(true)
}

/**
 * 执行搜索
 * @param {boolean} reset - true 从第一页开始
 */
async function doSearch(reset = false) {
  const word = keyword.value.trim()
  if (!word) return
  if (loading.value) return
  if (!reset && !hasMore.value) return

  loading.value = true
  try {
    const next = reset ? 1 : page.value + 1
    const data = await goodsApi.list({ keyword: word, page: next, pageSize: 10 })
    resultList.value = reset ? data.list : resultList.value.concat(data.list)
    page.value = next
    hasMore.value = data.hasMore
    searched.value = true
    saveHistory(word)
  } catch (e) {
    uni.showToast({ title: e.msg || '搜索失败', icon: 'none' })
  } finally {
    loading.value = false
    if (reset) uni.stopPullDownRefresh()
  }
}

/** 清空关键词回到历史/热词视图 */
function clearKeyword() {
  keyword.value = ''
  resetResult()
}

function resetResult() {
  resultList.value = []
  page.value = 0
  hasMore.value = true
  searched.value = false
}

/**
 * 保存搜索历史（去重置顶，上限 10 条，仅本地存储）
 */
function saveHistory(word) {
  const next = [word, ...history.value.filter((w) => w !== word)].slice(0, HISTORY_MAX)
  history.value = next
  uni.setStorageSync(HISTORY_KEY, next)
}

/** 清空历史（二次确认） */
function onClearHistory() {
  uni.showModal({
    title: '提示',
    content: '确定清空搜索历史吗？',
    success: (res) => {
      if (!res.confirm) return
      history.value = []
      uni.removeStorageSync(HISTORY_KEY)
    }
  })
}

/** 结果页加购（与首页一致：自动选有库存 SKU） */
async function onAddCart(goods) {
  try {
    await cartApi.add({ goodsId: goods.id, quantity: 1 })
    uni.showToast({ title: '已加入购物车', icon: 'success' })
  } catch (e) {
    uni.showToast({ title: e.msg || '加购失败', icon: 'none' })
  }
}

function goDetail(goods) {
  uni.navigateTo({ url: `/pages/mall/detail/index?id=${goods.id}` })
}

// 下拉刷新 / 触底分页
onPullDownRefresh(() => keyword.value && doSearch(true))
onReachBottom(() => keyword.value && doSearch(false))
onUnload(() => clearTimeout(debounceTimer))
</script>

<style scoped>
.search-page {
  min-height: 100vh;
  background-color: #f5f6f8;
  padding-bottom: 40rpx;
}

.search-bar {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin: 20rpx 24rpx;
  padding: 18rpx 24rpx;
  background-color: #ffffff;
  border-radius: 44rpx;
}

.search-input {
  flex: 1;
  font-size: 26rpx;
}

.search-clear {
  font-size: 28rpx;
  color: #999999;
  padding: 0 8rpx;
}

.history-block {
  background-color: #ffffff;
  border-radius: 16rpx;
  margin: 20rpx 24rpx 0;
  padding: 24rpx;
}

.history-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20rpx;
}

.block-title {
  font-size: 28rpx;
  color: #222222;
  font-weight: 500;
}

.history-clear {
  font-size: 24rpx;
  color: #999999;
}

.history-list {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.history-tag {
  padding: 10rpx 28rpx;
  background-color: #f5f6f8;
  border-radius: 28rpx;
  font-size: 24rpx;
  color: #666666;
}

.history-tag.hot {
  color: #e24b4a;
  background-color: #fcebeb;
}

.result-list {
  padding: 0 24rpx;
}

/* 两列网格：宽度作用在 <goods-card> 宿主节点上，与首页同规格（341rpx） */
.goods-grid {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  margin-top: 20rpx;
}

.goods-cell {
  display: block;
  width: 341rpx;
  margin-bottom: 20rpx;
}

.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 160rpx;
  gap: 24rpx;
}

.empty-text {
  font-size: 28rpx;
  color: #999999;
}

.empty-btn {
  padding: 14rpx 56rpx;
  background-color: #e24b4a;
  border-radius: 40rpx;
  color: #ffffff;
  font-size: 26rpx;
}

.load-tip {
  padding: 32rpx 0;
  text-align: center;
}

.load-tip text {
  font-size: 24rpx;
  color: #999999;
}
</style>
