<!--
  支付结果页（pages/mall/pay/result?orderNo={orderNo}&from=create）
  交互规格：docs/交互规格说明书-商城M1-M2.md §P4
  页面内三态：
    pending   待支付（from=create 初始）→「模拟支付」/「取消」
    success   支付成功（订单 PAID/SHIPPED/FINISHED）→「查看订单」
    error     支付异常（订单取消/超时竞态）→ 固定提示「金额将自动原路退回」
  真实环境替换点：onMockPay 中的 mockPay 调用换 uni.requestPayment（PRD §7.3：
  支付结果以服务端回调为唯一依据，此处仅 mock 阶段模拟回调行为）
-->
<template>
  <view class="result-page" v-if="order">
    <!-- 待支付态 -->
    <template v-if="viewState === 'pending'">
      <view class="state-icon pending-icon">💰</view>
      <text class="state-title">订单已提交</text>
      <text class="state-amount">应付 ¥{{ fen2yuan(order.payAmount) }}</text>
      <text class="state-tip">请在 {{ expireText }} 前完成支付，超时订单将自动关闭</text>
      <view class="btn-primary" @click="onMockPay">
        <text>{{ paying ? '支付中...' : '模拟支付' }}</text>
      </view>
      <view class="btn-plain" @click="goOrderList"><text>取消，稍后支付</text></view>
    </template>

    <!-- 支付成功态 -->
    <template v-else-if="viewState === 'success'">
      <view class="state-icon success-icon">✅</view>
      <text class="state-title">支付成功</text>
      <text class="state-amount">¥{{ fen2yuan(order.payAmount) }}</text>
      <text class="state-tip">商家将尽快为您发货</text>
      <view class="btn-primary" @click="goOrderDetail"><text>查看订单</text></view>
      <view class="btn-plain" @click="goOrderList"><text>返回订单列表</text></view>
    </template>

    <!-- 支付异常态（含超时竞态固定文案，PRD §7.3 规则 3） -->
    <template v-else>
      <view class="state-icon error-icon">⚠️</view>
      <text class="state-title">无法完成支付</text>
      <text class="state-tip error-tip">{{ errorTip }}</text>
      <view class="btn-primary" @click="goOrderList"><text>返回订单列表</text></view>
    </template>
  </view>
</template>

<script setup>
/** 支付结果页逻辑（Vue3 setup） */
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { orderApi } from '../api/index.js'
import { fen2yuan, formatTime } from '../utils/format.js'

/** 订单数据（以服务端状态为准渲染页面形态） */
const order = ref(null)
/** 页面三态：pending / success / error */
const viewState = ref('pending')
/** 异常态文案（超时竞态走固定文案） */
const errorTip = ref('')
/** 支付中防重标记 */
const paying = ref(false)
let orderNo = ''

/** 截止时间文案（待支付态展示） */
const expireText = computed(() =>
  order.value && order.value.payExpireAt ? formatTime(order.value.payExpireAt) : '15 分钟内'
)

/**
 * 页面加载：以服务端订单状态初始化页面形态
 * 状态映射（PRD §6.2 状态机）：UNPAID→待支付；PAID/SHIPPED/FINISHED→成功；CANCELED→异常
 */
onLoad(async (options) => {
  orderNo = options.orderNo || ''
  await loadOrder()
})

/** 拉取订单并刷新页面状态 */
async function loadOrder() {
  try {
    order.value = await orderApi.detail({ orderNo })
    const s = order.value.status
    if (s === 'UNPAID') viewState.value = 'pending'
    else if (s === 'CANCELED') {
      viewState.value = 'error'
      errorTip.value = '订单已关闭'
    } else viewState.value = 'success'
  } catch (e) {
    viewState.value = 'error'
    errorTip.value = e.msg || '订单加载失败'
  }
}

/**
 * 【mock 专用】模拟支付回调 → 真实环境替换为 uni.requestPayment
 * 竞态场景（PRD §7.3 规则 3）：订单超时后支付，服务端返回 40006，
 * 前端固定展示「金额将自动原路退回」——真实环境该退款由服务端自动发起
 */
async function onMockPay() {
  if (paying.value) return
  paying.value = true
  try {
    await orderApi.mockPay({ orderNo })
    await loadOrder()
  } catch (e) {
    if (e.code === 40006) {
      viewState.value = 'error'
      errorTip.value = '订单已超时关闭，支付金额将自动原路退回'
    } else {
      uni.showToast({ title: e.msg || '支付失败', icon: 'none' })
      await loadOrder()
    }
  } finally {
    paying.value = false
  }
}

function goOrderDetail() {
  uni.redirectTo({ url: `/pages/mall/order/detail?orderNo=${orderNo}` })
}

function goOrderList() {
  uni.redirectTo({ url: '/pages/mall/order/list' })
}
</script>

<style scoped>
.result-page {
  min-height: 100vh;
  background-color: #f5f6f8;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 120rpx 48rpx 0;
}

.state-icon {
  font-size: 120rpx;
  margin-bottom: 32rpx;
}

.state-title {
  font-size: 40rpx;
  font-weight: 500;
  color: #222222;
  margin-bottom: 20rpx;
}

.state-amount {
  font-size: 52rpx;
  color: #e24b4a;
  font-weight: 500;
  margin-bottom: 16rpx;
}

.state-tip {
  font-size: 26rpx;
  color: #999999;
  margin-bottom: 64rpx;
  text-align: center;
  line-height: 1.6;
}

.error-tip {
  color: #e24b4a;
}

.btn-primary {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 26rpx 0;
  background-color: #e24b4a;
  border-radius: 48rpx;
  color: #ffffff;
  font-size: 30rpx;
  margin-bottom: 24rpx;
}

.btn-plain {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 26rpx 0;
  border: 1rpx solid #dddddd;
  border-radius: 48rpx;
  color: #666666;
  font-size: 30rpx;
}
</style>
