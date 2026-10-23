<!--
  尺码选择器（服装电商核心交互件）
  规则（对齐设计稿「尺码决策链」）：
  - 售罄尺码【保留展示】并置灰划线，不隐藏——潮流电商的稀缺性需要被看见
  - 选中态：黑底黄字（反白）；未选：白底黑框；不可选：灰底 + 文字删除线
  - 多属性联动：选颜色后筛出该颜色下有货的尺码
  事件：change 抛出选中的 { colorId, size, sku }
-->
<template>
  <view class="size-picker">
    <!-- 颜色维度 -->
    <view v-if="colors.length" class="group">
      <text class="group-label">颜色</text>
      <view class="color-row">
        <view
          v-for="c in colors"
          :key="c.id"
          class="color-item"
          :class="{ active: currentColorId === c.id, disabled: !hasStockInColor(c.id) }"
          @click="onPickColor(c)"
        >
          <view class="color-dot" :style="{ backgroundColor: c.hex }" />
          <text class="color-name">{{ c.name }}</text>
        </view>
      </view>
    </view>

    <!-- 尺码维度 -->
    <view class="group">
      <text class="group-label">尺码</text>
      <view class="size-row">
        <view
          v-for="s in sizes"
          :key="s"
          class="size-item"
          :class="{ active: currentSize === s, disabled: !isSizeAvailable(s) }"
          @click="onPickSize(s)"
        >
          <text class="size-text">{{ s }}</text>
          <!-- 售罄遮罩：半透明盖住 + 文字划线 -->
          <view v-if="!isSizeAvailable(s)" class="soldout-mask" />
        </view>
      </view>
      <text v-if="currentSize && !isSizeAvailable(currentSize)" class="soldout-tip">
        该尺码已售罄，售罄码不再补货
      </text>
    </view>
  </view>
</template>

<script setup>
import { computed, ref, watch } from 'vue'

const props = defineProps({
  /** 商品 SPU：含 colors / sizes / skuList */
  goods: { type: Object, required: true },
  /** 初始选中颜色 id */
  colorId: { type: Number, default: 0 },
  /** 初始选中尺码 */
  size: { type: String, default: '' }
})

const emit = defineEmits(['change'])

const currentColorId = ref(props.colorId || (props.goods.colors[0] && props.goods.colors[0].id))
const currentSize = ref(props.size)

/** 当前颜色的 SKU 列表 */
const colorSkus = computed(() =>
  (props.goods.skuList || []).filter((s) => s.colorId === currentColorId.value)
)

/** 当前商品的尺码列表 */
const sizes = computed(() => props.goods.sizes || [])

/** 当前颜色的颜色对象 */
const colors = computed(() => props.goods.colors || [])

/** 某尺码在当前颜色下是否有货 */
function isSizeAvailable(size) {
  const sku = colorSkus.value.find((s) => s.size === size)
  return !!(sku && sku.stock > 0)
}

/** 某颜色下是否有任意尺码有货 */
function hasStockInColor(colorId) {
  return (props.goods.skuList || []).some((s) => s.colorId === colorId && s.stock > 0)
}

/** 选颜色：重置尺码（当前尺码在该颜色下无货时清空） */
function onPickColor(c) {
  if (!hasStockInColor(c.id)) return
  currentColorId.value = c.id
  if (currentSize.value && !isSizeAvailable(currentSize.value)) {
    currentSize.value = ''
  }
  emitChange()
}

/** 选尺码：售罄不可选 */
function onPickSize(size) {
  if (!isSizeAvailable(size)) return
  currentSize.value = size
  emitChange()
}

/** 向上抛当前选中的 SKU 信息 */
function emitChange() {
  const sku = colorSkus.value.find((s) => s.size === currentSize.value)
  emit('change', {
    colorId: currentColorId.value,
    size: currentSize.value,
    sku: sku || null
  })
}

// 外部（如购物车改规格）重置选中项时同步内部状态
watch(
  () => [props.colorId, props.size],
  () => {
    if (props.colorId) currentColorId.value = props.colorId
    if (props.size !== undefined) currentSize.value = props.size
  }
)
</script>

<style scoped>
.group {
  margin-bottom: 28rpx;
}

.group-label {
  display: block;
  font-size: $rz-fs-desc;
  font-weight: 500;
  color: $rz-ink;
  margin-bottom: 16rpx;
}

.color-row {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.color-item {
  display: flex;
  align-items: center;
  gap: 8rpx;
  padding: 8rpx 16rpx 8rpx 8rpx;
  border: 4rpx solid $rz-ink;
  background-color: $rz-white;
}

.color-item.active {
  background-color: $rz-ink;
}

.color-item.active .color-name {
  color: $rz-acid;
}

.color-item.disabled {
  opacity: 0.4;
}

.color-dot {
  width: 32rpx;
  height: 32rpx;
  border: 2rpx solid rgba(0, 0, 0, 0.15);
}

.color-name {
  font-size: $rz-fs-desc;
  color: $rz-ink;
}

.size-row {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.size-item {
  position: relative;
  width: 96rpx;
  height: 64rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 4rpx solid $rz-ink;
  background-color: $rz-white;
}

.size-item.active {
  background-color: $rz-ink;
}

.size-item.active .size-text {
  color: $rz-acid;
}

.size-item.disabled {
  background-color: $rz-grey-100;
  border-color: $rz-grey-300;
}

.size-item.disabled .size-text {
  color: $rz-grey-300;
}

/* 售罄遮罩：盖住 + 文字划线 */
.soldout-mask {
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(191, 191, 191, 0.4);
}

.size-item.disabled .size-text {
  text-decoration: line-through;
}

.soldout-tip {
  display: block;
  margin-top: 14rpx;
  font-size: $rz-fs-cap;
  color: $rz-danger;
}
</style>
