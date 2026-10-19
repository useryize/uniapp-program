<!--
  商城首页（pages/mall/index）
  职责：验证商城数据层全链路（api -> mock/真实接口）
  数据来源：api/index.js 的 goodsApi / cartApi，页面不感知 mock 与否
  功能：商品分页列表 + 下拉刷新 + 触底加载 + 快捷加购（SKU 自动选择）
  后续页面（搜索/详情/购物车/订单）按同一模式接入
-->
<template>
  <view class="mall-page">
    <!-- 搜索栏：搜索页属 M1 后续交付，当前仅占位 -->
    <view class="search-bar" @click="onSearchTap">
      <text class="search-icon">🔍</text>
      <text class="search-placeholder">搜索商品</text>
    </view>

    <!-- Banner 占位：真实环境由后台推荐位配置（PRD 板块②） -->
    <view class="banner">
      <text class="banner-text">商城 · 品质好物</text>
    </view>

    <!-- 商品双列网格 -->
    <view class="goods-grid">
      <view
        v-for="goods in goodsList"
        :key="goods.id"
        class="goods-card"
        @click="goDetail(goods)"
      >
        <!-- 封面：mock 阶段 cover 为空，用占位色块；接真实接口后自动走图片 -->
        <view class="cover" :style="{ backgroundColor: goods.color }">
          <image v-if="goods.cover" class="cover-img" :src="goods.cover" mode="aspectFill" />
          <text v-else class="cover-fallback">{{ goods.title.slice(0, 1) }}</text>
        </view>

        <view class="info">
          <text class="title">{{ goods.title }}</text>
          <text class="desc">{{ goods.description }}</text>
          <view class="price-row">
            <text class="price">¥{{ fen2yuan(goods.minPrice) }}</text>
            <text class="origin-price">¥{{ fen2yuan(goods.originPrice) }}</text>
          </view>
          <view class="bottom-row">
            <text class="sales">已售 {{ goods.sales }}</text>
            <view class="add-cart-btn" @click.stop="onAddCart(goods)">加购</view>
          </view>
        </view>
      </view>
    </view>

    <!-- 加载状态：加载中 / 没有更多 -->
    <view class="load-tip">
      <text>{{ loadingText }}</text>
    </view>
  </view>
</template>

<script setup>
/** 商城首页数据逻辑（Vue3 setup） */
import { ref, computed } from 'vue'
import { onLoad, onPullDownRefresh, onReachBottom } from '@dcloudio/uni-app'
import { goodsApi, cartApi } from './api/index.js'
import { fen2yuan } from './utils/format.js'

/** 商品列表数据源 */
const goodsList = ref([])
/** 当前已加载页码（从 1 开始） */
const page = ref(0)
/** 是否还有下一页（由服务端分页返回，前端只消费） */
const hasMore = ref(true)
/** 请求进行中标记（防重复加载） */
const loading = ref(false)

/** 底部加载提示文案 */
const loadingText = computed(() => {
  if (loading.value) return '加载中...'
  if (!hasMore.value) return '— 没有更多了 —'
  return '上拉加载更多'
})

/**
 * 拉取商品列表（分页）
 * @param {boolean} reset - true 重新从第一页拉取（下拉刷新/首次进入）
 */
async function loadGoods(reset = false) {
  if (loading.value) return
  if (!reset && !hasMore.value) return

  loading.value = true
  try {
    const next = reset ? 1 : page.value + 1
    const data = await goodsApi.list({ page: next, pageSize: 10 })

    goodsList.value = reset ? data.list : goodsList.value.concat(data.list)
    page.value = next
    hasMore.value = data.hasMore
  } catch (e) {
    // 统一错误出口：mock 与真实接口的 reject 结构一致 { code, msg }
    uni.showToast({ title: e.msg || '加载失败', icon: 'none' })
  } finally {
    loading.value = false
    if (reset) uni.stopPullDownRefresh()
  }
}

/**
 * 快捷加购（列表页场景）：不传 skuId，服务端自动选择有库存 SKU
 * 库存校验在服务端（mock handler）完成，前端只处理成功/失败反馈
 */
async function onAddCart(goods) {
  try {
    await cartApi.add({ goodsId: goods.id, quantity: 1 })
    uni.showToast({ title: '已加入购物车', icon: 'success' })
  } catch (e) {
    uni.showToast({ title: e.msg || '加购失败', icon: 'none' })
  }
}

/** 进入商品详情（详情页 M1 后续交付，当前提示） */
function goDetail(goods) {
  uni.showToast({ title: '详情页待 M1 交付', icon: 'none' })
}

/** 搜索入口（搜索页 M1 后续交付，当前提示） */
function onSearchTap() {
  uni.showToast({ title: '搜索页待 M1 交付', icon: 'none' })
}

// 生命周期：首次进入 / 下拉刷新 / 触底加载
onLoad(() => loadGoods(true))
onPullDownRefresh(() => loadGoods(true))
onReachBottom(() => loadGoods(false))
</script>

<style scoped>
.mall-page {
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

.search-placeholder {
  font-size: 26rpx;
  color: #999999;
}

.banner {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 200rpx;
  margin: 0 24rpx 24rpx;
  background: linear-gradient(90deg, #378add, #534ab7);
  border-radius: 16rpx;
}

.banner-text {
  font-size: 34rpx;
  font-weight: 500;
  color: #ffffff;
}

.goods-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 20rpx;
  padding: 0 24rpx;
}

.goods-card {
  width: calc((100% - 20rpx) / 2);
  background-color: #ffffff;
  border-radius: 16rpx;
  overflow: hidden;
}

.cover {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 320rpx;
}

.cover-img {
  width: 100%;
  height: 100%;
}

.cover-fallback {
  font-size: 72rpx;
  color: rgba(255, 255, 255, 0.85);
}

.info {
  padding: 16rpx 20rpx 20rpx;
}

.title {
  display: block;
  font-size: 28rpx;
  color: #222222;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.desc {
  display: block;
  margin-top: 6rpx;
  font-size: 22rpx;
  color: #999999;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.price-row {
  display: flex;
  align-items: baseline;
  gap: 12rpx;
  margin-top: 12rpx;
}

.price {
  font-size: 32rpx;
  font-weight: 500;
  color: #e24b4a;
}

.origin-price {
  font-size: 22rpx;
  color: #bbbbbb;
  text-decoration: line-through;
}

.bottom-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 12rpx;
}

.sales {
  font-size: 22rpx;
  color: #999999;
}

.add-cart-btn {
  padding: 8rpx 28rpx;
  font-size: 24rpx;
  color: #ffffff;
  background-color: #e24b4a;
  border-radius: 28rpx;
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
