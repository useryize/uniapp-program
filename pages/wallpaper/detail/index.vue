<template>
  <view class="page" @touchstart="onTouchStart" @touchend="onTouchEnd">
    <image v-if="current" class="wallpaper" :src="current.imageUrl" :mode="mode === 'clean' ? 'aspectFit' : 'aspectFill'" @error="imageError = true" />
    <view v-if="!current || imageError" class="image-error">{{ current ? '原图加载失败' : '未找到壁纸' }}</view>
    <view class="top" :style="{ paddingTop: header.top, paddingRight: header.rightInset }"><text class="circle" @click="back">×</text></view>
    <view v-if="current" class="mode-row"><text v-for="item in modes" :key="item.key" :class="{ active: mode === item.key }" @click="mode = item.key">{{ item.label }}</text></view>
    <view v-if="current && mode === 'lock'" class="lock-preview"><text>{{ dateLabel }}</text><text class="clock">09:41</text></view>
    <view v-if="current && mode === 'home'" class="home-preview"><text>09:41</text><view class="icons"><text>✦</text><text>○</text><text>◉</text><text>▣</text></view></view>
    <view v-if="current" class="arrows"><text @click="step(-1)">‹</text><text @click="step(1)">›</text></view>

    <view v-if="current" class="bottom"><view class="counter"><text>{{ index + 1 }} / {{ items.length }}</text><text @click="infoOpen = true">作品信息 ↗</text></view><text class="title">{{ current.title }}</text><text class="subtitle">{{ current.category }} · {{ current.width }} × {{ current.height }} · {{ current.license }}</text><view class="actions"><text class="favorite" @click="toggleFavorite">{{ favorite ? '♥ 已收藏' : '♡ 收藏' }}</text><text class="save" @click="save">{{ saving ? '保存中…' : '↓ 保存到相册' }}</text></view></view>

    <view v-if="infoOpen && current" class="info-mask" @click="infoOpen = false"><view class="info-sheet" @click.stop><text class="info-title">作品信息</text><text class="info-line">作者：{{ current.creator }}</text><text class="info-line">许可：{{ current.license }}</text><text class="info-line">来源：Wikimedia Commons</text><text class="info-tip">请在原始文件页核对许可和其他使用限制。</text><text class="copy" @click="copySource">复制原始文件链接</text></view></view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { wallpaperApi, type Wallpaper } from '../api/index'
import { getWallpaperHeaderLayout } from '../utils/header'

type PreviewMode = 'clean' | 'lock' | 'home'
const modes: Array<{ key: PreviewMode; label: string }> = [
  { key: 'clean', label: '原图' }, { key: 'lock', label: '锁屏' }, { key: 'home', label: '桌面' }
]
const header = getWallpaperHeaderLayout()
const items = ref<Wallpaper[]>([])
const index = ref(0)
const mode = ref<PreviewMode>('clean')
const infoOpen = ref(false)
const imageError = ref(false)
const saving = ref(false)
const favorite = ref(false)
const current = computed(() => items.value[index.value])
const dateLabel = new Date().toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' })
let startX = 0

onLoad((options) => {
  items.value = wallpaperApi.previewList()
  const id = decodeURIComponent(String(options?.id || ''))
  const found = items.value.findIndex(item => item.id === id)
  index.value = found >= 0 ? found : 0
  favorite.value = current.value ? wallpaperApi.isFavorite(current.value.id) : false
})

function back() { if (getCurrentPages().length > 1) uni.navigateBack(); else uni.redirectTo({ url: '/pages/wallpaper/home/index' }) }
function step(direction: number) {
  if (!items.value.length) return
  index.value = (index.value + direction + items.value.length) % items.value.length
  mode.value = 'clean'
  imageError.value = false
  favorite.value = wallpaperApi.isFavorite(current.value.id)
}
function onTouchStart(event: TouchEvent) { startX = event.changedTouches?.[0]?.clientX || 0 }
function onTouchEnd(event: TouchEvent) {
  const delta = (event.changedTouches?.[0]?.clientX || 0) - startX
  if (Math.abs(delta) > 70 && !infoOpen.value) step(delta < 0 ? 1 : -1)
}
function toggleFavorite() {
  if (!current.value) return
  favorite.value = wallpaperApi.toggleFavorite(current.value)
  uni.showToast({ title: favorite.value ? '已加入收藏' : '已取消收藏', icon: 'none' })
}
async function save() {
  if (!current.value || saving.value) return
  if (uni.getSystemInfoSync().uniPlatform === 'web') {
    uni.showToast({ title: '请在微信小程序中保存到相册', icon: 'none' })
    return
  }
  saving.value = true
  try {
    await wallpaperApi.save(current.value)
    uni.showToast({ title: '已保存到相册', icon: 'success' })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    if (/auth|authorize|permission|deny/i.test(message)) {
      uni.showModal({ title: '需要相册权限', content: '请在设置中允许保存图片到相册', success: result => { if (result.confirm) uni.openSetting({}) } })
    } else {
      uni.showToast({ title: '保存失败，请稍后重试', icon: 'none' })
    }
  } finally {
    saving.value = false
  }
}
function copySource() {
  if (!current.value) return
  uni.setClipboardData({ data: current.value.sourceUrl, success: () => { infoOpen.value = false; uni.showToast({ title: '链接已复制', icon: 'none' }) } })
}
</script>

