<!--
  商品卡片（公共组件）：首页推荐 / 分类页 / 搜索结果复用
  视觉：街头潮流 —— 2px 纯黑硬描边、圆角 0、酸性黄角标、价格红大号
  封面规则：goods.cover 有值显示图片，否则 color 色块 + 标题首字（mock 占位）
  金额展示：仅展示服务端返回值（fen2yuan），组件内不做任何计算
-->
<template>
  <view class="goods-card" :class="{ plain }" @click="$emit('select', goods)">
    <view class="cover" :style="{ backgroundColor: goods.color, height: coverHeight + 'rpx' }">
      <image v-if="goods.cover" class="cover-img" :src="goods.cover" mode="aspectFill" />
      <text v-else class="cover-fallback">{{ goods.title.slice(0, 1) }}</text>
    </view>

    <!-- 角标：图下独立一行（对齐设计稿商品卡结构） -->
    <view v-if="tag" class="tag-row">
      <text class="tag">{{ tag }}</text>
    </view>

    <view class="info">
      <text class="title">{{ goods.title }}</text>
      <view class="price-row">
        <text class="price">¥{{ fen2yuan(goods.minPrice) }}</text>
        <text class="origin-price">¥{{ fen2yuan(goods.originPrice) }}</text>
      </view>
      <view class="bottom-row">
        <text class="sales">已售 {{ salesText }}</text>
        <view v-if="showAdd" class="add-btn" @click.stop="$emit('add', goods)">
          <text class="add-icon">+</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed } from 'vue'
import { fen2yuan } from '../utils/format.js'

const props = defineProps({
  goods: { type: Object, required: true },
  /** 角标文案：NEW / HOT / LIMITED 等，为空则不渲染 */
  tag: { type: String, default: '' },
  /** 是否显示快捷加购按钮 */
  showAdd: { type: Boolean, default: false },
  plain: { type: Boolean, default: false },
  /** 封面高度（rpx），调用方按卡片宽度传入以保持 1:1 */
  coverHeight: { type: Number, default: 320 }
})

defineEmits(['select', 'add'])

/** 销量展示：超过 1 万折算为「x.x万」 */
const salesText = computed(() => {
  const s = Number(props.goods.sales || 0)
  if (props.plain) {
    if (s >= 10000) return (s / 10000).toFixed(1) + '万'
    if (s >= 1000) return (s / 1000).toFixed(1) + 'k'
  }
  return s >= 10000 ? (s / 10000).toFixed(1) + 'w' : String(s)
})
</script>

<style lang="scss" scoped>
@import "../styles/tokens.scss";
/*
 * 宽度说明：编译到微信小程序后，<goods-card> 会生成自定义宿主节点，
 * flex 容器的子项是宿主节点而非本 view —— 因此宽度/间距必须由使用方
 * 页面通过 class 作用在宿主节点上（如 index.vue 的 .goods-cell），
 * 本组件根节点不设 width/margin，仅负责外观。
 */
.goods-card {
  width: 100%;
  background-color: #ffffff;
  border: 4rpx solid $rz-ink;
  overflow: hidden;
}

.goods-card.plain {
  border: 0;
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.plain .tag-row,
.plain .info {
  padding: 0;
}

.plain .info {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.plain .tag {
  padding: 6rpx 12rpx;
  font-family: 'Bungee', sans-serif;
  font-size: 18rpx;
  letter-spacing: 0;
}

.plain .title {
  font-size: 26rpx;
  line-height: 36rpx;
}

.plain .price-row,
.plain .bottom-row {
  margin-top: 0;
}

.plain .price-row {
  gap: 12rpx;
}

.plain .price {
  font-family: 'Archivo Black', sans-serif;
  font-size: 36rpx;
}

.plain .origin-price {
  font-size: 22rpx;
  color: $rz-grey-500;
}

.plain .sales {
  font-size: 20rpx;
}

.cover {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cover-img {
  width: 100%;
  height: 100%;
}

.cover-fallback {
  font-size: 72rpx;
  color: rgba(255, 255, 255, 0.85);
}

/* 角标：图下独立一行，黑底黄字硬边 */
.tag-row {
  padding: 12rpx 14rpx 0;
}

.tag {
  display: inline-block;
  padding: 4rpx 12rpx;
  font-size: $rz-fs-cap;
  font-weight: 700;
  letter-spacing: 1rpx;
  color: $rz-acid;
  background-color: $rz-ink;
}

.info {
  padding: 14rpx 16rpx 16rpx;
}

.title {
  display: block;
  font-size: 28rpx;
  font-weight: 700;
  color: $rz-ink;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.desc {
  display: block;
  margin-top: 6rpx;
  font-size: $rz-fs-cap;
  color: $rz-grey-500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.price-row {
  display: flex;
  align-items: baseline;
  gap: 10rpx;
  margin-top: 12rpx;
}

.price {
  font-size: 38rpx;
  font-weight: 900;
  color: $rz-price;
}

.origin-price {
  font-size: 22rpx;
  color: $rz-grey-300;
  text-decoration: line-through;
}

.bottom-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 10rpx;
}

.sales {
  font-size: $rz-fs-cap;
  color: $rz-grey-500;
}

/* 快捷加购：黑底黄字方块 */
.add-btn {
  width: 44rpx;
  height: 44rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: $rz-acid;
  border: 4rpx solid $rz-ink;
}

.add-icon {
  font-size: 30rpx;
  font-weight: 900;
  color: $rz-ink;
  line-height: 1;
}
</style>
