<!--
  购物车页（pages/mall/cart/index）—— 商城页面内导航
  交互规格：docs/交互规格说明书-商城M1-M2.md §P2
  规则（PRD §③）：
  - 合计金额只用服务端返回的 checkedAmount，前端不算钱
  - 改量失败（超库存）回滚到服务端返回值
  - 删除二次确认；失效商品置灰不可结算
  服装电商要点（对齐设计稿）：
  - 规格行可点击直接改尺码/颜色（唤起规格面板）
  - 凑单提示条引导凑满免邮门槛
-->
<template>
  <view class="cart">
    <view class="cart-head">
      <view class="cart-back" @click="goHome">
        <image src="/static/mall/icons/back.png" mode="aspectFit" />
      </view>
      <text class="cart-head-title">购物车</text>
    </view>
    <!-- 空态 -->
    <view v-if="!loading && !cartList.length" class="empty">
      <text class="empty-title">购物车还是空的</text>
      <text class="empty-sub">挑几件街头单品，凑满 99 包邮</text>
      <view class="empty-btn" @click="goHome">
        <text class="empty-btn-text">去逛逛</text>
      </view>
      <view class="empty-art">
        <image class="empty-img" src="/static/mall/icons/cart.png" mode="aspectFit" />
      </view>
    </view>

    <template v-else>
      <!-- 凑单提示条 -->
      <view v-if="shipTip" class="ship-tip">
        <view class="ship-icon"><text class="ship-icon-text">+</text></view>
        <text class="ship-text">{{ shipTip }}</text>
        <text class="ship-link" @click="goHome">去凑单 ></text>
      </view>

      <!-- 有效商品列表 -->
      <view class="cart-list">
        <view v-for="item in validList" :key="item.id" class="cart-item">
          <view class="checkbox" :class="{ checked: item.checked }" @click="onToggle(item)">
            <image v-if="item.checked" class="checkbox-img" src="/static/mall/icons/check.png" mode="aspectFit" />
          </view>

          <view class="cover" :style="{ backgroundColor: item.color }">
            <image v-if="item.cover" class="cover-img" :src="item.cover" mode="aspectFill" />
            <text v-else class="cover-fallback">{{ item.title.slice(0, 1) }}</text>
          </view>

          <view class="item-info">
            <text class="item-title">{{ item.title }}</text>
            <!-- 规格可点击修改 -->
            <view class="item-spec" @click="openSpec(item)">
              <text class="item-spec-text">{{ item.spec }}</text>
              <text class="item-spec-edit">(点击修改)</text>
            </view>
            <view class="item-bottom">
              <text class="item-price">¥{{ fen2yuan(item.price) }}</text>
              <stepper :value="item.quantity" :max="item.stock" @change="(v) => onQty(item, v)" />
            </view>
          </view>

          <text class="item-remove" @click="onRemove(item)">删除</text>
        </view>
      </view>

      <!-- 失效商品区（PRD §5.5：置灰展示，可清理） -->
      <view v-if="invalidList.length" class="invalid-block">
        <view class="invalid-header">
          <text class="invalid-title">失效商品（{{ invalidList.length }}）</text>
          <text class="invalid-clear" @click="onClearInvalid">清空</text>
        </view>
        <view v-for="item in invalidList" :key="item.id" class="cart-item invalid">
          <view class="cover" :style="{ backgroundColor: item.color }">
            <image v-if="item.cover" class="cover-img" :src="item.cover" mode="aspectFill" />
            <text v-else class="cover-fallback">{{ item.title.slice(0, 1) }}</text>
          </view>
          <view class="item-info">
            <text class="item-title">{{ item.title }}</text>
            <text class="item-spec">{{ item.spec }}</text>
            <text class="invalid-reason">该商品已下架</text>
          </view>
          <text class="invalid-tag">失效</text>
        </view>
      </view>

      <!-- 底部结算栏：金额为服务端计算的 checkedAmount -->
      <view class="footer-bar">
        <view class="check-all" @click="onCheckAll">
          <view class="checkbox" :class="{ checked: isAllChecked }">
            <image v-if="isAllChecked" class="checkbox-img" src="/static/mall/icons/check.png" mode="aspectFit" />
          </view>
          <text class="check-all-text">全选</text>
        </view>
        <view class="footer-total">
          <text class="footer-total-label">已选 {{ checkedCount }} 件</text>
          <view class="footer-total-row">
            <text class="footer-total-text">合计</text>
            <text class="footer-total-price">¥{{ fen2yuan(checkedAmount) }}</text>
          </view>
        </view>
        <view class="footer-settle" :class="{ disabled: !checkedCount }" @click="goConfirm">
          <text class="footer-settle-text">去结算</text>
        </view>
      </view>
    </template>

    <!-- 改规格面板 -->
    <view v-if="specPopupShow" class="spec-mask" @click="closeSpec">
      <view class="spec-popup" @click.stop>
        <view class="spec-head">
          <text class="spec-title">修改规格</text>
          <view class="spec-close" @click="closeSpec">
            <image class="spec-close-img" src="/static/mall/icons/close.png" mode="aspectFit" />
          </view>
        </view>
        <scroll-view class="spec-scroll" scroll-y>
          <size-picker
            v-if="specGoods"
            :goods="specGoods"
            :color-id="specColorId"
            :size="specSize"
            @change="onSpecChange"
          />
          <view class="spec-qty">
            <text class="spec-label">购买数量</text>
            <stepper :value="specQty" :max="specMaxStock" @change="onSpecQty" />
          </view>
        </scroll-view>
        <view class="spec-foot">
          <view class="spec-btn spec-btn-primary" :class="{ disabled: !canSaveSpec }" @click="onSaveSpec">
            <text class="spec-btn-text">确定</text>
          </view>
        </view>
      </view>
    </view>
    <mall-tabbar current="cart" />
  </view>
