<template>
    <view class="content">
        <view class="item" v-for="(item, index) in list">
            <image class="pic" @click="previewImg(index)" mode="widthFix" :src="item?.url" :key="item._id" />
            <text class="text">{{ item.content }}</text>
        </view>

    </view>
</template>

<script setup>
import {
    ref,
} from 'vue'
import { onReachBottom, onLoad, onPullDownRefresh } from '@dcloudio/uni-app'
const list = ref([])
const previewImg = (index) => {
    uni.previewImage({
        current: index,
        urls: list.value.map(item => item.url)
    });
}
const netWort = (type) => {
    uni.showLoading({
        title: '加载中'
    });
    uni.request({
        url: "/tools/petShow",
        data: {
            size: 10
        },
        header: {
            "access-key": 'usereasy'
        }
    }).then((res) => {
        if (res?.data?.errCode === 0) {
            list.value = [...(type === 'init' ? [] : list.value), ...res?.data?.data]
            return
        }
        uni.showToast({
            title: res.data.errMsg || '请求错误,访问: https://api.qingnian8.com/apis/',
            icon: 'none',
            duration: 2000
        });
    }).catch(err => {
        uni.showToast({
            title: '请求错误',
            icon: 'none',
            duration: 2000
        });
    }).finally(() => {
        uni.hideLoading();
        uni.stopPullDownRefresh();
    })
}

onLoad(() => {
    netWort()
})

onReachBottom(() => {
    netWort()
})
onPullDownRefresh(() => {
    console.error(132465)
    netWort('init')
})

</script>

<style lang="less" scoped>
.content {
    padding: 0 30rpx 30rpx 30rpx;

    .item {
        box-shadow: 0 10px 20px rgba(0, 0, 0, .3);
        border-radius: 15rpx;
        overflow: hidden;
        margin-bottom: 30rpx;

        .pic {
            width: 100%;
            display: block;
        }

        .text {
            padding: 20rpx;
            display: block;
            font-size: #666;
            font-size: 28rpx;
        }

    }
}
</style>