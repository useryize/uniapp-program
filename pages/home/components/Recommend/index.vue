<template>
  <view class="title">
    <view class="name">每日推荐</view>
    <view class="date">
      <uni-icons type="calendar" size="18"></uni-icons>
      <view class="text">
        <uni-dateformat :date="Date.now()" format="dd日"></uni-dateformat>
      </view>
    </view>
  </view>
  <scroll-view class="recom" scroll-x>
    <view
      class="item"
      v-for="(item, index) in 8"
      :key="item"
      :style="{ backgroundColor: getRandomHexColor[index] }"
      >13246</view
    >
  </scroll-view>
</template>

<script setup>
const getRandomHexColor = [
  "#E0F7FA",
  "#B2EBF2",
  "#80DEEA",
  "#4DD0E1",
  "#26C6DA",
  "#F3E5F5",
  "#E1BEE7",
  "#CE93D8",
  "#BA68C8",
  "#AB47BC",
];
</script>
<style lang="scss" scoped>
.title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 30rpx;
  .name {
    font-size: 40rpx;
  }
}
.recom {
  padding: 0 30rpx;
  white-space: nowrap;
  .item {
    width: 200rpx;
    height: 430rpx;
    display: inline-block;
    margin-right: 15rpx;
    border-radius: 10rpx;
    overflow: hidden;
    image {
      width: 100%;
      height: 100%;
      border-radius: 10rpx;
    }
  }
}
</style>
