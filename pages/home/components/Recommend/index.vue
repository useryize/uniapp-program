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
    <view class="item" v-for="(item, index) in list" :key="item">
      <image :src="item?.src?.landscape" mode="heightFix" />
    </view>
  </scroll-view>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { request } from "@/utils/request";
const list = ref([]);
const init = async () => {
  const res = await request({
    url: "/v1/search",
    data: {
      query: "大海",
      per_page: "15",
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
  .time {
    display: flex;
    align-items: center;
    .text {
      margin-left: 10rpx;
      color: #ff6600;
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
