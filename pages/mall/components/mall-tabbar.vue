<template>
  <view class="tabbar-shell">
    <view class="tabbar-pill">
      <view
        v-for="item in items"
        :key="item.key"
        class="tabbar-item"
        :class="{ active: current === item.key }"
        @click="switchTo(item.path)"
      >
        <image class="tabbar-icon" :src="current === item.key ? item.on : item.off" mode="aspectFit" />
        <text class="tabbar-label">{{ item.label }}</text>
      </view>
    </view>
  </view>
</template>

<script setup>
defineProps({ current: { type: String, required: true } })

const items = [
  { key: 'home', label: '首页', path: '/pages/mall/index', off: '/static/tabbar/home_off.png', on: '/static/tabbar/home_on.png' },
  { key: 'category', label: '分类', path: '/pages/mall/category/index', off: '/static/tabbar/category_off.png', on: '/static/tabbar/category_on.png' },
  { key: 'cart', label: '购物车', path: '/pages/mall/cart/index', off: '/static/tabbar/cart_off.png', on: '/static/tabbar/cart_on.png' },
  { key: 'person', label: '我的', path: '/pages/wallpaper/person/index', off: '/static/tabbar/user_off.png', on: '/static/tabbar/user_on.png' }
]

function switchTo(path) {
  uni.switchTab({ url: path })
}
</script>

<style lang="scss" scoped>
@import "../../../uni.scss";
.tabbar-shell {
  position: fixed;
  z-index: 30;
  left: 0;
  right: 0;
  bottom: 0;
  height: 192rpx;
  padding: 0 40rpx;
  display: flex;
  align-items: center;
  background: $rz-white;
  border: 2rpx solid $rz-line;
  box-sizing: border-box;
}

.tabbar-pill {
  width: 100%;
  height: 124rpx;
  display: flex;
  border: 4rpx solid $rz-ink;
  border-radius: 70rpx;
  box-sizing: border-box;
  overflow: hidden;
}

.tabbar-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4rpx;
  color: $rz-grey-500;
}

.tabbar-item.active {
  color: $rz-ink;
  background: $rz-acid;
  border-radius: 70rpx;
}

.tabbar-icon {
  width: 36rpx;
  height: 36rpx;
}

.tabbar-label {
  font-size: 20rpx;
}
</style>
