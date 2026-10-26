<!--
  尺码助手 / 尺码表（pages/mall/size-guide/index）
  职责：身高体重体型录入 → 服务端推荐尺码 + 完整尺码表
  规则：推荐由服务端计算并给出依据（前端只展示，不做区间比较）
  数据：sizeApi.profile / sizeApi.saveProfile / sizeApi.recommend / sizeApi.chart
-->
<template>
  <view class="guide">
    <view class="guide-body">
      <!-- 引导语：白底区顶部 -->
      <view class="guide-intro">
        <text class="guide-intro-text">填身高体重，立刻拿到推荐尺码\n避免买错码，退换货率大幅下降</text>
      </view>

      <!-- 身体数据录入 -->
      <view class="panel">
        <text class="panel-title">你的身体数据</text>

        <view class="field-row">
          <text class="field-label">身高</text>
          <view class="field-input">
            <input
              class="field-num"
              type="number"
              v-model="height"
              placeholder="175"
              placeholder-class="field-ph"
            />
            <text class="field-unit">cm</text>
          </view>
        </view>

        <view class="field-row">
          <text class="field-label">体重</text>
          <view class="field-input">
            <input
              class="field-num"
              type="number"
              v-model="weight"
              placeholder="68"
              placeholder-class="field-ph"
            />
            <text class="field-unit">kg</text>
          </view>
        </view>

        <view class="fit-block">
          <text class="fit-label">体型</text>
          <view class="fit-row">
            <view
              v-for="f in fits"
              :key="f.key"
              class="fit-item"
              :class="{ active: fit === f.key }"
              @click="fit = f.key"
            >
              <text class="fit-text">{{ f.label }}</text>
            </view>
          </view>
        </view>

        <view class="submit-btn" :class="{ disabled: submitting }" @click="onSubmit">
          <text class="submit-text">{{ submitting ? '计算中...' : '获取推荐尺码' }}</text>
        </view>
      </view>

      <!-- 推荐结果卡 -->
      <view v-if="result" class="result-card">
        <view class="result-top">
          <text class="result-label">为你推荐</text>
          <view class="result-size"><text class="result-size-text">{{ result.size }}</text></view>
        </view>
        <text class="result-reason">{{ result.reason }}</text>
        <text class="result-range">适配区间 {{ result.range }}</text>
        <text class="result-link" @click="scrollToChart">查看完整尺码表 ></text>
      </view>

      <!-- 完整尺码表 -->
      <view class="panel chart-anchor">
        <view class="table-head">
          <text class="panel-title">完整尺码表</text>
          <text class="table-unit">单位 {{ chart.unit }}</text>
        </view>

        <view class="tr">
          <text class="th th-size">尺码</text>
          <text class="th">身高</text>
          <text class="th">体重</text>
          <text class="th">胸围</text>
        </view>
        <view
          v-for="row in chart.rows"
          :key="row.size"
          class="tr"
          :class="{ 'tr-recommend': row.recommend }"
        >
          <text class="td td-size">{{ row.size }}</text>
          <text class="td">{{ row.height }}</text>
          <text class="td">{{ row.weight }}</text>
          <text class="td">{{ row.chest }}</text>
          <text v-if="row.recommend" class="td-flag">推荐</text>
        </view>

        <text class="table-note">* 尺码为品牌标准，建议结合胸围与穿着习惯选择</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { sizeApi } from '../api/index.js'

/** 身高（字符串输入，转数字前不校验） */
const height = ref('')
/** 体重 */
const weight = ref('')
/** 体型 Y/A/B */
const fit = ref('A')
/** 推荐结果 */
const result = ref(null)
/** 尺码表 */
const chart = reactive({ unit: 'cm', rows: [], recommendSize: '' })
/** 提交防重 */
const submitting = ref(false)

/** 体型选项 */
const fits = [
  { key: 'Y', label: '偏瘦 Y' },
  { key: 'A', label: '标准 A' },
  { key: 'B', label: '偏胖 B' }
]

/** 提交：调服务端推荐 */
async function onSubmit() {
  if (submitting.value) return
  if (!height.value || !weight.value) {
    uni.showToast({ title: '请填写身高体重', icon: 'none' })
    return
  }
  submitting.value = true
  try {
    const data = await sizeApi.recommend({
      height: Number(height.value),
      weight: Number(weight.value),
      fit: fit.value
    })
    result.value = data
    // 推荐后同步标记尺码表推荐行
    const c = await sizeApi.chart({
      height: Number(height.value),
      weight: Number(weight.value),
      fit: fit.value
    })
    chart.rows = c.rows
    chart.unit = c.unit
    // 同时保存到用户尺码档案，跨商品复用推荐结果
    await sizeApi.saveProfile({
      height: Number(height.value),
      weight: Number(weight.value),
      fit: fit.value
    })
  } catch (e) {
    uni.showToast({ title: e.msg || '计算失败', icon: 'none' })
  } finally {
    submitting.value = false
  }
}

/** 滚动到尺码表 */
function scrollToChart() {
  uni.pageScrollTo({ selector: '.chart-anchor', duration: 300 })
}

