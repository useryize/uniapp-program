<template>
  <view class="titleBox">
    <view class="name">专题推荐</view>
    <view class="text">More+</view>
  </view>
  <view class="specBox">
    <view class="item" v-for="(item, index) in list" :key="item">
      <view class="image-container">
        <image 
          :src="item?.src?.landscape" 
          mode="heightFix" 
          lazy-load 
          @load="onImageLoad(index)"
        />
        <view class="image-placeholder" v-if="!loadedImages.has(index)">
          <view class="loading-spinner"></view>
        </view>
      </view>
      <view class="title">{{ item?.alt }}</view>
      <!-- <view class="tis">更新时间</view> -->
    </view>
    <view class="item more" v-if="list.length">More+</view>
  </view>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { request } from "@/utils/request";
const list = ref([]);
const loadedImages = ref(new Set());

const onImageLoad = (index) => {
  loadedImages.value.add(index);
};

const init = async () => {
  const res = await request({
    url: "/v1/search",
    data: {
      query: "樱花",
      per_page: "8",
      page: "1",
      orientation: "landscape",
      locale: "zh-CN",
    },
  });
  list.value = res?.photos;
};
onMounted(() => {
  init();
});
</script>

<style lang="scss" scoped>
.titleBox {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 30rpx;
  margin: 30rpx 0 20rpx;
  .name {
    font-size: 40rpx;
  }
  .text {
    margin-left: 10rpx;
    color: #ff6600;
  }
}

.specBox {
  padding: 0 30rpx;
  display: grid;
  gap: 10rpx;
  grid-template-columns: repeat(3, 1fr);
  .item {
    height: 300rpx;
    border-radius: 18rpx;
    position: relative;
    overflow: hidden;

    .image-container {
      position: relative;
      width: 100%;
      height: 100%;

      image {
        width: 100%;
        height: 100%;
        object-fit: cover;
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

    &.more {
      background: linear-gradient(
        135deg,
        rgba(255, 105, 180, 0.1),
        rgba(100, 200, 255, 0.1)
      );
      backdrop-filter: blur(25rpx);
      -webkit-backdrop-filter: blur(25rpx);
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .title {
      width: 100%;
      height: 40rpx;
      color: #ffffff;
      font-size: 24rpx;
      position: absolute;
      left: 0;
      bottom: 0;
      background-color: rgba(100, 200, 255, 0.3);
      backdrop-filter: blur(20rpx);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      padding: 0 20rpx;
      text-align: center;
    }
    .tis {
      padding: 8rpx 10rpx;
      font-size: 20rpx;
      color: #ffffff;
      border-radius: 0 0 18rpx;
      background-color: rgba($color: #ff0e0e, $alpha: 0.7);
      position: absolute;
      left: 0;
      top: 0;
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
