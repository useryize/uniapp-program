<template>
  <view class="tabbar-shell">
    <view class="tabbar-pill">
      <navigator
        v-for="item in items"
        :key="item.key"
        class="tabbar-item"
        :class="{ active: current === item.key }"
        :url="current === item.key ? '' : item.path"
        open-type="redirect"
        hover-class="none"
      >
        <image class="tabbar-icon" :src="item.icon" mode="aspectFit" />
        <text class="tabbar-label">{{ item.label }}</text>
      </navigator>
    </view>
  </view>
</template>

<script setup>
defineProps({ current: { type: String, required: true } })

const items = [
  { key: 'home', label: '首页', path: '/pages/mall/index', icon: '/static/mall/ardot/tab-home.png' },
  { key: 'category', label: '分类', path: '/pages/mall/category/index', icon: '/static/mall/ardot/tab-category.png' },
  { key: 'cart', label: '购物车', path: '/pages/mall/cart/index', icon: '/static/mall/ardot/tab-cart.png' },
  { key: 'person', label: '我的', path: '/pages/mall/person/index', icon: '/static/mall/ardot/tab-person.png' }
]

</script>

<style lang="scss" scoped>
@import "../styles/tokens.scss";
.tabbar-shell {
  position: fixed;
  z-index: 30;
  left: 0;
  right: 0;
  bottom: 0;
  height: calc(192rpx + env(safe-area-inset-bottom));
  padding: 0 40rpx env(safe-area-inset-bottom);
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
  padding: 8rpx;
  gap: 8rpx;
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
