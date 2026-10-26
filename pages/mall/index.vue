<!--
  商城首页（pages/mall/index）
  职责：品牌主视觉 + 服务入口区 + 限时秒杀 + 推荐商品流
  视觉：街头潮流 —— 墨黑/酸性黄撞色、2px 硬描边、圆角 0（对齐 pages/mall/design）
  数据：goodsApi.list / goodsApi.categories / dropApi.list / cartApi.add
-->
<template>
  <view class="home">
    <view class="home-status" />
    <!-- 顶部品牌栏：黑底黄标 -->
    <view class="brand-bar">
      <view class="logo">
        <view class="logo-mark"><text class="logo-letter">R</text></view>
        <text class="logo-text">RAWZONE</text>
      </view>
      <view class="brand-actions">
        <view class="icon-btn" @click="goSearch">
          <image class="icon-img" src="/static/mall/icons/search.png" mode="aspectFit" />
        </view>
        <view class="icon-btn" @click="goCart">
          <image class="icon-img" src="/static/mall/icons/cart.png" mode="aspectFit" />
          <text v-if="cartCount" class="badge">{{ cartCount > 99 ? '99+' : cartCount }}</text>
        </view>
      </view>
    </view>

    <!-- 主视觉：图片 + 图下黑底文案区（对齐设计稿结构） -->
    <view class="hero">
      <view class="hero-img-wrap">
        <image class="hero-img" src="/static/mall/hero.jpg" mode="aspectFill" />
        <view class="hero-tag"><text class="hero-tag-text">26SS NEW DROP</text></view>
        <view class="hero-count"><text class="hero-count-text">1/4</text></view>
      </view>
      <view class="hero-copy">
        <text class="hero-title">街头不设限</text>
        <text class="hero-sub">OVERSIZE CUT · 重磅 270G · 限量联名</text>
      </view>
    </view>

    <!-- 服务入口区：2×2 网格（发售日历 / 尺码助手 / 联名专区 / 全部商品） -->
    <view class="entries">
      <view class="entry entry-acid" @click="goDrop">
        <view class="entry-icon">
          <image class="entry-img" src="/static/mall/icons/calendar.png" mode="aspectFit" />
        </view>
        <view class="entry-info">
          <text class="entry-title">发售日历</text>
          <text class="entry-sub">{{ dropHint }}</text>
        </view>
      </view>
      <view class="entry entry-warn" @click="goSizeGuide">
        <view class="entry-icon entry-icon-dark">
          <image class="entry-img" src="/static/mall/icons/ruler.png" mode="aspectFit" />
        </view>
        <view class="entry-info">
          <text class="entry-title">尺码助手</text>
          <text class="entry-sub">输入身高体重 · 3秒推荐</text>
        </view>
      </view>
      <view class="entry" @click="goCategory">
        <view class="entry-icon entry-icon-red">
          <image class="entry-img" src="/static/mall/icons/grid_white.png" mode="aspectFit" />
        </view>
        <view class="entry-info">
          <text class="entry-title">联名专区</text>
          <text class="entry-sub">艺术家合作系列</text>
        </view>
      </view>
      <view class="entry" @click="goCategory">
        <view class="entry-icon">
          <image class="entry-img" src="/static/mall/icons/grid.png" mode="aspectFit" />
        </view>
        <view class="entry-info">
          <text class="entry-title">全部商品</text>
          <text class="entry-sub">卫衣 / 外套 / 鞋履</text>
        </view>
      </view>
    </view>

    <!-- 限时秒杀 -->
    <view class="block flash-block">
      <view class="block-head">
        <text class="block-title flash-title">FLASH SALE</text>
        <view class="countdown">
          <text class="cd-num">02</text>
          <text class="cd-sep">:</text>
          <text class="cd-num">15</text>
          <text class="cd-sep">:</text>
          <text class="cd-num">30</text>
        </view>
        <text class="block-more block-more-light" @click="goCategory">更多 ></text>
      </view>
      <scroll-view class="flash-scroll" scroll-x>
        <view class="flash-row">
          <view
            v-for="g in flashList"
            :key="g.id"
            class="flash-card"
            @click="goDetail(g)"
          >
            <view class="flash-cover" :style="{ backgroundColor: g.color }">
              <image v-if="g.cover" class="flash-img" :src="g.cover" mode="aspectFill" />
            </view>
            <text class="flash-name">{{ g.title }}</text>
            <text class="flash-price">¥{{ fen2yuan(g.minPrice) }}</text>
          </view>
        </view>
      </scroll-view>
    </view>

    <!-- 为你推荐 -->
    <view class="block">
      <view class="block-head">
        <text class="block-title">为你推荐</text>
        <text class="block-en">TRENDING NOW</text>
      </view>
      <view class="goods-grid">
        <goods-card
          v-for="g in goodsList"
          :key="g.id"
          class="goods-cell"
          :goods="g"
          :tag="g.id % 2 === 0 ? 'HOT' : 'NEW'"
          :show-add="true"
          @tap="goDetail"
          @add="onAddCart"
        />
      </view>
    </view>

    <view class="load-tip">
      <text class="load-text">{{ loadingText }}</text>
    </view>
    <mall-tabbar current="home" />
  </view>
