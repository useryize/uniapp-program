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
  <view class="result" :class="viewState" v-if="order">
    <!-- 待支付态 -->
    <template v-if="viewState === 'pending'">
      <view class="state-icon pending-icon">
        <image class="state-icon-img" src="/static/mall/icons/clock.png" mode="aspectFit" />
      </view>
      <text class="state-title">订单已提交</text>
      <text class="state-amount">应付 ¥{{ fen2yuan(order.payAmount) }}</text>
      <text class="state-tip">请在 {{ expireText }} 前完成支付，超时订单将自动关闭</text>
      <view class="info-card">
        <view class="info-row">
          <text class="info-label">订单号</text>
          <text class="info-value">{{ order.orderNo }}</text>
        </view>
        <view class="info-row">
          <text class="info-label">支付方式</text>
          <text class="info-value">微信支付</text>
        </view>
      </view>
      <view class="btn btn-primary" @click="onMockPay">
        <text class="btn-text">{{ paying ? '支付中...' : '模拟支付' }}</text>
      </view>
      <view class="btn btn-ghost" @click="goOrderList">
        <text class="btn-text">取消，稍后支付</text>
      </view>
    </template>

    <!-- 支付成功态 -->
    <template v-else-if="viewState === 'success'">
      <view class="state-icon success-icon">
        <image class="state-icon-img" src="/static/mall/icons/check.png" mode="aspectFit" />
      </view>
      <text class="state-title">支付成功</text>
      <text class="state-amount">¥{{ fen2yuan(order.payAmount) }}</text>
      <text class="state-tip">订单号 {{ order.orderNo }}</text>
      <view class="info-card">
        <view class="info-row">
          <text class="info-label">支付方式</text>
          <text class="info-value">微信支付</text>
        </view>
        <view class="info-row">
          <text class="info-label">支付时间</text>
          <text class="info-value">{{ payTimeText }}</text>
        </view>
      </view>
      <view class="btn btn-primary" @click="goOrderDetail">
        <text class="btn-text">查看订单</text>
      </view>
      <view class="btn btn-ghost" @click="goHome">
        <text class="btn-text">继续逛逛</text>
      </view>
    </template>

    <!-- 支付异常态（含超时竞态固定文案，PRD §7.3 规则 3） -->
    <template v-else>
      <view class="state-icon error-icon">
        <view class="error-mark"><text class="error-mark-text">!</text></view>
      </view>
      <text class="state-title">订单已超时关闭</text>
      <text class="state-tip error-tip">{{ errorTip }}</text>
      <view class="btn btn-primary" @click="goHome">
        <text class="btn-text">重新下单</text>
      </view>
      <view class="btn btn-ghost" @click="goOrderList">
        <text class="btn-text">查看订单</text>
      </view>
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

/** 支付时间文案 */
const payTimeText = computed(() => (order.value && order.value.payTime ? formatTime(order.value.payTime) : '—'))

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
      errorTip.value = '支付金额将自动原路退回\n如已完成扣款，1-3 个工作日到账'
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

function goHome() {
  uni.switchTab({ url: '/pages/mall/index' })
}
</script>

<style lang="scss" scoped>
@import "../../../uni.scss";
.result {
  min-height: 100vh;
  background-color: $rz-white;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 140rpx 48rpx 60rpx;
  box-sizing: border-box;
}

.result.success {
  padding-top: 480rpx;
}

.result.error {
  padding-top: 560rpx;
}

.result.success .state-icon,
.result.error .state-icon {
  position: fixed;
  bottom: 0;
  left: 0;
  margin: 0;
}

.result.error .state-tip {
  white-space: pre-line;
  margin-bottom: 32rpx;
}

.result.success .info-card {
  margin-top: 0;
}

.state-icon {
  width: 176rpx;
  height: 176rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 40rpx;
}

.success-icon {
  background-color: $rz-acid;
}

.pending-icon {
  background-color: $rz-grey-100;
}

.error-icon {
  background-color: $rz-danger-bg;
}

.state-icon-img {
  width: 88rpx;
  height: 88rpx;
}

.error-mark {
  width: 88rpx;
  height: 88rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 8rpx solid $rz-price;
  border-radius: 44rpx;
}

.error-mark-text {
  font-size: 56rpx;
  font-weight: 900;
  color: $rz-price;
  line-height: 1;
}

.state-title {
  font-size: 48rpx;
  font-weight: 900;
  color: $rz-ink;
  text-align: center;
}

.state-amount {
  margin-top: 20rpx;
  font-size: 76rpx;
  font-weight: 900;
  color: $rz-price;
}

.state-tip {
  margin-top: 16rpx;
  font-size: 26rpx;
  color: $rz-grey-500;
  text-align: center;
  line-height: 1.6;
}

.error-tip {
  color: $rz-danger;
}

/* ---- 订单信息卡 ---- */
.info-card {
  width: 100%;
  margin: 48rpx 0 40rpx;
  padding: 8rpx 28rpx;
  background-color: $rz-grey-50;
  border: 2rpx solid $rz-line;
}

.info-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 76rpx;
}

.info-label {
  font-size: 24rpx;
  color: $rz-grey-500;
}

.info-value {
  font-size: 24rpx;
  color: $rz-ink;
}

/* ---- 按钮 ---- */
.btn {
  width: 100%;
  height: 96rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20rpx;
  border: 4rpx solid $rz-ink;
}

.btn-primary {
  background-color: $rz-acid;
}

.btn-ghost {
  background-color: $rz-white;
}

.btn-text {
  font-size: 30rpx;
  font-weight: 900;
  color: $rz-ink;
}
</style>
