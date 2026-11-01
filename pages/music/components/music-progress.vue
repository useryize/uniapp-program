<template>
  <!-- 可拖拽进度条（规格 §6.3）：拖拽中显示时间气泡，松手立即跳转不回弹 -->
  <view
    class="m-progress"
    @touchstart.stop="onStart"
    @touchmove.stop.prevent="onMove"
    @touchend.stop="onEnd"
    @touchcancel.stop="onEnd"
  >
    <view class="m-progress__track">
      <view class="m-progress__fill" :style="{ width: pct + '%' }" />
      <view class="m-progress__knob" :style="{ left: pct + '%' }" />
    </view>

    <view v-if="dragging" class="m-progress__bubble" :style="{ left: pct + '%' }">
      <text class="m-progress__bubble-text">{{ bubbleText }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, getCurrentInstance, onMounted } from 'vue'
import { formatDuration } from '../utils/format'

const props = defineProps({
  /** 当前秒 */
  current: { type: Number, default: 0 },
  /** 总秒 */
  duration: { type: Number, default: 0 }
})

const emit = defineEmits(['seek'])

const dragging = ref(false)
const dragPct = ref(0)
/** 进度条实际宽度（px），用于把触点换算成百分比 */
const barWidth = ref(0)
const barLeft = ref(0)

const instance = getCurrentInstance()

const pct = computed(() => {
  if (dragging.value) return dragPct.value
  if (!props.duration) return 0
  return Math.min(100, Math.max(0, (props.current / props.duration) * 100))
})

const bubbleText = computed(() => {
  const sec = (dragPct.value / 100) * (props.duration || 0)
  return formatDuration(sec)
})

onMounted(() => {
  // 测量轨道尺寸，触点 → 百分比需要
  const query = uni.createSelectorQuery().in(instance.proxy)
  query
    .select('.m-progress__track')
    .boundingClientRect((rect) => {
      if (rect) {
        barWidth.value = rect.width
        barLeft.value = rect.left
      }
    })
    .exec()
})

function posToPct(clientX) {
  if (!barWidth.value) return 0
  const x = clientX - barLeft.value
  return Math.min(100, Math.max(0, (x / barWidth.value) * 100))
}

function onStart(e) {
  if (!props.duration) return
  dragging.value = true
  const touch = e.touches && e.touches[0]
  if (touch) dragPct.value = posToPct(touch.clientX)
}

function onMove(e) {
  if (!dragging.value) return
  const touch = e.touches && e.touches[0]
  if (touch) dragPct.value = posToPct(touch.clientX)
}

function onEnd() {
  if (!dragging.value) return
  const target = (dragPct.value / 100) * (props.duration || 0)
  dragging.value = false
  emit('seek', target)
}
</script>

<style lang="scss" scoped>
@import '../styles/tokens.scss';

.m-progress {
  position: relative;
  padding: 12rpx 0;
}

.m-progress__track {
  position: relative;
  height: 8rpx;
  border-radius: 4rpx;
  background-color: rgba(255, 255, 255, 0.12);
}

.m-progress__fill {
  position: absolute;
  left: 0;
  top: 0;
  height: 8rpx;
  border-radius: 4rpx;
  background-color: $m-primary;
}

.m-progress__knob {
  position: absolute;
  top: 50%;
  width: 16rpx;
  height: 16rpx;
  border-radius: 999rpx;
  background-color: #ffffff;
  transform: translate(-50%, -50%);
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.4);
}

.m-progress__bubble {
  position: absolute;
  top: -40rpx;
  transform: translateX(-50%);
  padding: 4rpx 12rpx;
  border-radius: 8rpx;
  background-color: rgba(255, 255, 255, 0.14);
}

.m-progress__bubble-text {
  font-family: $m-font-num;
  font-size: 20rpx;
  color: $m-text-1;
}
</style>
