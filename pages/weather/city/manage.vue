<template>
  <view class="wx-page">
    <weather-nav title="城市管理">
      <template #right>
        <text class="nav-action" @click="onDone">完成</text>
      </template>
    </weather-nav>

    <scroll-view class="page-scroll" scroll-y>
      <!-- 当前城市卡 -->
      <view class="cur-card" @click="goSearch">
        <view class="cur-icon"><view class="ico-locate" /></view>
        <view class="cur-text">
          <text class="cur-label">当前城市</text>
          <text class="cur-name">{{ currentCity.name }}</text>
          <text class="cur-weather">{{ currentBrief }}</text>
        </view>
        <view class="ico-arrow" />
      </view>

      <!-- 已添加列表 -->
      <view class="section">
        <text class="section-title">已添加城市</text>
        <view class="city-list">
          <view
            v-for="(c, i) in list"
            :key="c.adcode"
            class="city-row"
            :class="{ 'city-row--current': c.adcode === currentCity.adcode }"
          >
            <view
              class="drag-handle"
              @touchstart="onDragStart(i, $event)"
              @touchmove="onDragMove"
              @touchend="onDragEnd"
              @touchcancel="onDragEnd"
            >
              <view class="dot-row"><view class="dot" /><view class="dot" /><view class="dot" /></view>
              <view class="dot-row"><view class="dot" /><view class="dot" /><view class="dot" /></view>
            </view>
            <view class="row-main">
              <text class="row-name">{{ c.name }}</text>
              <text v-if="c.adcode === currentCity.adcode" class="row-badge">当前</text>
            </view>
            <text class="row-temp">{{ c.brief || '' }}</text>
            <view class="row-del" @click.stop="onRemove(c)">
              <view class="ico-close" />
            </view>
          </view>
        </view>
      </view>

      <!-- 添加城市 -->
      <view class="add-btn" @click="goSearch">
        <view class="ico-plus" />
        <text class="add-text">添加城市</text>
      </view>

      <!-- 排序提示 -->
      <view class="drag-tip">
        <view class="ico-info" />
        <text class="drag-tip-text">长按左侧手柄可拖动排序，点击右侧图标可移除</text>
      </view>

      <view class="scroll-bottom" />
    </scroll-view>
  </view>
</template>

<script setup>
/**
 * 城市管理（设计稿 03）
 */
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import weatherApi from '../api'
import WeatherNav from '../components/weather-nav.vue'

const list = ref([])
const currentCity = ref({})
const currentBrief = ref('')
const dragIndex = ref(-1)

/** 加载已添加城市，并补齐天气摘要 */
async function load() {
  const saved = weatherApi.getSavedCities()
  // 首次进入时把当前城市并入列表，避免空列表
  const cur = weatherApi.getCurrentCity()
  let list = saved
  if (list.length && !list.some((c) => c.adcode === cur.adcode)) {
    list = [cur, ...list]
    weatherApi.saveSavedCities(list)
  } else if (!list.length) {
    list = [cur]
    weatherApi.saveSavedCities(list)
  }
  list.value = list
  currentCity.value = cur
  await Promise.all(list.map(async (c) => {
    try {
      const d = await weatherApi.getWeather(c)
      c.brief = `${d.current.condition} ${d.current.tempText}`
    } catch (e) {
      c.brief = ''
    }
  }))
  // 当前城市摘要
  try {
    const d = await weatherApi.getWeather(cur)
    currentBrief.value = `${d.current.condition}　${d.current.tempText}　体感 ${d.current.feelsText}`
  } catch (e) {
    currentBrief.value = ''
  }
}

function goSearch() {
  uni.navigateTo({ url: '/pages/weather/city/search' })
}

function onDone() {
  uni.navigateBack({
    fail: () => uni.redirectTo({ url: '/pages/weather/home/index' })
  })
}

/** 删除城市 */
function onRemove(city) {
  uni.showModal({
    title: '移除城市',
    content: `确定要移除「${city.name}」吗？`,
    confirmText: '移除',
    confirmColor: '#EF4444',
    success: (res) => {
      if (res.confirm) {
        weatherApi.removeCity(city.adcode)
        load()
      }
    }
  })
}

/**
 * 拖拽排序
 * 依据：长按手柄后，跟踪手指的 clientY，与各行中心比较，实时换位
 */
const ROW_HEIGHT = 92 // 行高（rpx），与样式中的 city-row 高度一致
let dragFrom = -1
let dragStartY = 0
let dragMoved = false

/** 取触摸点相对列表顶部的偏移（px） */
function touchOffsetY(e) {
  const t = e.touches && e.touches[0]
  if (!t) return 0
  return t.clientY
}

function onDragStart(i, e) {
  dragFrom = i
  dragIndex.value = i
  dragMoved = false
  if (e && e.touches) {
    // 记录起点，后续按位移判断是否换位
    dragStartY = touchOffsetY(e)
  }
}

