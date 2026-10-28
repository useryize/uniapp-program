<!--
  应用首页（pages/index/index）
  职责：作为各子项目的统一入口导航页；当前承载「潮流商城」「极简壁纸」
  视觉来源：Ardot 文件 740919646771918，首页 Frame 2:1
  扩展策略：入口数据由 APPS 常量驱动，新增子项目只需追加一项，无需改动布局
-->
<template>
  <view class="home">
    <!-- 氛围光晕：靛蓝 / 紫罗兰 / 暖杏三处弥散 -->
    <view class="glow glow-indigo" />
    <view class="glow glow-violet" />
    <view class="glow glow-warm" />

    <!-- 状态栏占位 -->
    <view class="status-bar" />

    <!-- 顶部品牌栏 -->
    <view class="brand-bar">
      <view class="brand-left">
        <view class="logo-mark">
          <view class="logo-diamond" />
        </view>
        <view class="brand-text">
          <text class="brand-name">UNIFLOW</text>
          <text class="brand-sub">你的潮流生活空间</text>
        </view>
      </view>
      <view class="brand-actions">
        <view class="icon-btn" @click="onNotice">
          <view class="bell-icon" />
        </view>
        <view class="avatar" @click="onProfile">
          <view class="avatar-head" />
          <view class="avatar-body" />
        </view>
      </view>
    </view>

    <!-- Hero 主视觉 -->
    <view class="hero">
      <view class="hero-badge">
        <view class="hero-dot" />
        <text class="hero-badge-text">{{ apps.length }} 个应用已上线</text>
      </view>
      <text class="hero-title">今天想去哪儿逛逛？</text>
      <text class="hero-desc">精选空间，一站直达</text>
    </view>

    <!-- 应用入口列表：大卡片 + 预留占位 -->
    <view class="app-list">
      <view
        v-for="app in apps"
        :key="app.id"
        class="app-card"
        :class="`app-card--${app.id}`"
        @click="onEnter(app)"
      >
        <!-- 卡片氛围光 -->
        <view class="card-glow" :style="{ background: `radial-gradient(circle, ${app.glow} 0%, transparent 70%)` }" />

        <view class="card-body">
          <view class="card-head">
            <view class="card-icon" :style="{ background: app.iconBg, borderColor: app.iconBorder }">
              <view class="card-glyph" :style="{ borderColor: app.color, background: app.color }" />
            </view>
            <text class="card-name">{{ app.name }}</text>
          </view>
          <text class="card-desc">{{ app.desc }}</text>
        </view>

        <!-- 右侧封面 -->
        <view class="card-cover">
          <image v-if="app.cover" class="cover-img" :src="app.cover" mode="aspectFill" />
          <view v-else class="cover-fallback" :style="{ background: app.coverGradient }" />
        </view>

        <!-- 底行：标签 + 进入 -->
        <view class="card-foot">
          <view class="card-tags">
            <view class="chip" :style="{ background: app.tagBg }">
              <text class="chip-text" :style="{ color: app.color }">{{ app.tag }}</text>
            </view>
            <view class="chip chip--plain">
              <text class="chip-text chip-text--plain">{{ app.meta }}</text>
            </view>
          </view>
          <view class="card-enter">
            <text class="enter-text">进入</text>
            <view class="enter-arrow" :style="{ borderColor: app.color }" />
          </view>
        </view>
      </view>

      <!-- 预留位：后期新增应用的落点；点击进入完整列表 -->
      <view class="more-row" @click="onSeeAll">
        <view class="more-icon">
          <view class="plus-v" />
          <view class="plus-h" />
        </view>
        <text class="more-text">更多应用即将上线</text>
        <view class="chip chip--plain">
          <text class="chip-text chip-text--plain">敬请期待</text>
        </view>
      </view>
    </view>

    <!-- 底部信息 -->
    <view class="footer">
      <view class="footer-line" />
      <text class="footer-text">UNIFLOW · 版本 1.0.0</text>
    </view>
  </view>
</template>

<script setup>
/**
 * 子项目入口配置
 * 新增一个子项目 = 在此数组追加一项（id 唯一），布局自动适配
 */
