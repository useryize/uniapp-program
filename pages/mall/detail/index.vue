<!--
  商品详情页（pages/mall/detail/index?id={goodsId}）
  交互规格：docs/交互规格说明书-商城M1-M2.md §P1
  服装电商要点（对齐设计稿「尺码决策链」）：
    - 售罄尺码【保留展示】并置灰划线，不隐藏（稀缺性需要被看见）
    - 尺码推荐条 + 尺码助手入口常驻价格区下方
    - 规格入口【悬浮吸底】，下滑时始终可见，避免回滚找尺码
    - 规格面板为可滑动大面板，底部双按钮：加购 + 立即购买
  数据：goodsApi.detail / sizeApi.profile / sizeApi.recommend / cartApi.add
-->
<template>
  <view class="detail">
    <!-- 图集轮播 -->
    <swiper class="gallery" indicator-dots circular>
      <swiper-item v-for="(img, i) in images" :key="i">
        <view class="gallery-cover" :style="{ backgroundColor: goods.color }">
          <image v-if="img" class="gallery-img" :src="img" mode="aspectFill" />
          <text v-else class="gallery-fallback">{{ goods.title.slice(0, 1) }}</text>
        </view>
      </swiper-item>
    </swiper>

    <view class="detail-body">
      <!-- 价格区 -->
      <view class="price-block">
        <view class="price-row">
          <text class="price">¥{{ fen2yuan(currentPrice) }}</text>
          <text class="origin-price">¥{{ fen2yuan(goods.originPrice) }}</text>
          <view class="discount"><text class="discount-text">限时 {{ discountRate }} 折</text></view>
        </view>
        <view class="meta-row">
          <text class="meta-text">已售 {{ salesText }}</text>
          <text class="meta-stock">{{ stockHint }}</text>
        </view>

        <!-- 尺码推荐条 -->
        <view class="rec-bar" @click="goSizeGuide">
          <view class="rec-icon"><image class="rec-img" src="/static/mall/icons/ruler.png" mode="aspectFit" /></view>
          <text class="rec-text">{{ recommendText }}</text>
          <text class="rec-link">尺码助手 ></text>
        </view>
      </view>

      <!-- 标题与卖点 -->
      <view class="title-block">
        <text class="title">{{ goods.title }}</text>
        <text class="desc">{{ goods.description }}  ·  满 99 包邮  ·  7 天无理由退换</text>
      </view>

      <!-- 规格选择区 -->
      <view class="spec-block">
        <view class="spec-row">
          <text class="spec-label">颜色</text>
          <text class="spec-value">{{ selectedColorName || '请选择' }}</text>
        </view>
        <view class="spec-row">
          <text class="spec-label">尺码</text>
          <text class="spec-value">{{ selectedSize ? selectedSize : '请选择' }}</text>
        </view>
        <size-picker
          :goods="goods"
          :color-id="colorId"
          :size="selectedSize"
          @change="onSizeChange"
        />
      </view>

      <!-- 服务保障 -->
      <view class="svc-block">
        <view class="svc-item">
          <image class="svc-img" src="/static/mall/icons/truck.png" mode="aspectFit" />
          <text class="svc-text">满99包邮</text>
        </view>
        <view class="svc-item">
          <image class="svc-img" src="/static/mall/icons/check.png" mode="aspectFit" />
          <text class="svc-text">7天无理由退换</text>
        </view>
        <view class="svc-item">
          <image class="svc-img" src="/static/mall/icons/star.png" mode="aspectFit" />
          <text class="svc-text">官方正品</text>
        </view>
      </view>

      <!-- 评价 -->
      <view class="rev-block">
        <view class="rev-head">
          <text class="rev-title">用户评价 (2,431)</text>
          <text class="rev-more">查看全部 ></text>
        </view>
        <view class="rev-item">
          <view class="rev-user">
            <view class="rev-avatar"><text class="rev-avatar-text">K</text></view>
            <text class="rev-name">K***</text>
            <image class="rev-stars" src="/static/mall/icons/star.png" mode="aspectFit" />
          </view>
          <text class="rev-content">面料比想象中厚实，oversize 版型很街头，黑色百搭。发货快，第二天就到了。</text>
          <text class="rev-spec">黑色 / L   ·   2026-10-18</text>
        </view>
      </view>
    </view>

    <!-- 底部固定区：规格条 + 左右并排的加购和购买按钮 -->
    <view class="footer-bar">
      <!-- 悬浮规格入口条：下滑时始终可见 -->
      <view class="float-spec">
        <text class="float-spec-text">{{ selectedColorName }} / {{ selectedSize || '选尺码' }}   ¥{{ fen2yuan(currentPrice) }}</text>
        <view class="float-spec-btn" @click="openSku('cart')">
          <text class="float-spec-btn-text">选规格</text>
        </view>
      </view>
      <view class="footer-actions">
        <view class="footer-btn footer-add" :class="{ disabled: allSoldOut }" @click="openSku('cart')">
          <text class="footer-btn-text">{{ allSoldOut ? '暂时售罄' : '加入购物车' }}</text>
        </view>
        <view class="footer-btn footer-buy" :class="{ disabled: allSoldOut }" @click="openSku('buy')">
          <text class="footer-btn-text">{{ allSoldOut ? '暂时售罄' : '立即购买' }}</text>
        </view>
      </view>
    </view>

    <!-- 规格选择面板（mode: cart 加购 / buy 直购） -->
    <view v-if="skuPopupShow" class="sku-mask" @click="closeSku">
      <view class="sku-popup" @click.stop>
        <view class="sku-head">
          <view class="sku-cover" :style="{ backgroundColor: goods.color }">
            <image v-if="goods.cover" class="sku-cover-img" :src="goods.cover" mode="aspectFill" />
          </view>
          <view class="sku-info">
            <text class="sku-price">¥{{ fen2yuan(currentPrice) }}</text>
            <text class="sku-stock">库存 {{ selectedSku ? selectedSku.stock : 0 }}  ·  {{ selectedColorName || '未选色' }}</text>
            <text class="sku-selected">已选：{{ selectedColorName || '未选色' }} / {{ selectedSize || '未选码' }} / {{ quantity }} 件</text>
          </view>
          <view class="sku-close" @click="closeSku">
            <image class="sku-close-img" src="/static/mall/icons/close.png" mode="aspectFit" />
          </view>
        </view>

        <scroll-view class="sku-scroll" scroll-y>
          <!-- 尺码助手入口 -->
          <view class="sku-helper" @click="goSizeGuide">
            <view class="sku-helper-icon"><image class="sku-helper-img" src="/static/mall/icons/ruler.png" mode="aspectFit" /></view>
            <text class="sku-helper-text">不确定穿多大？用尺码助手 3 秒推荐</text>
            <text class="sku-helper-link">去测 ></text>
          </view>

          <!-- 紧张库存提示 -->
          <view v-if="stockTight" class="sku-stock-tip">
            <text class="sku-stock-tip-text">该配色仅剩 {{ stockTight }} 件，售罄尺码不再补货</text>
          </view>

          <view class="sku-content">
            <size-picker :goods="goods" :color-id="colorId" :size="selectedSize" @change="onSizeChange" />
          </view>

          <!-- 数量 -->
          <view class="sku-qty">
            <text class="sku-label">购买数量</text>
            <stepper :value="quantity" :max="maxStock" @change="onQtyChange" />
          </view>
          <text class="sku-note">当前规格库存 {{ selectedSku ? selectedSku.stock : 0 }} 件，最多可购买 {{ maxStock }} 件</text>
        </scroll-view>

        <view class="sku-foot">
          <view class="sku-btn sku-btn-ghost" :class="{ disabled: !canSubmit }" @click="onSkuConfirm('cart')">
            <text class="sku-btn-text">加入购物车</text>
          </view>
          <view class="sku-btn sku-btn-primary" :class="{ disabled: !canSubmit }" @click="onSkuConfirm('buy')">
            <text class="sku-btn-text">立即购买</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { goodsApi, cartApi, sizeApi } from '../api/index.js'
