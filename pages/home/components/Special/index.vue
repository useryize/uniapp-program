<template>
    <view class="titleBox">
        <view class="name">专题推荐</view>
        <view class="text">More+</view>
    </view>
    <view class="specBox">
        <view class="item" v-for="(item, index) in 8" :key="item" :style="{ backgroundColor: getRandomHexColor[index] }">
            <view class="title">title</view>
            <view class="tis">更新时间</view>
        </view>
        <view class="item more">More+</view>
    </view>
</template>

<script setup>
const getRandomHexColor = [
    "#E0F7FA",
    "#B2EBF2",
    "#80DEEA",
    "#4DD0E1",
    "#26C6DA",
    "#F3E5F5",
    "#E1BEE7",
    "#CE93D8",
    "#BA68C8",
    "#AB47BC",
];
</script>

<style lang="scss" scoped>
.titleBox {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 30rpx;
    margin: 20rpx 0;
    .name {
        font-size: 40rpx;
    }
    .text {
        margin-left: 10rpx;
        color: #5f24ff;
    }
}

.specBox {
    padding: 0 30rpx;
    display: grid;
    gap: 10rpx;
    grid-template-columns: repeat(3, 1fr);
    .item {
        height: 300rpx;
        border-radius: 18rpx;
        position: relative;
        overflow: hidden;
        &.more {
            background: linear-gradient( 135deg, rgba(255, 105, 180, 0.1), rgba(100, 200, 255, 0.1));
            backdrop-filter: blur(25rpx);
            -webkit-backdrop-filter: blur(25rpx);
            color: #ffffff;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .title {
            width: 100%;
            height: 40rpx;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #ffffff;
            font-size: 24rpx;
            position: absolute;
            left: 0;
            bottom: 0;
            background-color: rgba(100, 200, 255, 0.3);
            backdrop-filter: blur(20rpx);
        }
        .tis {
            padding: 8rpx 10rpx;
            font-size: 20rpx;
            color: #ffffff;
            border-radius: 0 0 18rpx;
            background-color: rgba($color: #ff0e0e, $alpha: .7);
            position: absolute;
            left: 0;
            top: 0;
        }
    }
}
</style>