const APPS = [
  {
    id: 'mall',
    name: '潮流商城',
    desc: '街头潮牌 · 限量发售 · 每周上新',
    tag: '今日发售',
    meta: '128 件在售',
    color: '#FFD500',
    iconBg: 'rgba(255, 213, 0, 0.16)',
    iconBorder: 'rgba(255, 213, 0, 0.34)',
    tagBg: 'rgba(255, 213, 0, 0.14)',
    glow: 'rgba(255, 213, 0, 0.22)',
    cover: '/static/mall/tee.jpg',
    coverGradient: 'linear-gradient(160deg, #FFD500 0%, #F5A623 100%)',
    url: '/pages/mall/index'
  },
  {
    id: 'wallpaper',
    name: '极简壁纸',
    desc: '高清美图 · 每日精选 · 免费下载',
    tag: '今日精选',
    meta: '3200+ 张',
    color: '#7FA8FF',
    iconBg: 'rgba(127, 168, 255, 0.18)',
    iconBorder: 'rgba(127, 168, 255, 0.36)',
    tagBg: 'rgba(127, 168, 255, 0.16)',
    glow: 'rgba(127, 168, 255, 0.24)',
    cover: '',
    coverGradient: 'linear-gradient(160deg, #476FF2 0%, #B87AFF 55%, #FA8C9E 100%)',
    url: '/pages/wallpaper/home/index'
  },
  {
    id: 'weather',
    name: '天气助手',
    desc: '实时天气 · 逐时预报 · 降水雷达',
    tag: '实时更新',
    meta: '367 城覆盖',
    color: '#4C8DFF',
    iconBg: 'rgba(76, 141, 255, 0.18)',
    iconBorder: 'rgba(76, 141, 255, 0.36)',
    tagBg: 'rgba(76, 141, 255, 0.16)',
    glow: 'rgba(76, 141, 255, 0.24)',
    cover: '',
    coverGradient: 'linear-gradient(160deg, #014DB2 0%, #00317A 55%, #001645 100%)',
    url: '/pages/weather/home/index'
  }
]

const apps = APPS

const onEnter = (app) => {
  uni.navigateTo({ url: app.url })
}

const onSeeAll = () => {
  uni.navigateTo({ url: '/pages/index/apps' })
}

const onNotice = () => {
  uni.showToast({ title: '暂无新消息', icon: 'none' })
}

const onProfile = () => {
  uni.navigateTo({ url: '/pages/mall/person/index' })
}
</script>

<style lang="scss" scoped>
@import './styles/tokens.scss';

.home {
  position: relative;
  min-height: 100vh;
  background: $uf-bg;
  overflow: hidden;
}

/* 氛围光晕 */
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
.glow-warm {
  width: 680rpx;
  height: 680rpx;
  bottom: -300rpx;
  left: -180rpx;
  background: radial-gradient(circle, rgba(255, 164, 92, 0.14) 0%, transparent 70%);
}

/* 状态栏 */
.status-bar {
  height: 88rpx;
}

/* 顶部品牌栏 */
.brand-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16rpx $uf-page-pad;
}
.brand-left {
  display: flex;
  align-items: center;
}
.logo-mark {
  width: 68rpx;
  height: 68rpx;
  border-radius: 22rpx;
  background: linear-gradient(135deg, #4D6AFF 0%, #8F5CFF 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 12rpx 32rpx rgba(77, 106, 255, 0.45);
}
.logo-diamond {
  width: 36rpx;
  height: 36rpx;
  background: rgba(255, 255, 255, 0.95);
  transform: rotate(45deg);
  border-radius: 4rpx;
}
.brand-text {
  margin-left: 20rpx;
  display: flex;
  flex-direction: column;
}
.brand-name {
  font-size: 30rpx;
  font-weight: 700;
  color: $uf-text-1;
  letter-spacing: 2rpx;
}
.brand-sub {
  margin-top: 2rpx;
  font-size: 20rpx;
  color: $uf-text-3;
}
.brand-actions {
  display: flex;
  align-items: center;
}
.icon-btn {
  width: 68rpx;
  height: 68rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.08);
  border: 2rpx solid rgba(255, 255, 255, 0.14);
  display: flex;
  align-items: center;
  justify-content: center;
}
.bell-icon {
  width: 26rpx;
  height: 26rpx;
  border: 3rpx solid #D8DCE6;
  border-radius: 6rpx 6rpx 4rpx 4rpx;
  border-bottom-width: 5rpx;
}
.avatar {
  margin-left: 20rpx;
  width: 68rpx;
  height: 68rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, #FAAD6B 0%, #F06B85 100%);
  border: 2rpx solid rgba(255, 255, 255, 0.18);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
.avatar-head {
  width: 26rpx;
  height: 26rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.92);
}
.avatar-body {
  margin-top: 4rpx;
  width: 44rpx;
  height: 22rpx;
  border-radius: 22rpx 22rpx 0 0;
  background: rgba(255, 255, 255, 0.92);
}

