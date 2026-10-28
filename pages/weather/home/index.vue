<template>
  <view class="wx-home">
    <!-- Hero：深蓝渐变 -->
    <view class="hero">
      <!-- 城市栏 -->
      <view class="city-bar">
        <view class="city-left" @click="onSwitchCity">
          <view class="ico-pin" />
          <text class="city-name">{{ city.short || city.name }}</text>
          <view class="ico-chevron" />
        </view>
        <view class="city-right">
          <view class="ico-search" @click="onSearch" />
          <view class="ico-more" @click="onMore" />
        </view>
      </view>

      <!-- 主温度区 -->
      <view class="main-temp">
        <view class="temp-left">
          <text class="temp-value">{{ current.tempText }}</text>
          <view class="desc-row">
            <text class="desc-text">{{ current.condition }}</text>
            <text class="desc-feel">体感 {{ current.feelsText }}</text>
          </view>
        </view>
        <image class="hero-icon" :src="heroIcon" mode="aspectFit" />
      </view>

      <!-- 玻璃指标卡 -->
      <view class="glass-card">
        <view v-for="m in metrics" :key="m.label" class="metric">
          <text class="metric-label">{{ m.label }}</text>
          <text class="metric-value">{{ m.value }}</text>
        </view>
      </view>
    </view>

    <!-- 内容区 -->
    <view class="content">
      <!-- 24小时预报 -->
      <view class="card">
        <view class="card-head">
          <text class="card-title">24小时预报</text>
          <text class="card-link" @click="goHourly">逐时详情 ›</text>
        </view>
        <scroll-view class="hour-scroll" scroll-x :show-scrollbar="false">
          <view class="hour-row">
            <view v-for="(h, i) in hourlyPreview" :key="i" class="hour-item">
              <text class="hour-time" :class="{ 'hour-time--now': i === 0 }">{{ i === 0 ? '现在' : h.time }}</text>
              <image class="hour-icon" :src="iconUrl(h.icon)" mode="aspectFit" />
              <text class="hour-temp">{{ round(h.temp) }}°</text>
            </view>
          </view>
        </scroll-view>
      </view>

      <!-- 7日预报 -->
      <view class="card">
        <view class="card-head">
          <text class="card-title">7日预报</text>
          <text class="card-link" @click="goTrend">15天预报 ›</text>
        </view>
        <view class="week-row">
          <view v-for="d in dailyPreview" :key="d.iso" class="week-item">
            <text class="week-day" :class="{ 'week-day--now': d.isToday }">{{ d.isToday ? '今天' : d.weekday }}</text>
            <image class="week-icon" :src="iconUrl(d.icon)" mode="aspectFit" />
            <text class="week-high">{{ round(d.high) }}°</text>
            <text class="week-low">{{ round(d.low) }}°</text>
          </view>
        </view>
      </view>

      <!-- 空气质量 -->
      <view class="card air-card" @click="goAir">
        <view class="air-left">
          <text class="air-title">空气质量 · {{ airQuality.level }}</text>
          <text class="air-desc">AQI {{ airQuality.aqi ?? '—' }}　PM2.5 {{ airQuality.pm25 ?? '—' }} μg/m³</text>
        </view>
        <view class="air-ring">
          <view class="air-ring-fill" :style="{ background: airQuality.color }" />
        </view>
      </view>

      <!-- 今日提醒 -->
      <view v-if="tips" class="tip-bar">
        <view class="tip-icon" />
        <text class="tip-text">{{ tips }}</text>
      </view>
    </view>

    <!-- 错误态 -->
    <view v-if="error" class="error-layer">
      <text class="error-title">{{ error }}</text>
      <view class="error-btn" @click="load">重新加载</view>
    </view>

    <weather-tabbar current="home" />
  </view>
</template>

<script setup>
/**
 * 首页 · 当前天气（设计稿 01）
 * 数据源：Open-Meteo，适配器输出见 api/weather.js
 */
import { ref, computed } from 'vue'
import { onShow, onPullDownRefresh } from '@dcloudio/uni-app'
import weatherApi from '../api'
import WeatherTabbar from '../components/weather-tabbar.vue'

const city = ref({})
const current = ref({})
const hourly = ref([])
const daily = ref([])
const airQuality = ref({})
const tips = ref('')
const error = ref('')

