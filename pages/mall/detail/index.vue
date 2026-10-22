<!--
  商品详情页（pages/mall/detail/index?id={goodsId}）
  交互规格：docs/交互规格说明书-商城M1-M2.md §P1
  核心：SKU 选择弹层（规格切换联动价格/库存，售罄禁用，PRD §①规则 4）
  数据来源：goodsApi.detail / cartApi.add / orderApi.create（直购在结算页提交）
-->
<template>
  <view class="detail-page" v-if="goods">
    <!-- 图集轮播：mock 阶段单张色块占位，接真实接口后为图集 -->
    <swiper class="banner-swiper" indicator-dots circular>
      <swiper-item>
        <view class="banner-cover" :style="{ backgroundColor: goods.color }">
          <image v-if="goods.cover" class="banner-img" :src="goods.cover" mode="aspectFill" />
          <text v-else class="banner-fallback">{{ goods.title.slice(0, 1) }}</text>
        </view>
      </swiper-item>
    </swiper>

    <!-- 价格区：仅展示服务端返回值 -->
    <view class="price-block">
      <view class="price-row">
        <text class="price">¥{{ fen2yuan(currentPrice) }}</text>
        <text class="origin-price">¥{{ fen2yuan(goods.originPrice) }}</text>
      </view>
      <text class="sales">已售 {{ goods.sales }}</text>
    </view>

    <!-- 标题与卖点 -->
    <view class="title-block">
      <text class="title">{{ goods.title }}</text>
      <text class="desc">{{ goods.description }}</text>
    </view>

    <!-- 规格入口行：点开 SKU 弹层 -->
    <view class="sku-entry" @click="openSku('cart')">
      <text class="sku-entry-label">选择规格</text>
      <text class="sku-entry-value">{{ selectedSku ? `${selectedSku.spec} × ${quantity}` : '请选择规格' }}</text>
      <text class="sku-entry-arrow">›</text>
    </view>

    <!-- 详情描述 -->
    <view class="desc-block">
      <text class="desc-title">商品详情</text>
      <text class="desc-content">{{ goods.description }}</text>
    </view>

    <!-- 底部操作栏：全部售罄时禁用（PRD §①：售罄保留展示不可下单） -->
    <view class="footer-bar">
      <view class="footer-cart" :class="{ disabled: allSoldOut }" @click="allSoldOut ? null : openSku('cart')">
        <text>加入购物车</text>
      </view>
      <view class="footer-buy" :class="{ disabled: allSoldOut }" @click="allSoldOut ? null : openSku('buy')">
        <text>立即购买</text>
      </view>
    </view>

    <!-- SKU 选择弹层（mode: cart=加购 / buy=直购） -->
    <view v-if="skuPopupShow" class="sku-mask" @click="closeSku">
      <view class="sku-popup" @click.stop>
        <view class="sku-goods">
          <view class="sku-cover" :style="{ backgroundColor: goods.color }">
            <text class="sku-cover-text">{{ goods.title.slice(0, 1) }}</text>
          </view>
          <view class="sku-goods-info">
            <text class="sku-price">¥{{ fen2yuan(currentPrice) }}</text>
            <text class="sku-stock">库存 {{ selectedSku ? selectedSku.stock : 0 }}</text>
          </view>
        </view>

        <!-- 规格选择：售罄 SKU 置灰禁用 -->
        <view class="sku-specs">
          <text class="sku-spec-label">规格</text>
          <view class="sku-spec-list">
            <view
              v-for="sku in goods.skuList"
              :key="sku.id"
              class="sku-spec-item"
              :class="{ active: selectedSku && selectedSku.id === sku.id, disabled: sku.stock === 0 }"
              @click="onSelectSku(sku)"
            >
              <text>{{ sku.spec }}</text>
            </view>
          </view>
        </view>

        <!-- 数量步进器：上限为当前 SKU 可售库存 -->
        <view class="sku-qty">
          <text class="sku-spec-label">数量</text>
          <view class="stepper">
            <view class="stepper-btn" :class="{ disabled: quantity <= 1 }" @click="onQtyChange(-1)"><text>−</text></view>
            <text class="stepper-num">{{ quantity }}</text>
            <view
              class="stepper-btn"
              :class="{ disabled: !selectedSku || quantity >= selectedSku.stock }"
              @click="onQtyChange(1)"
            ><text>+</text></view>
          </view>
        </view>

        <!-- 弹层确认按钮：文案随 mode 变化 -->
        <view class="sku-confirm" :class="{ disabled: !selectedSku || selectedSku.stock === 0 || submitting }" @click="onSkuConfirm">
          <text>{{ mode === 'cart' ? '加入购物车' : '立即购买' }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
/** 商品详情页逻辑（Vue3 setup） */
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { goodsApi, cartApi } from '../api/index.js'
import { fen2yuan } from '../utils/format.js'

/** 商品详情（含 skuList） */
const goods = ref(null)
/** SKU 弹层开关 */
const skuPopupShow = ref(false)
/** 弹层模式：cart=加入购物车 / buy=立即购买 */
const mode = ref('cart')
/** 当前选中 SKU（默认页面加载后选第一个有库存的） */
const selectedSku = ref(null)
/** 购买数量（1 ~ 当前 SKU 库存） */
const quantity = ref(1)
/** 提交防重标记 */
const submitting = ref(false)

/** 当前展示价格：跟随选中 SKU 联动（服务端数据，前端不算价） */
const currentPrice = computed(() => {
  if (selectedSku.value) return selectedSku.value.price
  return goods.value ? Math.min(...goods.value.skuList.map((s) => s.price)) : 0
})

/** 是否全部规格售罄（PRD §①规则 4：售罄保留展示但不可下单） */
const allSoldOut = computed(() => goods.value ? goods.value.skuList.every((s) => s.stock === 0) : false)

/**
 * 页面加载：取参并拉取详情
 */
onLoad(async (options) => {
  try {
    const data = await goodsApi.detail({ id: options.id })
    goods.value = data
    // 默认选中第一个有库存的 SKU
    selectedSku.value = data.skuList.find((s) => s.stock > 0) || null
  } catch (e) {
    uni.showToast({ title: e.msg || '商品加载失败', icon: 'none' })
    setTimeout(() => uni.navigateBack(), 1500)
  }
})

/**
 * 打开 SKU 弹层
 * @param {'cart'|'buy'} m 弹层模式
 */
function openSku(m) {
  mode.value = m
  quantity.value = 1
  skuPopupShow.value = true
}

function closeSku() {
  skuPopupShow.value = false
}

/**
 * 切换规格：售罄规格不可选（disabled 态）
 */
function onSelectSku(sku) {
  if (sku.stock === 0) return
  selectedSku.value = sku
  quantity.value = 1 // 切规格后数量重置
}

/**
 * 数量步进：下限 1，上限当前 SKU 可售库存
 */
function onQtyChange(delta) {
  if (!selectedSku.value) return
  const next = quantity.value + delta
  if (next < 1 || next > selectedSku.value.stock) return
  quantity.value = next
}

/**
 * 弹层确认：按 mode 分发到加购 / 直购
 */
async function onSkuConfirm() {
  if (!selectedSku.value || selectedSku.value.stock === 0 || submitting.value) return
  submitting.value = true
  try {
    if (mode.value === 'cart') {
      await cartApi.add({ goodsId: goods.value.id, skuId: selectedSku.value.id, quantity: quantity.value })
      uni.showToast({ title: '已加入购物车', icon: 'success' })
      closeSku()
    } else {
      // 直购：携带规格与数量进结算页，金额由结算页提交时服务端计算
      uni.navigateTo({
        url: `/pages/mall/confirm/index?skuId=${selectedSku.value.id}&quantity=${quantity.value}`
      })
      closeSku()
    }
  } catch (e) {
    uni.showToast({ title: e.msg || '操作失败', icon: 'none' })
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.detail-page {
  min-height: 100vh;
  background-color: #f5f6f8;
  padding-bottom: 140rpx;
}

.banner-swiper {
  height: 640rpx;
}

.banner-cover {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.banner-img {
  width: 100%;
  height: 100%;
}

.banner-fallback {
  font-size: 140rpx;
  color: rgba(255, 255, 255, 0.85);
}

.price-block {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  background-color: #ffffff;
  padding: 24rpx;
}

.price-row {
  display: flex;
  align-items: baseline;
  gap: 12rpx;
}

.price {
  font-size: 40rpx;
  font-weight: 500;
  color: #e24b4a;
}

.origin-price {
  font-size: 24rpx;
  color: #bbbbbb;
  text-decoration: line-through;
}

.sales {
  font-size: 24rpx;
  color: #999999;
}

.title-block {
  background-color: #ffffff;
  margin-top: 20rpx;
  padding: 24rpx;
  display: flex;
  flex-direction: column;
  gap: 10rpx;
}

.title {
  font-size: 32rpx;
  color: #222222;
  line-height: 1.5;
}

.desc {
  font-size: 24rpx;
  color: #999999;
}

.sku-entry {
  display: flex;
  align-items: center;
  background-color: #ffffff;
  margin-top: 20rpx;
  padding: 24rpx;
}

.sku-entry-label {
  font-size: 26rpx;
  color: #999999;
  margin-right: 24rpx;
}

.sku-entry-value {
  flex: 1;
  font-size: 26rpx;
  color: #222222;
}

.sku-entry-arrow {
  font-size: 32rpx;
  color: #cccccc;
}

.desc-block {
  background-color: #ffffff;
  margin-top: 20rpx;
  padding: 24rpx;
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.desc-title {
  font-size: 28rpx;
  color: #222222;
  font-weight: 500;
}

.desc-content {
  font-size: 26rpx;
  color: #666666;
  line-height: 1.6;
}

.footer-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  background-color: #ffffff;
  padding: 16rpx 24rpx calc(16rpx + env(safe-area-inset-bottom));
  gap: 20rpx;
}

.footer-cart,
.footer-buy {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 22rpx 0;
  border-radius: 44rpx;
  font-size: 28rpx;
  color: #ffffff;
}

.footer-cart {
  background-color: #ba7517;
}

.footer-buy {
  background-color: #e24b4a;
}

.disabled {
  opacity: 0.4;
}

.sku-mask {
  /* 兼容写法：低版本基础库不支持 inset 简写 */
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 100;
  display: flex;
  align-items: flex-end;
}

.sku-popup {
  width: 100%;
  background-color: #ffffff;
  border-radius: 24rpx 24rpx 0 0;
  padding: 32rpx 32rpx calc(32rpx + env(safe-area-inset-bottom));
}

.sku-goods {
  display: flex;
  gap: 24rpx;
  padding-bottom: 24rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.sku-cover {
  width: 140rpx;
  height: 140rpx;
  border-radius: 12rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.sku-cover-text {
  font-size: 56rpx;
  color: rgba(255, 255, 255, 0.85);
}

.sku-goods-info {
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  gap: 10rpx;
  padding-bottom: 8rpx;
}

.sku-price {
  font-size: 36rpx;
  font-weight: 500;
  color: #e24b4a;
}

.sku-stock {
  font-size: 24rpx;
  color: #999999;
}

.sku-specs {
  padding: 24rpx 0;
}

.sku-spec-label {
  font-size: 26rpx;
  color: #666666;
}

.sku-spec-list {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
  margin-top: 16rpx;
}

.sku-spec-item {
  padding: 12rpx 32rpx;
  background-color: #f5f6f8;
  border-radius: 8rpx;
  font-size: 26rpx;
  color: #222222;
  border: 1rpx solid #f5f6f8;
}

.sku-spec-item.active {
  background-color: #fcebeb;
  border-color: #e24b4a;
  color: #e24b4a;
}

.sku-spec-item.disabled {
  color: #cccccc;
  background-color: #fafafa;
}

.sku-qty {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx 0;
}

.stepper {
  display: flex;
  align-items: center;
  gap: 4rpx;
}

.stepper-btn {
  width: 56rpx;
  height: 56rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f6f8;
  border-radius: 8rpx;
  font-size: 32rpx;
  color: #222222;
}

.stepper-btn.disabled {
  color: #cccccc;
}

.stepper-num {
  width: 80rpx;
  text-align: center;
  font-size: 28rpx;
}

.sku-confirm {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24rpx 0;
  border-radius: 44rpx;
  background-color: #e24b4a;
  color: #ffffff;
  font-size: 28rpx;
  margin-top: 8rpx;
}

.sku-confirm.disabled {
  opacity: 0.4;
}
</style>