/* Hero */
.hero {
  padding: 44rpx $uf-page-pad 32rpx;
  display: flex;
  flex-direction: column;
}
.hero-badge {
  align-self: flex-start;
  display: flex;
  align-items: center;
  padding: 10rpx 24rpx;
  border-radius: 40rpx;
  background: rgba(87, 115, 255, 0.16);
  border: 2rpx solid rgba(102, 133, 255, 0.38);
}
.hero-dot {
  width: 12rpx;
  height: 12rpx;
  border-radius: 50%;
  background: #6BE09E;
  box-shadow: 0 0 12rpx rgba(107, 224, 158, 0.8);
  margin-right: 12rpx;
}
.hero-badge-text {
  font-size: 22rpx;
  color: #A9BEF5;
}
.hero-title {
  margin-top: 20rpx;
  font-size: $uf-fs-hero;
  font-weight: 700;
  color: $uf-text-1;
  line-height: 76rpx;
}
.hero-desc {
  margin-top: 16rpx;
  font-size: 26rpx;
  color: $uf-text-3;
}

/* 应用卡片列表 */
.app-list {
  padding: 0 $uf-page-pad 48rpx;
}
.app-card {
  position: relative;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  padding: 40rpx 36rpx 40rpx 44rpx;
  margin-bottom: $uf-gap;
  border-radius: $uf-radius-card;
  border: 2rpx solid $uf-line;
  background: $uf-surface;
  box-shadow: 0 24rpx 56rpx rgba(0, 0, 0, 0.45);
  overflow: hidden;
}
.app-card--wallpaper {
  background: linear-gradient(120deg, #1E2430 0%, #262E3D 100%);
}
.card-glow {
  position: absolute;
  top: -100rpx;
  left: -80rpx;
  width: 420rpx;
  height: 420rpx;
  border-radius: 50%;
  pointer-events: none;
}
.card-body {
  flex: 1;
  min-width: 0;
  padding-right: 24rpx;
}
.card-head {
  display: flex;
  align-items: center;
}
.card-icon {
  width: 60rpx;
  height: 60rpx;
  border-radius: 20rpx;
  border: 2rpx solid transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 18rpx;
}
.card-glyph {
  width: 34rpx;
  height: 34rpx;
  border-radius: 10rpx;
  border: 4rpx solid transparent;
  opacity: 0.9;
}
.card-name {
  font-size: $uf-fs-title;
  font-weight: 700;
  color: $uf-text-1;
}
.card-desc {
  display: block;
  margin-top: 14rpx;
  font-size: $uf-fs-desc;
  color: $uf-text-2;
  line-height: 34rpx;
}
.card-cover {
  width: 184rpx;
  height: 232rpx;
  border-radius: 28rpx;
  overflow: hidden;
  flex-shrink: 0;
}
.cover-img {
  width: 100%;
  height: 100%;
}
.cover-fallback {
  width: 100%;
  height: 100%;
}
.card-foot {
  width: 100%;
  margin-top: 24rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.card-tags {
  display: flex;
  align-items: center;
}
.chip {
  padding: 8rpx 16rpx;
  border-radius: $uf-radius-chip;
  margin-right: 12rpx;
}
.chip--plain {
  background: rgba(255, 255, 255, 0.08);
}
.chip-text {
  font-size: $uf-fs-cap;
}
.chip-text--plain {
  color: $uf-text-2;
}
.card-enter {
  display: flex;
  align-items: center;
}
.enter-text {
  font-size: 24rpx;
  color: $uf-text-2;
  margin-right: 8rpx;
}
.enter-arrow {
  width: 16rpx;
  height: 16rpx;
  border-top: 3rpx solid transparent;
  border-right: 3rpx solid transparent;
  transform: rotate(45deg);
}

/* 预留位 */
.more-row {
  display: flex;
  align-items: center;
  padding: 24rpx 32rpx;
  border-radius: 36rpx;
  border: 2rpx dashed rgba(255, 255, 255, 0.13);
  background: rgba(255, 255, 255, 0.025);
}
.more-icon {
  width: 60rpx;
  height: 60rpx;
  border-radius: 20rpx;
  background: rgba(255, 255, 255, 0.05);
  border: 2rpx solid rgba(255, 255, 255, 0.12);
  position: relative;
  margin-right: 24rpx;
}
.plus-v,
.plus-h {
  position: absolute;
  background: $uf-text-3;
  border-radius: 2rpx;
}
.plus-v {
  width: 3rpx;
  height: 26rpx;
  left: 50%;
  top: 50%;
  margin: -13rpx 0 0 -1.5rpx;
}
.plus-h {
  width: 26rpx;
  height: 3rpx;
  left: 50%;
  top: 50%;
  margin: -1.5rpx 0 0 -13rpx;
}
.more-text {
  flex: 1;
  font-size: 26rpx;
  font-weight: 500;
  color: #5E6673;
}

/* 底部 */
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
