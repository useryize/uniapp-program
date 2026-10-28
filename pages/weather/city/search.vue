<template>
  <view class="wx-page">
    <weather-nav title="城市搜索" />

    <!-- 搜索框 -->
    <view class="search-box">
      <view class="ico-search" />
      <input
        class="search-input"
        type="text"
        v-model="keyword"
        placeholder="搜索城市名 / 拼音首字母"
        placeholder-class="search-ph"
        confirm-type="search"
        @input="onInput"
      />
      <text v-if="keyword" class="search-clear" @click="clear">清空</text>
    </view>

    <scroll-view class="page-scroll" scroll-y>
      <!-- 定位城市 -->
      <view v-if="!keyword" class="section">
        <view class="locate-card" @click="onLocate">
          <view class="ico-locate" />
          <view class="locate-text">
            <text class="locate-label">当前定位城市</text>
            <text class="locate-name">{{ currentCity.short || currentCity.name }}</text>
          </view>
          <view class="ico-arrow" />
        </view>
      </view>

      <!-- 搜索结果 -->
      <view v-if="keyword" class="section">
        <text class="section-title">搜索结果</text>
        <view v-if="results.length" class="result-list">
          <view
            v-for="c in results"
            :key="c.adcode"
            class="result-item"
            @click="onSelect(c)"
          >
            <view class="result-main">
              <text class="result-name">{{ c.name }}</text>
              <text class="result-prov">{{ c.province }}</text>
            </view>
            <view class="ico-arrow" />
          </view>
        </view>
        <view v-else class="empty">
          <text class="empty-text">未找到匹配的城市</text>
          <text class="empty-sub">试试拼音首字母，如「hz」查杭州</text>
        </view>
      </view>

      <!-- 热门城市 -->
      <view v-if="!keyword" class="section">
        <text class="section-title">热门城市</text>
        <view class="city-grid">
          <view
            v-for="c in hot"
            :key="c.adcode"
            class="city-chip"
            @click="onSelect(c)"
          >
            <text class="chip-name">{{ c.short }}</text>
          </view>
        </view>
      </view>

      <!-- 历史记录 -->
      <view v-if="!keyword && history.length" class="section">
        <view class="section-head">
          <text class="section-title">历史记录</text>
          <text class="section-action" @click="clearHistory">清空</text>
        </view>
        <view class="city-grid">
          <view
            v-for="(c, i) in history"
            :key="c.adcode + i"
            class="city-chip city-chip--history"
            @click="onSelect(c)"
          >
            <text class="chip-name">{{ c.short }}</text>
          </view>
        </view>
      </view>

      <view class="scroll-bottom" />
    </scroll-view>
  </view>
</template>

<script setup>
/**
 * 城市搜索（设计稿 02）
 */
import { ref } from 'vue'
import weatherApi from '../api'
import WeatherNav from '../components/weather-nav.vue'

const keyword = ref('')
const results = ref([])
const hot = ref([])
const history = ref([])
const currentCity = ref({})

const HISTORY_KEY = 'wx_search_history'

/** 读取历史 */
function loadHistory() {
  try {
    const raw = uni.getStorageSync(HISTORY_KEY)
    const list = raw ? JSON.parse(raw) : []
    history.value = Array.isArray(list) ? list : []
  } catch (e) {
    history.value = []
  }
}

/** 写入历史（去重，最多 10 条） */
function pushHistory(city) {
  const list = history.value.filter((c) => c.adcode !== city.adcode)
  list.unshift(city)
  history.value = list.slice(0, 10)
  try {
    uni.setStorageSync(HISTORY_KEY, JSON.stringify(history.value))
  } catch (e) {
    // 忽略存储失败
  }
}

function clearHistory() {
  history.value = []
  try {
    uni.removeStorageSync(HISTORY_KEY)
  } catch (e) {
    // 忽略
  }
}

function onInput(e) {
  const v = e.detail.value
  keyword.value = v
  results.value = v ? weatherApi.findCities(v, 30) : []
}

function clear() {
  keyword.value = ''
  results.value = []
}

function onSelect(city) {
  pushHistory(city)
  // 加入已添加列表并设为当前城市
  weatherApi.addCity(city)
  uni.navigateBack({
    fail: () => uni.redirectTo({ url: '/pages/weather/home/index' })
  })
}