<style lang="scss" scoped>
@import '../styles/tokens.scss';
.page { position: relative; width: 100%; height: 100vh; overflow: hidden; background: #11272A; color: white; }
.wallpaper { width: 100%; height: 100%; }
.image-error { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; color: white; font-size: 24rpx; }
.top { position: absolute; top: 0; left: 0; right: 0; padding-left: 24rpx; height: 90rpx; display: flex; align-items: center; box-sizing: content-box; }
.circle { width: 66rpx; height: 66rpx; border-radius: 50%; background: rgba(255,255,255,.25); display: flex; align-items: center; justify-content: center; font-size: 39rpx; }
.mode-row { position: absolute; top: 116rpx; left: 50%; transform: translateX(-50%); display: flex; padding: 6rpx; border-radius: 50rpx; background: rgba(0,0,0,.25); white-space: nowrap; }
.mode-row text { padding: 12rpx 22rpx; font-size: 22rpx; border-radius: 40rpx; }
.mode-row text.active { color: $wp-text; background: white; font-weight: 700; }
.lock-preview { position: absolute; top: 25%; left: 0; right: 0; display: flex; align-items: center; flex-direction: column; text-shadow: 0 3rpx 15rpx rgba(0,0,0,.35); font-size: 28rpx; }
.clock { font-size: 140rpx; font-weight: 300; line-height: 1.1; }
.home-preview { position: absolute; top: 24%; left: 0; right: 0; display: flex; align-items: center; flex-direction: column; font-size: 45rpx; }
.icons { display: flex; gap: 23rpx; margin-top: 260rpx; }
.icons text { width: 74rpx; height: 74rpx; display: flex; align-items: center; justify-content: center; border-radius: 18rpx; background: rgba(255,255,255,.5); }
.arrows { position: absolute; top: 48%; left: 16rpx; right: 16rpx; display: flex; justify-content: space-between; }
.arrows text { width: 65rpx; height: 65rpx; border-radius: 50%; background: rgba(0,0,0,.22); display: flex; align-items: center; justify-content: center; font-size: 48rpx; }
.bottom { position: absolute; left: 0; right: 0; bottom: 0; padding: 90rpx 32rpx calc(40rpx + env(safe-area-inset-bottom)); display: flex; flex-direction: column; background: linear-gradient(transparent, rgba(7,28,32,.92)); }
.counter { display: flex; justify-content: space-between; font-size: 21rpx; margin-bottom: 12rpx; }
.title { font-size: 41rpx; font-weight: 700; }
.subtitle { margin-top: 9rpx; font-size: 21rpx; color: rgba(255,255,255,.82); }
.actions { display: flex; gap: 14rpx; margin-top: 28rpx; }
.actions text { flex: 1; text-align: center; border: 1rpx solid rgba(255,255,255,.6); border-radius: 12rpx; padding: 20rpx 10rpx; font-size: 24rpx; font-weight: 700; }
.actions .save { flex: 1.4; background: white; color: $wp-text; }
.info-mask { position: absolute; inset: 0; z-index: 10; background: rgba(0,0,0,.5); display: flex; align-items: flex-end; }
.info-sheet { width: 100%; padding: 36rpx 32rpx calc(46rpx + env(safe-area-inset-bottom)); box-sizing: border-box; border-radius: 28rpx 28rpx 0 0; background: $wp-bg; color: $wp-text; display: flex; flex-direction: column; gap: 20rpx; }
.info-title { font-size: 32rpx; font-weight: 700; }
.info-line { font-size: 23rpx; }
.info-tip { color: $wp-muted; font-size: 21rpx; }
.copy { padding: 18rpx; border-radius: 12rpx; text-align: center; background: $wp-accent; color: white; font-size: 23rpx; }
</style>
