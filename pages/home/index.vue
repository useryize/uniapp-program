<template>
  <swiper
    class="banner"
    circular
    :indicator-dots="true"
    :autoplay="false"
    :interval="5000"
    indicator-active-color="rgba(255,255,255,.7)"
  >
    <swiper-item class="item" v-for="(item, index) in 8" :key="item?.index">
      <view class="pic" :style="{ backgroundColor: getRandomHexColor() }"></view>
    </swiper-item>
  </swiper>
</template>
<script setup>
const getRandomHexColor = () => {
  const color = Math.floor(Math.random() * 16777215).toString(16);
  return `#${color.padStart(6, "0")}`;
};
</script>
<style lang="scss" scoped>
.banner {
  box-sizing: border-box;
  height: 300rpx;
  margin-top: 20rpx;
  .item {
    box-sizing: border-box;
    padding: 0 30rpx;
    .pic {
      box-sizing: border-box;
      border-radius: 18rpx;
      width: 100%;
      height: 100%;
      position: relative;
    }
  }
}
</style>
