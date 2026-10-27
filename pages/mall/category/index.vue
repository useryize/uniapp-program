<!--
  分类页（pages/mall/category/index）—— 商城页面内导航
  布局：左侧一级类目栏（固定）+ 右侧排序栏与商品网格
  数据：goodsApi.categories / goodsApi.list（按 categoryId 过滤）
-->
<template>
  <view class="category">
    <view class="category-status-bar" />
    <view class="category-head">
      <view class="category-back" @click="goHome">
        <image src="/static/mall/icons/back.png" mode="aspectFit" />
      </view>
      <text class="category-title">分类</text>
    </view>
    <view class="category-search" @click="goSearch">
      <image src="/static/mall/icons/search.png" mode="aspectFit" />
      <text>搜索卫衣 / 联名款 / 工装裤</text>
    </view>
    <view class="cat-body">
      <!-- 左侧类目栏 -->
      <scroll-view class="cat-rail" scroll-y>
        <view
          v-for="c in categories"
          :key="c.id"
          class="cat-cell"
          :class="{ active: currentId === c.id }"
          @click="onSelectCategory(c)"
        >
          <text class="cat-name">{{ c.name }}</text>
        </view>
      </scroll-view>

      <!-- 右侧商品区 -->
      <view class="cat-main">
        <!-- 排序栏 -->
        <view class="sort-bar">
          <text
            v-for="s in sorts"
            :key="s.key"
            class="sort-item"
            :class="{ active: sortKey === s.key }"
            @click="onSort(s.key)"
          >{{ s.label }}</text>
        </view>

        <!-- 当前二级类目 -->
        <view v-if="subCategories.length" class="sub-row">
          <view
            v-for="sub in subCategories"
            :key="sub.id"
            class="sub-chip"
            :class="{ active: subId === sub.id }"
            @click="onSelectSub(sub)"
          >
            <text class="sub-text">{{ sub.name }}</text>
          </view>
        </view>

        <!-- 商品网格 -->
        <scroll-view class="cat-scroll" scroll-y @scrolltolower="loadMore">
          <view class="cat-grid">
            <goods-card
              v-for="g in goodsList"
              :key="g.id"
              class="cat-cell-item"
              :goods="g"
              :plain="true"
              :cover-height="251"
              @tap="goDetail"
            />
          </view>
          <view class="cat-tip">
            <text class="cat-tip-text">{{ tipText }}</text>
          </view>
        </scroll-view>
      </view>
    </view>
    <mall-tabbar current="category" />
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { goodsApi } from '../api/index.js'
import GoodsCard from '../components/goods-card.vue'
import MallTabbar from '../components/mall-tabbar.vue'

/** 一级类目树 */
const categories = ref([])
/** 当前一级类目 id */
const currentId = ref(0)
/** 当前二级类目 id（0 = 全部） */
const subId = ref(0)
/** 商品列表 */
const goodsList = ref([])
/** 排序方式 */
const sortKey = ref('default')
/** 是否还有下一页 */
const hasMore = ref(true)
const loading = ref(false)

/** 排序项：default 综合 / sales 销量 / price 价格 */
const sorts = [
  { key: 'default', label: '综合' },
  { key: 'sales', label: '销量' },
  { key: 'price', label: '价格' }
]

/** 当前一级类目对象 */
const currentCategory = computed(() =>
  categories.value.find((c) => c.id === currentId.value)
)

/** 当前一级类目下的二级类目 */
const subCategories = computed(() =>
  currentCategory.value && currentCategory.value.children ? currentCategory.value.children : []
)

const tipText = computed(() => {
  if (loading.value) return '加载中...'
  return hasMore.value ? '上拉加载更多' : '— 没有更多了 —'
})

/** 切一级类目：重置二级筛选与分页 */
function onSelectCategory(c) {
  currentId.value = c.id
  subId.value = 0
  loadGoods(true)
}

/** 切二级类目 */
function onSelectSub(sub) {
  subId.value = sub.id
  loadGoods(true)
}

/** 切换排序（前端排序，服务端返回的是基准集） */
function onSort(key) {
  if (sortKey.value === key) return
  sortKey.value = key
  const sorted = [...goodsList.value]
  if (key === 'sales') {
    sorted.sort((a, b) => b.sales - a.sales)
  } else if (key === 'price') {
    sorted.sort((a, b) => a.minPrice - b.minPrice)
  }
  goodsList.value = sorted
}

/**
 * 拉取当前类目下的商品
 * @param {boolean} reset true 重新拉取
 */
