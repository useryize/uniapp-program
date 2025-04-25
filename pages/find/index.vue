<template>
  <view class="photo-wall">
    <view class="masonry">
      <view class="column" v-for="(column, columnIndex) in columns" :key="columnIndex">
        <view
          class="photo-item"
          v-for="(item, index) in column"
          :key="index"
          @click="previewImage(item)"
        >
          <image
            :src="item?.src?.medium"
            mode="widthFix"
            class="photo-image"
            lazy-load
            @load="onImageLoad(index, columnIndex)"
          />
        </view>
      </view>
    </view>
    <view class="loading" v-if="loading">
      <view class="loading-spinner"></view>
    </view>
  </view>
</template>

<script setup>
import { onReachBottom, onLoad, onPullDownRefresh } from "@dcloudio/uni-app";
import { request } from "@/utils/request";
import { onMounted, ref, computed } from "vue";

// 状态管理
const findList = ref([]);
const loading = ref(false);
const page = ref(1);

/**
 * 将图片数据分配到三列
 * @returns {Array} 包含三列图片数据的数组
 */
const columns = computed(() => {
  const cols = [[], [], []];
  findList.value.forEach((item, index) => {
    cols[index % 3].push(item);
  });
  return cols;
});

/**
 * 初始化数据
 * 获取图片列表并更新状态
 */
const init = async (type) => {
  try {
    loading.value = true;
    const res = await request({
      url: "/v1/curated",
      data: {
        page: page.value.toString(),
        per_page: "30",
      },
    });
    const list = type ? [] : findList.value;
    findList.value = [...list, ...(res?.photos || [])];
  } catch (error) {
    uni.showToast({
      title: "加载失败",
      icon: "none",
    });
  } finally {
    type && uni.stopPullDownRefresh();
    loading.value = false;
  }
};

/**
 * 预览图片
 * @param {Object} item 当前图片数据
 */
const previewImage = (item) => {
  const urls = findList.value.map((photo) => photo.src.large);
  const currentIndex = findList.value.findIndex((photo) => photo.id === item.id);
  uni.previewImage({
    urls,
    current: currentIndex,
  });
};

/**
 * 图片加载完成的回调
 * @param {number} index 图片在当前列的索引
 * @param {number} columnIndex 列索引
 */
const onImageLoad = (index, columnIndex) => {
  console.log(`Image loaded in column ${columnIndex} at index ${index}`);
};

/**
 * 监听页面滚动到底部
 * 触发加载更多数据
 */
onReachBottom(() => {
  if (!loading.value) {
    page.value++;
    init();
  }
});

onPullDownRefresh(() => {
  if (!loading.value) {
    page.value = 1;
    init(true);
  }
});

// 组件挂载时初始化数据
onMounted(() => {
  init();
});
</script>

<style lang="scss" scoped>
.photo-wall {
  padding: 0 30rpx;
  min-height: 100vh;
  background: #fff;

  .masonry {
    display: flex;
    gap: 10rpx;

    .column {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 10rpx;
    }
  }

  .photo-item {
    position: relative;
    border-radius: 12rpx;
    overflow: hidden;
    background: #f5f5f5;
    transition: transform 0.2s ease;

    &:active {
      transform: scale(0.9);
    }

    .photo-image {
      width: 100%;
      display: block;
      transition: transform 0.3s ease;
    }
  }

  .loading {
    display: flex;
    justify-content: center;
    padding: 40rpx;

    .loading-spinner {
      width: 40rpx;
      height: 40rpx;
      border: 4rpx solid #f3f3f3;
      border-top: 4rpx solid #3498db;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
  }
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>
