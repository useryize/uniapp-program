<!--
  全部应用（pages/index/apps）
  职责：应用入口的完整列表；当子项目数量增多时由首页跳转至此
  视觉来源：Ardot 文件 740919646771918，扩展态 Frame 2:78
  扩展策略：2 列网格，新增应用自动换行；末位保留「添加新应用」占位
-->
<template>
  <view class="apps">
    <view class="glow glow-indigo" />
    <view class="glow glow-violet" />

    <view class="status-bar" />

    <!-- 顶部栏 -->
    <view class="nav-bar">
      <view class="back-btn" @click="onBack">
        <view class="back-arrow" />
      </view>
      <text class="nav-title">全部应用</text>
    </view>

    <!-- 标题区 -->
    <view class="head">
      <text class="head-title">{{ apps.length }} 个应用</text>
      <text class="head-desc">每个空间都是独立的沉浸体验</text>
    </view>

    <!-- 应用网格 -->
    <view class="grid">
      <view
        v-for="app in apps"
        :key="app.id"
        class="cell"
        :style="{ background: app.bg, borderColor: app.border }"
        @click="onEnter(app)"
      >
        <view class="cell-icon" :style="{ background: app.iconBg, borderColor: app.iconBorder }">
          <view class="cell-glyph" :style="{ borderColor: app.color, background: app.color }" />
        </view>
        <view class="cell-text">
          <text class="cell-name">{{ app.name }}</text>
          <text class="cell-desc">{{ app.meta }}</text>
        </view>
      </view>

      <!-- 占位：添加新应用 -->
      <view class="cell cell--ghost" @click="onAdd">
        <view class="cell-icon cell-icon--ghost">
          <view class="plus-v" />
          <view class="plus-h" />
        </view>
        <view class="cell-text">
          <text class="cell-name cell-name--ghost">添加新应用</text>
        </view>
      </view>
    </view>

    <view class="footer">
      <view class="footer-line" />
      <text class="footer-text">已安装 {{ apps.length }} 个应用</text>
    </view>
  </view>
</template>

<script setup>
const APPS = [
  {
    id: 'mall',
    name: '潮流商城',
    meta: '128 件在售',
    color: '#FFD500',
    iconBg: 'rgba(255, 213, 0, 0.16)',
    iconBorder: 'rgba(255, 213, 0, 0.34)',
    bg: 'linear-gradient(160deg, #1E2433 0%, #2B2C40 100%)',
    border: 'rgba(255, 255, 255, 0.10)',
    url: '/pages/mall/index'
  },
  {
    id: 'wallpaper',
    name: '极简壁纸',
    meta: '3200+ 张高清',
    color: '#7FA8FF',
    iconBg: 'rgba(127, 168, 255, 0.18)',
    iconBorder: 'rgba(127, 168, 255, 0.36)',
    bg: 'linear-gradient(160deg, #1E2433 0%, #29303F 100%)',
    border: 'rgba(255, 255, 255, 0.10)',
    url: '/pages/wallpaper/home/index'
  },
  {
    id: 'coffee',
    name: '咖啡日记',
    meta: '记录 42 杯',
    color: '#FA9E5C',
    iconBg: 'rgba(250, 158, 92, 0.16)',
    iconBorder: 'rgba(250, 158, 92, 0.34)',
    bg: 'linear-gradient(160deg, #1E2433 0%, #2E2938 100%)',
    border: 'rgba(255, 255, 255, 0.10)',
    url: ''
  },
  {
    id: 'fitness',
    name: '健身计划',
    meta: '本周 3 次',
    color: '#4DD19E',
    iconBg: 'rgba(77, 209, 158, 0.16)',
    iconBorder: 'rgba(77, 209, 158, 0.34)',
    bg: 'linear-gradient(160deg, #1E2433 0%, #233334 100%)',
    border: 'rgba(255, 255, 255, 0.10)',
    url: ''
  },
  {
    id: 'music',
    name: '音乐盒',
    meta: '12 个歌单',
    color: '#B87AFF',
    iconBg: 'rgba(184, 122, 255, 0.16)',
    iconBorder: 'rgba(184, 122, 255, 0.34)',
    bg: 'linear-gradient(160deg, #1E2433 0%, #30273B 100%)',
    border: 'rgba(255, 255, 255, 0.10)',
    url: ''
  }
]

