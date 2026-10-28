<template>
  <view class="wx-tabbar">
    <view class="pill">
      <view
        v-for="item in items"
        :key="item.key"
        class="tab"
        :class="{ 'tab--active': current === item.key }"
        @click="onTap(item)"
      >
        <view class="tab-icon">
          <view v-if="item.key === 'home'" class="ico ico-home" :class="{ 'ico-home--on': current === item.key }" />
          <view v-else-if="item.key === 'trend'" class="ico ico-trend" :class="{ 'ico-trend--on': current === item.key }" />
          <view v-else-if="item.key === 'index'" class="ico ico-grid" :class="{ 'ico-grid--on': current === item.key }" />
          <view v-else class="ico ico-radar" :class="{ 'ico-radar--on': current === item.key }" />
        </view>
        <text class="tab-label">{{ item.label }}</text>
      </view>
    </view>
  </view>
</template>

<script setup>
/**
 * 底部胶囊导航
 * 对应设计稿：高度 62px / 圆角 36px / 1px 描边 / 激活项填主色
 */
const props = defineProps({
  /** 当前激活项：home / trend / index / radar */
  current: { type: String, required: true }
})

const items = [
  { key: 'home', label: '首页', url: '/pages/weather/home/index' },
  { key: 'trend', label: '趋势', url: '/pages/weather/detail/trend' },
  { key: 'index', label: '指数', url: '/pages/weather/detail/indices' },
  { key: 'radar', label: '雷达', url: '/pages/weather/explore/radar' }
]

const onTap = (item) => {
  if (item.key === props.current) return
  uni.redirectTo({ url: item.url })
}
</script>

<style lang="scss" scoped>
@import '../styles/tokens.scss';

.wx-tabbar {
  position: fixed;
  z-index: 30;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 24rpx 42rpx calc(42rpx + env(safe-area-inset-bottom));
  box-sizing: border-box;
  pointer-events: none;
}

.pill {
  display: flex;
  align-items: stretch;
  height: 124rpx;
  padding: 8rpx;
  box-sizing: border-box;
  background: #FFFFFF;
  border-radius: $wx-radius-pill;
  border: 2rpx solid #E6EBF1;
  box-shadow: $wx-shadow-pill;
  pointer-events: auto;
}

.tab {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
  border-radius: 52rpx;
}

.tab--active {
  background: $wx-blue;
}

.tab-label {
  font-size: $wx-fs-tab;
  font-weight: 500;
  letter-spacing: 1rpx;
  color: #9AA5B4;
}

.tab--active .tab-label {
  color: #FFFFFF;
  font-weight: 600;
}

/* 图标：纯 CSS 绘制，避免额外资源 */
.ico {
  width: 36rpx;
  height: 36rpx;
  position: relative;
}

.ico-home {
  border: 4rpx solid #9AA5B4;
  border-top: none;
  border-radius: 0 0 8rpx 8rpx;
  width: 30rpx;
  height: 22rpx;
  margin-top: 14rpx;
}

.ico-home::before {
  content: '';
  position: absolute;
  left: 50%;
  top: -12rpx;
  transform: translateX(-50%) rotate(45deg);
  width: 22rpx;
  height: 22rpx;
  border-top: 4rpx solid #9AA5B4;
  border-left: 4rpx solid #9AA5B4;
  border-radius: 3rpx;
  background: transparent;
}

.ico-home--on {
  border-color: #FFFFFF;
}
.ico-home--on::before {
  border-color: #FFFFFF;
}

.ico-trend::before {
  content: '';
  position: absolute;
  left: 0;
  top: 10rpx;
  width: 36rpx;
  height: 4rpx;
  background: #9AA5B4;
  border-radius: 2rpx;
  transform: rotate(-28deg);
}

.ico-trend::after {
  content: '';
  position: absolute;
  right: 0;
  top: 2rpx;
  width: 12rpx;
  height: 12rpx;
  border-radius: 50%;
  background: #9AA5B4;
}

.ico-trend--on::before {
  background: #FFFFFF;
}
.ico-trend--on::after {
  background: #FFFFFF;
}

.ico-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 5rpx;
  align-content: center;
  justify-content: center;
}

.ico-grid::before,
.ico-grid::after {
  content: '';
  width: 14rpx;
  height: 14rpx;
  border: 4rpx solid #9AA5B4;
  border-radius: 4rpx;
}

.ico-grid::after {
  box-shadow: 18rpx 0 0 -4rpx transparent, 0 18rpx 0 -4rpx transparent, 18rpx 18rpx 0 -4rpx transparent;
  border-color: #9AA5B4;
  background: transparent;
}

.ico-grid--on::before,
.ico-grid--on::after {
  border-color: #FFFFFF;
}

.ico-radar {
  border: 4rpx solid #9AA5B4;
  border-radius: 50%;
}

.ico-radar::before {
  content: '';
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 16rpx;
  height: 16rpx;
  border: 4rpx solid #9AA5B4;
  border-radius: 50%;
}

.ico-radar::after {
  content: '';
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 6rpx;
  height: 6rpx;
  border-radius: 50%;
  background: #9AA5B4;
}

.ico-radar--on {
  border-color: #FFFFFF;
}
.ico-radar--on::before {
  border-color: #FFFFFF;
}
.ico-radar--on::after {
  background: #FFFFFF;
}
</style>