const round = (v) => (v == null ? '--' : Math.round(v))
const iconUrl = (icon) => `/static/weather/icons/${icon || 'sunny'}.png`

const hourlyPreview = computed(() => hourly.value.slice(0, 8))
const dailyPreview = computed(() =>
  daily.value.slice(0, 7).map((d, i) => ({ ...d, isToday: i === 0 }))
)

const heroIcon = computed(() => {
  const key = current.value.icon || 'sunny'
  return `/static/weather/icons/${key}-light.png`
})

const metrics = computed(() => {
  const c = current.value
  return [
    { label: '湿度', value: c.humidity != null ? `${c.humidity}%` : '—' },
    { label: '风力', value: c.windText || '—' },
    { label: '降水概率', value: c.precipProbability != null ? `${c.precipProbability}%` : '—' },
    { label: '气压', value: c.pressure != null ? `${Math.round(c.pressure)}` : '—' }
  ]
})

/** 加载数据 */
async function load() {
  error.value = ''
  try {
    const target = weatherApi.getCurrentCity()
    city.value = target
    const data = await weatherApi.getWeather(target)
    current.value = data.current
    hourly.value = data.hourly
    daily.value = data.daily
    airQuality.value = data.airQuality
    tips.value = data.tips
  } catch (e) {
    error.value = e && e.msg ? e.msg : '加载失败，请稍后重试'
  }
}

const onSwitchCity = () => uni.navigateTo({ url: '/pages/weather/city/manage' })
const onSearch = () => uni.navigateTo({ url: '/pages/weather/city/search' })
const onMore = () => uni.showToast({ title: '设置功能开发中', icon: 'none' })
const goHourly = () => uni.navigateTo({ url: '/pages/weather/detail/hourly' })
const goTrend = () => uni.navigateTo({ url: '/pages/weather/detail/trend' })
const goAir = () => uni.navigateTo({ url: '/pages/weather/detail/air' })

onShow(() => {
  load()
})

onPullDownRefresh(async () => {
  await load()
  uni.stopPullDownRefresh()
})
</script>

<style lang="scss" scoped>
@import '../styles/tokens.scss';

.wx-home {
  min-height: 100vh;
  background: $wx-bg;
  padding-bottom: 160rpx;
}

/* Hero */
.hero {
  background: $wx-grad-hero;
  padding: 0 $wx-page-pad 48rpx;
}

.city-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 96rpx;
}

.city-left {
  display: flex;
  align-items: center;
  gap: 10rpx;
}

.city-name {
  font-size: 34rpx;
  font-weight: 600;
  color: #FFFFFF;
}

.ico-pin {
  width: 26rpx;
  height: 26rpx;
  border: 4rpx solid #FFFFFF;
  border-radius: 50% 50% 50% 4rpx;
  transform: rotate(-45deg);
  margin-top: -4rpx;
}

.ico-chevron {
  width: 14rpx;
  height: 14rpx;
  border-right: 4rpx solid #FFFFFF;
  border-bottom: 4rpx solid #FFFFFF;
  transform: rotate(45deg);
  margin-top: -6rpx;
}

.city-right {
  display: flex;
  align-items: center;
  gap: 32rpx;
}

.ico-search {
  width: 34rpx;
  height: 34rpx;
  border: 4rpx solid #FFFFFF;
  border-radius: 50%;
  position: relative;
}

.ico-search::after {
  content: '';
  position: absolute;
  right: -12rpx;
  bottom: -8rpx;
  width: 14rpx;
  height: 4rpx;
  background: #FFFFFF;
  transform: rotate(45deg);
  border-radius: 2rpx;
}

.ico-more {
  width: 36rpx;
  height: 8rpx;
  position: relative;
}

.ico-more::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  width: 8rpx;
  height: 8rpx;
  border-radius: 50%;
  background: #FFFFFF;
  box-shadow: 14rpx 0 0 #FFFFFF, 28rpx 0 0 #FFFFFF;
}

/* 主温度 */
.main-temp {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 0 36rpx;
}

.temp-left {
  display: flex;
  flex-direction: column;
}

.temp-value {
  font-size: $wx-fs-temp;
  font-weight: 300;
  line-height: 1.05;
  letter-spacing: -8rpx;
  color: #FFFFFF;
}

.desc-row {
  display: flex;
  align-items: center;
  gap: 20rpx;
  margin-top: 8rpx;
}

.desc-text {
  font-size: 32rpx;
  font-weight: 600;
  color: #FFFFFF;
}

