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
  <view class="confirm-page" v-if="loaded">
    <!-- 地址卡 -->
    <view class="address-card" @click="onPickAddress">
      <template v-if="address">
        <view class="address-info">
          <view class="address-line1">
            <text class="address-receiver">{{ address.receiver }}</text>
            <text class="address-phone">{{ maskedPhone(address.phone) }}</text>
          </view>
          <text class="address-detail">{{ address.region }} {{ address.detail }}</text>
        </view>
        <text class="address-arrow">›</text>
      </template>
      <template v-else>
        <text class="address-empty">+ 请选择收货地址</text>
        <text class="address-arrow">›</text>
      </template>
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

    <!-- 金额明细：运费仅展示规则文案，实付以提交后服务端返回为准 -->
    <view class="amount-block">
      <view class="amount-row">
        <text>商品金额</text>
        <text>¥{{ fen2yuan(goodsTotal) }}</text>
      </view>
      <view class="amount-row">
        <text>运费</text>
        <text class="amount-freight-tip">{{ freightTip }}</text>
      </view>
    </view>

    <!-- 订单备注 -->
    <view class="remark-block">
      <text class="remark-label">订单备注</text>
      <input
        class="remark-input"
        v-model="remark"
        placeholder="选填，给商家留言（50 字内）"
        maxlength="50"
      />
    </view>

    <!-- 底部提交栏 -->
    <view class="footer-bar">
      <view class="footer-note">
        <text class="footer-note-text">提交后生成订单，支付以微信支付为准</text>
      </view>
      <view class="footer-submit" :class="{ disabled: submitting }" @click="onSubmit">
        <text>{{ submitting ? '提交中...' : '提交订单' }}</text>
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
  return `满 ¥${threshold} 包邮，否则收 ¥${freight}`
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
.confirm-page {
  min-height: 100vh;
  background-color: #f5f6f8;
  padding: 20rpx 24rpx 160rpx;
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.address-card {
  display: flex;
  align-items: center;
  background-color: #ffffff;
  border-radius: 16rpx;
  padding: 28rpx 24rpx;
}

.address-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10rpx;
}

.address-line1 {
  display: flex;
  align-items: baseline;
  gap: 16rpx;
}

.address-receiver {
  font-size: 30rpx;
  color: #222222;
  font-weight: 500;
}

.address-phone {
  font-size: 24rpx;
  color: #999999;
}

.address-detail {
  font-size: 26rpx;
  color: #666666;
  line-height: 1.5;
}

.address-empty {
  flex: 1;
  font-size: 28rpx;
  color: #999999;
}

.address-arrow {
  font-size: 32rpx;
  color: #cccccc;
}

.goods-block {
  background-color: #ffffff;
  border-radius: 16rpx;
  padding: 8rpx 24rpx;
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
  color: #e24b4a;
}

.goods-qty {
  font-size: 24rpx;
  color: #999999;
}

.amount-block {
  background-color: #ffffff;
  border-radius: 16rpx;
  padding: 8rpx 24rpx;
}

.amount-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 22rpx 0;
  font-size: 26rpx;
  color: #666666;
  border-bottom: 1rpx solid #f5f6f8;
}

.amount-row:last-child {
  border-bottom: none;
}

.amount-freight-tip {
  font-size: 24rpx;
  color: #999999;
}

.remark-block {
  display: flex;
  align-items: center;
  background-color: #ffffff;
  border-radius: 16rpx;
  padding: 28rpx 24rpx;
  gap: 20rpx;
}

.remark-label {
  font-size: 26rpx;
  color: #666666;
  flex-shrink: 0;
}

.remark-input {
  flex: 1;
  font-size: 26rpx;
  color: #222222;
}

.footer-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: #ffffff;
  padding: 16rpx 24rpx calc(16rpx + env(safe-area-inset-bottom));
}

.footer-note-text {
  font-size: 22rpx;
  color: #999999;
}

.footer-submit {
  padding: 22rpx 56rpx;
  background-color: #e24b4a;
  border-radius: 44rpx;
  color: #ffffff;
  font-size: 28rpx;
}

.footer-submit.disabled {
  opacity: 0.5;
}
</style>
