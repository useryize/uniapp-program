<template>
  <view class="wx-page">
    <weather-nav title="空气质量">
      <template #right>
        <text class="nav-city">{{ city.short || city.name }}</text>
      </template>
    </weather-nav>

    <scroll-view class="page-scroll" scroll-y>
      <!-- AQI 主卡 -->
      <view class="aqi-card">
        <view class="aqi-ring">
          <view class="ring-track" />
          <view class="ring-arc" :style="{ borderTopColor: air.color, borderRightColor: air.color }" />
          <view class="aqi-center">
            <text class="aqi-value">{{ air.aqi ?? '—' }}</text>
            <text class="aqi-level">{{ air.level }}</text>
          </view>
        </view>
        <view class="aqi-text">
          <text class="aqi-title">空气质量{{ air.level }}</text>
          <text class="aqi-desc">{{ air.advice }}</text>
          <text class="aqi-time">更新于 {{ air.updatedAt || '—' }}</text>
        </view>
      </view>

      <!-- 污染物明细 -->
      <view class="card list-card">
        <view class="list-head">
          <text class="list-title">污染物浓度</text>
          <text class="list-unit">μg/m³</text>
        </view>
        <view v-for="p in air.items" :key="p.key" class="poll-row">
          <text class="poll-name">{{ p.name }}</text>
          <view class="poll-track">
            <view class="poll-fill" :style="{ width: (p.ratio * 100) + '%', background: p.color }" />
          </view>
          <text class="poll-value">{{ p.value ?? '—' }}</text>
          <text class="poll-level" :style="{ color: p.color }">{{ p.level }}</text>
        </view>
      </view>

      <!-- 健康建议 -->
      <view class="advice-card">
        <view class="advice-icon">
          <view class="bulb" />
        </view>
        <text class="advice-text">{{ air.advice }}</text>
      </view>

      <view class="scroll-bottom" />
    </scroll-view>
  </view>
</template>

<script setup>
/**
 * 空气质量（设计稿 06）
 */
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import weatherApi from '../api'
import WeatherNav from '../components/weather-nav.vue'

const city = ref({})
const air = ref({ level: '—', color: '#9AA5B4', aqi: null, items: [] })

onLoad(async () => {
  try {
    const c = weatherApi.getCurrentCity()
    city.value = c
    const data = await weatherApi.getWeather(c)
    air.value = data.airQuality
  } catch (e) {
    uni.showToast({ title: e.msg || '加载失败', icon: 'none' })
  }
})
</script>

<style lang="scss" scoped>
@import '../styles/tokens.scss';

.wx-page {
  min-height: 100vh;
  background: $wx-bg;
}

.nav-city {
  font-size: 26rpx;
  color: $wx-text-3;
}

.page-scroll {
  height: calc(100vh - 180rpx);
}

/* AQI 主卡 */
.aqi-card {
  display: flex;
  align-items: center;
  gap: 32rpx;
  margin: 8rpx $wx-page-pad 28rpx;
  padding: 40rpx 36rpx;
  background: $wx-grad-aqi;
  border-radius: $wx-radius-card;
}

.aqi-ring {
  width: 192rpx;
  height: 192rpx;
  position: relative;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ring-track {
  position: absolute;
  left: 0;
  top: 0;
  width: 192rpx;
  height: 192rpx;
  border-radius: 50%;
  border: 18rpx solid rgba(255, 255, 255, 0.26);
}

.ring-arc {
  position: absolute;
  left: 0;
  top: 0;
  width: 192rpx;
  height: 192rpx;
  border-radius: 50%;
  border: 18rpx solid transparent;
  border-top-color: #FFFFFF;
  border-right-color: #FFFFFF;
  transform: rotate(45deg);
}

.aqi-center {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4rpx;
}

.aqi-value {
  font-size: $wx-fs-aqi;
  font-weight: 600;
  line-height: 1.05;
  color: #FFFFFF;
}

.aqi-level {
  font-size: 26rpx;
  color: #D8F5EA;
}

.aqi-text {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 14rpx;
}

.aqi-title {
  font-size: 40rpx;
  font-weight: 600;
  color: #FFFFFF;
}

.aqi-desc {
  font-size: $wx-fs-desc;
  color: #D8F5EA;
  line-height: 36rpx;
}

.aqi-time {
  font-size: $wx-fs-cap;
  color: #A8E6D0;
}

/* 污染物 */
.card {
  background: $wx-card;
  border-radius: $wx-radius-card;
  box-shadow: $wx-shadow-card;
  margin: 0 $wx-page-pad 28rpx;
}

.list-card {
  padding: 32rpx $wx-page-pad 16rpx;
}

.list-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12rpx;
}

.list-title {
  font-size: $wx-fs-title;
  font-weight: 600;
  color: $wx-text-1;
}

.list-unit {
  font-size: $wx-fs-cap;
  color: $wx-text-3;
}

.poll-row {
  display: flex;
  align-items: center;
  gap: 20rpx;
  padding: 22rpx 0;
}

.poll-name {
  width: 112rpx;
  font-size: 26rpx;
  color: $wx-text-1;
}

.poll-track {
  flex: 1;
  height: 12rpx;
  background: $wx-line-3;
  border-radius: 6rpx;
  overflow: hidden;
}

.poll-fill {
  height: 100%;
  border-radius: 6rpx;
  min-width: 12rpx;
}

.poll-value {
  width: 72rpx;
  text-align: right;
  font-size: 26rpx;
  font-weight: 600;
  color: $wx-text-1;
}

.poll-level {
  width: 88rpx;
  text-align: right;
  font-size: $wx-fs-cap;
}

/* 建议 */
.advice-card {
  display: flex;
  align-items: center;
  gap: 22rpx;
  margin: 0 $wx-page-pad;
  padding: 28rpx;
  background: $wx-green-soft;
  border-radius: $wx-radius-md;
}

.advice-icon {
  width: 40rpx;
  height: 40rpx;
  border-radius: 50%;
  background: rgba(16, 185, 129, 0.18);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.bulb {
  width: 20rpx;
  height: 20rpx;
  border-radius: 50%;
  border: 4rpx solid $wx-green;
  margin-top: -6rpx;
}

.advice-text {
  flex: 1;
  font-size: $wx-fs-desc;
  color: $wx-green-ink;
  line-height: 36rpx;
}

.scroll-bottom {
  height: 60rpx;
}
</style>
