<template>
    <view class="personBox">
    
    </view>
</template>

<script setup>
import { onMounted, ref } from 'vue';

const init = () => {
    uni.getSystemInfo({
        success: (res) => {
            console.log('设备信息:', res);
            // 包含设备品牌、型号、操作系统版本等信息
        }
    });
    // #ifdef MP-WEIXIN

    // uni.getUserProfile({
    //     desc: '用于完善会员资料', // 声明获取用户个人信息后的用途
    //     success: (res) => {
    //         uni.showToast({
    //             title: res,
    //             duration: 2000
    //         });
    //         console.log('用户信息:', res.userInfo);
    //         // 获取到的信息与上面相同
    //     },
    //     fail: (err) => {
    //         console.error('获取用户信息失败:', err);
    //     }
    // });
    // #endif
}
onMounted(() => {
    init()
})
</script>