<!--
  发售日历（pages/mall/drop/index）
  职责：潮牌限量款发售节奏管理
  三态（对齐设计稿「发售机制链」）：
    soon    即将发售 → 倒计时 + 开售提醒订阅
    live    正在发售 → 剩余库存 + 立即抢购
    soldout 已售罄 → 到货提醒订阅
  数据：dropApi.list / dropApi.subscribe
-->
<template>
  <view class="drop">
    <view class="drop-head">
      <view class="drop-head-left">
        <text class="drop-title">发售日历</text>
        <text class="drop-en">DROP CALENDAR</text>
      </view>
    </view>

    <view class="drop-tabs">
      <view
        v-for="t in tabs"
        :key="t.key"
        class="drop-tab"
        :class="{ active: tab === t.key }"
        @click="onTab(t.key)"
      >
        <text class="drop-tab-text">{{ t.label }}</text>
      </view>
    </view>

    <scroll-view class="drop-scroll" scroll-y>
      <view class="drop-list">
        <view v-for="d in list" :key="d.id" class="drop-card">
          <!-- 状态头：三态配色 -->
          <view class="dc-head" :class="'dc-' + d.type">
            <text class="dc-tag">{{ tagText(d) }}</text>
            <text class="dc-count">{{ countText(d) }}</text>
          </view>

          <!-- 商品行 -->
          <view class="dc-body" @click="goDetail(d)">
            <view class="dc-cover" :style="{ backgroundColor: '#F2F2F2' }">
              <image v-if="d.cover" class="dc-img" :src="d.cover" mode="aspectFill" />
            </view>
            <view class="dc-info">
              <text class="dc-name">{{ d.title }}</text>
              <text class="dc-sub">{{ subText(d) }}</text>
            </view>
            <view class="dc-action" @click.stop="onAction(d)">
              <text class="dc-action-text">{{ actionText(d) }}</text>
            </view>
          </view>
        </view>

        <view v-if="!list.length" class="drop-empty">
          <text class="drop-empty-text">该分类暂无发售</text>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { dropApi } from '../api/index.js'

/** 当前 tab：all / soon / live / soldout */
const tab = ref('all')
/** 发售列表 */
const list = ref([])
/** 原始全量数据（tab 切换走本地过滤，避免重复请求） */
const allList = ref([])
/** 倒计时刷新句柄 */
let timer = null

const tabs = [
  { key: 'all', label: '全部' },
  { key: 'soon', label: '即将发售' },
  { key: 'live', label: '正在发售' },
  { key: 'soldout', label: '往期回顾' }
]

const filtered = computed(() => (tab.value === 'all' ? allList.value : allList.value.filter((d) => d.type === tab.value)))

/** 三态筛选：刷新本地列表 */
function onTab(key) {
  tab.value = key
  list.value = filtered.value
}

/** 状态头左侧文案 */
function tagText(d) {
  if (d.type === 'soon') return '倒计时'
  if (d.type === 'live') return '正在发售'
  return '已结束'
}

/** 状态头右侧：倒计时 / 剩余时间 / 结果 */
function countText(d) {
  if (d.type === 'soon') return countdown(d.startAt)
  if (d.type === 'live') return '剩余 ' + countdown(d.endAt)
  return d.limit === d.sold ? '3 秒售罄' : '已售罄'
}

/** 副标：时间 + 限量 */
function subText(d) {
  const date = formatDate(d.startAt)
  if (d.type === 'soon') return `${date} 开售  ·  限量 ${d.limit} 件`
  if (d.type === 'live') return `限量 ${d.limit} 件  ·  剩余 ${d.remain} 件`
  return `${formatDate(d.startAt)} 发售  ·  已售罄`
}

/** 按钮文案 */
function actionText(d) {
  if (d.type === 'soon') return '开售提醒'
  if (d.type === 'live') return '立即抢购'
  return '到货提醒'
}

/**
 * 倒计时格式化：距目标时间的天/时/分/秒
 * @param {number} target 目标时间戳
 * @returns {string}
 */
