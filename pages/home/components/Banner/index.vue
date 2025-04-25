<template>
  <swiper
    class="banner"
    circular
    :indicator-dots="true"
    :autoplay="false"
    :interval="5000"
    indicator-color="rgba(255,255,255,.7)"
    indicator-active-color="rgba(255,255,255,1)"
  >
    <swiper-item class="item" v-for="(item, index) in bannerList" :key="item?.index">
      <image @click="previewImg(index)" :src="item?.src?.landscape" mode="aspectFill" lazy-load />
    </swiper-item>
  </swiper>
</template>
<script setup>
import { request } from "@/utils/request";
import { onMounted, ref } from "vue";
const bannerList = ref([]);
const init = async () => {
  const res = await request({
    url: "/v1/search",
    data: {
      query: "名胜古迹",
      per_page: "15",
      page: "1",
      orientation: "landscape",
      locale: "zh-CN",
    },
  });
  bannerList.value = res?.photos;
};

const previewImg = (index) => {
  uni.previewImage({
    current: index,
    urls: bannerList.value.map((item) => item.src.landscape),
  });
  console.error(bannerList.value.map((item) => item.src.landscape))
};

onMounted(() => {
  init();
});
</script>
<style lang="scss" scoped>
.banner {
  box-sizing: border-box;
  height: 450rpx;
  .item {
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
