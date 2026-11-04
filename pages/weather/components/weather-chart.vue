<template>
  <view class="wx-chart" :style="{ height: height + 'rpx' }">
    <canvas
      :canvas-id="cid"
      :id="cid"
      class="chart-canvas"
      :style="{ width: width + 'rpx', height: height + 'rpx' }"
      @touchstart="onTouchStart"
      @touchmove="onTouchMove"
      @touchend="onTouchEnd"
    />
    <!-- 选中点提示 -->
    <view
      v-if="activeIndex >= 0 && points[activeIndex]"
      class="chart-tip"
      :style="{ left: tipLeft + 'rpx' }"
    >
      <text class="tip-time">{{ points[activeIndex].label }}</text>
      <text class="tip-value">{{ points[activeIndex].value }}{{ unit }}</text>
    </view>
    <!-- 轴标签：与曲线数据点同坐标，避免刻度与节点错位 -->
    <view class="chart-axis">
      <text
        v-for="(t, i) in axisTicks"
        :key="i"
        class="axis-tick"
        :class="{ 'axis-tick--first': i === 0 }"
        :style="{ left: t.left + 'rpx' }"
      >{{ t.text }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
/**
 * 折线图（使用 uni-app CanvasContext）
 * 支持双序列（气温 / 降水概率）、渐变面积、触摸选中点
 */
import { ref, shallowRef, computed, onMounted, watch, getCurrentInstance } from 'vue'

interface ChartPoint {
  label: string
  value: number
}

const props = withDefaults(defineProps<{
  points?: ChartPoint[]
  points2?: ChartPoint[]
  width?: number
  height?: number
  color?: string
  color2?: string
  unit?: string
  unit2?: string
  showSecond?: boolean
  maxTicks?: number
  firstLabel?: string
}>(), {
  points: () => [],
  points2: () => [],
  width: 622,
  height: 280,
  color: '#014DB2',
  color2: '#10B981',
  unit: '°',
  unit2: '%',
  showSecond: false,
  maxTicks: 6,
  firstLabel: ''
})

const cid = `chart-${Math.random().toString(36).slice(2, 9)}`
// 原生绘图上下文不能交给 Vue 深层代理。
const ctx = shallowRef<ReturnType<typeof uni.createCanvasContext> | null>(null)
const instance = getCurrentInstance()
const activeIndex = ref(-1)
const tipLeft = ref(0)

/** rpx → px（用于 canvas 绘制） */
const rpx2px = (v: any) => (v * uni.getSystemInfoSync().windowWidth) / 750

/** 左右内边距（rpx）——与绘点逻辑保持一致 */
const PAD_L = 8
const PAD_R = 8

/**
 * 轴刻度：位置与曲线数据点严格对齐
 * 取点规则：首点、末点，以及中间均匀分布的若干点（最多 maxTicks 个）
 */
const axisTicks = computed(() => {
  const series = props.points
  if (!series.length) return []
  const maxTicks = Math.max(2, Math.min(props.maxTicks || 6, series.length))
  const step = series.length > 1 ? (series.length - 1) / (maxTicks - 1) : 0
  const ticks = []
  for (let i = 0; i < maxTicks; i += 1) {
    const idx = Math.round(i * step)
    const p = series[idx]
    if (!p) continue
    // 与 drawSeries 相同的横坐标公式
    const x = PAD_L + ((props.width - PAD_L - PAD_R) * idx) / Math.max(1, series.length - 1)
    ticks.push({ text: idx === 0 ? props.firstLabel || p.label : p.label, left: x })
  }
  return ticks
})

const allValues = computed(() => {
  const a = props.points.map((p) => p.value).filter((v) => v != null)
  const b = props.showSecond ? props.points2.map((p) => p.value).filter((v) => v != null) : []
  return [...a, ...b]
})

/** 计算取值区间（留 8% 余量） */
const range = computed(() => {
  const vals = allValues.value
  if (!vals.length) return { min: 0, max: 1 }
  let min = Math.min(...vals)
  let max = Math.max(...vals)
  if (min === max) {
    min -= 1
    max += 1
  }
  const pad = (max - min) * 0.12
  return { min: min - pad, max: max + pad }
})

/**
 * 绘制折线
 * @param {Array} series 数据序列
 * @param {string} stroke 描边色
 * @param {boolean} dashed 是否虚线
 * @param {boolean} area 是否填充面积
 */
function drawSeries(series: any, stroke: any, dashed: any, area: any) {
  const canvas = ctx.value
  if (!canvas || !series.length) return
  const w = rpx2px(props.width)
  const h = rpx2px(props.height)
  const padT = rpx2px(16)
  const padB = rpx2px(16)
  const padL = rpx2px(PAD_L)
  const padR = rpx2px(PAD_R)
  const innerW = w - padL - padR
  const innerH = h - padT - padB
  const { min, max } = range.value
  const step = series.length > 1 ? innerW / (series.length - 1) : 0

  const xy = series.map((p: any, i: any) => {
    const x = padL + step * i
    const ratio = (p.value - min) / (max - min)
    const y = padT + innerH * (1 - ratio)
    return { x, y }
  })

  if (area) {
    const grad = canvas.createLinearGradient(0, padT, 0, h - padB)
    grad.addColorStop(0, hexToRgba(stroke, 0.14))
    grad.addColorStop(1, hexToRgba(stroke, 0.01))
    canvas.beginPath()
    canvas.moveTo(xy[0].x, h - padB)
    xy.forEach((p: any) => canvas.lineTo(p.x, p.y))
    canvas.lineTo(xy[xy.length - 1].x, h - padB)
    canvas.closePath()
    canvas.setFillStyle(grad)
    canvas.fill()
  }

  canvas.beginPath()
  xy.forEach((p: any, i: any) => (i ? canvas.lineTo(p.x, p.y) : canvas.moveTo(p.x, p.y)))
  canvas.setStrokeStyle(stroke)
  canvas.setLineWidth(3)
  if (dashed) canvas.setLineDash([6, 6], 0)
  else canvas.setLineDash([], 0)
  canvas.lineJoin = 'round'
  canvas.lineCap = 'round'
  canvas.stroke()
  canvas.setLineDash([], 0)

  // 选中点高亮
  if (activeIndex.value >= 0 && activeIndex.value < xy.length) {
    const p = xy[activeIndex.value]
    canvas.beginPath()
    canvas.arc(p.x, p.y, 5, 0, Math.PI * 2)
    canvas.setFillStyle(stroke)
    canvas.fill()
    canvas.beginPath()
    canvas.arc(p.x, p.y, 8, 0, Math.PI * 2)
    canvas.setStrokeStyle('#FFFFFF')
    canvas.setLineWidth(3)
    canvas.stroke()
  }
}

/** 十六进制色 → rgba */
function hexToRgba(hex: any, alpha: any) {
  const h = hex.replace('#', '')
  const r = parseInt(h.substring(0, 2), 16)
  const g = parseInt(h.substring(2, 4), 16)
  const b = parseInt(h.substring(4, 6), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

/** 重绘 */
function render() {
  if (!ctx.value) return
  const w = rpx2px(props.width)
  const h = rpx2px(props.height)
  ctx.value.clearRect(0, 0, w, h)

  // 网格线
  ctx.value.setStrokeStyle('#EFF2F7')
  ctx.value.setLineWidth(1)
  for (let i = 0; i < 3; i += 1) {
    const y = rpx2px(16) + (h - rpx2px(32)) * (i / 2)
    ctx.value.beginPath()
    ctx.value.moveTo(rpx2px(PAD_L), y)
    ctx.value.lineTo(w - rpx2px(PAD_R), y)
    ctx.value.stroke()
  }

  if (props.showSecond) drawSeries(props.points2, props.color2, true, false)
  drawSeries(props.points, props.color, false, true)
  ctx.value.draw()
}

onMounted(() => {
  setTimeout(() => {
    ctx.value = uni.createCanvasContext(cid, instance?.proxy)
    render()
  }, 0)
})

watch(
  () => [props.points, props.points2, props.showSecond],
  () => {
    setTimeout(render, 30)
  },
  { deep: true }
)

/** 触摸 → 计算最近点 */
function pick(e: any) {
  const series = props.points
  if (!series.length) return
  const touch = e.touches && e.touches[0]
  if (!touch) return
  const x = touch.x
  const w = rpx2px(props.width)
  const padL = rpx2px(PAD_L)
  const padR = rpx2px(PAD_R)
  const innerW = w - padL - padR
  const step = series.length > 1 ? innerW / (series.length - 1) : 0
  let idx = step ? Math.round((x - padL) / step) : 0
  idx = Math.max(0, Math.min(series.length - 1, idx))
  activeIndex.value = idx
  tipLeft.value = Math.max(0, Math.min(props.width - 100, padL + step * idx - 40))
  render()
}

const onTouchStart = (e: any) => pick(e)
const onTouchMove = (e: any) => pick(e)
const onTouchEnd = () => {
  // 保留选中态，便于阅读
}
</script>

<style lang="scss" scoped>
.wx-chart {
  position: relative;
  width: 100%;
  padding-bottom: 34rpx;
}

.chart-canvas {
  display: block;
}

/* 轴标签：绝对定位，与曲线节点同坐标 */
.chart-axis {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 30rpx;
}

.axis-tick {
  position: absolute;
  top: 0;
  transform: translateX(-50%);
  font-size: 20rpx;
  color: #9AA5B4;
  white-space: nowrap;
}

.axis-tick--first {
  transform: translateX(-10%);
  color: #014DB2;
  font-weight: 600;
}

.chart-tip {
  position: absolute;
  top: -12rpx;
  width: 120rpx;
  padding: 8rpx 0;
  border-radius: 12rpx;
  background: rgba(10, 22, 40, 0.88);
  display: flex;
  flex-direction: column;
  align-items: center;
  pointer-events: none;
}

.tip-time {
  font-size: 20rpx;
  color: rgba(255, 255, 255, 0.7);
}

.tip-value {
  font-size: 26rpx;
  font-weight: 600;
  color: #FFFFFF;
  margin-top: 2rpx;
}
</style>