function countdown(target) {
  const diff = target - Date.now()
  if (diff <= 0) return '已结束'
  const d = Math.floor(diff / 86400000)
  const h = Math.floor((diff % 86400000) / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  const s = Math.floor((diff % 60000) / 1000)
  const p = (n) => String(n).padStart(2, '0')
  return d > 0 ? `${d}天 ${p(h)}:${p(m)}:${p(s)}` : `${p(h)}:${p(m)}:${p(s)}`
}

/** 时间戳 -> 'M-D' */
function formatDate(ts) {
  const d = new Date(ts)
  return `${d.getMonth() + 1}-${d.getDate()}`
}

/** 拉取发售列表 */
async function loadDrops() {
  try {
    const data = await dropApi.list({})
    allList.value = data
    list.value = data
  } catch (e) {
    uni.showToast({ title: e.msg || '加载失败', icon: 'none' })
  }
}

/** 操作：订阅提醒 / 抢购 */
function onAction(d) {
  if (d.type === 'live') {
    goDetail(d)
    return
  }
  // 订阅提醒
  dropApi
    .subscribe({ goodsId: d.goodsId })
    .then(() => {
      uni.showToast({ title: '已设置提醒，开售前通知你', icon: 'none' })
    })
    .catch((e) => {
      uni.showToast({ title: e.msg || '订阅失败', icon: 'none' })
    })
}

function goDetail(d) {
  uni.navigateTo({ url: `/pages/mall/detail/index?id=${d.goodsId}` })
}

onLoad(() => {
  loadDrops()
  // 每秒刷新倒计时
  timer = setInterval(() => {
    if (tab.value === 'soon' || tab.value === 'live') {
      list.value = filtered.value.map((d) => ({ ...d }))
    }
  }, 1000)
})
</script>

<style lang="scss" scoped>
@import "../../../uni.scss";
.drop {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: $rz-grey-50;
}

/* ---- 顶部 ---- */
.drop-head {
  height: 112rpx;
  display: flex;
  align-items: center;
  padding: 0 $rz-page-pad;
  background-color: $rz-ink;
  flex-shrink: 0;
}

.drop-head-left {
  display: flex;
  align-items: baseline;
  gap: 16rpx;
}

.drop-title {
  font-size: 40rpx;
  font-weight: 900;
  color: $rz-white;
}

.drop-en {
  font-size: 20rpx;
  font-weight: 700;
  letter-spacing: 2rpx;
  color: $rz-acid;
}

.drop-tabs {
  display: flex;
  height: 88rpx;
  background-color: $rz-white;
  flex-shrink: 0;
}

.drop-tab {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.drop-tab.active {
  background-color: $rz-ink;
}

.drop-tab-text {
  font-size: 28rpx;
  color: $rz-ink;
}

.drop-tab.active .drop-tab-text {
  color: $rz-acid;
  font-weight: 700;
}

.drop-scroll {
  flex: 1;
  min-height: 0;
}

.drop-list {
  padding: 24rpx $rz-page-pad;
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

/* ---- 发售卡 ---- */
.drop-card {
  background-color: $rz-white;
}

.dc-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16rpx 24rpx;
}

.dc-soon {
  background-color: $rz-acid;
}

.dc-live {
  background-color: $rz-price;
}

.dc-soldout {
  background-color: $rz-grey-100;
}

.dc-tag {
  font-size: 20rpx;
  font-weight: 700;
  color: $rz-ink;
}

.dc-live .dc-tag,
.dc-live .dc-count {
  color: $rz-white;
}

.dc-soldout .dc-tag,
.dc-soldout .dc-count {
  color: $rz-grey-500;
}

.dc-count {
  font-size: 26rpx;
  font-weight: 900;
  color: $rz-ink;
}

.dc-body {
  display: flex;
  align-items: center;
  gap: 20rpx;
  padding: 24rpx;
}

.dc-cover {
  width: 144rpx;
  height: 144rpx;
  overflow: hidden;
  flex-shrink: 0;
}

.dc-img {
  width: 100%;
  height: 100%;
}

.dc-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  min-width: 0;
}

.dc-name {
  font-size: 28rpx;
  font-weight: 700;
  color: $rz-ink;
  line-height: 1.4;
}

.dc-sub {
  font-size: 22rpx;
  color: $rz-grey-500;
}

.dc-action {
  width: 152rpx;
  height: 64rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 4rpx solid $rz-ink;
  background-color: $rz-white;
  flex-shrink: 0;
}

.dc-action-text {
  font-size: 24rpx;
  font-weight: 700;
  color: $rz-ink;
}

.drop-empty {
  padding: 80rpx 0;
  text-align: center;
}

.drop-empty-text {
  font-size: 26rpx;
  color: $rz-grey-500;
}
</style>
