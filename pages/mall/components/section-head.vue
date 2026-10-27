<!--
  区块标题（公共组件）
  街头潮流风格：左粗黑标题 + 右侧英文装饰标签
  事件：more 点击「更多」时触发
-->
<template>
  <view class="section-head">
    <text class="section-title">{{ title }}</text>
    <text v-if="en" class="section-en">{{ en }}</text>
    <text v-if="more" class="section-more" @click="$emit('more')">{{ more }}</text>
  </view>
</template>

<script setup>
defineProps({
  /** 中文主标题 */
  title: { type: String, required: true },
  /** 英文装饰标签 */
  en: { type: String, default: '' },
  /** 右侧「更多」文案，为空则不渲染 */
  more: { type: String, default: '' }
})

defineEmits(['more'])
</script>

<style lang="scss" scoped>
@import "../styles/tokens.scss";
.section-head {
  display: flex;
  align-items: baseline;
  gap: 16rpx;
  padding: 0 $rz-page-pad;
  margin-bottom: $rz-gap-lg;
}

.section-title {
  font-size: $rz-fs-title;
  font-weight: 900;
  color: $rz-ink;
  line-height: 1.3;
}

.section-en {
  font-size: 20rpx;
  font-weight: 700;
  letter-spacing: 2rpx;
  color: $rz-grey-500;
}

.section-more {
  margin-left: auto;
  font-size: $rz-fs-desc;
  color: $rz-grey-500;
}
</style>
