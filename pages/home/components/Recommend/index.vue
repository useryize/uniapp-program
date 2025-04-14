<template>
  <view class="titleBox">
    <view class="name">每日推荐</view>
    <view class="time">
      <uni-icons type="calendar" size="18"></uni-icons>
      <view class="text">
        <uni-dateformat :date="Date.now()" format="dd日" />
      </view>
    </view>
  </view>
  <scroll-view class="scrollBox" scroll-x>
    <view
      class="item"
      v-for="(item, index) in 8"
      :key="item"
      :style="{ backgroundColor: getRandomHexColor[8 - index] }"
    ></view>
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
.titleBox {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 30rpx;
  margin: 20rpx 0;
  .name {
    font-size: 40rpx;
  }
  .time {
    display: flex;
    align-items: center;
    .text {
      margin-left: 10rpx;
      color: #5f24ff;
    }
  }
}
.scrollBox {
  box-sizing: border-box;
  padding: 0 30rpx;
  white-space: nowrap;
  overflow: hidden;
  .item {
    width: 300rpx;
    height: 430rpx;
    margin-right: 10rpx;
    display: inline-block;
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
