<template>
  <view class="wx-page">
    <weather-nav title="生活指数">
      <template #right>
        <text class="nav-city">{{ city.short || city.name }}</text>
      </template>
    </weather-nav>

    <scroll-view class="page-scroll" scroll-y>
      <!-- 指数网格 -->
      <view class="index-grid">
        <view v-for="idx in indices" :key="idx.key" class="index-card">
          <view class="idx-icon" :style="{ background: idx.color + '1A' }">
            <image class="idx-icon-img" :src="iconUrl(idx.key)" mode="aspectFit" />
          </view>
          <text class="idx-name">{{ idx.name }}</text>
          <text class="idx-level" :style="{ color: idx.color }">{{ idx.level }}</text>
          <text class="idx-advice">{{ idx.advice }}</text>
        </view>
      </view>

      <!-- 说明 -->
      <view class="note-card">
        <view class="ico-info" />
        <text class="note-text">生活指数由气温、湿度、降水、紫外线等实测要素推导，仅供参考</text>
      </view>

      <view class="scroll-bottom" />
    </scroll-view>
  </view>
</template>

<script setup>
/**
 * 生活指数（设计稿 07）
 * 数据来源：utils/indices.js 自算（Open-Meteo 免费层不提供生活指数）
 */
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import weatherApi from '../api'
import WeatherNav from '../components/weather-nav.vue'

const city = ref({})
const indices = ref([])

/** 8 项指数各自的图标 */
const ICON_MAP = {
  dressing: 'dressing',
  uv: 'uv',
  carWash: 'carWash',
  sport: 'sport',
  cold: 'cold',
  drying: 'drying',
  allergy: 'allergy',
  travel: 'travel'
}

const iconUrl = (key) => `/static/weather/icons/idx-${ICON_MAP[key] || 'dressing'}.png`

onLoad(async () => {
  try {
    const c = weatherApi.getCurrentCity()
    city.value = c
    const data = await weatherApi.getWeather(c)
    indices.value = data.indices
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

.index-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 24rpx;
  padding: 8rpx $wx-page-pad 0;
}

.index-card {
  width: 322rpx;
  padding: 32rpx 28rpx;
  background: $wx-card;
  border-radius: $wx-radius-lg;
  box-shadow: $wx-shadow-card;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}

.idx-icon {
  width: 52rpx;
  height: 52rpx;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20rpx;
}

.idx-icon-img {
  width: 32rpx;
  height: 32rpx;
}

.idx-name {
  font-size: 28rpx;
  font-weight: 600;
  color: $wx-text-1;
}

.idx-level {
  font-size: 26rpx;
  font-weight: 600;
  margin-top: 8rpx;
}

.idx-advice {
  font-size: $wx-fs-cap;
  color: $wx-text-2;
  line-height: 32rpx;
  margin-top: 10rpx;
}

/* 说明 */
.note-card {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin: 28rpx $wx-page-pad 0;
  padding: 24rpx 28rpx;
  background: #EFF3F9;
  border-radius: $wx-radius-md;
}

.ico-info {
  width: 28rpx;
  height: 28rpx;
  border: 4rpx solid #8A97A8;
  border-radius: 50%;
  position: relative;
  flex-shrink: 0;
}

.ico-info::after {
  content: '';
  position: absolute;
  left: 50%;
  top: 5rpx;
  transform: translateX(-50%);
  width: 4rpx;
  height: 9rpx;
  background: #8A97A8;
  border-radius: 2rpx;
}

.note-text {
  flex: 1;
  font-size: $wx-fs-cap;
  color: $wx-text-2;
}

.scroll-bottom {
  height: 60rpx;
}
</style>
