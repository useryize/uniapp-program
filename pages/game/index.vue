<template>
  <view class="gram-view">
    <canvas canvas-id="gameCanvas" class="game-canvas" />
  </view>
</template>
<script setup>
import { ref, onMounted } from "vue";
const canvasNode = ref(null);
const canvasWidth = ref(null);
const canvasHeight = ref(null);
const gridSize = ref(10);

const drawGame = () => {
  const ctx = uni.createCanvasContext("gameCanvas");

  // 获取 canvas 的宽高和节点信息
  const query = uni.createSelectorQuery();
  query
    .select(".game-canvas")
    .fields({ node: true, size: true }, (res) => {
      console.error(res);
      canvasNode.value = res.node;
      canvasWidth.value = res.width;
      canvasHeight.value = res.height;

      // 画布背景
      ctx.setFillStyle("#f4f4f4");
      ctx.fillRect(0, 0, canvasWidth.value, canvasHeight.value);

      ctx.setStrokeStyle("rgba(0, 0, 0, 0.06)"); // 修正透明度设置
      ctx.setLineWidth(1);

      // 垂直网格线
      const widthCount = Math.ceil(canvasWidth.value / gridSize.value); // 计算垂直线数量
      for (let i = 0; i <= widthCount; i++) {
        ctx.beginPath();
        ctx.moveTo(i * gridSize.value, 0);
        ctx.lineTo(i * gridSize.value, canvasHeight.value);
        ctx.stroke();
      }

      // 水平网格线
      const heightCount = Math.ceil(canvasHeight.value / gridSize.value); // 计算水平线数量
      for (let i = 0; i <= heightCount; i++) {
        // 确保最后一根线绘制
        ctx.beginPath();
        ctx.moveTo(0, i * gridSize.value);
        ctx.lineTo(canvasWidth.value, i * gridSize.value);
        ctx.stroke();
      }

      ctx.draw();
    })
    .exec();
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
    border-radius: 20rpx;
    overflow: hidden;
  }
}
</style>
