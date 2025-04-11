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
      <view class="pic" :style="{ backgroundColor: getRandomHexColor[index] }"></view>
    </swiper-item>
  </swiper>
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
.banner {
  box-sizing: border-box;
  height: 300rpx;
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