const apps = APPS

const onBack = () => {
  uni.navigateBack()
}

const onEnter = (app) => {
  if (!app.url) {
    uni.showToast({ title: `${app.name} 即将上线`, icon: 'none' })
    return
  }
  uni.navigateTo({ url: app.url })
}

const onAdd = () => {
  uni.showToast({ title: '敬请期待', icon: 'none' })
}
</script>

<style lang="scss" scoped>
@import './styles/tokens.scss';

.apps {
  position: relative;
  min-height: 100vh;
  background: $uf-bg;
  overflow: hidden;
}

.glow {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
}
.glow-indigo {
  width: 600rpx;
  height: 600rpx;
  top: -220rpx;
  left: -160rpx;
  background: radial-gradient(circle, rgba(61, 90, 255, 0.32) 0%, transparent 70%);
}
.glow-violet {
  width: 560rpx;
  height: 560rpx;
  top: -180rpx;
  right: -100rpx;
  background: radial-gradient(circle, rgba(125, 77, 255, 0.26) 0%, transparent 70%);
}

.status-bar {
  height: 88rpx;
}

.nav-bar {
  height: 112rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 $uf-page-pad;
}
.back-btn {
  width: 64rpx;
  height: 64rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.08);
  border: 2rpx solid rgba(255, 255, 255, 0.14);
  display: flex;
  align-items: center;
  justify-content: center;
}
.back-arrow {
  width: 22rpx;
  height: 22rpx;
  border-left: 3rpx solid #D8DCE6;
  border-bottom: 3rpx solid #D8DCE6;
  transform: rotate(45deg);
}
.nav-title {
  font-size: 34rpx;
  font-weight: 600;
  color: $uf-text-1;
}

.head {
  padding: 12rpx $uf-page-pad 36rpx;
  display: flex;
  flex-direction: column;
}
.head-title {
  font-size: 52rpx;
  font-weight: 700;
  color: $uf-text-1;
}
.head-desc {
  margin-top: 12rpx;
  font-size: 24rpx;
  color: $uf-text-3;
}

/* 应用网格 */
.grid {
  padding: 0 $uf-page-pad 48rpx;
  display: flex;
  flex-wrap: wrap;
  gap: $uf-gap;
}
.cell {
  width: calc((100% - #{$uf-gap}) / 2);
  height: 304rpx;
  border-radius: $uf-radius-item;
  border: 2rpx solid $uf-line;
  padding: 28rpx;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
.cell--ghost {
  background: rgba(255, 255, 255, 0.02);
  border: 2rpx dashed rgba(255, 255, 255, 0.13);
}
.cell-icon {
  width: 72rpx;
  height: 72rpx;
  border-radius: 24rpx;
  border: 2rpx solid transparent;
  display: flex;
  align-items: center;
  justify-content: center;
}
.cell-icon--ghost {
  background: rgba(255, 255, 255, 0.05);
}
.cell-glyph {
  width: 38rpx;
  height: 38rpx;
  border-radius: 12rpx;
  border: 4rpx solid transparent;
  opacity: 0.9;
}
.plus-v,
.plus-h {
  position: absolute;
  background: $uf-text-3;
  border-radius: 2rpx;
}
.cell-icon--ghost {
  position: relative;
}
.plus-v {
  width: 3rpx;
  height: 30rpx;
  left: 50%;
  top: 50%;
  margin: -15rpx 0 0 -1.5rpx;
}
.plus-h {
  width: 30rpx;
  height: 3rpx;
  left: 50%;
  top: 50%;
  margin: -1.5rpx 0 0 -15rpx;
}
.cell-text {
  display: flex;
  flex-direction: column;
}
.cell-name {
  font-size: 28rpx;
  font-weight: 600;
  color: $uf-text-1;
}
.cell-name--ghost {
  font-size: 24rpx;
  font-weight: 500;
  color: $uf-text-3;
}
.cell-desc {
  margin-top: 10rpx;
  font-size: 22rpx;
  color: $uf-text-3;
}

.footer {
  padding: 12rpx $uf-page-pad 28rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.footer-line {
  width: 100%;
  height: 2rpx;
  background: $uf-line-soft;
  margin-bottom: 16rpx;
}
.footer-text {
  font-size: 20rpx;
  color: $uf-text-4;
  letter-spacing: 1rpx;
}
</style>
