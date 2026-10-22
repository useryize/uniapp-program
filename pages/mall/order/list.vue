<!--
  订单列表页（pages/mall/order/list?status={status}）
  交互规格：docs/交互规格说明书-商城M1-M2.md §P5
  五个状态 tab；按状态渲染操作按钮（PRD §6.2 状态机决定按钮可见性）；
  onShow 刷新：从支付结果页返回后订单状态可能已变化
-->
<template>
  <view class="order-list-page">
    <!-- 状态 tab -->
    <view class="tabs">
      <view
        v-for="tab in tabs"
        :key="tab.key"
        class="tab-item"
        :class="{ active: currentTab === tab.key }"
        @click="onTabChange(tab.key)"
      >
        <text>{{ tab.label }}</text>
      </view>
    </view>

    <!-- 订单列表 -->
    <swiper class="tab-swiper" :current="tabIndex" @change="onSwiperChange">
      <swiper-item v-for="tab in tabs" :key="tab.key">
        <scroll-view scroll-y class="tab-scroll" @scrolltolower="onLoadMore">
          <view v-if="!loading && !orderList.length" class="empty">
            <text class="empty-text">{{ emptyText }}</text>
          </view>

          <view
            v-for="order in orderList"
            :key="order.orderNo"
            class="order-card"
            @click="goDetail(order)"
          >
            <view class="order-header">
              <text class="order-no">订单号 {{ order.orderNo }}</text>
              <text class="order-status">{{ orderStatusText(order.status) }}</text>
            </view>

            <!-- 商品缩略：首个快照 + 件数（PRD §7.1：历史订单展示快照） -->
            <view class="order-goods">
              <view class="cover" :style="{ backgroundColor: order.items[0].colorSnapshot }">
                <image v-if="order.items[0].coverSnapshot" class="cover-img" :src="order.items[0].coverSnapshot" mode="aspectFill" />
                <text v-else class="cover-fallback">{{ order.items[0].titleSnapshot.slice(0, 1) }}</text>
              </view>
              <view class="order-goods-info">
                <text class="order-goods-title">{{ order.items[0].titleSnapshot }}</text>
                <text class="order-goods-qty">共 {{ totalQty(order) }} 件</text>
              </view>
              <text class="order-pay">实付 ¥{{ fen2yuan(order.payAmount) }}</text>
            </view>

            <!-- 操作按钮：按状态机渲染，非允许状态不展示按钮（PRD §5.7） -->
            <view class="order-actions">
              <template v-if="order.status === 'UNPAID'">
                <view class="action-btn plain" @click.stop="onCancel(order)"><text>取消订单</text></view>
                <view class="action-btn primary" @click.stop="goPay(order)"><text>去支付</text></view>
              </template>
              <template v-else-if="order.status === 'SHIPPED'">
                <view class="action-btn plain" @click.stop="onConfirm(order)"><text>确认收货</text></view>
                <view class="action-btn primary" @click.stop="goDetail(order)"><text>查看详情</text></view>
              </template>
              <template v-else>
                <view class="action-btn plain" @click.stop="goDetail(order)"><text>查看详情</text></view>
              </template>
            </view>
          </view>

          <view v-if="orderList.length" class="load-tip">
            <text>{{ loading ? '加载中...' : hasMore ? '上拉加载更多' : '— 没有更多了 —' }}</text>
          </view>
        </scroll-view>
      </swiper-item>
    </swiper>
  </view>
</template>