function onDragMove(e) {
  if (dragFrom < 0) return
  const y = touchOffsetY(e)
  if (!y) return
  // 每一行的位移阈值 = 行高（px ≈ rpx/2，按 375 宽屏折算）
  const rowPx = ROW_HEIGHT * (uni.getSystemInfoSync().windowWidth / 750) * 0.5
  const delta = Math.round((y - dragStartY) / rowPx)
  const target = Math.max(0, Math.min(list.value.length - 1, dragFrom + delta))
  if (target !== dragFrom) {
    weatherApi.moveCity(dragFrom, target)
    list.value = weatherApi.getSavedCities()
    dragFrom = target
    dragIndex.value = target
    dragMoved = true
  }
}

function onDragEnd() {
  dragFrom = -1
  dragIndex.value = -1
  if (dragMoved) load()
}

onShow(() => {
  load()
})
</script>

<style lang="scss" scoped>
@import '../styles/tokens.scss';

.wx-page {
  min-height: 100vh;
  background: $wx-bg;
}

.nav-action {
  font-size: 30rpx;
  color: $wx-blue;
}

.page-scroll {
  height: calc(100vh - 180rpx);
}

/* 当前城市卡 */
.cur-card {
  display: flex;
  align-items: center;
  gap: 24rpx;
  margin: 8rpx $wx-page-pad 0;
  padding: 36rpx 32rpx;
  background: $wx-grad-hero;
  border-radius: $wx-radius-lg;
}

.cur-icon {
  width: 44rpx;
  height: 44rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.ico-locate {
  width: 34rpx;
  height: 34rpx;
  border: 4rpx solid #FFFFFF;
  border-radius: 50% 50% 50% 4rpx;
  transform: rotate(-45deg);
  position: relative;
}

.ico-locate::after {
  content: '';
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 10rpx;
  height: 10rpx;
  border-radius: 50%;
  background: #FFFFFF;
}

.cur-text {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.cur-label {
  font-size: $wx-fs-cap;
  color: $wx-text-4;
}

.cur-name {
  font-size: 38rpx;
  font-weight: 600;
  color: #FFFFFF;
}

.cur-weather {
  font-size: $wx-fs-desc;
  color: $wx-text-4;
}

.ico-arrow {
  width: 16rpx;
  height: 16rpx;
  border-right: 4rpx solid #B8C0CC;
  border-bottom: 4rpx solid #B8C0CC;
  transform: rotate(-45deg);
  flex-shrink: 0;
}

/* 列表 */
.section {
  padding: 32rpx $wx-page-pad 0;
}

.section-title {
  display: block;
  font-size: 30rpx;
  font-weight: 600;
  color: $wx-text-1;
  margin-bottom: 20rpx;
}

.city-list {
  background: $wx-card;
  border-radius: $wx-radius-card;
  overflow: hidden;
}

.city-row {
  display: flex;
  align-items: center;
  gap: 20rpx;
  padding: 28rpx 24rpx;
  border-bottom: 2rpx solid $wx-line;
}

.city-row:last-child {
  border-bottom: none;
}

.city-row--current {
  background: rgba(234, 241, 253, 0.6);
}

.drag-handle {
  width: 40rpx;
  display: flex;
  flex-direction: column;
  gap: 6rpx;
  padding: 6rpx 0;
  flex-shrink: 0;
}

.dot-row {
  display: flex;
  gap: 6rpx;
}

.dot {
  width: 7rpx;
  height: 7rpx;
  border-radius: 50%;
  background: #8A97A8;
}

.row-main {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 14rpx;
}

.row-name {
  font-size: 30rpx;
  color: $wx-text-1;
}

.row-badge {
  font-size: 20rpx;
  color: $wx-blue;
  background: $wx-blue-soft;
  padding: 4rpx 14rpx;
  border-radius: 8rpx;
}

.row-temp {
  font-size: $wx-fs-desc;
  color: $wx-text-2;
}

.row-del {
  width: 48rpx;
  height: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ico-close {
  width: 26rpx;
  height: 26rpx;
  position: relative;
}

.ico-close::before,
.ico-close::after {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  width: 26rpx;
  height: 3rpx;
  background: #9AA5B4;
  border-radius: 2rpx;
}

.ico-close::before {
  transform: rotate(45deg);
}

.ico-close::after {
  transform: rotate(-45deg);
}

/* 添加按钮 */
.add-btn {
  margin: 32rpx $wx-page-pad 0;
  padding: 28rpx;
  border-radius: $wx-radius-md;
  background: $wx-card;
  border: 2rpx dashed $wx-line-2;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16rpx;
}

.ico-plus {
  width: 30rpx;
  height: 30rpx;
  position: relative;
}

.ico-plus::before,
.ico-plus::after {
  content: '';
  position: absolute;
  background: $wx-blue;
  border-radius: 2rpx;
}

.ico-plus::before {
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 30rpx;
  height: 4rpx;
}

.ico-plus::after {
  left: 50%;
  top: 0;
  transform: translateX(-50%);
  width: 4rpx;
  height: 30rpx;
}

.add-text {
  font-size: 28rpx;
  color: $wx-blue;
}

/* 提示 */
.drag-tip {
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

.drag-tip-text {
  flex: 1;
  font-size: $wx-fs-cap;
  color: $wx-text-2;
}

.scroll-bottom {
  height: 60rpx;
}
</style>
