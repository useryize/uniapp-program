<template>
  <!-- 状态栏占位：高度取系统真实值，安卓不同机型 24~48 不等，不能写死 44 -->
  <view class="m-status-bar" :style="{ height: statusBarHeight + 'px' }" />
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const statusBarHeight = ref(44)

onMounted(() => {
  try {
    const info = uni.getWindowInfo ? uni.getWindowInfo() : uni.getSystemInfoSync()
    statusBarHeight.value = info.statusBarHeight || 44
  } catch (e) {
    // 取不到就用默认值，不影响布局
  }
})
</script>

<style lang="scss" scoped>
.m-status-bar {
  width: 100%;
  flex-shrink: 0;
}
</style>
