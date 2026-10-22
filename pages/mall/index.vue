<!--
  商城首页（pages/mall/index）
  职责：商品列表展示 + 分页 + 快捷加购（数据层全链路验证入口）
  商品卡已组件化：components/goods-card.vue（搜索页复用）
-->
<template>
  <view class="mall-page">
    <!-- 搜索栏：点击进搜索页 -->
    <view class="search-bar" @click="goSearch">
      <text class="search-icon">🔍</text>
      <text class="search-placeholder">搜索商品</text>
    </view>

    <!-- Banner 占位：真实环境由后台推荐位配置（PRD 板块②） -->
    <view class="banner">
      <text class="banner-text">商城 · 品质好物</text>
    </view>

    <!-- 商品双列网格 -->
    <view class="goods-grid">
      <goods-card
        v-for="goods in goodsList"
        :key="goods.id"
        class="goods-cell"
        :goods="goods"
        @tap="goDetail"
        @add="onAddCart"
      />
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
import GoodsCard from './components/goods-card.vue'

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
 * 库存校验在服务端完成，前端只处理成功/失败反馈
 */
async function onAddCart(goods) {
  try {
    await cartApi.add({ goodsId: goods.id, quantity: 1 })
    uni.showToast({ title: '已加入购物车', icon: 'success' })
  } catch (e) {
    uni.showToast({ title: e.msg || '加购失败', icon: 'none' })
  }
}

/** 进入商品详情 */
function goDetail(goods) {
  uni.navigateTo({ url: `/pages/mall/detail/index?id=${goods.id}` })
}

/** 进搜索页 */
function goSearch() {
  uni.navigateTo({ url: '/pages/mall/search/index' })
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

/*
 * 两列网格（小程序兼容写法）：
 * - <goods-card> 编译后产生宿主节点，宽度 class 必须作用在宿主上（.goods-cell）
 * - 固定 rpx 摆脱 calc 精度：750 - 左右边距48 - 列间距20 = 682，每卡 341rpx
 * - space-between 保证两列对齐，不依赖 flex gap（低版本基础库不支持）
 */
.goods-grid {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  padding: 0 24rpx;
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

.load-tip text {
  font-size: 24rpx;
  color: #999999;
}
</style>
