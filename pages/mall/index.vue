<!--
  商城首页（pages/mall/index）
  职责：品牌主视觉 + 服务入口区 + 限时秒杀 + 推荐商品流
  视觉来源：Ardot 文件 739096499841184，首页 Frame 2:1
  数据：goodsApi.list / dropApi.list / cartApi.list
-->
<template>
  <view class="home">
    <view class="home-status" />
    <!-- 顶部品牌栏：黑底黄标 -->
    <view class="brand-bar">
      <view class="logo">
        <image class="brand-lockup" src="/static/mall/ardot/brand.png" mode="aspectFit" />
      </view>
      <view class="brand-actions">
        <view class="icon-btn search-btn" @click="goSearch">
          <image class="icon-img" src="/static/mall/ardot/search-button.png" mode="aspectFit" />
        </view>
        <view class="icon-btn" @click="goCart">
          <image class="icon-img" src="/static/mall/ardot/cart-button.png" mode="aspectFit" />
          <text v-if="cartCount" class="badge">{{ cartCount > 99 ? '99+' : cartCount }}</text>
        </view>
      </view>
    </view>

    <!-- Ardot 2:95：360px 主视觉 -->
    <view class="hero">
      <view class="hero-img-wrap">
        <image class="hero-img" src="/static/mall/ardot/hero.jpg" mode="aspectFill" />
        <image class="hero-tag" src="/static/mall/ardot/hero-tag.png" mode="aspectFit" />
      </view>
      <view class="hero-copy">
        <text class="hero-title">街头不设限</text>
        <text class="hero-sub">OVERSIZE CUT  ·  重磅 270G  ·  限量联名</text>
      </view>
    </view>

    <!-- Ardot 2:101：16px 外边距、10px 列间距的两行入口 -->
    <view class="entries">
      <view class="entry-row">
      <view class="entry entry-acid" @click="goDrop">
        <image class="entry-img" src="/static/mall/ardot/calendar-icon.png" mode="aspectFit" />
        <view class="entry-info">
          <text class="entry-title">发售日历</text>
          <text class="entry-sub">{{ dropHint }}</text>
        </view>
      </view>
      <view class="entry entry-warn" @click="goSizeGuide">
        <image class="entry-img" src="/static/mall/ardot/ruler-icon.png" mode="aspectFit" />
        <view class="entry-info">
          <text class="entry-title">尺码助手</text>
          <text class="entry-sub">输入身高体重 · 3秒推荐</text>
        </view>
      </view>
      </view>
      <view class="entry-row">
      <view class="entry" @click="goCategory">
        <image class="entry-img entry-img-large" src="/static/mall/ardot/collab-icon.png" mode="aspectFit" />
        <view class="entry-info">
          <text class="entry-title">联名专区</text>
          <text class="entry-sub">艺术家合作系列</text>
        </view>
      </view>
      <view class="entry" @click="goCategory">
        <image class="entry-img entry-img-large" src="/static/mall/ardot/all-icon.png" mode="aspectFit" />
        <view class="entry-info">
          <text class="entry-title">全部商品</text>
          <text class="entry-sub">卫衣 / 外套 / 鞋履</text>
        </view>
      </view>
      </view>
    </view>

    <!-- 限时秒杀 -->
    <view class="block flash-block">
      <view class="block-head">
        <image class="flash-title-img" src="/static/mall/ardot/flash-title.png" mode="aspectFit" />
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
          <goods-card
            v-for="g in flashList"
            :key="g.id"
            class="flash-card"
            :goods="g"
            :tag="flashTags[g.id] || 'SALE'"
            :cover-height="320"
            plain
            @select="goDetail"
          />
        </view>
      </scroll-view>
    </view>

    <!-- 为你推荐 -->
    <view class="recommend-block">
      <view class="block-head">
        <text class="block-title">为你推荐</text>
        <image class="trending-title-img" src="/static/mall/ardot/trending-title.png" mode="aspectFit" />
      </view>
      <view class="goods-grid">
        <goods-card
          v-for="g in goodsList"
          :key="g.id"
          class="goods-cell"
          :goods="g"
          :tag="recommendTags[g.id] || 'NEW'"
          :cover-height="320"
          plain
          @select="goDetail"
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

// 首页展示图和短标题对应 Ardot Frame 2:1；商品 id、价格与跳转仍来自接口。
const artGoods = {
  1: { cover: '/static/mall/ardot/hoodie.jpg', title: '落肩宽松连帽卫衣' },
  2: { cover: '/static/mall/ardot/tee.jpg', title: '重磅纯棉印花短袖' },
  3: { cover: '/static/mall/ardot/cargo-flash.jpg', title: '机能工装裤' },
  4: { cover: '/static/mall/ardot/denim.jpg', title: '水洗做旧牛仔外套' },
  5: { cover: '/static/mall/ardot/sneaker.jpg', title: '复古厚底运动鞋' }
}
const flashArt = {
  1: '/static/mall/ardot/hoodie-flash.jpg',
  2: '/static/mall/ardot/tee-flash.jpg',
  3: '/static/mall/ardot/cargo-flash.jpg'
}
const flashTags = { 1: '-30%', 2: '-25%', 3: '-40%' }
const recommendTags = { 1: 'HOT', 2: 'NEW', 4: 'LIMITED', 5: 'NEW' }
function homeGoods(goods) {
  return { ...goods, ...(artGoods[goods.id] || {}) }
}

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

    const mapped = data.list.map(homeGoods)
    const ordered = reset ? [1, 2, 4, 5].map((id) => mapped.find((g) => g.id === id)).filter(Boolean).concat(mapped.filter((g) => ![1, 2, 4, 5].includes(g.id))) : mapped
    goodsList.value = reset ? ordered : goodsList.value.concat(ordered)
    page.value = next
    hasMore.value = data.hasMore
    if (reset) flashList.value = data.list.slice(0, 3).map((g) => ({ ...homeGoods(g), cover: flashArt[g.id] || homeGoods(g).cover, title: g.id === 1 ? '落肩连帽卫衣' : g.id === 2 ? '重磅印花短袖' : homeGoods(g).title }))
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
  uni.redirectTo({ url: '/pages/mall/category/index' })
}

