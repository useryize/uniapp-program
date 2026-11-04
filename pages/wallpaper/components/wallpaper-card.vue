<template>
  <view class="card" @click="$emit('select', wallpaper)">
    <view class="cover">
      <image v-if="!failed" class="image" :src="wallpaper.thumbnailUrl" mode="aspectFill" lazy-load @error="failed = true" />
      <view v-if="failed" class="fallback"><text>图片加载失败</text></view>
      <text v-if="label" class="label">{{ label }}</text>
    </view>
    <text class="name">{{ wallpaper.title }}</text>
    <text class="meta">{{ wallpaper.category }} · {{ wallpaper.license }}</text>
  </view>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { Wallpaper } from '../api/index'

const props = defineProps<{ wallpaper: Wallpaper; label?: string }>()
defineEmits<{ select: [wallpaper: Wallpaper] }>()
const failed = ref(false)
watch(() => props.wallpaper.thumbnailUrl, () => { failed.value = false })
</script>

<style lang="scss" scoped>
@import '../styles/tokens.scss';
.card { min-width: 0; }
.cover { position: relative; width: 100%; height: 430rpx; overflow: hidden; border-radius: 8rpx; background: $wp-image-fallback; }
.image { width: 100%; height: 100%; }
.fallback { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: $wp-muted; font-size: 22rpx; }
.label { position: absolute; left: 12rpx; top: 12rpx; padding: 7rpx 11rpx; border-radius: 6rpx; background: rgba(255,255,255,.88); color: $wp-text; font-size: 18rpx; }
.name { display: block; margin-top: 12rpx; color: $wp-text; font-size: 24rpx; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.meta { display: block; margin-top: 5rpx; color: $wp-muted; font-size: 20rpx; }
</style>