</template>

<script setup>
/** 商城首页数据逻辑（Vue3 setup） */
import { ref, computed } from 'vue'
import { onLoad, onPullDownRefresh, onReachBottom, onShow } from '@dcloudio/uni-app'
import { goodsApi, cartApi, dropApi } from './api/index.js'
import { fen2yuan } from './utils/format.js'
import GoodsCard from './components/goods-card.vue'
import MallTabbar from './components/mall-tabbar.vue'

/** 商品列表数据源 */
const goodsList = ref([])
/** 秒杀商品（取列表前 3 条） */
const flashList = ref([])
/** 当前已加载页码（从 1 开始） */
const page = ref(0)
/** 是否还有下一页（由服务端分页返回，前端只消费） */
const hasMore = ref(true)
/** 请求进行中标记（防重复加载） */
const loading = ref(false)
/** 购物车件数（tabBar 角标） */
const cartCount = ref(0)
/** 发售日历摘要 */
const dropInfo = ref(null)

const loadingText = computed(() => {
  if (loading.value) return '加载中...'
  if (!hasMore.value) return '— 没有更多了 —'
  return '上拉加载更多'
})

/** 首页入口区的发售提示文案 */
const dropHint = computed(() => {
  if (!dropInfo.value) return '查看即将开售'
  const soon = dropInfo.value.soon || 0
  return soon > 0 ? `${soon} 场待开售 · ${dropInfo.value.date}` : '暂无待开售'
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
    if (reset) flashList.value = data.list.slice(0, 3)
  } catch (e) {
    uni.showToast({ title: e.msg || '加载失败', icon: 'none' })
  } finally {
    loading.value = false
    if (reset) uni.stopPullDownRefresh()
  }
}

/** 拉取发售日历摘要（入口区文案） */
async function loadDrops() {
  try {
    const list = await dropApi.list({})
    const soon = list.find((d) => d.type === 'soon')
    dropInfo.value = {
      soon: list.filter((d) => d.type === 'soon').length,
      date: soon ? formatDropDate(soon.startAt) : ''
    }
  } catch (e) {
    // 发售日历为增强信息，失败不阻断首页
  }
}

/** 时间戳 -> 'M月D日' */
function formatDropDate(ts) {
  const d = new Date(ts)
  return `${d.getMonth() + 1}月${d.getDate()}日`
}

/** 快捷加购（列表页场景）：不传 skuId，服务端自动选择有库存 SKU */
async function onAddCart(goods) {
  try {
    const res = await cartApi.add({ goodsId: goods.id, quantity: 1 })
    cartCount.value = res.cartCount
    uni.showToast({ title: '已加入购物车', icon: 'success' })
  } catch (e) {
    uni.showToast({ title: e.msg || '加购失败', icon: 'none' })
  }
}

/** 刷新购物车角标 */
async function refreshCartCount() {
  try {
    const data = await cartApi.list()
    cartCount.value = data.list.reduce((n, i) => n + i.quantity, 0)
  } catch (e) {
    // 角标失败不阻断
  }
}

/** 进入商品详情 */
function goDetail(goods) {
  uni.navigateTo({ url: `/pages/mall/detail/index?id=${goods.id}` })
}

function goSearch() {
  uni.navigateTo({ url: '/pages/mall/search/index' })
}

function goCategory() {
  uni.switchTab({ url: '/pages/mall/category/index' })
}

function goCart() {
  uni.switchTab({ url: '/pages/mall/cart/index' })
}

function goDrop() {
  uni.navigateTo({ url: '/pages/mall/drop/index' })
}

function goSizeGuide() {
  uni.navigateTo({ url: '/pages/mall/size-guide/index' })
}

// 生命周期：首次进入 / 每次显示（角标刷新） / 下拉刷新 / 触底加载
onLoad(() => {
  loadGoods(true)
  loadDrops()
})
onShow(() => {
  uni.hideTabBar({ animation: false })
  refreshCartCount()
})
onPullDownRefresh(() => loadGoods(true))
onReachBottom(() => loadGoods(false))
</script>

<style lang="scss" scoped>
@import "../../uni.scss";
.home {
  min-height: 100vh;
  background-color: $rz-grey-50;
  padding-bottom: 192rpx;
}

.home-status {
  height: 124rpx;
  background-color: $rz-ink;
}

/* ---- 品牌栏 ---- */
.brand-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 192rpx;
  padding: 0 $rz-page-pad;
  background-color: $rz-ink;
}

.logo {
  display: flex;
  align-items: center;
  gap: 14rpx;
}

.logo-mark {
  width: 56rpx;
  height: 56rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: $rz-acid;
}

.logo-letter {
  font-size: 36rpx;
  font-weight: 900;
  color: $rz-ink;
  line-height: 1;
}

.logo-text {
  font-size: 40rpx;
  font-weight: 900;
  letter-spacing: 3rpx;
  color: $rz-white;
}