.desc-feel {
  font-size: 26rpx;
  color: $wx-text-4;
}

.hero-icon {
  width: 184rpx;
  height: 184rpx;
  flex-shrink: 0;
}

/* 玻璃指标卡 */
.glass-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 28rpx 24rpx;
  border-radius: $wx-radius-card;
  background: rgba(255, 255, 255, 0.18);
  /* backdrop-filter 在小程序端支持有限，用半透明纯色兜底 */
}

.metric {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10rpx;
  flex: 1;
}

.metric-label {
  font-size: $wx-fs-cap;
  color: $wx-text-4;
}

.metric-value {
  font-size: $wx-fs-value;
  font-weight: 600;
  color: #FFFFFF;
}

/* 内容区 */
.content {
  padding: 28rpx $wx-page-pad 0;
  display: flex;
  flex-direction: column;
  gap: $wx-gap;
}

.card {
  background: $wx-card;
  border-radius: $wx-radius-card;
  padding: 32rpx $wx-page-pad;
  box-shadow: $wx-shadow-card;
}

.card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24rpx;
}

.card-title {
  font-size: $wx-fs-title;
  font-weight: 600;
  color: $wx-text-1;
}

.card-link {
  font-size: $wx-fs-desc;
  color: $wx-blue;
}

/* 24小时 */
.hour-scroll {
  width: 100%;
  white-space: nowrap;
}

.hour-row {
  display: flex;
  gap: 28rpx;
  padding-bottom: 4rpx;
}

.hour-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14rpx;
  min-width: 72rpx;
}

.hour-time {
  font-size: $wx-fs-cap;
  color: $wx-text-2;
}

.hour-time--now {
  color: $wx-blue;
  font-weight: 600;
}

.hour-icon {
  width: 48rpx;
  height: 48rpx;
}

.hour-temp {
  font-size: 30rpx;
  font-weight: 600;
  color: $wx-text-1;
}

/* 7日 */
.week-row {
  display: flex;
  justify-content: space-between;
}

.week-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10rpx;
}

.week-day {
  font-size: $wx-fs-cap;
  color: $wx-text-2;
}

.week-day--now {
  color: $wx-blue;
  font-weight: 600;
}

.week-icon {
  width: 44rpx;
  height: 44rpx;
}

.week-high {
  font-size: 28rpx;
  font-weight: 600;
  color: $wx-text-1;
}

.week-low {
  font-size: 22rpx;
  font-weight: 500;
  color: $wx-text-3;
}

/* 空气质量 */
.air-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.air-left {
  display: flex;
  flex-direction: column;
  gap: 10rpx;
  flex: 1;
}

.air-title {
  font-size: 30rpx;
  font-weight: 600;
  color: $wx-text-1;
}

.air-desc {
  font-size: $wx-fs-desc;
  color: $wx-text-2;
}

.air-ring {
  width: 88rpx;
  height: 88rpx;
  border-radius: 50%;
  border: 8rpx solid $wx-line-3;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.air-ring-fill {
  width: 48rpx;
  height: 48rpx;
  border-radius: 50%;
}

/* 提示条 */
.tip-bar {
  display: flex;
  align-items: center;
  gap: 18rpx;
  padding: 26rpx 28rpx;
  border-radius: $wx-radius-md;
  background: $wx-amber-soft;
}

.tip-icon {
  width: 32rpx;
  height: 32rpx;
  border-radius: 8rpx;
  background: $wx-amber;
  position: relative;
  flex-shrink: 0;
}

.tip-icon::after {
  content: '';
  position: absolute;
  left: 50%;
  top: 8rpx;
  transform: translateX(-50%);
  width: 4rpx;
  height: 12rpx;
  background: #FFFFFF;
  border-radius: 2rpx;
}

.tip-text {
  flex: 1;
  font-size: $wx-fs-desc;
  color: $wx-amber-ink;
  line-height: 36rpx;
}

/* 错误态 */
.error-layer {
  position: fixed;
  left: 0;
  right: 0;
  top: 45%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 32rpx;
}

.error-title {
  font-size: $wx-fs-body;
  color: $wx-text-2;
}

.error-btn {
  padding: 20rpx 56rpx;
  border-radius: $wx-radius-sm;
  background: $wx-blue;
  color: #FFFFFF;
  font-size: $wx-fs-body;
}
</style>
