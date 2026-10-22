<!--
  订单详情页（pages/mall/order/detail?orderNo={orderNo}）
  交互规格：docs/交互规格说明书-商城M1-M2.md §P6
  区块：状态时间轴 / 地址快照（手机号脱敏）/ 商品快照 / 金额明细 / 订单号可复制
  快照原则（PRD §7.1 规则 3）：全部展示 *_Snapshot 字段，商品改价不影响历史订单
-->
<template>
  <view class="order-detail-page" v-if="order">
    <!-- 状态 + 时间轴（仅展示已发生的节点） -->
    <view class="status-block">
      <text class="status-text">{{ orderStatusText(order.status) }}</text>
      <view class="timeline">
        <view v-for="node in timeline" :key="node.label" class="timeline-item">
          <view class="timeline-dot" :class="{ done: node.time }"></view>
          <text class="timeline-label">{{ node.label }}</text>
          <text class="timeline-time">{{ node.time || '—' }}</text>
        </view>
      </view>
      <!-- 物流信息（mock 发货后有模拟单号；真实环境对接物流轨迹 API，PRD §10） -->
      <view v-if="order.logistics" class="logistics">
        <text class="logistics-text">{{ order.logistics.company }}：{{ order.logistics.no }}</text>
      </view>
    </view>

    <!-- 地址快照：手机号脱敏（PRD §7.5 规则 1） -->
    <view class="card address-card">
      <text class="address-receiver">{{ order.addressSnapshot.receiver }} {{ maskedPhone(order.addressSnapshot.phone) }}</text>
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
      <view class="amount-row"><text>商品金额</text><text>¥{{ fen2yuan(order.totalAmount) }}</text></view>
      <view class="amount-row"><text>运费</text><text>{{ order.freight ? '¥' + fen2yuan(order.freight) : '包邮' }}</text></view>
      <view class="amount-row"><text>优惠</text><text>-¥{{ fen2yuan(order.discountAmount) }}</text></view>
      <view class="amount-row pay-row"><text>实付款</text><text class="pay-amount">¥{{ fen2yuan(order.payAmount) }}</text></view>
    </view>

    <!-- 订单信息 -->
    <view class="card">
      <view class="info-row">
        <text>订单编号</text>
        <view class="info-value-wrap" @click="copyOrderNo">
          <text class="info-value">{{ order.orderNo }}</text>
          <text class="copy-btn">复制</text>
        </view>
      </view>
      <view v-if="order.remark" class="info-row"><text>订单备注</text><text class="info-value">{{ order.remark }}</text></view>
    </view>

    <!-- 操作按钮：按状态机渲染 -->
    <view class="footer-bar" v-if="order.status === 'UNPAID' || order.status === 'SHIPPED'">
      <template v-if="order.status === 'UNPAID'">
        <view class="action-btn plain" @click="onCancel"><text>取消订单</text></view>
        <view class="action-btn primary" @click="goPay"><text>去支付</text></view>
      </template>
      <template v-else>
        <view class="action-btn primary" @click="onConfirm"><text>确认收货</text></view>
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
  { label: '创建订单', time: formatTime(order.value.createTime) },
  { label: '支付成功', time: formatTime(order.value.payTime) },
  { label: '商家发货', time: formatTime(order.value.shipTime) },
  { label: '交易完成', time: formatTime(order.value.finishTime) }
] : [])

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

/** 确认收货（SHIPPED -> FINISHED 终态） */
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

function goPay() {
  uni.navigateTo({ url: `/pages/mall/pay/result?orderNo=${orderNo}&from=order` })
}
</script>

<style scoped>
.order-detail-page {
  min-height: 100vh;
  background-color: #f5f6f8;
  padding: 20rpx 24rpx 160rpx;
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.status-block {
  background: linear-gradient(135deg, #378add, #534ab7);
  border-radius: 16rpx;
  padding: 32rpx 24rpx;
}

.status-text {
  font-size: 36rpx;
  color: #ffffff;
  font-weight: 500;
}

.timeline {
  display: flex;
  justify-content: space-between;
  margin-top: 40rpx;
}

.timeline-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
  flex: 1;
}

.timeline-dot {
  width: 16rpx;
  height: 16rpx;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.35);
}

.timeline-dot.done {
  background-color: #ffffff;
}

.timeline-label {
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.85);
}

.timeline-time {
  font-size: 20rpx;
  color: rgba(255, 255, 255, 0.6);
}

.logistics {
  margin-top: 24rpx;
  padding-top: 20rpx;
  border-top: 1rpx solid rgba(255, 255, 255, 0.2);
}

.logistics-text {
  font-size: 24rpx;
  color: #ffffff;
}

.card {
  background-color: #ffffff;
  border-radius: 16rpx;
  padding: 8rpx 24rpx;
}

.address-card {
  padding: 28rpx 24rpx;
  display: flex;
  flex-direction: column;
  gap: 10rpx;
}

.address-receiver {
  font-size: 30rpx;
  color: #222222;
  font-weight: 500;
}

.address-detail {
  font-size: 26rpx;
  color: #666666;
  line-height: 1.5;
}

.goods-item {
  display: flex;
  gap: 20rpx;
  padding: 24rpx 0;
  border-bottom: 1rpx solid #f5f6f8;
}

.goods-item:last-child {
  border-bottom: none;
}

.cover {
  width: 140rpx;
  height: 140rpx;
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
  font-size: 52rpx;
  color: rgba(255, 255, 255, 0.85);
}

.goods-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  overflow: hidden;
}

.goods-title {
  font-size: 28rpx;
  color: #222222;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.goods-spec {
  font-size: 22rpx;
  color: #999999;
  background-color: #f5f6f8;
  align-self: flex-start;
  padding: 4rpx 12rpx;
  border-radius: 6rpx;
}

.goods-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 8rpx;
}

.goods-price {
  font-size: 28rpx;
  color: #222222;
}

.goods-qty {
  font-size: 24rpx;
  color: #999999;
}

.amount-card .amount-row,
.info-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 22rpx 0;
  font-size: 26rpx;
  color: #666666;
  border-bottom: 1rpx solid #f5f6f8;
}

.amount-card .amount-row:last-child,
.info-row:last-child {
  border-bottom: none;
}

.pay-row {
  border-top: 1rpx solid #f5f6f8;
}

.pay-amount {
  color: #e24b4a;
  font-size: 32rpx;
  font-weight: 500;
}

.info-value-wrap {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.info-value {
  font-size: 26rpx;
  color: #222222;
}

.copy-btn {
  font-size: 22rpx;
  color: #378add;
  border: 1rpx solid #378add;
  border-radius: 6rpx;
  padding: 4rpx 12rpx;
}

.footer-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  justify-content: flex-end;
  gap: 16rpx;
  background-color: #ffffff;
  padding: 16rpx 24rpx calc(16rpx + env(safe-area-inset-bottom));
}

.action-btn {
  padding: 18rpx 48rpx;
  border-radius: 40rpx;
  font-size: 26rpx;
}

.action-btn.plain {
  border: 1rpx solid #dddddd;
  color: #666666;
}

.action-btn.primary {
  background-color: #e24b4a;
  color: #ffffff;
}
</style>