</template>

<script setup>
/** 购物车页逻辑（Vue3 setup） */
import { ref, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { cartApi, goodsApi } from '../api/index.js'
import { fen2yuan } from '../utils/format.js'
import Stepper from '../components/stepper.vue'
import SizePicker from '../components/size-picker.vue'
import MallTabbar from '../components/mall-tabbar.vue'
import { MALL_CONFIG } from '../config'

/** 购物车列表（服务端返回，含失效标记） */
const cartList = ref([])
/** 已选件数与合计（均为服务端计算口径，PRD §③） */
const checkedCount = ref(0)
const checkedAmount = ref(0)
const loading = ref(false)

/* ---- 改规格面板状态 ---- */
const specPopupShow = ref(false)
/** 正在改规格的购物车项 */
const specItem = ref(null)
/** 该项所属商品的完整信息（含 colors/sizes/skuList） */
const specGoods = ref(null)
const specColorId = ref(0)
const specSize = ref('')
const specQty = ref(1)
const specSaving = ref(false)

/** 有效商品（可结算） */
const validList = computed(() => cartList.value.filter((i) => !i.invalid))
/** 失效商品（已下架/库存为 0） */
const invalidList = computed(() => cartList.value.filter((i) => i.invalid))
/** 全选状态：有效商品全部选中 */
const isAllChecked = computed(
  () => validList.value.length > 0 && validList.value.every((i) => i.checked)
)

/**
 * 凑单提示：已选金额距离免邮门槛还差多少
 * 运费规则取服务端常量（config.js），前端只做提示不算钱
 */
const shipTip = computed(() => {
  if (!checkedAmount.value) return ''
  const threshold = MALL_CONFIG.FREE_SHIPPING_THRESHOLD
  if (checkedAmount.value >= threshold) return '已享包邮'
  const gap = (threshold - checkedAmount.value) / 100
  return `再买 ¥${gap.toFixed(0)} 可享包邮`
})

/** 规格面板可选的最大库存 */
const specMaxStock = computed(() => {
  if (!specGoods.value) return 1
  const sku = (specGoods.value.skuList || []).find(
    (s) => s.colorId === specColorId.value && s.size === specSize.value
  )
  return sku ? sku.stock : 1
})

/** 是否可保存规格 */
const canSaveSpec = computed(
  () => !!(specSize.value && specQty.value <= specMaxStock.value && !specSaving.value)
)

/** 拉取购物车（onShow 触发：从结算页返回时数量可能变化） */
async function loadCart() {
  loading.value = true
  try {
    const data = await cartApi.list()
    cartList.value = data.list
    checkedCount.value = data.checkedCount
    checkedAmount.value = data.checkedAmount
  } catch (e) {
    uni.showToast({ title: e.msg || '购物车加载失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

onShow(() => {
  loadCart()
})

/**
 * 勾选/取消单项
 */
async function onToggle(item) {
  try {
    await cartApi.setChecked({ id: item.id, checked: !item.checked })
    await loadCart()
  } catch (e) {
    uni.showToast({ title: e.msg || '操作失败', icon: 'none' })
  }
}

/** 全选/取消全选（仅对有效商品生效，服务端处理） */
async function onCheckAll() {
  try {
    await cartApi.checkAll({ checked: !isAllChecked.value })
    await loadCart()
  } catch (e) {
    uni.showToast({ title: e.msg || '操作失败', icon: 'none' })
  }
}

/**
 * 数量步进：失败（超库存）时重拉服务端数据回滚显示
 * @param {Object} item 购物车项
 * @param {number} v 目标数量
 */
async function onQty(item, v) {
  try {
    await cartApi.updateQty({ id: item.id, quantity: v })
    await loadCart()
  } catch (e) {
    uni.showToast({ title: e.msg || '修改失败', icon: 'none' })
    await loadCart() // 回滚到服务端口径
  }
}

/**
 * 删除（二次确认后调用，PRD §5.5）
 */
function onRemove(item) {
  uni.showModal({
    title: '提示',
    content: '确定删除该商品吗？',
    success: async (res) => {
      if (!res.confirm) return
      try {
        await cartApi.remove({ ids: [item.id] })
        await loadCart()
      } catch (e) {
        uni.showToast({ title: e.msg || '删除失败', icon: 'none' })
      }
    }
  })
}

/** 清空失效商品 */
function onClearInvalid() {
  const ids = invalidList.value.map((i) => i.id)
  uni.showModal({
    title: '提示',
    content: '确定清空失效商品吗？',
    success: async (res) => {
      if (!res.confirm) return
      try {
        await cartApi.remove({ ids })
        await loadCart()
      } catch (e) {
        uni.showToast({ title: e.msg || '操作失败', icon: 'none' })
      }
    }
  })
}

/**
 * 打开改规格面板：拉该商品详情以获得完整的颜色/尺码维度
 * @param {Object} item 购物车项
 */
async function openSpec(item) {
  try {
    const g = await goodsApi.detail({ id: item.goodsId })
    specItem.value = item
    specGoods.value = g
    // 回显当前已选规格
    const cur = (g.skuList || []).find((s) => s.id === item.skuId)
    specColorId.value = cur ? cur.colorId : g.colors[0].id
    specSize.value = cur ? cur.size : ''
    specQty.value = item.quantity
    specPopupShow.value = true
  } catch (e) {
    uni.showToast({ title: e.msg || '规格加载失败', icon: 'none' })
  }
}

function closeSpec() {
  specPopupShow.value = false
  specItem.value = null
  specGoods.value = null
}

/** 规格面板内的选择变化 */
function onSpecChange(payload) {
  specColorId.value = payload.colorId
  specSize.value = payload.size
  specQty.value = 1
}

/** 规格面板内的数量变化 */
function onSpecQty(v) {
  specQty.value = v
}

/** 保存改后的规格 */
async function onSaveSpec() {
  if (!canSaveSpec.value) return
  const sku = (specGoods.value.skuList || []).find(
    (s) => s.colorId === specColorId.value && s.size === specSize.value
  )
  if (!sku) {
    uni.showToast({ title: '请选择规格', icon: 'none' })
    return
  }
  specSaving.value = true
  try {
    await cartApi.updateSku({ id: specItem.value.id, skuId: sku.id, quantity: specQty.value })
    closeSpec()
    await loadCart()
    uni.showToast({ title: '规格已修改', icon: 'success' })
  } catch (e) {
    uni.showToast({ title: e.msg || '修改失败', icon: 'none' })
  } finally {
    specSaving.value = false
  }
}

/** 去结算：携带选中且有效项的 id 列表（结算页据此取明细，金额仍以服务端为准） */
function goConfirm() {
  const ids = validList.value.filter((i) => i.checked).map((i) => i.id)
  if (!ids.length) return
  uni.navigateTo({ url: `/pages/mall/confirm/index?ids=${ids.join(',')}` })
}

function goHome() {
  uni.redirectTo({ url: '/pages/mall/index' })
}
</script>

<style lang="scss" scoped>
@import "../styles/tokens.scss";
.cart {
  min-height: 100vh;
  background-color: $rz-grey-50;
  padding-bottom: calc(320rpx + env(safe-area-inset-bottom));
}

.cart-head {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 112rpx;
  background-color: $rz-white;
}

.cart-back {
  position: absolute;
  left: 32rpx;
  width: 48rpx;
  height: 48rpx;
  display: flex;
  align-items: center;
}

.cart-back image {
  width: 32rpx;
  height: 32rpx;
}

.cart-head-title {
  font-size: 32rpx;
  font-weight: 900;
  color: $rz-ink;
}

/* ---- 空态 ---- */
.empty {
  padding-top: 360rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20rpx;
}

.empty-art {
  width: 320rpx;
  height: 320rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: $rz-grey-100;
  margin-top: 20rpx;
}

.empty-img {
  width: 120rpx;
  height: 120rpx;
  opacity: 0.35;
}

.empty-title {
  font-size: 34rpx;
  font-weight: 700;
  color: $rz-ink;
}

.empty-sub {
  font-size: 24rpx;
  color: $rz-grey-500;
}

.empty-btn {
  margin-top: 20rpx;
  width: 320rpx;
  height: 84rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: $rz-acid;
  border: 4rpx solid $rz-ink;
}

.empty-btn-text {
  font-size: 30rpx;
  font-weight: 900;
  color: $rz-ink;
}

/* ---- 凑单提示 ---- */
.ship-tip {
  display: flex;
  align-items: center;
  gap: 12rpx;
  padding: 18rpx 24rpx;
  background-color: $rz-warn-bg;
}

.ship-icon {
  width: 32rpx;
  height: 32rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: $rz-acid;
}

.ship-icon-text {
  font-size: 26rpx;
  font-weight: 900;
  color: $rz-ink;
  line-height: 1;
}

.ship-text {
  flex: 1;
  font-size: 22rpx;
  color: $rz-ink;
}

.ship-link {
  font-size: 22rpx;
  font-weight: 700;
  color: $rz-ink;
}

/* ---- 商品列表 ---- */
.cart-list {
  padding: 20rpx 24rpx 0;
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.cart-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 20rpx;
  background-color: $rz-white;
}

.checkbox {
  width: 40rpx;
  height: 40rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 4rpx solid $rz-ink;
  background-color: $rz-white;
  flex-shrink: 0;
}

.checkbox.checked {
  background-color: $rz-ink;
}

.checkbox-img {
  width: 24rpx;
  height: 24rpx;
}

.cover {
  width: 160rpx;
  height: 160rpx;
  overflow: hidden;
  flex-shrink: 0;
}

.cover-img {
  width: 100%;
  height: 100%;
}

.cover-fallback {
  font-size: 64rpx;
  color: rgba(255, 255, 255, 0.85);
}

.item-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10rpx;
  min-width: 0;
}

.item-title {
  font-size: 26rpx;
  font-weight: 700;
  color: $rz-ink;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* 规格行：可点击修改 */
.item-spec {
  display: flex;
  align-items: center;
  gap: 6rpx;
  align-self: flex-start;
  padding: 4rpx 0;
}

.item-spec-text {
  font-size: 22rpx;
  color: $rz-ink;
}

.item-spec-edit {
  font-size: 20rpx;
  color: $rz-grey-500;
}

.item-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 4rpx;
}

.item-price {
  font-size: 34rpx;
  font-weight: 900;
  color: $rz-price;
}

.item-remove {
  position: absolute;
  top: 12rpx;
  right: 16rpx;
  font-size: 20rpx;
  color: $rz-grey-500;
}

/* ---- 失效商品 ---- */
.invalid-block {
  margin-top: 24rpx;
  padding: 20rpx 24rpx 0;
}

.invalid-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16rpx;
}

.invalid-title {
  font-size: 26rpx;
  color: $rz-grey-500;
}

.invalid-clear {
  font-size: 24rpx;
  color: $rz-grey-500;
}

.cart-item.invalid {
  border-color: $rz-line;
  opacity: 0.7;
  margin-bottom: 20rpx;
}

.invalid-reason {
  font-size: 20rpx;
  color: $rz-grey-300;
}

.invalid-tag {
  padding: 4rpx 12rpx;
  font-size: 20rpx;
  color: $rz-grey-500;
  border: 2rpx solid $rz-grey-300;
}

/* ---- 底部结算栏 ---- */
.footer-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: calc(192rpx + env(safe-area-inset-bottom));
  height: 128rpx;
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 0 24rpx;
  background-color: $rz-white;
  border-top: 4rpx solid $rz-ink;
  z-index: 10;
}

.check-all {
  display: flex;
  align-items: center;
  gap: 10rpx;
}

.check-all-text {
  font-size: 26rpx;
  color: $rz-ink;
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

.footer-total-row {
  display: flex;
  align-items: baseline;
  gap: 8rpx;
}

.footer-total-text {
  font-size: 24rpx;
  color: $rz-ink;
}

.footer-total-price {
  font-size: 38rpx;
  font-weight: 900;
  color: $rz-price;
}

.footer-settle {
  width: 200rpx;
  height: 84rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: $rz-acid;
  border: 4rpx solid $rz-ink;
}

.footer-settle.disabled {
  opacity: 0.4;
}

.footer-settle-text {
  font-size: 30rpx;
  font-weight: 900;
  color: $rz-ink;
}

/* ---- 改规格面板 ---- */
.spec-mask {
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

.spec-popup {
  width: 100%;
  height: 800rpx;
  display: flex;
  flex-direction: column;
  background-color: $rz-white;
  border-top: 4rpx solid $rz-ink;
}

.spec-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx $rz-page-pad;
  border-bottom: 2rpx solid $rz-line;
  flex-shrink: 0;
}

.spec-title {
  font-size: 32rpx;
  font-weight: 900;
  color: $rz-ink;
}

.spec-close {
  width: 44rpx;
  height: 44rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.spec-close-img {
  width: 28rpx;
  height: 28rpx;
}

.spec-scroll {
  flex: 1;
  min-height: 0;
  padding: 24rpx $rz-page-pad;
}

.spec-qty {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 24rpx;
}

.spec-label {
  font-size: 26rpx;
  color: $rz-ink;
}

.spec-foot {
  padding: 20rpx $rz-page-pad;
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
  border-top: 2rpx solid $rz-line;
  flex-shrink: 0;
}

.spec-btn {
  height: 88rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 4rpx solid $rz-ink;
}

.spec-btn-primary {
  background-color: $rz-acid;
}

.spec-btn.disabled {
  opacity: 0.4;
}

.spec-btn-text {
  font-size: 30rpx;
  font-weight: 900;
  color: $rz-ink;
}
</style>
