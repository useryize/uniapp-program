<template>
  <!-- 每日推荐入口条（规格 §8.1.2）：点条身进 daily 页，点播放键立即整列入队播放 -->
  <view class="m-daily" @tap="$emit('open')">
    <view class="m-daily__date">
      <text class="m-daily__day">{{ day }}</text>
      <text class="m-daily__month">{{ month }}</text>
    </view>

    <view class="m-daily__text">
      <text class="m-daily__title">每日推荐 · {{ count }} 首</text>
      <text class="m-daily__reason">{{ reason }}</text>
    </view>

    <view class="m-daily__btn" @tap.stop="$emit('play')">
      <view class="m-daily__tri" />
    </view>
  </view>
</template>

<script setup lang="ts">
defineProps({
  day: { type: String, default: '' },
  month: { type: String, default: '' },
  count: { type: Number, default: 0 },
  reason: { type: String, default: '' }
})

defineEmits(['open', 'play'])
</script>

<style lang="scss" scoped>
@import '../styles/tokens.scss';

.m-daily {
  display: flex;
  align-items: center;
  height: 148rpx;
  border-radius: 28rpx;
  background-color: rgba(0, 224, 184, 0.08);
  border: 1rpx solid rgba(0, 224, 184, 0.22);
  padding: 0 28rpx;
  box-sizing: border-box;
}

.m-daily__date {
  width: 84rpx;
  height: 108rpx;
  border-radius: 20rpx;
  background-color: $m-primary;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.m-daily__day {
  font-family: $m-font-num;
  font-size: 40rpx;
  font-weight: 700;
  color: #0a0a0c;
  line-height: 46rpx;
}

.m-daily__month {
  font-family: $m-font-num;
  font-size: 18rpx;
  font-weight: 700;
  color: rgba(10, 10, 12, 0.7);
  line-height: 24rpx;
}

.m-daily__text {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding-left: 24rpx;
  overflow: hidden;
}

.m-daily__title {
  font-family: $m-font-cn;
  font-size: 30rpx;
  font-weight: 700;
  color: $m-text-1;
  line-height: 42rpx;
}

.m-daily__reason {
  margin-top: 8rpx;
  font-family: $m-font-cn;
  font-size: 22rpx;
  color: $m-text-2;
  line-height: 30rpx;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.m-daily__btn {
  width: 80rpx;
  height: 80rpx;
  border-radius: 999rpx;
  background-color: $m-primary;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.m-daily__tri {
  width: 0;
  height: 0;
  border-top: 14rpx solid transparent;
  border-bottom: 14rpx solid transparent;
  border-left: 20rpx solid #0a0a0c;
  margin-left: 6rpx;
}
</style>
