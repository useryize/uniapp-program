<!--
  个人中心（pages/wallpaper/person/index）—— tabBar「我的」
  说明：该页是全 App 共用的用户中心，同时承载商城订单入口与服装电商能力
        （尺码档案 / 发售提醒），壁纸模块功能保留在功能宫格内
  视觉：街头潮流 —— 墨黑头部 + 酸性黄强调 + 2px 硬描边
-->
<template>
  <view class="person">
    <!-- 用户头部 -->
    <view class="user-head">
      <view class="user-row" @click="handleLogin">
        <view class="avatar">
          <image v-if="isLogin && userInfo.avatarUrl" class="avatar-img" :src="userInfo.avatarUrl" mode="aspectFill" />
          <text v-else class="avatar-text">R</text>
        </view>
        <view class="user-info">
          <text class="user-name">{{ isLogin ? userInfo.nickName : '点击登录' }}</text>
          <text class="user-level">VIP2 黑卡会员  ·  积分 2,480</text>
        </view>
      </view>
    </view>

    <!-- 我的订单 -->
    <view class="panel">
      <view class="panel-head">
        <text class="panel-title">我的订单</text>
        <text class="panel-more" @click="goOrderList">全部订单 ></text>
      </view>
      <view class="order-entries">
        <view
          v-for="o in orderEntries"
          :key="o.key"
          class="order-entry"
          @click="goOrderList(o.key)"
        >
          <image class="order-entry-img" :src="o.icon" mode="aspectFit" />
          <text class="order-entry-text">{{ o.label }}</text>
        </view>
      </view>
    </view>

    <!-- 功能宫格 -->
    <view class="panel">
      <view class="func-grid">
        <view
          v-for="f in funcList"
          :key="f.key"
          class="func-item"
          @click="onFunc(f)"
        >
          <image class="func-img" :src="f.icon" mode="aspectFit" />
          <text class="func-text">{{ f.label }}</text>
        </view>
      </view>
    </view>

    <!-- 发售提醒 -->
    <view class="drop-card" @click="goDrop">
      <view class="drop-icon">
        <image class="drop-icon-img" src="/static/mall/icons/calendar.png" mode="aspectFit" />
      </view>
      <view class="drop-info">
        <text class="drop-title">发售提醒</text>
        <text class="drop-sub">{{ dropSub }}</text>
      </view>
      <image class="drop-arrow" src="/static/mall/icons/arrow_right.png" mode="aspectFit" />
    </view>

    <view v-if="isLogin" class="logout" @click="handleLogout">
      <text class="logout-text">退出登录</text>
    </view>
    <mall-tabbar current="person" />
  </view>
</template>