import { fen2yuan } from '../utils/format.js'
import SizePicker from '../components/size-picker.vue'
import Stepper from '../components/stepper.vue'

/** 商品详情（含 skuList / colors / sizes / sizeChart） */
const goods = ref({})
/** 规格面板开关 */
const skuPopupShow = ref(false)
/** 面板模式：cart 加购 / buy 直购 */
const mode = ref('cart')
/** 选中颜色 id */
const colorId = ref(0)
/** 选中尺码 */
const selectedSize = ref('')
/** 购买数量 */
const quantity = ref(1)
/** 提交防重 */
const submitting = ref(false)
/** 用户尺码档案（用于推荐文案） */
const profile = ref({ height: 175, weight: 68 })

/** 图集 */
const images = computed(() => goods.value.images || [])

/** 当前颜色的 SKU 列表 */
const colorSkus = computed(() =>
  (goods.value.skuList || []).filter((s) => s.colorId === colorId.value)
)

/** 当前选中 SKU */
const selectedSku = computed(() =>
  colorSkus.value.find((s) => s.size === selectedSize.value) || null
)

/** 当前展示价格：跟随选中 SKU 联动（服务端数据，前端不算价） */
const currentPrice = computed(() => {
  if (selectedSku.value) return selectedSku.value.price
  const prices = (goods.value.skuList || []).map((s) => s.price)
  return prices.length ? Math.min(...prices) : 0
})

