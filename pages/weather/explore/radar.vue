<template>
  <view class="wx-page">
    <weather-nav title="降水雷达">
      <template #right>
        <text class="nav-city">{{ city.short || city.name }}</text>
      </template>
    </weather-nav>

    <scroll-view class="page-scroll" scroll-y>
      <!-- 雷达地图 -->
      <view class="map-box">
        <!-- 底图：网格示意 -->
        <view class="map-grid">
          <view v-for="i in 6" :key="'h' + i" class="grid-h" :style="{ top: (i * 100) / 6 + '%' }" />
          <view v-for="i in 5" :key="'v' + i" class="grid-v" :style="{ left: (i * 100) / 5 + '%' }" />
        </view>

        <!-- 雷达回波瓦片 -->
        <view v-if="tiles.length" class="tile-layer">
          <image
            v-for="(t, i) in tiles"
            :key="i"
            class="radar-tile"
            :src="t.url"
            :style="{ left: 'calc(50% + ' + t.left + 'rpx)', top: 'calc(50% + ' + t.top + 'rpx)' }"
            mode="widthFix"
          />
        </view>

        <!-- 无数据提示 -->
        <view v-else class="map-empty">
          <text class="map-empty-text">{{ radarTip }}</text>
        </view>

        <!-- 定位标记 -->
        <view class="marker">
          <view class="marker-ring" />
          <view class="marker-core" />
        </view>

        <!-- 图例 -->
        <view class="legend">
          <view class="legend-item">
            <view class="legend-block" style="background: #10B981" />
            <text class="legend-text">小雨</text>
          </view>
          <view class="legend-item">
            <view class="legend-block" style="background: #F59E0B" />
            <text class="legend-text">中雨</text>
          </view>
          <view class="legend-item">
            <view class="legend-block" style="background: #EF4444" />
            <text class="legend-text">大雨</text>
          </view>
        </view>

        <!-- 署名（RainViewer 免费条款强制要求） -->
        <text class="credit">Weather data by RainViewer</text>
      </view>

      <!-- 时间轴 -->
      <view class="card">
        <view class="time-head">
          <text class="time-title">降水预报时段</text>
          <text class="time-range">{{ rangeText }}</text>
        </view>

        <view class="track">
          <view class="track-line">
            <view class="track-played" :style="{ width: playRatio + '%' }" />
            <view class="track-thumb" :style="{ left: playRatio + '%' }" />
          </view>
          <view class="track-ticks">
            <text
              v-for="(f, i) in frames"
              :key="f.time"
              class="tick-text"
              :class="{ 'tick-text--on': i === frameIndex }"
              @click="onPickFrame(i)"
            >{{ relTime(f.time) }}</text>
          </view>
        </view>

        <view v-if="!hasForecast" class="degrade-tip">
          <text class="degrade-text">当前数据源暂未提供降水预报帧，仅展示实况回波</text>
        </view>
      </view>

      <!-- 出行提示 -->
      <view class="advice-bar">
        <view class="advice-icon">
          <view class="info-dot" />
        </view>
        <text class="advice-text">{{ adviceText }}</text>
      </view>

      <view class="scroll-bottom" />
    </scroll-view>
  </view>
</template>

<script setup>
/**
 * 降水雷达（设计稿 08）
 * 数据源：RainViewer 免费公开 API（免 Key，10 分钟一帧）
 * 注意：nowcast 实测为空，需优雅降级为「仅实况回波」
 */
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import weatherApi from '../api'
import { relativeTime } from '../utils/units'
import WeatherNav from '../components/weather-nav.vue'

const city = ref({})
const frames = ref([])
const tiles = ref([])
const frameIndex = ref(0)
const hasForecast = ref(false)
const radarTip = ref('雷达数据加载中…')
const adviceText = ref('暂无降水预警，天气状况良好')
const radarHost = ref('https://tilecache.rainviewer.com')

const ZOOM = 6

/** 时间轴范围文案 */
const rangeText = computed(() => {
  if (!frames.value.length) return '—'
  return `近 ${frames.value.length * 10} 分钟`
})

/** 播放进度比例 */
const playRatio = computed(() => {
  if (!frames.value.length) return 0
  return (frameIndex.value / Math.max(1, frames.value.length - 1)) * 100
})

const relTime = (ts) => relativeTime(ts)

/** 加载雷达 */
async function loadRadar() {
  radarTip.value = '雷达数据加载中…'
  try {
    const c = city.value
    const radar = await weatherApi.getRadarFrames()
    frames.value = radar.frames
    hasForecast.value = frames.value.length > 0
    radarHost.value = radar.host || radarHost.value

    if (!frames.value.length) {
      tiles.value = []
      radarTip.value = '暂无雷达数据'
      return
    }

    // 默认取最新一帧
    frameIndex.value = frames.value.length - 1
    applyFrame(frameIndex.value)
  } catch (e) {
    tiles.value = []
    radarTip.value = e && e.msg ? e.msg : '雷达数据加载失败'
  }
}

/** 应用指定帧的瓦片 */
function applyFrame(i) {
  const f = frames.value[i]
  if (!f) return
  const c = city.value
  tiles.value = weatherApi.getRadarTiles(
    radarHost.value,
    f.path,
    c.lng,
    c.lat,
    ZOOM,
    2
  )
}

function onPickFrame(i) {
  frameIndex.value = i
  applyFrame(i)
}