<script setup>
/** 个人中心逻辑（Vue3 setup） */
import { ref, reactive, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import MallTabbar from '../../mall/components/mall-tabbar.vue'
import { sizeApi, dropApi } from '../../mall/api/index.js'

const isLogin = ref(false)
const userInfo = reactive({
  avatarUrl: '',
  nickName: ''
})

/** 尺码档案（服务端返回，跨商品复用推荐结果） */
const sizeProfile = ref(null)
/** 发售提醒摘要 */
const dropSummary = ref({ soon: 0 })

/** 我的订单入口（按订单状态机） */
const orderEntries = [
  { key: 'UNPAID', label: '待付款', icon: '/static/mall/icons/clock.png' },
  { key: 'PAID', label: '待发货', icon: '/static/mall/icons/truck.png' },
  { key: 'SHIPPED', label: '待收货', icon: '/static/mall/icons/package.png' },
  { key: 'REFUND', label: '退款/售后', icon: '/static/mall/icons/refund.png' }
]

/** 功能宫格 */
const funcList = [
  { key: 'fav', label: '收藏', icon: '/static/mall/icons/heart.png' },
  { key: 'address', label: '地址', icon: '/static/mall/icons/location.png' },
  { key: 'coupon', label: '优惠券', icon: '/static/mall/icons/coupon.png' },
  { key: 'service', label: '客服', icon: '/static/mall/icons/service.png' },
  { key: 'size', label: '尺码档案', icon: '/static/mall/icons/slider.png' },
  { key: 'setting', label: '设置', icon: '/static/mall/icons/setting.png' }
]

/** 发售提醒副标 */
const dropSub = computed(() => {
  const n = dropSummary.value.soon
  return n > 0 ? `${n} 场即将开售  ·  已开启推送` : '暂无待开售场次'
})

/** 加载尺码档案与发售摘要 */
async function loadData() {
  try {
    sizeProfile.value = await sizeApi.profile()
  } catch (e) {
    // 档案读取失败不阻断
  }
  try {
    const list = await dropApi.list({})
    dropSummary.value = { soon: list.filter((d) => d.type === 'soon').length }
  } catch (e) {
    // 增强信息，失败不阻断
  }
}

onShow(() => {
  uni.hideTabBar({ animation: false })
  const cached = uni.getStorageSync('userInfo')
  if (cached) {
    userInfo.avatarUrl = cached.avatarUrl
    userInfo.nickName = cached.nickName
    isLogin.value = true
  }
  loadData()
})

/** 处理登录 */
function handleLogin() {
  if (isLogin.value) return
  // #ifdef MP-WEIXIN
  uni.getUserProfile({
    desc: '用于完善用户资料',
    success: (res) => {
      userInfo.avatarUrl = res.userInfo.avatarUrl
      userInfo.nickName = res.userInfo.nickName
      isLogin.value = true
      uni.setStorageSync('userInfo', res.userInfo)
    },
    fail: () => {
      uni.showToast({ title: '获取用户信息失败', icon: 'none' })
    }
  })
  // #endif

  // #ifdef H5
  uni.showToast({ title: '请使用微信小程序登录', icon: 'none' })
  // #endif
}

/** 处理退出登录 */
function handleLogout() {
  uni.showModal({
    title: '提示',
    content: '确定要退出登录吗？',
    success: (res) => {
      if (res.confirm) {
        uni.removeStorageSync('userInfo')
        userInfo.avatarUrl = ''
        userInfo.nickName = ''
        isLogin.value = false
        uni.showToast({ title: '已退出登录', icon: 'success' })
      }
    }
  })
}

/** 订单入口：跳订单列表并带上状态筛选 */
function goOrderList(status) {
  const url = status && status !== 'REFUND'
    ? `/pages/mall/order/list?status=${status}`
    : '/pages/mall/order/list'
  uni.navigateTo({ url })
}

/** 跳发售日历 */
function goDrop() {
  uni.navigateTo({ url: '/pages/mall/drop/index' })
}

/** 跳尺码助手 */
function goSizeGuide() {
  uni.navigateTo({ url: '/pages/mall/size-guide/index' })
}

/** 功能宫格点击 */
function onFunc(f) {
  if (f.key === 'size') return goSizeGuide()
  if (f.key === 'service') {
    uni.showToast({ title: '客服将在 9:00-22:00 为你服务', icon: 'none' })
    return
  }
  uni.showToast({ title: `${f.label}功能待交付`, icon: 'none' })
}
</script>

<style lang="scss" scoped>
@import "../../../uni.scss";
.person {
  min-height: 100vh;
  background-color: $rz-grey-50;
  padding-bottom: 192rpx;
}

/* ---- 用户头部 ---- */
.user-head {
  background-color: $rz-ink;
  padding: 40rpx $rz-page-pad 36rpx;
}

.user-row {
  display: flex;
  align-items: center;
  gap: 24rpx;
}

.avatar {
  width: 120rpx;
  height: 120rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: $rz-acid;
  flex-shrink: 0;
}

.avatar-img {
  width: 120rpx;
  height: 120rpx;
}

.avatar-text {
  font-size: 52rpx;
  font-weight: 900;
  color: $rz-ink;
}

.user-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10rpx;
  min-width: 0;
}

.user-name {
  font-size: 38rpx;
  font-weight: 900;
  color: $rz-white;
}

.user-level {
  font-size: 24rpx;
  color: $rz-acid;
}

/* ---- 面板：通栏无边框，相邻面板连续 ---- */
.panel {
  background-color: $rz-white;
  padding: 26rpx $rz-page-pad;
}

.panel + .panel {
  margin-top: 0;
}

.panel-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 26rpx;
}

.panel-title {
  font-size: 32rpx;
  font-weight: 900;
  color: $rz-ink;
}

.panel-more {
  font-size: 24rpx;
  color: $rz-grey-500;
}

/* ---- 订单入口 ---- */
.order-entries {
  display: flex;
  justify-content: space-between;
}

.order-entry {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12rpx;
  width: 25%;
}

.order-entry-img {
  width: 44rpx;
  height: 44rpx;
}

.order-entry-text {
  font-size: 22rpx;
  color: $rz-ink;
}

/* ---- 发售提醒 ---- */
.drop-card {
  display: flex;
  align-items: center;
  gap: 20rpx;
  background-color: $rz-ink;
  margin: 24rpx $rz-page-pad 0;
  padding: 26rpx $rz-page-pad;
}

.drop-icon {
  width: 64rpx;
  height: 64rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: $rz-acid;
  flex-shrink: 0;
}

.drop-icon-img {
  width: 36rpx;
  height: 36rpx;
}

.drop-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6rpx;
  min-width: 0;
}

.drop-title {
  font-size: 30rpx;
  font-weight: 700;
  color: $rz-white;
}

.drop-sub {
  font-size: 22rpx;
  color: $rz-acid;
}

.drop-arrow {
  width: 24rpx;
  height: 24rpx;
  opacity: 0.5;
  flex-shrink: 0;
}

/* ---- 功能宫格：4 列 ---- */
.func-grid {
  display: flex;
  flex-wrap: wrap;
}

.func-item {
  width: 25%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12rpx;
  padding: 20rpx 0;
}

.func-img {
  width: 44rpx;
  height: 44rpx;
}

.func-text {
  font-size: 22rpx;
  color: $rz-ink;
}

.logout {
  margin: 32rpx $rz-page-pad 0;
  height: 88rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: $rz-white;
  border: 4rpx solid $rz-ink;
}

.logout-text {
  font-size: 28rpx;
  font-weight: 700;
  color: $rz-ink;
}
</style>