/** 当前颜色名 */
const selectedColorName = computed(() => {
  const c = (goods.value.colors || []).find((x) => x.id === colorId.value)
  return c ? c.name : ''
})

/** 是否全部尺码售罄（售罄保留展示但不可下单） */
const allSoldOut = computed(() =>
  (goods.value.skuList || []).length > 0 && goods.value.skuList.every((s) => s.stock === 0)
)

/** 当前规格最大可购数量 */
const maxStock = computed(() => (selectedSku.value ? selectedSku.value.stock : 1))

/** 紧张库存提示：当前颜色下最少的有货数量 */
const stockTight = computed(() => {
  const stocks = colorSkus.value.filter((s) => s.stock > 0).map((s) => s.stock)
  return stocks.length ? Math.min(...stocks) : 0
})

/** 是否可提交 */
const canSubmit = computed(
  () => !!(selectedSku.value && selectedSku.value.stock > 0 && quantity.value <= selectedSku.value.stock && !submitting.value)
)

/** 销量展示 */
const salesText = computed(() => {
  const s = Number(goods.value.sales || 0)
  return s >= 10000 ? (s / 10000).toFixed(1) + 'w' : String(s)
})

/** 折扣（现价 / 划线价 × 10，取一位小数） */
const discountRate = computed(() => {
  if (!goods.value.originPrice) return ''
  const r = (currentPrice.value / goods.value.originPrice) * 10
  return r.toFixed(1)
})

/** 库存提示文案 */
const stockHint = computed(() => {
  if (allSoldOut.value) return '已售罄'
  const n = stockTight.value
  return n && n <= 10 ? `仅剩 ${n} 件 · 售罄码不再补货` : '现货充足'
})

/** 尺码推荐文案（基于用户档案，服务端推荐结果回显） */
const recommendText = computed(() => {
  if (!profile.value.height) return '填写身高体重，3 秒推荐尺码'
  return `根据你的 ${profile.value.height}cm / ${profile.value.weight}kg，推荐尺码 ${profile.value.recommendSize || 'M'}`
})

/** 尺码选择变化回调 */
function onSizeChange(payload) {
  colorId.value = payload.colorId
  selectedSize.value = payload.size
  quantity.value = 1
}

/** 数量变化 */
function onQtyChange(v) {
  quantity.value = v
}

/** 打开规格面板 */
function openSku(m) {
  mode.value = m
  quantity.value = 1
  skuPopupShow.value = true
}

function closeSku() {
  skuPopupShow.value = false
}

/**
 * 面板确认：按 mode 分发到加购 / 直购
 * @param {'cart'|'buy'} m
 */
