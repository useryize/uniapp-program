<template>
  <swiper
    class="banner"
    circular
    :indicator-dots="true"
    :autoplay="false"
    :interval="5000"
    indicator-active-color="rgba(255,255,255,.7)"
  >
    <swiper-item class="item" v-for="(item, index) in bannerList" :key="item?.index">
      <image :src="HOST + item?.url" mode="scaleToFill" />
    </swiper-item>
  </swiper>
</template>
<script setup>
import { request, HOST } from "@/utils/request";
import { onMounted, ref } from "vue";

const bannerList = ref([]);
const init = async () => {
  const res = await request({
    url: "/HPImageArchive.aspx",
    data: {
      format: "js",
      idx: "0",
      n: "8",
    },
  });
  bannerList.value = res?.images;
  console.error(bannerList);
};
onMounted(() => {
  init();
});
</script>
<style lang="scss" scoped>
.banner {
  box-sizing: border-box;

  .item {
    // height: 300rpx;
    // aspect-ratio: 16/9;
    // height: (750 * 1080 / 1920)rpx;
    box-sizing: border-box;
    padding: 0 30rpx;
    overflow: hidden;

    image {
      width: 100%;
      height: 100%;
      border-radius: 8rpx;
    }
  }
}
</style>
