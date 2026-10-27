<template>
  <view class="wallpaper-home">
    <Banner />
    <Recommend />
    <Special />
    <WallpaperTabbar current="home" />
  </view>
</template>

<script setup>
import Banner from "./components/Banner/index.vue";
import Recommend from "./components/Recommend/index.vue";
import Special from "./components/Special/index.vue";
import WallpaperTabbar from "../components/wallpaper-tabbar.vue";
import { onPullDownRefresh } from '@dcloudio/uni-app'
onPullDownRefresh(() => {
	setTimeout(() => {
		uni.stopPullDownRefresh()
	}, 1000)
})
</script>

<style scoped>
.wallpaper-home {
  min-height: 100vh;
  padding-bottom: calc(112rpx + env(safe-area-inset-bottom));
  box-sizing: border-box;
}
</style>
