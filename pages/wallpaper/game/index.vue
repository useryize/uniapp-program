<template>
  <view class="gram-view">
    <canvas canvas-id="gameCanvas" class="game-canvas" />
    <Button @click="startGame">开始游戏</Button>
    <Button @click="startGame">暂停游戏</Button>
  </view>
</template>
<script setup>
import { ref, onMounted, onUnmounted, reactive, watch, computed } from "vue";
import { onShow, onHide, onResize } from "@dcloudio/uni-app";

const gameLoopKey = ref(null);

const state = reactive({
  canvasNode: null,
  canvasWidth: null,
  canvasHeight: null,
  gridSize: 10, // 画布步进单位
  speed: 300, // 移到速度
  direction: "right", // 移动方向
  nextDirection: "right", // 下一帧方向 快速按反向问题
  food: { x: 10, y: 10 }, // 食物
  snake: [{ x: 5, y: 5 }], // 本体
});

const x = computed(() => state.food.x)
watch(x, (res, res2) => {
  console.error(res, res2);
});

//生成食物
const createdFood = () => {
  const x = Math.floor(Math.random() * (state.canvasWidth / state.gridSize) + 1);
  const y = Math.floor(Math.random() * (state.canvasHeight / state.gridSize) + 1);
  if (state.snake.some((item) => item.x === x && item.y === y)) {
    return createdFood();
  }
  state.food = { x, y };
};

// 更新游戏状态
const updateGame = () => {
  state.direction = state.nextDirection;
  const head = { ...state.snake[0] };

  switch (state.direction) {
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
  state.snake = [head, ...state.snake];
  if (head?.x === state.food.x && head.y === state.food.y) {
    createdFood();
  } else {
    state.snake.pop();
  }
  drawGame();
};

// 主循环
const gameLoop = () => {
  updateGame();
  gameLoopKey.value = setTimeout(gameLoop, state.speed);
};

const startGame = () => {
  state.asdasd += 1;
  console.error(state.asdasd);
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
      state.canvasNode = res.node;
      state.canvasWidth = res.width;
      state.canvasHeight = res.height;

      // 画布背景
      ctx.setFillStyle("#f4f4f4");
      ctx.fillRect(0, 0, state.canvasWidth, state.canvasHeight);

      ctx.setStrokeStyle("rgba(0, 0, 0, 0.06)"); // 修正透明度设置
      ctx.setLineWidth(1);

      // 垂直网格线
      const widthCount = Math.ceil(state.canvasWidth / state.gridSize); // 计算垂直线数量
      for (let i = 0; i <= widthCount; i++) {
        ctx.beginPath();
        ctx.moveTo(i * state.gridSize, 0);
        ctx.lineTo(i * state.gridSize, state.canvasHeight);
        ctx.stroke();
      }

      // 水平网格线
      const heightCount = Math.ceil(state.canvasHeight / state.gridSize); // 计算水平线数量
      for (let i = 0; i <= heightCount; i++) {
        // 确保最后一根线绘制
        ctx.beginPath();
        ctx.moveTo(0, i * state.gridSize);
        ctx.lineTo(state.canvasWidth, i * state.gridSize);
        ctx.stroke();
      }

      // 食物位置
      ctx.setFillStyle("#ff0000");
      ctx.fillRect(
        state.food.x * state.gridSize,
        state.food.y * state.gridSize,
        state.gridSize,
        state.gridSize
      );

      // 绘制本体
      state.snake.forEach((item, index) => {
        ctx.setFillStyle("#000000");
        ctx.fillRect(
          item.x * state.gridSize,
          item.y * state.gridSize,
          state.gridSize,
          state.gridSize
        );
      });

      ctx.draw();
    })
    .exec();
};

// 按键
const handleKeyDown = (e) => {
  switch (e?.key) {
    case "ArrowUp":
      if (state.direction !== "down") state.nextDirection = "up";
      break;
    case "ArrowDown":
      if (state.direction !== "up") state.nextDirection = "down";
      break;
    case "ArrowLeft":
      if (state.direction !== "right") state.nextDirection = "left";
      break;
    case "ArrowRight":
      if (state.direction !== "left") state.nextDirection = "right";
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

onResize((res) => {
  console.error(res);
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
