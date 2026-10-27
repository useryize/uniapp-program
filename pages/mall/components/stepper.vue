<!--
  数量步进器（公共组件）
  上限为当前 SKU 可售库存（服务端口径），下限 1
  事件：change 抛出变化后的数量
-->
<template>
  <view class="stepper">
    <view class="stepper-btn" :class="{ disabled: value <= min }" @click="onChange(-1)">
      <text class="stepper-sign">−</text>
    </view>
    <text class="stepper-num">{{ value }}</text>
    <view class="stepper-btn" :class="{ disabled: value >= max }" @click="onChange(1)">
      <text class="stepper-sign">+</text>
    </view>
  </view>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  /** 当前数量 */
  value: { type: Number, default: 1 },
  /** 下限，默认 1 */
  min: { type: Number, default: 1 },
  /** 上限，默认取当前可售库存 */
  max: { type: Number, default: 99 }
})

const emit = defineEmits(['change'])

function onChange(delta) {
  const next = props.value + delta
  if (next < props.min || next > props.max) return
  emit('change', next)
}
</script>

<style lang="scss" scoped>
@import "../styles/tokens.scss";
.stepper {
  display: flex;
  align-items: center;
  border: 4rpx solid $rz-ink;
  background-color: $rz-white;
}

.stepper-btn {
  width: 56rpx;
  height: 52rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stepper-btn.disabled {
  opacity: 0.35;
}

.stepper-sign {
  font-size: 32rpx;
  font-weight: 700;
  color: $rz-ink;
  line-height: 1;
}

.stepper-num {
  min-width: 60rpx;
  text-align: center;
  font-size: 28rpx;
  font-weight: 700;
  color: $rz-ink;
}
</style>
