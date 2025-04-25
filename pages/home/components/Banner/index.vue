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
      <view class="image-container">
        <image 
          @click="previewImg(index)" 
          :src="item?.src?.landscape" 
          mode="aspectFill" 
          lazy-load 
          @load="onImageLoad(index)"
        />
        <view class="image-placeholder" v-if="!loadedImages.has(index)">
          <view class="loading-spinner"></view>
        </view>
      </view>
    </swiper-item>
  </swiper>
</template>
<script setup>
import { request } from "@/utils/request";
import { onMounted, ref } from "vue";
const bannerList = ref([]);
const loadedImages = ref(new Set());

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

const onImageLoad = (index) => {
  loadedImages.value.add(index);
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

    .image-container {
      position: relative;
      width: 100%;
      height: 100%;

      image {
        width: 100%;
        height: 100%;
        border-radius: 8rpx;
      }

      .image-placeholder {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #f5f5f5;
        border-radius: 8rpx;

        .loading-spinner {
          width: 40rpx;
          height: 40rpx;
          border: 4rpx solid #f3f3f3;
          border-top: 4rpx solid #3498db;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
      }
    }
  }
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>
