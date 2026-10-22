<!--
  购物车页（pages/mall/cart/index）
  交互规格：docs/交互规格说明书-商城M1-M2.md §P2
  规则（PRD §③）：
  - 合计金额只用服务端返回的 checkedAmount，前端不算钱
  - 改量失败（超库存）回滚到服务端返回值
  - 删除二次确认；失效商品置灰不可结算
-->
<template>
  <view class="cart-page">
    <!-- 空态 -->
    <view v-if="!loading && !cartList.length" class="empty">
      <text class="empty-icon">🛒</text>
      <text class="empty-text">购物车还是空的</text>
      <view class="empty-btn" @click="goHome"><text>去逛逛</text></view>
    </view>

    <template v-else>
      <!-- 有效商品列表 -->
      <view class="cart-list">
        <view v-for="item in validList" :key="item.id" class="cart-item">
          <view
            class="checkbox"
            :class="{ checked: item.checked }"
            @click="onToggle(item)"
          ><text v-if="item.checked">✓</text></view>

          <view class="cover" :style="{ backgroundColor: item.color }">
            <image v-if="item.cover" class="cover-img" :src="item.cover" mode="aspectFill" />
            <text v-else class="cover-fallback">{{ item.title.slice(0, 1) }}</text>
          </view>

          <view class="item-info">
            <text class="item-title">{{ item.title }}</text>
            <text class="item-spec">{{ item.spec }}</text>
            <view class="item-bottom">
              <text class="item-price">¥{{ fen2yuan(item.price) }}</text>
              <view class="stepper">
                <view class="stepper-btn" :class="{ disabled: item.quantity <= 1 }" @click="onQty(item, -1)"><text>−</text></view>
                <text class="stepper-num">{{ item.quantity }}</text>
                <view class="stepper-btn" @click="onQty(item, 1)"><text>+</text></view>
              </view>
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
            <text class="cover-fallback">{{ item.title.slice(0, 1) }}</text>
          </view>
          <view class="item-info">
            <text class="item-title">{{ item.title }}</text>
            <text class="item-spec">{{ item.spec }}</text>
          </view>
          <text class="invalid-tag">失效</text>
        </view>
      </view>

      <!-- 底部结算栏：金额为服务端计算的 checkedAmount -->
      <view class="footer-bar">
        <view class="check-all" @click="onCheckAll">
          <view class="checkbox" :class="{ checked: isAllChecked }"><text v-if="isAllChecked">✓</text></view>
          <text class="check-all-text">全选</text>
        </view>
        <view class="footer-total">
          <text class="footer-total-label">合计:</text>
          <text class="footer-total-price">¥{{ fen2yuan(checkedAmount) }}</text>
        </view>
        <view
          class="footer-settle"
          :class="{ disabled: !checkedCount }"
          @click="goConfirm"
        >
          <text>去结算({{ checkedCount }})</text>
        </view>
      </view>
    </template>
  </view>
</template>