async function loadGoods(reset = false) {
  if (loading.value) return
  if (!reset && !hasMore.value) return

  loading.value = true
  try {
    // 二级选中时按二级类目过滤，否则按一级（含其二级）过滤
    const params = { page: 1, pageSize: 20 }
    if (subId.value) params.categoryId = subId.value
    else if (currentId.value) params.categoryId = currentId.value

    const data = await goodsApi.list(params)
    goodsList.value = data.list
    hasMore.value = data.hasMore
  } catch (e) {
    uni.showToast({ title: e.msg || '加载失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

function loadMore() {
  if (!hasMore.value || loading.value) return
  // mock 阶段一次性返回全量，真实接口此处翻页追加
  hasMore.value = false
}

function goDetail(goods) {
  uni.navigateTo({ url: `/pages/mall/detail/index?id=${goods.id}` })
}

function goHome() {
  uni.redirectTo({ url: '/pages/mall/index' })
}

function goSearch() {
  uni.navigateTo({ url: '/pages/mall/search/index' })
}

onLoad(async () => {
  try {
    categories.value = await goodsApi.categories()
  } catch (e) {
    uni.showToast({ title: e.msg || '类目加载失败', icon: 'none' })
  }
  loadGoods(true)
})

onShow(() => {
  // 从详情页返回时刷新（价格/库存可能已变）
  if (categories.value.length) loadGoods(true)
})
</script>

<style lang="scss" scoped>
@import "../styles/tokens.scss";
.category {
  height: 100vh;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  padding-bottom: calc(192rpx + env(safe-area-inset-bottom));
  background-color: $rz-grey-50;
  overflow: hidden;
}

.category-status-bar {
  height: var(--status-bar-height);
  flex-shrink: 0;
  background-color: $rz-white;
}

.category-head {
  height: 112rpx;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: $rz-white;
  position: relative;
}

.category-back {
  position: absolute;
  left: 32rpx;
  width: 48rpx;
  height: 48rpx;
  display: flex;
  align-items: center;
}

.category-back image {
  width: 32rpx;
  height: 32rpx;
}

.category-title {
  color: $rz-ink;
  font-size: 32rpx;
  font-weight: 900;
}

.category-search {
  height: 80rpx;
  flex-shrink: 0;
  padding: 0 24rpx;
  display: flex;
  align-items: center;
  gap: 16rpx;
  background-color: $rz-grey-100;
  color: $rz-grey-500;
  font-size: 26rpx;
}

.category-search image {
  width: 28rpx;
  height: 28rpx;
  opacity: 0.5;
}

.cat-body {
  display: flex;
  flex: 1;
  min-height: 0;
}

/* ---- 左侧类目栏（白底，选中黑块，无分隔线） ---- */
.cat-rail {
  width: 176rpx;
  height: 100%;
  background-color: $rz-white;
  flex-shrink: 0;
}

.cat-cell {
  height: 104rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cat-cell.active {
  background-color: $rz-ink;
}

.cat-name {
  font-size: 28rpx;
  color: $rz-ink;
}

.cat-cell.active .cat-name {
  color: $rz-acid;
  font-weight: 700;
}

/* ---- 右侧 ---- */
.cat-main {
  flex: 1;
  height: 100%;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.sort-bar {
  display: flex;
  align-items: center;
  gap: 32rpx;
  padding: 0 24rpx;
  height: 80rpx;
  background-color: $rz-white;
  flex-shrink: 0;
}

.sort-item {
  font-size: 26rpx;
  color: $rz-grey-500;
}

.sort-item.active {
  color: $rz-ink;
  font-weight: 700;
}

.sub-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  padding: 16rpx 24rpx;
  background-color: $rz-white;
  flex-shrink: 0;
}

.sub-chip {
  padding: 8rpx 20rpx;
  border: 4rpx solid $rz-ink;
  background-color: $rz-white;
}

.sub-chip.active {
  background-color: $rz-ink;
}

.sub-text {
  font-size: 22rpx;
  color: $rz-ink;
}

.sub-chip.active .sub-text {
  color: $rz-acid;
}

.cat-scroll {
  flex: 1;
  min-height: 0;
}

.cat-grid {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  padding: 20rpx 24rpx 0;
}

/* 两列，卡宽 251rpx，封面 1:1 */
.cat-cell-item {
  display: block;
  width: 251rpx;
  margin-bottom: 20rpx;
}

.cat-tip {
  padding: 28rpx 0;
  text-align: center;
}

.cat-tip-text {
  font-size: 24rpx;
  color: $rz-grey-500;
}
</style>
