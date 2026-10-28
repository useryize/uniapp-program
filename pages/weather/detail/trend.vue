<template>
  <view class="wx-page">
    <weather-nav title="15天趋势">
      <template #right>
        <view class="unit-switch">
          <view class="unit-item" :class="{ 'unit-item--on': metric === 'temp' }" @click="metric = 'temp'">
            <text class="unit-text" :class="{ 'unit-text--on': metric === 'temp' }">温度</text>
          </view>
          <view class="unit-item" :class="{ 'unit-item--on': metric === 'precip' }" @click="metric = 'precip'">
            <text class="unit-text" :class="{ 'unit-text--on': metric === 'precip' }">降水</text>
          </view>
        </view>
      </template>
    </weather-nav>

    <scroll-view class="page-scroll" scroll-y>
      <!-- 曲线图 -->
      <view class="card chart-card">
        <text class="chart-title">{{ metric === 'temp' ? '未来 15 天最高 / 最低气温' : '未来 15 天降水概率' }}</text>

        <weather-chart
          :points="mainPoints"
          :points2="metric === 'temp' ? lowPoints : []"
          :show-second="metric === 'temp'"
          :width="622"
          :height="260"
          :color="metric === 'temp' ? '#F59E0B' : '#4C8DFF'"
          color2="#4C8DFF"
          :unit="metric === 'temp' ? '°' : '%'"
          first-label="今天"
        />

        <view class="legend">
          <view class="legend-item">
            <view class="legend-line" style="background: #F59E0B" />
            <text class="legend-text">最高温</text>
          </view>
          <view v-if="metric === 'temp'" class="legend-item">
            <view class="legend-line legend-line--dash" style="background: #4C8DFF" />
            <text class="legend-text">最低温</text>
          </view>
        </view>
      </view>

      <!-- 日出日落 -->
      <view v-if="today" class="card sun-card">
        <view class="sun-icon">
          <view class="sun-arc" />
        </view>
        <view class="sun-text">
          <text class="sun-label">日出 / 日落</text>
          <text class="sun-value">{{ today.sunrise }}　/　{{ today.sunset }}</text>
          <text class="sun-extra">昼长 {{ dayLength }}</text>
        </view>
      </view>

      <!-- 逐日明细 -->
      <view class="card list-card">
        <view v-for="(d, i) in daily" :key="d.iso" class="day-row">
          <text class="day-date">{{ d.date }} {{ d.weekday }}</text>
          <image class="day-icon" :src="`/static/weather/icons/${d.icon}.png`" mode="aspectFit" />
          <text class="day-cond">{{ d.condition }}</text>
          <text class="day-low">{{ round(d.low) }}°</text>
          <text class="day-high">{{ round(d.high) }}°</text>
        </view>
      </view>

      <view class="scroll-bottom" />
    </scroll-view>
  </view>
</template>

<script setup>
/**
 * 15天趋势（设计稿 05）
 */
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import weatherApi from '../api'
import WeatherNav from '../components/weather-nav.vue'
import WeatherChart from '../components/weather-chart.vue'

const daily = ref([])
const metric = ref('temp')

const round = (v) => (v == null ? '--' : Math.round(v))

const today = computed(() => daily.value[0] || null)

const mainPoints = computed(() =>
  daily.value.map((d) => ({
    label: d.date,
    value: metric.value === 'temp' ? (d.high ?? 0) : (d.precipProb ?? 0)
  }))
)

const lowPoints = computed(() =>
  daily.value.map((d) => ({ label: d.date, value: d.low ?? 0 }))
)

/** 昼长计算 */
const dayLength = computed(() => {
  const t = today.value
  if (!t || !t.sunrise || !t.sunset) return '—'
  const toMin = (s) => {
    const [h, m] = String(s).split(':').map(Number)
    return h * 60 + m
  }
  const diff = toMin(t.sunset) - toMin(t.sunrise)
  if (diff <= 0) return '—'
  return `${Math.floor(diff / 60)} 小时 ${diff % 60} 分`
})

onLoad(async () => {
  try {
    const city = weatherApi.getCurrentCity()
    const data = await weatherApi.getWeather(city)
    daily.value = data.daily
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

.unit-switch {
  display: flex;
  padding: 4rpx;
  background: #EFF2F7;
  border-radius: $wx-radius-xs;
}

.unit-item {
  padding: 8rpx 18rpx;
  border-radius: 18rpx;
}

.unit-item--on {
  background: $wx-card;
}

.unit-text {
  font-size: $wx-fs-cap;
  color: $wx-text-3;
}

.unit-text--on {
  color: $wx-text-1;
  font-weight: 500;
}

.page-scroll {
  height: calc(100vh - 180rpx);
}

.card {
  background: $wx-card;
  border-radius: $wx-radius-card;
  padding: 32rpx $wx-page-pad;
  box-shadow: $wx-shadow-card;
  margin: 0 $wx-page-pad 28rpx;
}

.chart-title {
  display: block;
  font-size: 30rpx;
  font-weight: 600;
  color: $wx-text-1;
  margin-bottom: 16rpx;
}




.legend {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 32rpx;
  margin-top: 20rpx;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 10rpx;
}

.legend-line {
  width: 28rpx;
  height: 6rpx;
  border-radius: 3rpx;
}

.legend-line--dash {
  opacity: 0.7;
}

.legend-text {
  font-size: $wx-fs-cap;
  color: $wx-text-2;
}

/* 日出日落 */
.sun-card {
  display: flex;
  align-items: center;
  gap: 28rpx;
}

.sun-icon {
  width: 64rpx;
  height: 64rpx;
  border-radius: 50%;
  background: rgba(245, 158, 11, 0.14);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.sun-arc {
  width: 30rpx;
  height: 30rpx;
  border: 4rpx solid $wx-amber;
  border-radius: 50%;
  border-bottom-color: transparent;
  transform: rotate(-45deg);
}

.sun-text {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}

.sun-label {
  font-size: $wx-fs-cap;
  color: $wx-text-3;
}

.sun-value {
  font-size: 32rpx;
  font-weight: 600;
  color: $wx-text-1;
}

.sun-extra {
  font-size: $wx-fs-cap;
  color: $wx-text-2;
}

/* 明细 */
.list-card {
  padding: 0;
  overflow: hidden;
}

.day-row {
  display: flex;
  align-items: center;
  height: 96rpx;
  padding: 0 24rpx;
  border-bottom: 2rpx solid $wx-line;
}

.day-row:last-child {
  border-bottom: none;
}

.day-date {
  width: 156rpx;
  font-size: 24rpx;
  color: $wx-text-1;
}

.day-icon {
  width: 44rpx;
  height: 44rpx;
  margin-right: 20rpx;
}

.day-cond {
  flex: 1;
  font-size: 24rpx;
  color: $wx-text-2;
}

.day-low {
  width: 68rpx;
  text-align: right;
  font-size: 26rpx;
  color: #4C8DFF;
}

.day-high {
  width: 68rpx;
  text-align: right;
  font-size: 26rpx;
  font-weight: 600;
  color: $wx-amber;
}

.scroll-bottom {
  height: 60rpx;
}
</style>
