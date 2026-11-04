<template>
  <view class="wp-header" :style="{ paddingTop: layout.top }">
    <view class="row" :style="{ paddingRight: layout.rightInset }">
      <view class="heading">
        <text class="eyebrow">WALLPAPER JOURNAL</text>
        <text class="title">{{ title }}</text>
      </view>
      <view class="header-slot"><slot /></view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { getWallpaperHeaderLayout } from '../utils/header'

defineProps<{ title: string }>()
const layout = getWallpaperHeaderLayout()
</script>

<style lang="scss" scoped>
@import '../styles/tokens.scss';
.wp-header { background: $wp-bg; }
.row { height: 92rpx; padding-left: $wp-page-pad; display: flex; justify-content: space-between; align-items: center; box-sizing: border-box; }
.heading { display: flex; flex-direction: column; min-width: 0; }
.eyebrow { color: $wp-muted; font-size: 18rpx; letter-spacing: 3rpx; font-weight: 700; }
.title { color: $wp-text; font-size: 42rpx; font-weight: 700; line-height: 1.18; }
.header-slot { flex-shrink: 0; }
</style>
