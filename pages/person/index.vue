<template>
  <view class="personBox">
    <view class="userBox">
      <view>
        <image
          class="avatar"
          :src="isLogin ? userInfo.avatarUrl : '/static/images/default-avatar.svg'"
          mode="aspectFill"
        ></image>
      </view>
      <view>
        <text class="login-text" @click="handleLogin">
          {{ isLogin ? userInfo.nickName : "点击登录" }}
        </text>
      </view>
    </view>

    <view class="listBox">
      <view class="function-item" @click="handleAbout">
        <view class="left">
          <image
            class="icon"
            src="/static/images/about-icon.svg"
            mode="aspectFit"
          ></image>
          <text class="title">关于我们</text>
        </view>
        <image
          class="arrow"
          src="/static/images/arrow-right.svg"
          mode="aspectFit"
        ></image>
      </view>

      <view class="function-item" @click="handleContact">
        <view class="left">
          <image
            class="icon"
            src="/static/images/service-icon.svg"
            mode="aspectFit"
          ></image>
          <text class="title">联系客服</text>
        </view>
        <image
          class="arrow"
          src="/static/images/arrow-right.svg"
          mode="aspectFit"
        ></image>
      </view>

      <view class="function-item" v-if="isLogin" @click="handleLogout">
        <view class="left">
          <view class="icon logout-icon">
            <view class="logout-circle"></view>
            <view class="logout-arrow"></view>
          </view>
          <text class="title">退出登录</text>
        </view>
        <image
          class="arrow"
          src="/static/images/arrow-right.svg"
          mode="aspectFit"
        ></image>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, reactive, onMounted } from "vue";

const isLogin = ref(false);
const userInfo = reactive({
  avatarUrl: "",
  nickName: "",
});

// 处理登录
const handleLogin = () => {
  if (isLogin.value) return;
  // #ifdef MP-WEIXIN
  uni.getUserProfile({
    desc: "用于完善用户资料",
    success: (res) => {
      userInfo.avatarUrl = res.userInfo.avatarUrl;
      userInfo.nickName = res.userInfo.nickName;
      isLogin.value = true;
      uni.setStorageSync("userInfo", res.userInfo);
    },
    fail: (err) => {
      uni.showToast({
        title: "获取用户信息失败",
        icon: "none",
      });
    },
  });
  // #endif

  // #ifdef H5
  uni.showToast({
    title: "请使用微信小程序登录",
    icon: "none",
  });
  // #endif
};

// 处理退出登录
const handleLogout = () => {
  uni.showModal({
    title: '提示',
    content: '确定要退出登录吗？',
    success: (res) => {
      if (res.confirm) {
        // 清除用户信息
        uni.removeStorageSync('userInfo');
        userInfo.avatarUrl = '';
        userInfo.nickName = '';
        isLogin.value = false;
        
        uni.showToast({
          title: '已退出登录',
          icon: 'success'
        });
      }
    }
  });
};

// 处理关于我们
const handleAbout = () => {};

// 处理联系客服
const handleContact = () => {
  // #ifdef MP-WEIXIN
  uni.openCustomerServiceChat({
    extInfo: { url: "您的客服会话URL" },
    corpId: "您的企业ID",
    success(res) {},
  });
  // #endif

  // #ifdef H5
  // 打开在线客服系统
  window.open("您的在线客服系统URL", "_blank");
  // #endif

  // #ifdef APP-PLUS
  // 打开APP内置客服
  uni.showModal({
    title: "联系客服",
    content: "客服电话：400-xxx-xxxx\n工作时间：9:00-18:00",
    showCancel: false,
  });
  // #endif
};

onMounted(() => {
  // 检查是否已登录
  const storedUserInfo = uni.getStorageSync("userInfo");
  if (storedUserInfo) {
    userInfo.avatarUrl = storedUserInfo.avatarUrl;
    userInfo.nickName = storedUserInfo.nickName;
    isLogin.value = true;
  }
});
</script>

<style lang="scss">
.personBox {
  min-height: 100vh;
  background-color: #f8f8f8;

  .userBox {
    background: linear-gradient(to right, #a8e6cf, #dcedc1);
    padding: 40rpx 30rpx;
    height: 300rpx;
    display: flex;
    align-items: center;
    .avatar {
      width: 120rpx;
      height: 120rpx;
      border-radius: 60rpx;
      border: 4rpx solid #ffffff;
    }

    .login-text {
      margin-left: 30rpx;
      color: #333333;
      font-size: 32rpx;
      font-weight: 500;
    }
  }

  .listBox {
    margin-top: 30rpx;
    background-color: #ffffff;
    border-radius: 20rpx;
    margin: 30rpx;

    .function-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 30rpx;
      border-bottom: 1rpx solid #f5f5f5;

      &:last-child {
        border-bottom: none;
      }

      .left {
        display: flex;
        align-items: center;

        .icon {
          width: 40rpx;
          height: 40rpx;
          margin-right: 20rpx;
        }

        .logout-icon {
          position: relative;
          width: 40rpx;
          height: 40rpx;
          margin-right: 20rpx;
          
          .logout-circle {
            position: absolute;
            width: 24rpx;
            height: 24rpx;
            border: 2rpx solid #ff4d4f;
            border-radius: 50%;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
          }
          
          .logout-arrow {
            position: absolute;
            width: 16rpx;
            height: 16rpx;
            border-right: 2rpx solid #ff4d4f;
            border-bottom: 2rpx solid #ff4d4f;
            transform: rotate(45deg);
            top: 50%;
            left: 50%;
            margin-top: -4rpx;
            margin-left: -8rpx;
          }
        }

        .title {
          color: #333333;
          font-size: 28rpx;
        }
      }

      .arrow {
        width: 32rpx;
        height: 32rpx;
      }
    }
  }
}
</style>