onLoad(async () => {
  try {
    const c = weatherApi.getCurrentCity()
    city.value = c
    await loadRadar()

    // 结合天气数据给出出行提示
    const data = await weatherApi.getWeather(c)
    const prob = data.current.precipProbability
    if (prob >= 60) {
      adviceText.value = '未来 1 小时有中雨，建议携带雨具，路面湿滑注意出行安全'
    } else if (prob >= 30) {
      adviceText.value = '可能有零星降水，出行建议携带折叠伞'
    } else {
      adviceText.value = '未来 1 小时无明显降水，适合出行'
    }
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

/* 地图 */
.map-box {
  position: relative;
  height: 600rpx;
  margin: 8rpx $wx-page-pad 28rpx;
  border-radius: $wx-radius-card;
  background: #EDF1F5;
  overflow: hidden;
}

.map-grid {
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
}

.grid-h {
  position: absolute;
  left: 0;
  right: 0;
  height: 1px;
  background: #DFE6ED;
}

.grid-v {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 1px;
  background: #DFE6ED;
}

.tile-layer {
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
}

.radar-tile {
  position: absolute;
  width: 512rpx;
  height: 512rpx;
  margin-left: -256rpx;
  margin-top: -256rpx;
}

.map-empty {
  position: absolute;
  left: 0;
  right: 0;
  top: 45%;
  display: flex;
  justify-content: center;
}

.map-empty-text {
  font-size: $wx-fs-desc;
  color: $wx-text-3;
}

/* 定位标记 */
.marker {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 40rpx;
  height: 40rpx;
  margin-left: -20rpx;
  margin-top: -20rpx;
}

.marker-ring {
  position: absolute;
  left: 0;
  top: 0;
  width: 40rpx;
  height: 40rpx;
  border-radius: 50%;
  background: rgba(1, 77, 178, 0.2);
}

.marker-core {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 16rpx;
  height: 16rpx;
  margin-left: -8rpx;
  margin-top: -8rpx;
  border-radius: 50%;
  background: $wx-blue;
  border: 3rpx solid #FFFFFF;
}

/* 图例 */
.legend {
  position: absolute;
  left: 20rpx;
  top: 20rpx;
  display: flex;
  align-items: center;
  gap: 20rpx;
  padding: 14rpx 20rpx;
  background: rgba(255, 255, 255, 0.92);
  border-radius: $wx-radius-xs;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.legend-block {
  width: 20rpx;
  height: 20rpx;
  border-radius: 6rpx;
}

.legend-text {
  font-size: 20rpx;
  color: $wx-text-1;
}

.credit {
  position: absolute;
  right: 16rpx;
  bottom: 12rpx;
  font-size: 18rpx;
  color: $wx-text-3;
}

/* 时间轴 */
.card {
  background: $wx-card;
  border-radius: $wx-radius-card;
  padding: 32rpx $wx-page-pad;
  box-shadow: $wx-shadow-card;
  margin: 0 $wx-page-pad 28rpx;
}

.time-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 28rpx;
}

.time-title {
  font-size: 30rpx;
  font-weight: 600;
  color: $wx-text-1;
}

.time-range {
  font-size: $wx-fs-desc;
  color: $wx-text-3;
}

.track-line {
  position: relative;
  height: 12rpx;
  background: #E6EBF2;
  border-radius: 6rpx;
}

.track-played {
  position: absolute;
  left: 0;
  top: 0;
  height: 12rpx;
  background: $wx-blue;
  border-radius: 6rpx;
}

.track-thumb {
  position: absolute;
  top: 50%;
  width: 40rpx;
  height: 40rpx;
  margin-left: -20rpx;
  margin-top: -20rpx;
  border-radius: 50%;
  background: $wx-blue;
  border: 6rpx solid #FFFFFF;
  box-shadow: 0 4rpx 12rpx rgba(0.02, 0.09, 0.16, 0.2);
}

.track-ticks {
  display: flex;
  justify-content: space-between;
  margin-top: 20rpx;
}

.tick-text {
  font-size: 20rpx;
  color: $wx-text-3;
}

.tick-text--on {
  color: $wx-blue;
  font-weight: 600;
}

.degrade-tip {
  margin-top: 20rpx;
  padding: 18rpx 22rpx;
  background: $wx-amber-soft;
  border-radius: $wx-radius-xs;
}

.degrade-text {
  font-size: 20rpx;
  color: $wx-amber-ink;
}

/* 提示 */
.advice-bar {
  display: flex;
  align-items: center;
  gap: 18rpx;
  margin: 0 $wx-page-pad;
  padding: 26rpx 28rpx;
  background: $wx-blue-soft;
  border-radius: $wx-radius-md;
}

.advice-icon {
  width: 34rpx;
  height: 34rpx;
  border: 4rpx solid $wx-blue;
  border-radius: 50%;
  position: relative;
  flex-shrink: 0;
}

.info-dot {
  position: absolute;
  left: 50%;
  top: 5rpx;
  transform: translateX(-50%);
  width: 4rpx;
  height: 12rpx;
  background: $wx-blue;
  border-radius: 2rpx;
}

.advice-text {
  flex: 1;
  font-size: $wx-fs-desc;
  color: $wx-blue-line;
  line-height: 36rpx;
}

.scroll-bottom {
  height: 60rpx;
}
</style>
