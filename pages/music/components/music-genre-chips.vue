<template>
  <!-- 曲风胶囊横滑条（规格 §3.2）：首页与榜单的核心开关，切换只刷新内容区 -->
  <scroll-view class="m-chips" scroll-x :show-scrollbar="false" enhanced>
    <view class="m-chips__inner">
      <view
        v-for="g in genres"
        :key="g.id || 'all'"
        class="m-chips__item"
        :class="{ 'is-active': g.id === modelValue }"
        @tap="onTap(g)"
      >
        <text class="m-chips__text" :class="{ 'is-active': g.id === modelValue }">
          {{ g.label }}
        </text>
      </view>
    </view>
  </scroll-view>
</template>

<script setup lang="ts">
import type { GenreOption } from '../api/types'

const props = withDefaults(defineProps<{
  genres?: GenreOption[]
  /** 当前选中的曲风 id，空串代表「全部」 */
  modelValue?: string
}>(), {
  genres: () => [],
  modelValue: ''
})

const emit = defineEmits<{ 'update:modelValue': [id: string]; change: [id: string] }>()

function onTap(g: GenreOption) {
  if (g.id === props.modelValue) return
  emit('update:modelValue', g.id)
  emit('change', g.id)
}
</script>

<style lang="scss" scoped>
@import '../styles/tokens.scss';

.m-chips {
  width: 100%;
  white-space: nowrap;
}

.m-chips__inner {
  display: inline-flex;
  align-items: center;
  padding: 0 32rpx;
}

.m-chips__item {
  height: 64rpx;
  padding: 0 28rpx;
  border-radius: 999rpx;
  background-color: $m-line-weak;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16rpx;
  flex-shrink: 0;

  &.is-active {
    background-color: $m-primary;
  }
}

.m-chips__text {
  font-family: $m-font-num;
  font-size: 24rpx;
  font-weight: 500;
  color: $m-text-2;
  line-height: 32rpx;

  &.is-active {
    color: #0a0a0c;
    font-weight: 600;
  }
}
</style>