function onLocate() {
  weatherApi.setCurrentCity(currentCity.value)
  uni.navigateBack({
    fail: () => uni.redirectTo({ url: '/pages/weather/home/index' })
  })
}

hot.value = weatherApi.hotCities(12)
currentCity.value = weatherApi.getCurrentCity()
loadHistory()
</script>

<style lang="scss" scoped>
@import '../styles/tokens.scss';

.wx-page {
  min-height: 100vh;
  background: $wx-bg;
}

.search-box {
  display: flex;
  align-items: center;
  gap: 18rpx;
  margin: 8rpx $wx-page-pad 0;
  padding: 22rpx 28rpx;
  background: $wx-card;
  border-radius: $wx-radius-sm;
  border: 2rpx solid $wx-line-2;
}

.ico-search {
  width: 32rpx;
  height: 32rpx;
  border: 4rpx solid $wx-text-1;
  border-radius: 50%;
  position: relative;
  flex-shrink: 0;
}

.ico-search::after {
  content: '';
  position: absolute;
  right: -12rpx;
  bottom: -8rpx;
  width: 14rpx;
  height: 4rpx;
  background: $wx-text-1;
  transform: rotate(45deg);
  border-radius: 2rpx;
}

.search-input {
  flex: 1;
  font-size: 28rpx;
  color: $wx-text-1;
}

.search-ph {
  color: $wx-text-3;
}

.search-clear {
  font-size: $wx-fs-desc;
  color: $wx-text-3;
}

.page-scroll {
  height: calc(100vh - 200rpx);
}

.section {
  padding: 28rpx $wx-page-pad 0;
}

.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20rpx;
}

.section-title {
  display: block;
  font-size: 30rpx;
  font-weight: 600;
  color: $wx-text-1;
  margin-bottom: 20rpx;
}

.section-head .section-title {
  margin-bottom: 0;
}

.section-action {
  font-size: $wx-fs-desc;
  color: $wx-text-3;
}

/* 定位卡 */
.locate-card {
  display: flex;
  align-items: center;
  gap: 24rpx;
  padding: 28rpx;
  background: $wx-blue-soft;
  border-radius: $wx-radius-md;
}

.ico-locate {
  width: 40rpx;
  height: 40rpx;
  border: 4rpx solid $wx-blue;
  border-radius: 50% 50% 50% 4rpx;
  transform: rotate(-45deg);
  flex-shrink: 0;
  position: relative;
}

.ico-locate::after {
  content: '';
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 12rpx;
  height: 12rpx;
  border-radius: 50%;
  background: $wx-blue;
}

.locate-text {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}

.locate-label {
  font-size: $wx-fs-cap;
  color: $wx-text-2;
}

.locate-name {
  font-size: 30rpx;
  font-weight: 600;
  color: $wx-blue;
}

.ico-arrow {
  width: 16rpx;
  height: 16rpx;
  border-right: 4rpx solid #B8C0CC;
  border-bottom: 4rpx solid #B8C0CC;
  transform: rotate(-45deg);
  flex-shrink: 0;
}

/* 搜索结果 */
.result-list {
  background: $wx-card;
  border-radius: $wx-radius-card;
  overflow: hidden;
}

.result-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 26rpx 28rpx;
  border-bottom: 2rpx solid $wx-line;
}

.result-item:last-child {
  border-bottom: none;
}

.result-main {
  display: flex;
  align-items: baseline;
  gap: 16rpx;
}

.result-name {
  font-size: 30rpx;
  color: $wx-text-1;
}

.result-prov {
  font-size: $wx-fs-cap;
  color: $wx-text-3;
}

/* 城市网格 */
.city-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.city-chip {
  min-width: 140rpx;
  padding: 22rpx 28rpx;
  background: $wx-card;
  border: 2rpx solid $wx-line-2;
  border-radius: $wx-radius-xs;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
}

.city-chip--history {
  background: #EFF2F7;
  border-color: transparent;
}

.chip-name {
  font-size: 26rpx;
  color: $wx-text-1;
}

/* 空态 */
.empty {
  padding: 80rpx 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16rpx;
}

.empty-text {
  font-size: $wx-fs-body;
  color: $wx-text-2;
}

.empty-sub {
  font-size: $wx-fs-cap;
  color: $wx-text-3;
}

.scroll-bottom {
  height: 60rpx;
}
</style>
