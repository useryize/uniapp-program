<template>
  <Banner />
  <Recommend />
  <Special />
</template>

<script setup>
import Banner from "./components/Banner/index.vue";
import Recommend from "./components/Recommend/index.vue";
import Special from "./components/Special/index.vue";
import { onPullDownRefresh } from '@dcloudio/uni-app'
onPullDownRefresh(() => {
	setTimeout(() => {
		uni.stopPullDownRefresh()
	}, 1000)
})
</script>