function goCart() {
  uni.redirectTo({ url: '/pages/mall/cart/index' })
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
  refreshCartCount()
})
onPullDownRefresh(() => loadGoods(true))
onReachBottom(() => loadGoods(false))
</script>

<style lang="scss" scoped>
@import "./styles/tokens.scss";
.home {
  min-height: 100vh;
  background-color: $rz-white;
  padding-bottom: calc(192rpx + env(safe-area-inset-bottom));
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
}

.brand-lockup {
  width: 302rpx;
  height: 60rpx;
}

.brand-actions {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.icon-btn {
  position: relative;
  width: 68rpx;
  height: 68rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2rpx solid $rz-white;
}

.icon-img {
  width: 36rpx;
  height: 36rpx;
}

.search-btn {
  border: 0;
}

.search-btn .icon-img {
  width: 68rpx;
  height: 68rpx;
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
  height: 720rpx;
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
  top: 32rpx;
  left: 32rpx;
  width: 242rpx;
  height: 44rpx;
}

/* 图下黑底文案区 */
.hero-copy {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 126rpx;
}

.hero-title {
  font-size: 80rpx;
  font-weight: 900;
  color: $rz-white;
  line-height: 92rpx;
}

.hero-sub {
  font-size: 24rpx;
  font-weight: 500;
  color: $rz-acid;
  line-height: 28rpx;
}

/* Ardot 2:101：白底 16px 内边距，两行各 56px。 */
.entries {
  display: flex;
  flex-direction: column;
  padding: 32rpx;
  background-color: $rz-white;
}

.entry-row {
  display: flex;
  gap: 20rpx;
}

.entry {
  flex: 1;
  min-width: 0;
  height: 112rpx;
  display: flex;
  align-items: center;
  gap: 12rpx;
  padding: 0 24rpx;
  background-color: $rz-grey-50;
  box-sizing: border-box;
}

.entry-acid {
  background-color: $rz-ink;
  padding-left: 20rpx;
  padding-right: 16rpx;
}

.entry-warn {
  background-color: $rz-warn-bg;
  border: 2rpx solid $rz-ink;
}

.entry-img {
  flex-shrink: 0;
  width: 56rpx;
  height: 56rpx;
}

.entry-img-large {
  width: 64rpx;
  height: 64rpx;
}

.entry-info {
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.entry-title {
  font-size: 26rpx;
  font-weight: 700;
  color: $rz-ink;
  line-height: 36rpx;
}

.entry-acid .entry-title {
  color: $rz-white;
}

.entry-sub {
  font-size: 20rpx;
  color: $rz-grey-500;
  line-height: 26rpx;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.entry-acid .entry-sub {
  font-size: 18rpx;
  color: $rz-acid;
}

.block-head {
  display: flex;
  align-items: center;
  gap: 20rpx;
  padding: 0 $rz-page-pad;
}

.block-title {
  font-size: 36rpx;
  font-weight: 900;
  color: $rz-ink;
}

.trending-title-img {
  width: 214rpx;
  height: 24rpx;
}

.block-more {
  margin-left: auto;
  font-size: 24rpx;
  color: $rz-grey-500;
}

.countdown {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.cd-num {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 52rpx;
  height: 44rpx;
  font-size: 24rpx;
  font-weight: 900;
  color: $rz-ink;
  background-color: $rz-white;
}

.cd-sep {
  font-size: 24rpx;
  font-weight: 900;
  color: $rz-white;
}

/* 秒杀区块：通栏黑底 */
.flash-block {
  background-color: $rz-ink;
  padding: 28rpx 0 36rpx;
}

.flash-block .block-head {
  margin-bottom: 24rpx;
}

.flash-title-img {
  width: 250rpx;
  height: 40rpx;
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
  width: 208rpx;
  flex-shrink: 0;
  white-space: normal;
}

.recommend-block {
  background-color: $rz-white;
}

.recommend-block .block-head {
  padding-top: 40rpx;
  padding-bottom: 24rpx;
}

/* Ardot 2:143：左右各 16px、列与行间隔 12px。 */
.goods-grid {
  display: flex;
  flex-wrap: wrap;
  column-gap: 24rpx;
  row-gap: 24rpx;
  padding: 0 $rz-page-pad;
}

.goods-cell {
  display: block;
  width: calc((100% - 24rpx) / 2);
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