onLoad(async () => {
  try {
    // 读取已保存的尺码档案并回填
    const p = await sizeApi.profile()
    height.value = String(p.height || '')
    weight.value = String(p.weight || '')
    fit.value = p.fit || 'A'

    const c = await sizeApi.chart({
      height: p.height,
      weight: p.weight,
      fit: p.fit
    })
    chart.rows = c.rows
    chart.unit = c.unit
  } catch (e) {
    // 档案读取失败不阻断，直接展示尺码表
    try {
      const c = await sizeApi.chart({})
      chart.rows = c.rows
      chart.unit = c.unit
    } catch (e2) {
      // ignore
    }
  }
})
</script>

<style lang="scss" scoped>
@import "../../../uni.scss";
.guide {
  min-height: 100vh;
  background-color: $rz-grey-50;
}

/* 引导语：白底通栏 */
.guide-intro {
  background-color: $rz-white;
  padding: 28rpx $rz-page-pad 8rpx;
}

.guide-intro-text {
  display: block;
  font-size: 26rpx;
  color: $rz-grey-500;
  line-height: 1.7;
}

.guide-body {
  padding: 0 0 40rpx;
}

/* ---- 录入面板：通栏无边框 ---- */
.panel {
  background-color: $rz-white;
  padding: 28rpx $rz-page-pad;
  margin-top: 20rpx;
}

.panel-title {
  display: block;
  font-size: 32rpx;
  font-weight: 900;
  color: $rz-ink;
  margin-bottom: 24rpx;
}

.field-row {
  display: flex;
  align-items: center;
  margin-bottom: 20rpx;
}

.field-label {
  width: 100rpx;
  font-size: 28rpx;
  color: $rz-ink;
}

.field-input {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
  height: 80rpx;
  border: 4rpx solid $rz-ink;
  background-color: $rz-white;
}

.field-num {
  flex: 1;
  text-align: center;
  font-size: 36rpx;
  font-weight: 900;
  color: $rz-ink;
  height: 80rpx;
  line-height: 80rpx;
}

.field-ph {
  color: $rz-grey-300;
  font-weight: 400;
}

.field-unit {
  font-size: 24rpx;
  color: $rz-grey-500;
  padding-right: 20rpx;
}

.fit-block {
  margin-bottom: 24rpx;
}

.fit-label {
  display: block;
  font-size: 28rpx;
  color: $rz-ink;
  margin-bottom: 16rpx;
}

.fit-row {
  display: flex;
  gap: 16rpx;
}

.fit-item {
  flex: 1;
  height: 72rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 4rpx solid $rz-ink;
  background-color: $rz-white;
}

.fit-item.active {
  background-color: $rz-ink;
}

.fit-text {
  font-size: 26rpx;
  color: $rz-ink;
}

.fit-item.active .fit-text {
  color: $rz-acid;
  font-weight: 700;
}

.submit-btn {
  height: 88rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: $rz-acid;
  border: 4rpx solid $rz-ink;
}

.submit-btn.disabled {
  opacity: 0.5;
}

.submit-text {
  font-size: 32rpx;
  font-weight: 900;
  color: $rz-ink;
}

/* ---- 推荐结果卡：黑底通栏 ---- */
.result-card {
  background-color: $rz-ink;
  padding: 28rpx $rz-page-pad;
  margin-top: 20rpx;
}

.result-top {
  display: flex;
  align-items: center;
  gap: 20rpx;
  margin-bottom: 16rpx;
}

.result-label {
  font-size: 28rpx;
  color: $rz-white;
}

.result-size {
  padding: 4rpx 24rpx;
  background-color: $rz-acid;
}

.result-size-text {
  font-size: 40rpx;
  font-weight: 900;
  color: $rz-ink;
}

.result-reason {
  display: block;
  font-size: 24rpx;
  color: $rz-white;
  line-height: 1.6;
}

.result-range {
  display: block;
  margin-top: 10rpx;
  font-size: 22rpx;
  color: $rz-grey-500;
}

.result-link {
  display: block;
  margin-top: 16rpx;
  font-size: 24rpx;
  font-weight: 700;
  color: $rz-acid;
}

/* ---- 尺码表 ---- */
.table-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
}

.table-unit {
  font-size: 22rpx;
  color: $rz-grey-500;
}

.tr {
  position: relative;
  display: flex;
  align-items: center;
  height: 72rpx;
  border-bottom: 2rpx solid $rz-line;
}

.tr-recommend {
  background-color: $rz-warn-bg;
}

.th {
  flex: 1;
  text-align: center;
  font-size: 24rpx;
  font-weight: 700;
  color: $rz-ink;
}

.th-size,
.td-size {
  width: 110rpx;
  flex: none;
}

.td {
  flex: 1;
  text-align: center;
  font-size: 24rpx;
  color: $rz-ink;
}

.td-size {
  font-weight: 700;
}

.td-flag {
  position: absolute;
  right: 8rpx;
  font-size: 18rpx;
  font-weight: 700;
  color: $rz-ink;
}

.table-note {
  display: block;
  margin-top: 20rpx;
  font-size: 20rpx;
  color: $rz-grey-500;
}
</style>
