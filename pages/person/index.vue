<template>
  <view class="personBox">
    <view class="userBox">
      <view>
        <image
          class="avatar"
          :src="isLogin ? userInfo.avatarUrl : '/static/images/default-avatar.svg'"
          mode="aspectFill"
        ></image>
        <view class="text" @click="handleLogin">
          {{ isLogin ? userInfo.nickName : "点击登录" }}
        </view>
      </view>
    </view>

    <view class="listBox">
      <view class="item" v-for="item in itemList" :key="item?.icon" @click="item?.click">
        <view class="text">
          <uni-icons :type="item?.icon" size="40rpx"></uni-icons>
          <text class="title">{{ item.name }}</text>
        </view>
        <uni-icons type="right" size="40rpx"></uni-icons>
      </view>
      <view class="logOut" v-if="isLogin" @click="handleLogout">退出登录</view>
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
    title: "提示",
    content: "确定要退出登录吗？",
    success: (res) => {
      if (res.confirm) {
        // 清除用户信息
        uni.removeStorageSync("userInfo");
        userInfo.avatarUrl = "";
        userInfo.nickName = "";
        isLogin.value = false;

        uni.showToast({
          title: "已退出登录",
          icon: "success",
        });
      }
    },
  });
};

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
  // window.open("您的在线客服系统URL", "_blank");
  // #endif

  // #ifdef APP-PLUS
  // 打开APP内置客服
  // uni.showModal({
  //   title: "联系客服",
  //   content: "客服电话：400-xxx-xxxx\n工作时间：9:00-18:00",
  //   showCancel: false,
  // });
  // #endif
};

const itemList = ref([
  { name: "我的下载", icon: "download-filled", click: () => {} },
  { name: "我的评分", icon: "star-filled", click: () => {} },
  { name: "关于我们", icon: "person-filled", click: () => {} },
  { name: "联系客服", icon: "chatboxes-filled", click: handleContact },
]);

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
    height: 360rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    .avatar {
      width: 120rpx;
      height: 120rpx;
      border-radius: 60rpx;
      border: 4rpx solid #ffffff;
    }

    .text {
      margin-top: 24rpx;
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

    .item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 30rpx;
      border-bottom: 1rpx solid #f3f3f3;

      &:last-child {
        border-bottom: none;
      }

      .text {
        display: flex;
        align-items: center;

        .title {
          color: #333333;
          font-size: 28rpx;
          margin-left: 20rpx;
        }
      }
    }
    .logOut {
      color: #ff0000;
    }
  }
}
</style>
