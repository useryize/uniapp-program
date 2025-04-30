<template>
  <view class="gram-view">
    <canvas canvas-id="gameCanvas" class="game-canvas" />
    <Button @click="startGame">开始游戏</Button>
  </view>
</template>
<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import { onShow, onHide } from "@dcloudio/uni-app";
const canvasNode = ref(null);
const canvasWidth = ref(null);
const canvasHeight = ref(null);
const gridSize = ref(10); // 画布步进单位
const speed = ref(300); // 移到速度
const direction = ref("right"); // 移到方向
const nextDirection = ref("right"); // 下一帧方向 快速按反向问题

const food = ref({ x: 10, y: 10 }); // 食物
const snake = ref([{ x: 5, y: 5 }]); // 本体

const gameLoopKey = ref(null);

//生成食物
const createdFood = () => {
  const x = Math.floor(Math.random() * (canvasWidth.value / gridSize.value) + 1);
  const y = Math.floor(Math.random() * (canvasHeight.value / gridSize.value) + 1);
  if (snake.value.some((item) => item.x === x && item.y === y)) {
    return createdFood();
  }
  food.value = { x, y };
  console.error(food.value);
};

// 更新游戏状态
const updateGame = () => {
  direction.value = nextDirection?.value;
  const head = { ...snake.value[0] };
  switch (direction.value) {
    case "up":
      head.y -= 1;
      break;
    case "down":
      head.y += 1;
      break;
    case "left":
      head.x -= 1;
      break;
    case "right":
      head.x += 1;
      break;
  }
  snake.value = [head, ...snake.value];
  if (head?.x === food.value.x && head.y === food.value.y) {
    createdFood();
  } else {
    snake.value.pop();
  }
  drawGame();
};

// 主循环
const gameLoop = () => {
  updateGame();
  gameLoopKey.value = setTimeout(gameLoop, speed.value);
};

const startGame = () => {
  gameLoop();
};

// 绘制游戏
const drawGame = () => {
  const ctx = uni.createCanvasContext("gameCanvas");

  // 获取 canvas 的宽高和节点信息
  const query = uni.createSelectorQuery();
  query
    .select(".game-canvas")
    .fields({ node: true, size: true }, (res) => {
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

      // 食物位置
      ctx.setFillStyle("#ff0000");
      ctx.fillRect(
        food.value.x * gridSize.value,
        food.value.y * gridSize.value,
        gridSize.value,
        gridSize.value
      );

      // 绘制本体
      snake.value.forEach((item, index) => {
        ctx.setFillStyle("#000000");
        ctx.fillRect(
          item.x * gridSize.value,
          item.y * gridSize.value,
          gridSize.value,
          gridSize.value
        );
      });

      ctx.draw();
    })
    .exec();
};

// 按键
const handleKeyDown = (e) => {
  console.error;
  switch (e?.key) {
    case "ArrowUp":
      if (direction.value !== "down") nextDirection.value = "up";
      break;
    case "ArrowDown":
      if (direction.value !== "up") nextDirection.value = "down";
      break;
    case "ArrowLeft":
      if (direction.value !== "right") nextDirection.value = "left";
      break;
    case "ArrowRight":
      if (direction.value !== "left") nextDirection.value = "right";
      break;
  }
  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e?.key)) {
    updateGame();
  }
  if (e?.key === "Enter") {
    gameLoop();
  }
};

// 键盘事件
const addKeyDownListener = () => {
  if (typeof window !== "undefined") {
    window.addEventListener("keydown", handleKeyDown);
  }
};

// 销毁键盘事件
const removeKeyDownListener = () => {
  if (typeof window !== "undefined") {
    window.removeEventListener("keydown", handleKeyDown);
  }
};

onMounted(() => {
  drawGame();
  addKeyDownListener();
});

onUnmounted(() => {
  removeKeyDownListener();
});

onShow(() => {
  addKeyDownListener();
});

onHide(() => {
  removeKeyDownListener();
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
