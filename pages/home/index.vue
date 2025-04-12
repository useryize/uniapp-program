<template>
  <Banner />
  <Recommend />
  <Special />
</template>

<script setup>
import Banner from "./components/Banner";
import Recommend from "./components/Recommend";
import Special from "./components/Special";
import { onPullDownRefresh } from '@dcloudio/uni-app'
onPullDownRefresh(() => {
	setTimeout(() => {
		uni.stopPullDownRefresh()
	}, 1000)
})
</script>
