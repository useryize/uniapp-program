<template>
  <view class="wallpaper-tabbar">
    <navigator
      v-for="item in items"
      :key="item.key"
      class="wallpaper-tab"
      :class="{ active: current === item.key }"
      :url="current === item.key ? '' : item.path"
      open-type="redirect"
      hover-class="none"
    >
      <uni-icons :type="current === item.key ? item.activeIcon : item.icon" size="22" :color="current === item.key ? '#1677ff' : '#888888'" />
      <text>{{ item.label }}</text>
    </navigator>
  </view>
</template>

<script setup>
defineProps({ current: { type: String, required: true } })

const items = [
  { key: 'home', label: '首页', path: '/pages/wallpaper/home/index', icon: 'home', activeIcon: 'home-filled' },
  { key: 'find', label: '精选', path: '/pages/wallpaper/find/index', icon: 'image', activeIcon: 'image-filled' }
]
</script>

<style scoped>
.wallpaper-tabbar {
  position: fixed;
  z-index: 30;
  left: 0;
  right: 0;
  bottom: 0;
  height: calc(112rpx + env(safe-area-inset-bottom));
  padding-bottom: env(safe-area-inset-bottom);
  box-sizing: border-box;
  display: flex;
  background: #ffffff;
  border-top: 1px solid #e8e8e8;
}

.wallpaper-tab {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4rpx;
  color: #888888;
  font-size: 20rpx;
}

.wallpaper-tab.active {
  color: #1677ff;
}
</style>