<script setup>
/** 购物车页逻辑（Vue3 setup） */
import { ref, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { cartApi } from '../api/index.js'
import { fen2yuan } from '../utils/format.js'

/** 购物车列表（服务端返回，含失效标记） */
const cartList = ref([])
/** 已选件数与合计（均为服务端计算口径，PRD §③） */
const checkedCount = ref(0)
const checkedAmount = ref(0)
const loading = ref(false)

/** 有效商品（可结算） */
const validList = computed(() => cartList.value.filter((i) => !i.invalid))
/** 失效商品（已下架/库存为 0） */
const invalidList = computed(() => cartList.value.filter((i) => i.invalid))
/** 全选状态：有效商品全部选中 */
const isAllChecked = computed(() =>
  validList.value.length > 0 && validList.value.every((i) => i.checked)
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

onShow(loadCart)

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
 */
async function onQty(item, delta) {
  const next = item.quantity + delta
  if (next < 1) return
  try {
    await cartApi.updateQty({ id: item.id, quantity: next })
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

/** 去结算：携带选中且有效项的 id 列表（结算页据此取明细，金额仍以服务端为准） */
function goConfirm() {
  const ids = validList.value.filter((i) => i.checked).map((i) => i.id)
  if (!ids.length) return
  uni.navigateTo({ url: `/pages/mall/confirm/index?ids=${ids.join(',')}` })
}

function goHome() {
  uni.switchTab({ url: '/pages/wallpaper/home/index' })
}
</script>

<style scoped>
.cart-page {
  min-height: 100vh;
  background-color: #f5f6f8;
  padding-bottom: 160rpx;
}

.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 240rpx;
  gap: 24rpx;
}

.empty-icon {
  font-size: 96rpx;
}

.empty-text {
  font-size: 28rpx;
  color: #999999;
}

.empty-btn {
  padding: 16rpx 64rpx;
  background-color: #e24b4a;
  border-radius: 40rpx;
  color: #ffffff;
  font-size: 28rpx;
}

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
  gap: 20rpx;
  background-color: #ffffff;
  border-radius: 16rpx;
  padding: 24rpx;
}

.cart-item.invalid {
  opacity: 0.5;
}

.checkbox {
  width: 40rpx;
  height: 40rpx;
  border-radius: 50%;
  border: 2rpx solid #dddddd;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24rpx;
  color: #ffffff;
  flex-shrink: 0;
}

.checkbox.checked {
  background-color: #e24b4a;
  border-color: #e24b4a;
}

.cover {
  width: 160rpx;
  height: 160rpx;
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
  font-size: 56rpx;
  color: rgba(255, 255, 255, 0.85);
}

.item-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  overflow: hidden;
}

.item-title {
  font-size: 28rpx;
  color: #222222;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-spec {
  font-size: 22rpx;
  color: #999999;
  background-color: #f5f6f8;
  align-self: flex-start;
  padding: 4rpx 12rpx;
  border-radius: 6rpx;
}

.item-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 8rpx;
}

.item-price {
  font-size: 30rpx;
  color: #e24b4a;
  font-weight: 500;
}

.stepper {
  display: flex;
  align-items: center;
  gap: 4rpx;
}

.stepper-btn {
  width: 48rpx;
  height: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f6f8;
  border-radius: 8rpx;
  font-size: 28rpx;
  color: #222222;
}

.stepper-btn.disabled {
  color: #cccccc;
}

.stepper-num {
  width: 64rpx;
  text-align: center;
  font-size: 26rpx;
}

.item-remove {
  position: absolute;
  top: 20rpx;
  right: 24rpx;
  font-size: 24rpx;
  color: #999999;
}

.invalid-block {
  margin: 24rpx;
  background-color: #ffffff;
  border-radius: 16rpx;
  padding: 24rpx;
}

.invalid-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20rpx;
}

.invalid-title {
  font-size: 26rpx;
  color: #999999;
}

.invalid-clear {
  font-size: 24rpx;
  color: #378add;
}

.invalid-tag {
  font-size: 22rpx;
  color: #999999;
}

.footer-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  background-color: #ffffff;
  padding: 16rpx 24rpx calc(16rpx + env(safe-area-inset-bottom));
  gap: 20rpx;
}

.check-all {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.check-all-text {
  font-size: 26rpx;
  color: #666666;
}

.footer-total {
  flex: 1;
  display: flex;
  align-items: baseline;
  justify-content: flex-end;
  gap: 8rpx;
}

.footer-total-label {
  font-size: 24rpx;
  color: #666666;
}

.footer-total-price {
  font-size: 34rpx;
  color: #e24b4a;
  font-weight: 500;
}

.footer-settle {
  padding: 20rpx 48rpx;
  background-color: #e24b4a;
  border-radius: 44rpx;
  color: #ffffff;
  font-size: 28rpx;
}

.footer-settle.disabled {
  opacity: 0.4;
}
</style>
