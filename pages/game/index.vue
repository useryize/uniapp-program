<template>
  <view class="gram-view">
    <canvas canvas-id="gameCanvas" class="game-canvas" />
  </view>
</template>
<script setup>
import { ref, onMounted } from "vue";

// 绘制游戏
const drawGame = () => {
  const ctx = uni.createCanvasContext("gameCanvas");

  ctx.draw();
  console.error(ctx);
};

onMounted(() => {
  drawGame();
});
</script>
<style lang="scss" scoped>
.gram-view {
  padding: 80rpx;
  height: 80vh;
  .game-canvas {
    position: relative;
    width: 100%;
    height: 100%;
    background-color: #f4f4f4;
  }
}
</style>
