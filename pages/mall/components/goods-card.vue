<!--
  商品卡片（公共组件）：首页列表 / 搜索结果复用
  封面规则：goods.cover 有值显示图片，否则 color 色块 + 标题首字（mock 占位）
  金额展示：仅展示服务端返回值（fen2yuan），组件内不做任何计算
-->
<template>
  <view class="goods-card" @click="$emit('tap', goods)">
    <view class="cover" :style="{ backgroundColor: goods.color }">
      <image v-if="goods.cover" class="cover-img" :src="goods.cover" mode="aspectFill" />
      <text v-else class="cover-fallback">{{ goods.title.slice(0, 1) }}</text>
    </view>

    <view class="info">
      <text class="title">{{ goods.title }}</text>
      <text class="desc">{{ goods.description }}</text>
      <view class="price-row">
        <text class="price">¥{{ fen2yuan(goods.minPrice) }}</text>
        <text class="origin-price">¥{{ fen2yuan(goods.originPrice) }}</text>
      </view>
      <view class="bottom-row">
        <text class="sales">已售 {{ goods.sales }}</text>
        <view class="add-cart-btn" @click.stop="$emit('add', goods)">加购</view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { fen2yuan } from '../utils/format.js'

/**
 * 商品卡片
 * @prop {Object} goods 商品项（goods.list 返回结构，含 minPrice/originPrice/color/cover）
 * @emits {tap} 点击卡片（父页面跳详情）
 * @emits {add} 点击加购按钮（父页面调 cartApi.add）
 */
defineProps({
  goods: { type: Object, required: true }
})

defineEmits(['tap', 'add'])
</script>

<style scoped>
/*
 * 宽度说明：编译到微信小程序后，<goods-card> 会生成自定义宿主节点，
 * flex 容器的子项是宿主节点而非本 view —— 因此宽度/间距必须由使用方
 * 页面通过 class 作用在宿主节点上（如 index.vue 的 .goods-cell），
 * 本组件根节点不设 width/margin，仅负责外观。
 */
.goods-card {
  width: 100%;
  background-color: #ffffff;
  border-radius: 16rpx;
  overflow: hidden;
}

.cover {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 320rpx;
}

.cover-img {
  width: 100%;
  height: 100%;
}

.cover-fallback {
  font-size: 72rpx;
  color: rgba(255, 255, 255, 0.85);
}

.info {
  padding: 16rpx 20rpx 20rpx;
}

.title {
  display: block;
  font-size: 28rpx;
  color: #222222;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.desc {
  display: block;
  margin-top: 6rpx;
  font-size: 22rpx;
  color: #999999;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.price-row {
  display: flex;
  align-items: baseline;
  gap: 12rpx;
  margin-top: 12rpx;
}

.price {
  font-size: 32rpx;
  font-weight: 500;
  color: #e24b4a;
}

.origin-price {
  font-size: 22rpx;
  color: #bbbbbb;
  text-decoration: line-through;
}

.bottom-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 12rpx;
}

.sales {
  font-size: 22rpx;
  color: #999999;
}

.add-cart-btn {
  padding: 8rpx 28rpx;
  font-size: 24rpx;
  color: #ffffff;
  background-color: #e24b4a;
  border-radius: 28rpx;
}
</style>
