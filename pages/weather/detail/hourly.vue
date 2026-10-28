<template>
  <view class="wx-page">
    <weather-nav title="逐小时预报">
      <template #right>
        <view class="date-switch">
          <text class="switch-text">{{ dayLabel }}</text>
        </view>
      </template>
    </weather-nav>

    <scroll-view class="page-scroll" scroll-y>
      <!-- 温度曲线 -->
      <view class="card chart-card">
        <view class="card-head">
          <text class="card-title">气温曲线</text>
          <view class="legend">
            <view class="legend-item">
              <view class="legend-dot" style="background: #014DB2" />
              <text class="legend-text">气温</text>
            </view>
            <view class="legend-item">
              <view class="legend-dot" style="background: #10B981" />
              <text class="legend-text">降水概率</text>
            </view>
          </view>
        </view>

        <weather-chart
          :points="tempPoints"
          :points2="precipPoints"
          :show-second="true"
          :width="622"
          :height="280"
          color="#014DB2"
          color2="#10B981"
          unit="°"
          first-label="现在"
        />
      </view>

      <!-- 逐时明细 -->
      <view class="card list-card">
        <view class="table-head">
          <text class="th th-time">时间</text>
          <text class="th th-icon">天气</text>
          <text class="th th-val">气温</text>
          <text class="th th-val">体感</text>
          <text class="th th-precip">降水概率</text>
        </view>
        <view v-for="(h, i) in hourly" :key="h.iso" class="table-row">
          <view class="td td-time-wrap">
            <text class="td td-time" :class="{ 'td-time--now': i === 0 }">{{ i === 0 ? '现在' : h.time }}</text>
            <text v-if="h.dayOffset > 0" class="td-day">次日</text>
          </view>
          <image class="td-icon" :src="`/static/weather/icons/${h.icon}.png`" mode="aspectFit" />
          <text class="td td-val">{{ round(h.temp) }}°</text>
          <text class="td td-val td-muted">{{ round(h.feelsLike) }}°</text>
          <text class="td td-precip" :class="{ 'td-precip--zero': !h.precipProbability }">{{ h.precipProbability }}%</text>
        </view>
      </view>

      <view class="scroll-bottom" />
    </scroll-view>
  </view>
</template>

<script setup>
/**
 * 逐小时详情（设计稿 04）
 */
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import weatherApi from '../api'
import WeatherNav from '../components/weather-nav.vue'
import WeatherChart from '../components/weather-chart.vue'

const hourly = ref([])
const dayLabel = ref('今天')

const round = (v) => (v == null ? '--' : Math.round(v))

const tempPoints = computed(() =>
  hourly.value.map((h) => ({ label: h.time, value: h.temp ?? 0 }))
)
const precipPoints = computed(() =>
  hourly.value.map((h) => ({ label: h.time, value: h.precipProbability ?? 0 }))
)

onLoad(async () => {
  try {
    const city = weatherApi.getCurrentCity()
    const data = await weatherApi.getWeather(city)
    hourly.value = data.hourly
    const d = data.daily[0]
    dayLabel.value = d ? `${d.date}` : '今天'
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

.date-switch {
  padding: 8rpx 18rpx;
  background: $wx-blue-soft;
  border-radius: $wx-radius-xs;
}

.switch-text {
  font-size: $wx-fs-desc;
  color: $wx-blue;
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

.card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20rpx;
}

.card-title {
  font-size: $wx-fs-title;
  font-weight: 600;
  color: $wx-text-1;
}

.legend {
  display: flex;
  align-items: center;
  gap: 24rpx;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 10rpx;
}

.legend-dot {
  width: 14rpx;
  height: 14rpx;
  border-radius: 50%;
}

.legend-text {
  font-size: $wx-fs-cap;
  color: $wx-text-2;
}

.chart-card {
  padding-bottom: 24rpx;
}




/* 明细表 */
.list-card {
  padding: 0;
  overflow: hidden;
}

.table-head,
.table-row {
  display: flex;
  align-items: center;
  padding: 0 24rpx;
}

.table-head {
  height: 78rpx;
  background: $wx-card-2;
}

.table-row {
  height: 92rpx;
  border-bottom: 2rpx solid $wx-line;
}

.table-row:last-child {
  border-bottom: none;
}

.th {
  font-size: $wx-fs-cap;
  font-weight: 500;
  color: $wx-text-3;
}

.th-time,
.td-time-wrap {
  width: 96rpx;
}

.th-icon {
  width: 72rpx;
}

.th-val {
  width: 84rpx;
}

.th-precip {
  flex: 1;
  text-align: right;
}

.td {
  font-size: 26rpx;
  color: $wx-text-1;
}

.td-time {
  font-size: 26rpx;
}

.td-time-wrap {
  display: flex;
  flex-direction: column;
  gap: 2rpx;
}

.td-day {
  font-size: 18rpx;
  color: $wx-blue;
  background: $wx-blue-soft;
  padding: 2rpx 8rpx;
  border-radius: 6rpx;
  align-self: flex-start;
}

.td-time--now {
  color: $wx-blue;
  font-weight: 600;
}

.td-icon {
  width: 48rpx;
  height: 48rpx;
  margin-right: 24rpx;
}

.td-val {
  font-weight: 600;
}

.td-muted {
  font-weight: 400;
  color: $wx-text-2;
}

.td-precip {
  flex: 1;
  text-align: right;
  font-weight: 600;
  color: $wx-blue;
}

.td-precip--zero {
  color: $wx-text-3;
  font-weight: 400;
}

.scroll-bottom {
  height: 60rpx;
}
</style>
