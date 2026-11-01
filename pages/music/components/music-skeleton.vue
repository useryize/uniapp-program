<template>
  <!-- 骨架屏（规格 §3.2）：Audius 接口均值 2.5s，首屏必须骨架占位，不能白屏 -->
  <view class="m-skeleton">
    <!-- 卡片网格形态（首页主推区） -->
    <view v-if="type === 'grid'" class="m-skeleton__grid">
      <view v-for="i in rows" :key="i" class="m-skeleton__card">
        <view class="m-skeleton__cover" />
        <view class="m-skeleton__line" style="width: 70%" />
        <view class="m-skeleton__line m-skeleton__line--short" />
      </view>
    </view>

    <!-- 列表形态（曲目列表） -->
    <view v-else class="m-skeleton__list">
      <view v-for="i in rows" :key="i" class="m-skeleton__row">
        <view class="m-skeleton__thumb" />
        <view class="m-skeleton__col">
          <view class="m-skeleton__line" style="width: 55%" />
          <view class="m-skeleton__line m-skeleton__line--short" style="width: 32%" />
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
defineProps({
  /** grid | list */
  type: { type: String, default: 'list' },
  rows: { type: Number, default: 5 }
})
</script>

<style lang="scss" scoped>
@import '../styles/tokens.scss';

.m-skeleton__list,
.m-skeleton__grid {
  width: 100%;
}

.m-skeleton__row {
  display: flex;
  align-items: center;
  height: 104rpx;
  padding: 0 32rpx;
  box-sizing: border-box;
}

.m-skeleton__thumb {
  width: 80rpx;
  height: 80rpx;
  border-radius: 16rpx;
  background-color: $m-surface-hover;
  margin-right: 24rpx;
  animation: m-pulse 1.4s ease-in-out infinite;
}

.m-skeleton__col {
  flex: 1;
}

.m-skeleton__grid {
  display: flex;
  flex-wrap: wrap;
  padding: 0 32rpx;
}

.m-skeleton__card {
  width: calc(50% - 11rpx);
  margin-bottom: 32rpx;

  &:nth-child(odd) {
    margin-right: 22rpx;
  }
}

.m-skeleton__cover {
  width: 100%;
  height: 160rpx;
  border-radius: 24rpx;
  background-color: $m-surface-hover;
  margin-bottom: 16rpx;
  animation: m-pulse 1.4s ease-in-out infinite;
}

.m-skeleton__line {
  height: 24rpx;
  border-radius: 8rpx;
  background-color: $m-surface-hover;
  margin-bottom: 12rpx;
  animation: m-pulse 1.4s ease-in-out infinite;

  &--short {
    width: 40%;
    height: 20rpx;
  }
}

@keyframes m-pulse {
  0%,
  100% {
    opacity: 0.5;
  }
  50% {
    opacity: 1;
  }
}
</style>