async function onSkuConfirm(m) {
  if (!canSubmit.value) return
  submitting.value = true
  try {
    if (m === 'cart') {
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

function goSizeGuide() {
  uni.navigateTo({ url: '/pages/mall/size-guide/index' })
}

function goCart() {
  uni.navigateTo({ url: '/pages/mall/cart/index' })
}

function onService() {
  uni.showToast({ title: '客服将在 9:00-22:00 为你服务', icon: 'none' })
}

onLoad(async (options) => {
  try {
    const data = await goodsApi.detail({ id: options.id })
    goods.value = data
    // 默认选中第一个有库存的颜色 + 第一个有库存的尺码
    const firstColor = (data.colors || []).find((c) =>
      (data.skuList || []).some((s) => s.colorId === c.id && s.stock > 0)
    )
    colorId.value = firstColor ? firstColor.id : (data.colors[0] ? data.colors[0].id : 0)
    const firstSize = (data.skuList || []).find((s) => s.colorId === colorId.value && s.stock > 0)
    selectedSize.value = firstSize ? firstSize.size : ''

    // 读取用户尺码档案并请求推荐，用于详情页推荐条
    try {
      const p = await sizeApi.profile()
      const rec = await sizeApi.recommend({ height: p.height, weight: p.weight, fit: p.fit })
      profile.value = { ...p, recommendSize: rec.size }
    } catch (e) {
      // 档案缺失不影响详情页
    }
  } catch (e) {
    uni.showToast({ title: e.msg || '商品加载失败', icon: 'none' })
    setTimeout(() => uni.navigateBack(), 1500)
  }
})
</script>

<style lang="scss" scoped>
@import "../styles/tokens.scss";
.detail {
  min-height: 100vh;
  background-color: $rz-grey-50;
  /* 底部预留：规格条、操作按钮和安全区 */
  padding-bottom: calc(200rpx + env(safe-area-inset-bottom));
}

/* ---- 图集 ---- */
.gallery {
  height: 750rpx;
  background-color: $rz-ink;
}

.gallery-cover {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.gallery-img {
  width: 100%;
  height: 100%;
}

.gallery-fallback {
  font-size: 140rpx;
  color: rgba(255, 255, 255, 0.85);
}

/* ---- 价格区 ---- */
.price-block {
  background-color: $rz-white;
  padding: 24rpx $rz-page-pad;
}

.price-row {
  display: flex;
  align-items: baseline;
  gap: 16rpx;
}

.price {
  font-size: 64rpx;
  font-weight: 900;
  color: $rz-price;
  line-height: 1.1;
}

.origin-price {
  font-size: 26rpx;
  color: $rz-grey-300;
  text-decoration: line-through;
}

.discount {
  padding: 4rpx 12rpx;
  background-color: $rz-ink;
}

.discount-text {
  font-size: 20rpx;
  font-weight: 700;
  color: $rz-acid;
}

.meta-row {
  display: flex;
  align-items: center;
  gap: 24rpx;
  margin-top: 12rpx;
}

.meta-text {
  font-size: 24rpx;
  color: $rz-grey-500;
}

.meta-stock {
  font-size: 24rpx;
  color: $rz-danger;
}

/* 尺码推荐条 */
.rec-bar {
  display: flex;
  align-items: center;
  gap: 14rpx;
  margin-top: 20rpx;
  padding: 16rpx 20rpx;
  background-color: $rz-warn-bg;
}

.rec-icon {
  width: 40rpx;
  height: 40rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: $rz-acid;
}

.rec-img {
  width: 24rpx;
  height: 24rpx;
}

.rec-text {
  flex: 1;
  font-size: 24rpx;
  font-weight: 500;
  color: $rz-ink;
}

.rec-link {
  font-size: 24rpx;
  font-weight: 700;
  color: $rz-ink;
}

/* ---- 标题 ---- */
.title-block {
  background-color: $rz-white;
  padding: 24rpx $rz-page-pad;
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.title {
  font-size: 34rpx;
  font-weight: 700;
  color: $rz-ink;
  line-height: 1.4;
}

.desc {
  font-size: 24rpx;
  color: $rz-grey-500;
  line-height: 1.5;
}

/* ---- 规格区 ---- */
.spec-block {
  background-color: $rz-white;
  margin-top: 16rpx;
  padding: 24rpx $rz-page-pad;
}

.spec-row {
  display: flex;
  align-items: center;
  margin-bottom: 20rpx;
}

.spec-label {
  width: 90rpx;
  font-size: 26rpx;
  color: $rz-ink;
}

.spec-value {
  font-size: 26rpx;
  color: $rz-grey-500;
}

/* ---- 服务保障 ---- */
.svc-block {
  display: flex;
  align-items: center;
  gap: 40rpx;
  background-color: $rz-grey-50;
  margin-top: 16rpx;
  padding: 24rpx $rz-page-pad;
}

.svc-item {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.svc-img {
  width: 26rpx;
  height: 26rpx;
}

.svc-text {
  font-size: 22rpx;
  color: $rz-ink;
}

/* ---- 评价 ---- */
.rev-block {
  background-color: $rz-white;
  margin-top: 16rpx;
  padding: 24rpx $rz-page-pad;
}

.rev-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20rpx;
}

.rev-title {
  font-size: 28rpx;
  font-weight: 700;
  color: $rz-ink;
}

.rev-more {
  font-size: 24rpx;
  color: $rz-grey-500;
}

.rev-item {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.rev-user {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.rev-avatar {
  width: 40rpx;
  height: 40rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: $rz-ink;
}

.rev-avatar-text {
  font-size: 22rpx;
  font-weight: 700;
  color: $rz-acid;
}

.rev-name {
  font-size: 24rpx;
  color: $rz-ink;
}

.rev-stars {
  width: 20rpx;
  height: 20rpx;
}

.rev-content {
  font-size: 26rpx;
  color: $rz-ink;
  line-height: 1.6;
}

.rev-spec {
  font-size: 22rpx;
  color: $rz-grey-500;
}

/* ---- 底部固定区：规格条 + 双按钮 ---- */
.footer-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  background-color: $rz-white;
  border-top: 4rpx solid $rz-ink;
  padding-bottom: env(safe-area-inset-bottom);
  z-index: 11;
}

/* 规格入口条 */
.float-spec {
  height: 80rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 $rz-page-pad;
  background-color: $rz-white;
}

.float-spec-text {
  font-size: 24rpx;
  color: $rz-ink;
}

.float-spec-btn {
  padding: 10rpx 20rpx;
  background-color: $rz-ink;
}

.float-spec-btn-text {
  font-size: 22rpx;
  font-weight: 700;
  color: $rz-acid;
}

.footer-actions {
  display: flex;
}

.footer-btn {
  flex: 1;
  min-width: 0;
  height: 88rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-top: 4rpx solid $rz-ink;
}

.footer-add {
  background-color: $rz-white;
}

.footer-buy {
  background-color: $rz-acid;
  border-left: 4rpx solid $rz-ink;
}

.footer-btn-text {
  font-size: 30rpx;
  font-weight: 900;
  color: $rz-ink;
}

.disabled {
  opacity: 0.4;
}

/* ---- 规格面板 ---- */
.sku-mask {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  background-color: rgba(0, 0, 0, 0.55);
  z-index: 100;
  display: flex;
  align-items: flex-end;
}

.sku-popup {
  width: 100%;
  height: 1080rpx;
  display: flex;
  flex-direction: column;
  background-color: $rz-white;
  border-top: 4rpx solid $rz-ink;
}

.sku-head {
  display: flex;
  align-items: center;
  gap: 20rpx;
  padding: 24rpx $rz-page-pad;
  border-bottom: 2rpx solid $rz-line;
  flex-shrink: 0;
}

.sku-cover {
  width: 144rpx;
  height: 144rpx;
  overflow: hidden;
  flex-shrink: 0;
}

.sku-cover-img {
  width: 100%;
  height: 100%;
}

.sku-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  min-width: 0;
}

.sku-price {
  font-size: 44rpx;
  font-weight: 900;
  color: $rz-price;
}

.sku-stock {
  font-size: 22rpx;
  color: $rz-grey-500;
}

.sku-selected {
  font-size: 24rpx;
  color: $rz-ink;
}

.sku-close {
  width: 48rpx;
  height: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.sku-close-img {
  width: 28rpx;
  height: 28rpx;
}

.sku-scroll {
  flex: 1;
  min-height: 0;
  padding: 0 $rz-page-pad;
}

.sku-helper {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-top: 24rpx;
  padding: 16rpx 20rpx;
  background-color: $rz-warn-bg;
}

.sku-helper-icon {
  width: 36rpx;
  height: 36rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: $rz-acid;
}

.sku-helper-img {
  width: 22rpx;
  height: 22rpx;
}

.sku-helper-text {
  flex: 1;
  font-size: 22rpx;
  color: $rz-ink;
}

.sku-helper-link {
  font-size: 22rpx;
  font-weight: 700;
  color: $rz-ink;
}

.sku-stock-tip {
  margin-top: 16rpx;
  padding: 16rpx 20rpx;
  background-color: $rz-danger-bg;
}

.sku-stock-tip-text {
  font-size: 22rpx;
  color: $rz-danger;
}

.sku-content {
  margin-top: 24rpx;
}

.sku-qty {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 24rpx;
}

.sku-label {
  font-size: 26rpx;
  color: $rz-ink;
}

.sku-note {
  display: block;
  margin-top: 14rpx;
  font-size: 22rpx;
  color: $rz-grey-500;
}

.sku-foot {
  display: flex;
  gap: 20rpx;
  padding: 20rpx $rz-page-pad;
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
  border-top: 2rpx solid $rz-line;
  flex-shrink: 0;
}

.sku-btn {
  flex: 1;
  height: 88rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 4rpx solid $rz-ink;
}

.sku-btn-ghost {
  background-color: $rz-white;
}

.sku-btn-primary {
  background-color: $rz-acid;
}

.sku-btn-text {
  font-size: 28rpx;
  font-weight: 700;
  color: $rz-ink;
}
</style>
