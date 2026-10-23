<!--
  订单确认/结算页（pages/mall/confirm/index）
  交互规格：docs/交互规格说明书-商城M1-M2.md §P3
  双入口：
    - 购物车去结算：?ids=c1001,c1002   → cartApi.list 按 ids 过滤
    - 详情页立即购买：?skuId=11&quantity=2 → goodsApi.detail({ skuId }) 反查
  金额规则（PRD §7.1）：页面只展示服务端返回的单价与数量派生小计，
  实付金额一律以 order.create 返回为准，页面无任何金额输入口
-->
<template>
  <view class="confirm" v-if="loaded">
    <!-- 地址卡：黑底反白 -->
    <view class="address-card" @click="onPickAddress">
      <view class="address-icon">
        <image class="address-icon-img" src="/static/mall/icons/location.png" mode="aspectFit" />
      </view>
      <view class="address-info">
        <view class="address-line1">
          <text class="address-receiver">{{ address ? address.receiver : '请选择收货地址' }}</text>
          <text v-if="address" class="address-phone">{{ maskedPhone(address.phone) }}</text>
          <view v-if="address && address.isDefault" class="address-tag">
            <text class="address-tag-text">默认</text>
          </view>
        </view>
        <text class="address-detail">{{ address ? address.region + ' ' + address.detail : '地址管理页待交付，默认地址已自动带入' }}</text>
      </view>
      <image class="address-arrow" src="/static/mall/icons/arrow_right.png" mode="aspectFit" />
    </view>

    <!-- 商品清单 -->
    <view class="goods-block">
      <view v-for="item in items" :key="item.skuId" class="goods-item">
        <view class="cover" :style="{ backgroundColor: item.color }">
          <image v-if="item.cover" class="cover-img" :src="item.cover" mode="aspectFill" />
          <text v-else class="cover-fallback">{{ item.title.slice(0, 1) }}</text>
        </view>
        <view class="goods-info">
          <text class="goods-title">{{ item.title }}</text>
          <text class="goods-spec">{{ item.spec }}</text>
          <view class="goods-bottom">
            <text class="goods-price">¥{{ fen2yuan(item.price) }}</text>
            <text class="goods-qty">×{{ item.quantity }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 配送方式 -->
    <view class="row-block">
      <text class="row-label">配送方式</text>
      <text class="row-value">快递配送  ·  预计 2-4 天送达</text>
    </view>

    <!-- 订单备注 -->
    <view class="row-block">
      <text class="row-label">订单备注</text>
      <input
        class="remark-input"
        v-model="remark"
        placeholder="选填，可备注尺码或颜色偏好"
        placeholder-class="remark-ph"
        maxlength="50"
      />
    </view>

    <!-- 金额明细：运费仅展示规则文案，实付以提交后服务端返回为准 -->
    <view class="amount-block">
      <view class="amount-row">
        <text class="amount-label">商品合计</text>
        <text class="amount-value">¥{{ fen2yuan(goodsTotal) }}</text>
      </view>
      <view class="amount-row">
        <text class="amount-label">运费</text>
        <text class="amount-value">{{ freightTip }}</text>
      </view>
      <view class="amount-row">
        <text class="amount-label">优惠券</text>
        <text class="amount-value">¥0</text>
      </view>
      <view class="amount-row amount-total">
        <text class="amount-total-label">应付金额</text>
        <text class="amount-total-value">¥{{ fen2yuan(goodsTotal) }}</text>
      </view>
    </view>

    <!-- 底部提交栏 -->
    <view class="footer-bar">
      <view class="footer-total">
        <text class="footer-total-label">应付金额</text>
        <text class="footer-total-price">¥{{ fen2yuan(goodsTotal) }}</text>
      </view>
      <view class="footer-submit" :class="{ disabled: submitting }" @click="onSubmit">
        <text class="footer-submit-text">{{ submitting ? '提交中...' : '提交订单' }}</text>
      </view>
    </view>
  </view>
</template>

<script setup>
/** 结算页逻辑（Vue3 setup） */
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { cartApi, goodsApi, addressApi, orderApi } from '../api/index.js'
import { fen2yuan, maskedPhone } from '../utils/format.js'
import { MALL_CONFIG } from '../config.js'

/** 结算明细（展示用：skuId/quantity/title/spec/price/color/cover） */
const items = ref([])
/** 选中地址（默认地址，地址管理页后续交付） */
const address = ref(null)
/** 订单备注 */
const remark = ref('')
/** 提交防重（PRD §7.4 幂等的前端配合项） */
const submitting = ref(false)
/** 页面数据就绪标记 */
const loaded = ref(false)
/** 结算来源：cart=购物车 ids / buy=直购 */
let source = { type: '', ids: [], skuId: 0, quantity: 1 }

/** 商品合计（服务端单价 × 数量派生，仅展示） */
const goodsTotal = computed(() =>
  items.value.reduce((n, i) => n + i.price * i.quantity, 0)
)

/** 运费规则文案（规则值来自模块配置，实付以服务端计算为准） */
const freightTip = computed(() => {
  const threshold = (MALL_CONFIG.FREE_SHIPPING_THRESHOLD / 100).toFixed(0)
  const freight = (MALL_CONFIG.FREIGHT / 100).toFixed(0)
  return `满 ¥${threshold} 包邮，否则 ¥${freight}`
})

/**
 * 页面加载：解析入口参数并装配数据
 */
onLoad(async (options) => {
  try {
    if (options.ids) {
      // 入口 A：购物车去结算
      source = { type: 'cart', ids: options.ids.split(','), skuId: 0, quantity: 1 }
      const data = await cartApi.list()
      items.value = data.list
        .filter((i) => source.ids.includes(i.id))
        .map(({ skuId, goodsId, quantity, title, spec, price, color, cover }) =>
          ({ skuId, goodsId, quantity, title, spec, price, color, cover }))
    } else if (options.skuId) {
      // 入口 B：详情页立即购买（SKU 反查商品，仅展示；提交仍传 skuId+quantity）
      source = { type: 'buy', ids: [], skuId: Number(options.skuId), quantity: Number(options.quantity || 1) }
      const goods = await goodsApi.detail({ skuId: source.skuId })
      const sku = goods.skuList.find((s) => s.id === source.skuId)
      items.value = [{
        skuId: sku.id, goodsId: goods.id, quantity: source.quantity,
        title: goods.title, spec: sku.spec, price: sku.price, color: goods.color, cover: goods.cover
      }]
    }

    if (!items.value.length) throw { msg: '没有可结算的商品' }

    // 默认地址（无默认取第一条）
    const addresses = await addressApi.list()
    address.value = addresses.find((a) => a.isDefault) || addresses[0] || null

    loaded.value = true
  } catch (e) {
    uni.showToast({ title: e.msg || '页面加载失败', icon: 'none' })
    setTimeout(() => uni.navigateBack(), 1500)
  }
})

/** 地址占位点击（地址管理页后续交付） */
function onPickAddress() {
  uni.showToast({ title: '地址管理页待交付，默认地址已自动带入', icon: 'none' })
}

/**
 * 提交订单（PRD §④）
 * - items 只传 skuId + quantity，任何金额字段不传（§7.1 规则 1）
 * - 成功跳支付结果页；失败 toast 服务端文案并停留
 */
async function onSubmit() {
  if (submitting.value) return
  if (!address.value) {
    uni.showToast({ title: '请先选择收货地址', icon: 'none' })
    return
  }

  submitting.value = true
  try {
    const result = await orderApi.create({
      items: items.value.map(({ skuId, quantity }) => ({ skuId, quantity })),
      addressId: address.value.id,
      remark: remark.value
    })
    // redirectTo：结算页完成使命，回退不应再回到本页
    uni.redirectTo({
      url: `/pages/mall/pay/result?orderNo=${result.orderNo}&from=create`
    })
  } catch (e) {
    uni.showToast({ title: e.msg || '提交失败', icon: 'none' })
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.confirm {
  min-height: 100vh;
  background-color: $rz-grey-50;
  padding: 0 0 180rpx;
  display: flex;
  flex-direction: column;
  gap: 0;
}

/* ---- 地址卡 ---- */
.address-card {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 28rpx 24rpx;
  background-color: $rz-ink;
}

.address-icon {
  width: 44rpx;
  height: 44rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.address-icon-img {
  width: 30rpx;
  height: 30rpx;
}

.address-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  min-width: 0;
}

.address-line1 {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.address-receiver {
  font-size: 30rpx;
  font-weight: 700;
  color: $rz-white;
}

.address-phone {
  font-size: 24rpx;
  color: $rz-grey-500;
}

.address-tag {
  padding: 2rpx 10rpx;
  background-color: $rz-acid;
}

.address-tag-text {
  font-size: 18rpx;
  font-weight: 700;
  color: $rz-ink;
}

.address-detail {
  font-size: 24rpx;
  color: $rz-white;
  line-height: 1.5;
}

.address-arrow {
  width: 24rpx;
  height: 24rpx;
  opacity: 0.6;
  flex-shrink: 0;
}

/* ---- 商品清单：通栏无边框 ---- */
.goods-block {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
  padding: 24rpx $rz-page-pad;
  background-color: $rz-white;
  margin: 20rpx 0 0;
}

.goods-item {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.cover {
  width: 128rpx;
  height: 128rpx;
  overflow: hidden;
  flex-shrink: 0;
}

.cover-img {
  width: 100%;
  height: 100%;
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
  min-width: 0;
}

.goods-title {
  font-size: 28rpx;
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
  font-size: 32rpx;
  font-weight: 900;
  color: $rz-price;
}

.goods-qty {
  font-size: 24rpx;
  color: $rz-grey-500;
}

/* ---- 通用行：通栏无边框 ---- */
.row-block {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 26rpx $rz-page-pad;
  background-color: $rz-white;
  margin-top: 20rpx;
}

.row-label {
  font-size: 26rpx;
  color: $rz-ink;
  flex-shrink: 0;
}

.row-value {
  flex: 1;
  text-align: right;
  font-size: 26rpx;
  font-weight: 500;
  color: $rz-ink;
}

.remark-input {
  flex: 1;
  text-align: right;
  font-size: 26rpx;
  color: $rz-ink;
  height: 40rpx;
}

.remark-ph {
  color: $rz-grey-300;
  font-size: 24rpx;
}

/* ---- 金额明细：通栏无边框 ---- */
.amount-block {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
  padding: 26rpx $rz-page-pad;
  background-color: $rz-white;
  margin-top: 20rpx;
}

.amount-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.amount-label {
  font-size: 26rpx;
  color: $rz-ink;
}

.amount-value {
  font-size: 26rpx;
  color: $rz-ink;
}

.amount-total {
  padding-top: 16rpx;
  border-top: 2rpx solid $rz-line;
}

.amount-total-label {
  font-size: 28rpx;
  font-weight: 700;
  color: $rz-ink;
}

.amount-total-value {
  font-size: 40rpx;
  font-weight: 900;
  color: $rz-price;
}

/* ---- 底部提交栏 ---- */
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

.footer-total {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2rpx;
}

.footer-total-label {
  font-size: 20rpx;
  color: $rz-grey-500;
}

.footer-total-price {
  font-size: 40rpx;
  font-weight: 900;
  color: $rz-price;
}

.footer-submit {
  width: 240rpx;
  height: 88rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: $rz-acid;
  border: 4rpx solid $rz-ink;
}

.footer-submit.disabled {
  opacity: 0.5;
}

.footer-submit-text {
  font-size: 30rpx;
  font-weight: 900;
  color: $rz-ink;
}
</style>