<script setup>
/** 订单列表页逻辑（Vue3 setup） */
import { ref, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { orderApi } from '../api/index.js'
import { fen2yuan, orderStatusText } from '../utils/format.js'

/** 状态 tab 配置（CANCELED 不设独立 tab，在"全部"中可见） */
const tabs = [
  { key: 'ALL', label: '全部' },
  { key: 'UNPAID', label: '待付款' },
  { key: 'PAID', label: '待发货' },
  { key: 'SHIPPED', label: '待收货' },
  { key: 'FINISHED', label: '已完成' }
]

const tabIndex = ref(0)
const currentTab = computed(() => tabs[tabIndex.value].key)

/** 列表数据（tab 切换时重置） */
const orderList = ref([])
const page = ref(0)
const hasMore = ref(true)
const loading = ref(false)

const emptyText = computed(() => {
  const map = {
    ALL: '还没有订单', UNPAID: '没有待付款订单', PAID: '没有待发货订单',
    SHIPPED: '没有待收货订单', FINISHED: '没有已完成订单'
  }
  return map[currentTab.value]
})

/** 订单商品总件数 */
function totalQty(order) {
  return order.items.reduce((n, i) => n + i.quantity, 0)
}

/**
 * 拉取订单列表（分页）
 * @param {boolean} reset - true 重置到第一页（tab 切换 / onShow 刷新）
 */
async function loadOrders(reset = false) {
  if (loading.value) return
  if (!reset && !hasMore.value) return

  loading.value = true
  try {
    const next = reset ? 1 : page.value + 1
    const data = await orderApi.list({ status: currentTab.value, page: next, pageSize: 10 })
    orderList.value = reset ? data.list : orderList.value.concat(data.list)
    page.value = next
    hasMore.value = data.hasMore
  } catch (e) {
    uni.showToast({ title: e.msg || '订单加载失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

// onShow 刷新：支付结果/详情页操作后回来状态可能已变
onShow(() => loadOrders(true))

/** tab 切换：重置列表 */
function onTabChange(index) {
  tabIndex.value = index
  loadOrders(true)
}

function onSwiperChange(e) {
  tabIndex.value = e.detail.current
  loadOrders(true)
}

function onLoadMore() {
  loadOrders(false)
}

/** 去支付（待付款单回到支付结果页继续支付） */
function goPay(order) {
  uni.navigateTo({ url: `/pages/mall/pay/result?orderNo=${order.orderNo}&from=order` })
}

/** 取消订单（二次确认；取消即释放锁定库存，PRD §7.2 规则 2） */
function onCancel(order) {
  uni.showModal({
    title: '提示',
    content: '确定取消该订单吗？',
    success: async (res) => {
      if (!res.confirm) return
      try {
        await orderApi.cancel({ orderNo: order.orderNo })
        uni.showToast({ title: '已取消', icon: 'success' })
        loadOrders(true)
      } catch (e) {
        uni.showToast({ title: e.msg || '取消失败', icon: 'none' })
      }
    }
  })
}

/** 确认收货（SHIPPED -> FINISHED 终态，PRD §6.2） */
function onConfirm(order) {
  uni.showModal({
    title: '提示',
    content: '确认已收到货吗？确认后订单完成。',
    success: async (res) => {
      if (!res.confirm) return
      try {
        await orderApi.confirm({ orderNo: order.orderNo })
        uni.showToast({ title: '已确认收货', icon: 'success' })
        loadOrders(true)
      } catch (e) {
        uni.showToast({ title: e.msg || '操作失败', icon: 'none' })
      }
    }
  })
}

function goDetail(order) {
  uni.navigateTo({ url: `/pages/mall/order/detail?orderNo=${order.orderNo}` })
}
</script>

<style scoped>
.order-list-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f5f6f8;
}

.tabs {
  display: flex;
  background-color: #ffffff;
}

.tab-item {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24rpx 0;
  font-size: 28rpx;
  color: #666666;
  position: relative;
}

.tab-item.active {
  color: #e24b4a;
  font-weight: 500;
}

.tab-item.active::after {
  content: '';
  position: absolute;
  left: 50%;
  bottom: 8rpx;
  width: 48rpx;
  height: 6rpx;
  background-color: #e24b4a;
  border-radius: 3rpx;
  transform: translateX(-50%);
}

.tab-swiper {
  flex: 1;
}

.tab-scroll {
  height: 100%;
}

.empty {
  display: flex;
  justify-content: center;
  padding-top: 240rpx;
}

.empty-text {
  font-size: 28rpx;
  color: #999999;
}

.order-card {
  background-color: #ffffff;
  border-radius: 16rpx;
  margin: 20rpx 24rpx 0;
  padding: 24rpx;
}

.order-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20rpx;
}

.order-no {
  font-size: 24rpx;
  color: #999999;
}

.order-status {
  font-size: 26rpx;
  color: #e24b4a;
}

.order-goods {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.cover {
  width: 120rpx;
  height: 120rpx;
  border-radius: 12rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.cover-img {
  width: 100%;
  height: 100%;
  border-radius: 12rpx;
}

.cover-fallback {
  font-size: 44rpx;
  color: rgba(255, 255, 255, 0.85);
}

.order-goods-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10rpx;
  overflow: hidden;
}

.order-goods-title {
  font-size: 28rpx;
  color: #222222;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.order-goods-qty {
  font-size: 24rpx;
  color: #999999;
}

.order-pay {
  font-size: 28rpx;
  color: #222222;
  font-weight: 500;
}

.order-actions {
  display: flex;
  justify-content: flex-end;
  gap: 16rpx;
  margin-top: 24rpx;
  padding-top: 20rpx;
  border-top: 1rpx solid #f5f6f8;
}

.action-btn {
  padding: 12rpx 32rpx;
  border-radius: 32rpx;
  font-size: 24rpx;
}

.action-btn.plain {
  border: 1rpx solid #dddddd;
  color: #666666;
}

.action-btn.primary {
  background-color: #e24b4a;
  color: #ffffff;
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
