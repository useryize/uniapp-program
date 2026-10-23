<!--
  订单详情页（pages/mall/order/detail?orderNo={orderNo})
  交互规格：docs/交互规格说明书-商城M1-M2.md §P6
  区块：状态时间轴 / 地址快照（手机号脱敏）/ 商品快照 / 金额明细 / 订单号可复制
  快照原则（PRD §7.1 规则 3）：全部展示 *_Snapshot 字段，商品改价不影响历史订单
-->
<template>
  <view class="order-detail-page" v-if="order">
    <!-- 状态 + 时间轴（仅展示已发生的节点） -->
    <view class="status-block">
      <text class="status-text">{{ orderStatusText(order.status) }}</text>
      <text class="status-sub">{{ statusTip }}</text>

      <view class="timeline">
        <view v-for="node in timeline" :key="node.label" class="timeline-item">
          <view class="timeline-dot" :class="{ done: node.time }" />
          <text class="timeline-label">{{ node.label }}</text>
          <text class="timeline-time">{{ node.time || '—' }}</text>
        </view>
      </view>

      <!-- 物流信息（mock 发货后有模拟单号；真实环境对接物流轨迹 API，PRD §10） -->
      <view v-if="order.logistics" class="logistics">
        <image class="logistics-img" src="/static/mall/icons/truck.png" mode="aspectFit" />
        <text class="logistics-text">{{ order.logistics.company }}：{{ order.logistics.no }}</text>
      </view>
    </view>

    <!-- 地址快照：手机号脱敏（PRD §7.5 规则 1） -->
    <view class="card address-card">
      <view class="address-line1">
        <text class="address-receiver">{{ order.addressSnapshot.receiver }}</text>
        <text class="address-phone">{{ maskedPhone(order.addressSnapshot.phone) }}</text>
      </view>
      <text class="address-detail">{{ order.addressSnapshot.region }} {{ order.addressSnapshot.detail }}</text>
    </view>

    <!-- 商品快照列表 -->
    <view class="card">
      <view v-for="item in order.items" :key="item.skuId" class="goods-item">
        <view class="cover" :style="{ backgroundColor: item.colorSnapshot }">
          <image v-if="item.coverSnapshot" class="cover-img" :src="item.coverSnapshot" mode="aspectFill" />
          <text v-else class="cover-fallback">{{ item.titleSnapshot.slice(0, 1) }}</text>
        </view>
        <view class="goods-info">
          <text class="goods-title">{{ item.titleSnapshot }}</text>
          <text class="goods-spec">{{ item.specSnapshot }}</text>
          <view class="goods-bottom">
            <text class="goods-price">¥{{ fen2yuan(item.price) }}</text>
            <text class="goods-qty">×{{ item.quantity }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 金额明细：实付 = 商品小计 + 运费 - 优惠（V1 优惠恒 0，结构预留 PRD §9） -->
    <view class="card amount-card">
      <view class="amount-row">
        <text class="amount-label">商品合计</text>
        <text class="amount-value">¥{{ fen2yuan(order.totalAmount) }}</text>
      </view>
      <view class="amount-row">
        <text class="amount-label">运费</text>
        <text class="amount-value">{{ order.freight ? '¥' + fen2yuan(order.freight) : '包邮' }}</text>
      </view>
      <view class="amount-row">
        <text class="amount-label">优惠</text>
        <text class="amount-value">-¥{{ fen2yuan(order.discountAmount) }}</text>
      </view>
      <view class="amount-row pay-row">
        <text class="pay-label">实付款</text>
        <text class="pay-amount">¥{{ fen2yuan(order.payAmount) }}</text>
      </view>
    </view>

    <!-- 订单信息 -->
    <view class="card">
      <view class="info-row">
        <text class="info-label">订单编号</text>
        <view class="info-value-wrap" @click="copyOrderNo">
          <text class="info-value">{{ order.orderNo }}</text>
          <text class="copy-btn">复制</text>
        </view>
      </view>
      <view v-if="order.remark" class="info-row">
        <text class="info-label">订单备注</text>
        <text class="info-value">{{ order.remark }}</text>
      </view>
    </view>

    <!-- 操作按钮：按状态机渲染 -->
    <view class="footer-bar" v-if="order.status === 'UNPAID' || order.status === 'SHIPPED'">
      <template v-if="order.status === 'UNPAID'">
        <view class="action-btn plain" @click="onCancel">
          <text class="action-btn-text">取消订单</text>
        </view>
        <view class="action-btn primary" @click="goPay">
          <text class="action-btn-text">去支付</text>
        </view>
      </template>
      <template v-else>
        <view class="action-btn plain" @click="onApplyRefund">
          <text class="action-btn-text">申请退款</text>
        </view>
        <view class="action-btn primary" @click="onConfirm">
          <text class="action-btn-text">确认收货</text>
        </view>
      </template>
    </view>
  </view>
</template>

<script setup>
/** 订单详情页逻辑（Vue3 setup） */
import { ref, computed } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { orderApi } from '../api/index.js'
import { fen2yuan, maskedPhone, formatTime, orderStatusText } from '../utils/format.js'

const order = ref(null)
let orderNo = ''

/** 时间轴节点：仅已发生的时间有值（服务端字段） */
const timeline = computed(() => order.value ? [
  { label: '订单创建', time: formatTime(order.value.createTime) },
  { label: '支付成功', time: formatTime(order.value.payTime) },
  { label: '商家发货', time: formatTime(order.value.shipTime) },
  { label: '交易完成', time: formatTime(order.value.finishTime) }
] : [])

/** 状态区副标题（按状态机给不同提示） */
const statusTip = computed(() => {
  if (!order.value) return ''
  const map = {
    UNPAID: '请在 15 分钟内完成支付，超时订单将自动关闭',
    PAID: '商家正在备货，预计 48 小时内发出',
    SHIPPED: '包裹已在路上，注意查收',
    FINISHED: '交易已完成，感谢你的支持',
    CANCELED: '订单已关闭'
  }
  return map[order.value.status] || ''
})

async function loadOrder() {
  try {
    order.value = await orderApi.detail({ orderNo })
  } catch (e) {
    uni.showToast({ title: e.msg || '订单加载失败', icon: 'none' })
  }
}

onLoad((options) => { orderNo = options.orderNo || '' })
onShow(loadOrder)

/** 复制订单号 */
function copyOrderNo() {
  uni.setClipboardData({
    data: order.value.orderNo,
    success: () => uni.showToast({ title: '已复制', icon: 'success' })
  })
}

/** 取消订单（二次确认） */
function onCancel() {
  uni.showModal({
    title: '提示',
    content: '确定取消该订单吗？',
    success: async (res) => {
      if (!res.confirm) return
      try {
        await orderApi.cancel({ orderNo })
        uni.showToast({ title: '已取消', icon: 'success' })
        loadOrder()
      } catch (e) {
        uni.showToast({ title: e.msg || '取消失败', icon: 'none' })
      }
    }
  })
}

/** 去支付 */
function goPay() {
  uni.navigateTo({ url: `/pages/mall/pay/result?orderNo=${orderNo}&from=order` })
}

/** 申请退款（售后域 M4 交付，先占位提示） */
function onApplyRefund() {
  uni.showToast({ title: '退款/售后入口待交付', icon: 'none' })
}

/** 确认收货 */
function onConfirm() {
  uni.showModal({
    title: '提示',
    content: '确认已收到货吗？确认后订单完成。',
    success: async (res) => {
      if (!res.confirm) return
      try {
        await orderApi.confirm({ orderNo })
        uni.showToast({ title: '已确认收货', icon: 'success' })
        loadOrder()
      } catch (e) {
        uni.showToast({ title: e.msg || '操作失败', icon: 'none' })
      }
    }
  })
}
</script>

<style scoped>
.order-detail-page {
  min-height: 100vh;
  background-color: $rz-grey-50;
  padding-bottom: 160rpx;
}

/* ---- 状态区 ---- */
.status-block {
  background-color: $rz-ink;
  padding: 32rpx $rz-page-pad 28rpx;
}

.status-text {
  display: block;
  font-size: 44rpx;
  font-weight: 900;
  color: $rz-white;
}

.status-sub {
  display: block;
  margin-top: 10rpx;
  font-size: 24rpx;
  color: $rz-acid;
}

.timeline {
  margin-top: 32rpx;
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.timeline-item {
  display: flex;
  align-items: center;
  gap: 14rpx;
}

.timeline-dot {
  width: 16rpx;
  height: 16rpx;
  border-radius: 8rpx;
  background-color: $rz-grey-500;
  flex-shrink: 0;
}

.timeline-dot.done {
  background-color: $rz-acid;
}

.timeline-label {
  flex: 1;
  font-size: 24rpx;
  color: $rz-grey-500;
}

.timeline-time {
  font-size: 22rpx;
  color: $rz-grey-500;
}

.logistics {
  display: flex;
  align-items: center;
  gap: 10rpx;
  margin-top: 24rpx;
  padding: 16rpx 20rpx;
  background-color: rgba(255, 255, 255, 0.08);
}

.logistics-img {
  width: 28rpx;
  height: 28rpx;
  opacity: 0.8;
}

.logistics-text {
  font-size: 22rpx;
  color: $rz-white;
}

/* ---- 卡片 ---- */
.card {
  background-color: $rz-white;
  border: 4rpx solid $rz-ink;
  margin: 20rpx 24rpx 0;
  padding: 24rpx;
}

.address-card {
  display: flex;
  flex-direction: column;
  gap: 10rpx;
}

.address-line1 {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.address-receiver {
  font-size: 30rpx;
  font-weight: 700;
  color: $rz-ink;
}

.address-phone {
  font-size: 24rpx;
  color: $rz-grey-500;
}

.address-detail {
  font-size: 24rpx;
  color: $rz-grey-500;
  line-height: 1.5;
}

/* ---- 商品快照 ---- */
.goods-item {
  display: flex;
  align-items: center;
  gap: 20rpx;
  padding: 16rpx 0;
}

.goods-item + .goods-item {
  border-top: 2rpx solid $rz-line;
}

.cover {
  width: 120rpx;
  height: 120rpx;
  overflow: hidden;
  flex-shrink: 0;
}

.cover-img {
  width: 100%;
  height: 100%;
}

.cover-fallback {
  font-size: 48rpx;
  color: rgba(255, 255, 255, 0.85);
}

.goods-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  min-width: 0;
}

.goods-title {
  font-size: 26rpx;
  font-weight: 700;
  color: $rz-ink;
  line-height: 1.4;
}

.goods-spec {
  font-size: 22rpx;
  color: $rz-grey-500;
}

.goods-bottom {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
}

.goods-price {
  font-size: 28rpx;
  font-weight: 700;
  color: $rz-ink;
}

.goods-qty {
  font-size: 22rpx;
  color: $rz-grey-500;
}

/* ---- 金额明细 ---- */
.amount-card {
  display: flex;
  flex-direction: column;
  gap: 18rpx;
}

.amount-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.amount-label {
  font-size: 24rpx;
  color: $rz-ink;
}

.amount-value {
  font-size: 24rpx;
  color: $rz-ink;
}

.pay-row {
  padding-top: 16rpx;
  border-top: 2rpx solid $rz-line;
}

.pay-label {
  font-size: 26rpx;
  font-weight: 700;
  color: $rz-ink;
}

.pay-amount {
  font-size: 40rpx;
  font-weight: 900;
  color: $rz-price;
}

/* ---- 订单信息 ---- */
.info-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 68rpx;
}

.info-label {
  font-size: 24rpx;
  color: $rz-ink;
}

.info-value-wrap {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.info-value {
  font-size: 24rpx;
  color: $rz-grey-500;
}

.copy-btn {
  padding: 4rpx 12rpx;
  font-size: 20rpx;
  color: $rz-ink;
  border: 2rpx solid $rz-ink;
}

/* ---- 底部操作栏 ---- */
.footer-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  height: 128rpx;
  display: flex;
  align-items: center;
  gap: 20rpx;
  padding: 0 24rpx;
  background-color: $rz-white;
  border-top: 4rpx solid $rz-ink;
  z-index: 10;
}

.action-btn {
  flex: 1;
  height: 88rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 4rpx solid $rz-ink;
}

.action-btn.plain {
  background-color: $rz-white;
}

.action-btn.primary {
  background-color: $rz-acid;
}

.action-btn-text {
  font-size: 30rpx;
  font-weight: 900;
  color: $rz-ink;
}
</style>