.brand-actions {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.icon-btn {
  position: relative;
  width: 56rpx;
  height: 56rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 4rpx solid $rz-white;
}

.icon-img {
  width: 34rpx;
  height: 34rpx;
}

.badge {
  position: absolute;
  top: -12rpx;
  right: -12rpx;
  min-width: 28rpx;
  height: 28rpx;
  padding: 0 6rpx;
  text-align: center;
  font-size: 18rpx;
  font-weight: 700;
  line-height: 28rpx;
  color: $rz-white;
  background-color: $rz-price;
  border-radius: 14rpx;
}

/* ---- 主视觉 ---- */
.hero {
  background-color: $rz-ink;
}

.hero-img-wrap {
  position: relative;
  width: 100%;
  height: 594rpx;
}

.hero-img {
  width: 100%;
  height: 100%;
}

.hero-tag {
  position: absolute;
  top: 24rpx;
  left: 24rpx;
  padding: 6rpx 16rpx;
  background-color: $rz-acid;
}

.hero-tag-text {
  font-size: 22rpx;
  font-weight: 900;
  letter-spacing: 1rpx;
  color: $rz-ink;
}

/* 图片计数角标 */
.hero-count {
  position: absolute;
  top: 24rpx;
  right: 24rpx;
  padding: 4rpx 12rpx;
  background-color: $rz-ink;
}

.hero-count-text {
  font-size: 20rpx;
  font-weight: 700;
  color: $rz-white;
}

/* 图下黑底文案区 */
.hero-copy {
  display: flex;
  flex-direction: column;
  gap: 10rpx;
  padding: 24rpx 32rpx 28rpx;
}

.hero-title {
  font-size: 76rpx;
  font-weight: 900;
  color: $rz-white;
  line-height: 1.2;
}

.hero-sub {
  font-size: 24rpx;
  color: $rz-acid;
  letter-spacing: 1rpx;
}

/* ---- 服务入口区：2×2 通栏网格 ---- */
.entries {
  display: flex;
  flex-wrap: wrap;
  background-color: $rz-ink;
  padding-bottom: 2rpx;
}

.entry {
  width: 50%;
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 24rpx 24rpx;
  background-color: $rz-white;
  border-bottom: 2rpx solid $rz-ink;
  border-right: 2rpx solid $rz-ink;
  box-sizing: border-box;
}

.entry-acid {
  background-color: $rz-ink;
}

.entry-warn {
  background-color: $rz-warn-bg;
}

.entry-icon {
  width: 64rpx;
  height: 64rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: $rz-acid;
}

.entry-icon-dark {
  background-color: $rz-ink;
}

.entry-icon-red {
  background-color: $rz-price;
}

.entry-img {
  width: 38rpx;
  height: 38rpx;
}

.entry-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}

.entry-title {
  font-size: 30rpx;
  font-weight: 700;
  color: $rz-ink;
}

.entry-acid .entry-title {
  color: $rz-white;
}

.entry-sub {
  font-size: 22rpx;
  color: $rz-grey-500;
}

.entry-acid .entry-sub {
  color: $rz-acid;
}

/* ---- 区块 ---- */
.block {
  margin-top: 24rpx;
  padding: 24rpx 0 8rpx;
  background-color: $rz-white;
}

.block-head {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 0 $rz-page-pad;
  margin-bottom: 20rpx;
}

.block-title {
  font-size: 40rpx;
  font-weight: 900;
  color: $rz-ink;
}

.block-en {
  font-size: 20rpx;
  font-weight: 700;
  letter-spacing: 2rpx;
  color: $rz-grey-500;
}

.block-more {
  margin-left: auto;
  font-size: $rz-fs-desc;
  color: $rz-grey-500;
}

.countdown {
  display: flex;
  align-items: center;
  gap: 4rpx;
}

.cd-num {
  font-size: 24rpx;
  font-weight: 900;
  color: $rz-ink;
  background-color: $rz-white;
  padding: 2rpx 8rpx;
}

.cd-sep {
  font-size: 24rpx;
  font-weight: 900;
  color: $rz-white;
}

/* 秒杀区块：通栏黑底 */
.flash-block {
  background-color: $rz-ink;
  padding: 24rpx 0 8rpx;
}

.flash-title {
  color: $rz-acid;
}

.block-more-light {
  color: $rz-white;
}

/* ---- 秒杀横滑 ---- */
.flash-scroll {
  white-space: nowrap;
  width: 100%;
}

.flash-row {
  display: inline-flex;
  gap: 20rpx;
  padding: 0 $rz-page-pad;
}

.flash-card {
  display: inline-flex;
  flex-direction: column;
  gap: 8rpx;
  width: 208rpx;
}

.flash-cover {
  width: 208rpx;
  height: 240rpx;
  overflow: hidden;
}

.flash-img {
  width: 100%;
  height: 100%;
}

.flash-name {
  font-size: 24rpx;
  color: $rz-ink;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.flash-price {
  font-size: 30rpx;
  font-weight: 900;
  color: $rz-price;
}

/* ---- 推荐网格 ---- */
.goods-grid {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  padding: 0 $rz-page-pad;
}

.goods-cell {
  display: block;
  width: 341rpx;
  margin-bottom: 20rpx;
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
