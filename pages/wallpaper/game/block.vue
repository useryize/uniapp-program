<template>
  <!-- 游戏主容器 -->
  <div id="game-container">
    <!-- 主游戏画布 - 用于绘制游戏板 -->
    <canvas id="game-canvas" width="300" height="600"></canvas>

    <!-- 侧边信息面板 -->
    <div id="side-panel">
      <!-- 下一个方块预览标题 -->
      <div class="panel-title">下一个</div>
      <!-- 下一个方块预览画布 -->
      <canvas id="next-piece" width="150" height="150"></canvas>

      <!-- 分数显示标题 -->
      <div class="panel-title">分数</div>
      <!-- 分数显示区域 -->
      <div id="score-display">0</div>

      <!-- 等级显示标题 -->
      <div class="panel-title">等级</div>
      <!-- 等级显示区域 -->
      <div id="level-display">1</div>

      <!-- 消除行数显示标题 -->
      <div class="panel-title">消除行</div>
      <!-- 消除行数显示区域 -->
      <div id="lines-display">0</div>

      <!-- 开始/暂停按钮 -->
      <button id="start-btn">开始/暂停</button>
    </div>
  </div>
</template>
<script setup>
// ================ 游戏常量定义 ================
const COLS = 10; // 游戏板的列数
const ROWS = 20; // 游戏板的行数
const BLOCK_SIZE = 30; // 每个方块的像素大小
const EMPTY = "black"; // 空白格子的颜色

// 所有可能的方块形状和对应的颜色
const SHAPES = [
  { shape: [[1, 1, 1, 1]], color: "#00FFFF" }, // I 形方块 - 青色
  {
    shape: [
      [1, 1, 1],
      [0, 1, 0],
    ],
    color: "#800080",
  }, // T 形方块 - 紫色
  {
    shape: [
      [1, 1, 1],
      [1, 0, 0],
    ],
    color: "#0000FF",
  }, // J 形方块 - 蓝色
  {
    shape: [
      [1, 1, 1],
      [0, 0, 1],
    ],
    color: "#FF7F00",
  }, // L 形方块 - 橙色
  {
    shape: [
      [1, 1],
      [1, 1],
    ],
    color: "#FFFF00",
  }, // O 形方块 - 黄色
  {
    shape: [
      [0, 1, 1],
      [1, 1, 0],
    ],
    color: "#00FF00",
  }, // S 形方块 - 绿色
  {
    shape: [
      [1, 1, 0],
      [0, 1, 1],
    ],
    color: "#FF0000",
  }, // Z 形方块 - 红色
];

// ================ 游戏变量定义 ================
let canvas, ctx; // 主游戏画布和上下文
let nextCanvas, nextCtx; // 下一个方块预览画布和上下文
let board = []; // 游戏板二维数组
let currentPiece, nextPiece; // 当前方块和下一个方块
let score = 0; // 游戏分数
let level = 1; // 当前等级
let lines = 0; // 消除的行数
let gameOver = false; // 游戏结束标志
let isPaused = false; // 暂停状态标志
let dropInterval; // 方块下落的时间间隔
let dropStart; // 方块开始下落的时间

// ================ 游戏初始化函数 ================
function init() {
  // 获取主游戏画布和上下文
  canvas = document.getElementById("game-canvas");
  ctx = canvas.getContext("2d");

  // 获取下一个方块预览画布和上下文
  nextCanvas = document.getElementById("next-piece");
  nextCtx = nextCanvas.getContext("2d");

  // 为开始按钮添加点击事件监听器
  document.getElementById("start-btn").addEventListener("click", togglePause);
  // 为键盘添加按键事件监听器
  document.addEventListener("keydown", control);

  // 重置游戏状态
  resetGame();
}

// ================ 重置游戏函数 ================
function resetGame() {
  // 初始化游戏板数组
  board = [];
  for (let r = 0; r < ROWS; r++) {
    board[r] = []; // 初始化每一行
    for (let c = 0; c < COLS; c++) {
      board[r][c] = EMPTY; // 初始化为空白格子
    }
  }

  // 重置游戏状态变量
  score = 0; // 分数归零
  level = 1; // 等级重置为1
  lines = 0; // 消除行数归零
  gameOver = false; // 游戏结束标志重置

  // 更新显示区域
  updateScore();
  updateLevel();
  updateLines();

  // 创建新方块
  createNewPiece();

  // 设置方块下落定时器
  // if (dropInterval) clearInterval(dropInterval); // 清除已有定时器
  dropStart = Date.now(); // 记录开始时间
  // dropInterval = setInterval(drop, 1000); // 设置1秒下落一次的定时器
  requestAnimationFrame(drop);
  // 绘制初始游戏状态
  draw();
}

// ================ 创建新方块函数 ================
function createNewPiece() {
  // 如果没有下一个方块，则随机生成一个
  if (!nextPiece) {
    nextPiece = {
      shape: SHAPES[Math.floor(Math.random() * SHAPES.length)].shape,
      color: SHAPES[Math.floor(Math.random() * SHAPES.length)].color,
    };
  }

  // 设置当前方块为下一个方块
  currentPiece = {
    shape: nextPiece.shape, // 形状
    color: nextPiece.color, // 颜色
    // 初始位置：水平居中，顶部开始
    x: Math.floor(COLS / 2) - Math.floor(nextPiece.shape[0].length / 2),
    y: 0,
  };

  // 生成新的下一个方块
  nextPiece = {
    shape: SHAPES[Math.floor(Math.random() * SHAPES.length)].shape,
    color: SHAPES[Math.floor(Math.random() * SHAPES.length)].color,
  };

  // 绘制下一个方块预览
  drawNextPiece();

  // 检查游戏是否结束（新方块无法放置）
  if (collision(0, 0)) {
    gameOver = true; // 设置游戏结束标志
    clearInterval(dropInterval); // 清除下落定时器
    // 为分数显示添加游戏结束样式
    document.getElementById("score-display").classList.add("game-over");
  }
}

// ================ 绘制游戏板函数 ================
function draw() {
  // 清空整个画布
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 绘制所有已落下的方块
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      drawBlock(c, r, board[r][c]); // 绘制每个格子
    }
  }

  // 绘制当前活动的方块
  if (currentPiece) {
    for (let r = 0; r < currentPiece.shape.length; r++) {
      for (let c = 0; c < currentPiece.shape[r].length; c++) {
        if (currentPiece.shape[r][c]) {
          // 只绘制形状中值为1的部分
          drawBlock(currentPiece.x + c, currentPiece.y + r, currentPiece.color);
        }
      }
    }
  }

  // 绘制网格线
  ctx.strokeStyle = "#333"; // 网格线颜色
  ctx.lineWidth = 0.5; // 网格线宽度

  // 绘制垂直线
  for (let i = 0; i <= COLS; i++) {
    ctx.beginPath();
    ctx.moveTo(i * BLOCK_SIZE, 0); // 起点
    ctx.lineTo(i * BLOCK_SIZE, ROWS * BLOCK_SIZE); // 终点
    ctx.stroke(); // 绘制线条
  }

  // 绘制水平线
  for (let i = 0; i <= ROWS; i++) {
    ctx.beginPath();
    ctx.moveTo(0, i * BLOCK_SIZE); // 起点
    ctx.lineTo(COLS * BLOCK_SIZE, i * BLOCK_SIZE); // 终点
    ctx.stroke(); // 绘制线条
  }
}

// ================ 绘制单个方块函数 ================
function drawBlock(x, y, color) {
  // 绘制方块主体
  ctx.fillStyle = color; // 设置填充颜色
  ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);

  // 添加3D边框效果
  ctx.strokeStyle = "#fff"; // 白色边框
  ctx.lineWidth = 2; // 边框宽度
  ctx.strokeRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);

  // 如果不是空白格子，添加高光效果
  if (color !== EMPTY) {
    ctx.fillStyle = "rgba(255, 255, 255, 0.2)"; // 半透明白色
    ctx.fillRect(x * BLOCK_SIZE + 2, y * BLOCK_SIZE + 2, BLOCK_SIZE - 4, 4);
  }
}

// ================ 绘制下一个方块函数 ================
function drawNextPiece() {
  // 清空预览画布
  nextCtx.clearRect(0, 0, nextCanvas.width, nextCanvas.height);

  // 如果没有下一个方块，直接返回
  if (!nextPiece) return;

  // 计算居中显示的偏移量
  const offsetX = (nextCanvas.width / BLOCK_SIZE - nextPiece.shape[0].length) / 2;
  const offsetY = (nextCanvas.height / BLOCK_SIZE - nextPiece.shape.length) / 2;

  // 绘制下一个方块
  for (let r = 0; r < nextPiece.shape.length; r++) {
    for (let c = 0; c < nextPiece.shape[r].length; c++) {
      if (nextPiece.shape[r][c]) {
        // 只绘制形状中值为1的部分
        // 绘制方块主体
        nextCtx.fillStyle = nextPiece.color;
        nextCtx.fillRect(
          (offsetX + c) * BLOCK_SIZE,
          (offsetY + r) * BLOCK_SIZE,
          BLOCK_SIZE,
          BLOCK_SIZE
        );

        // 添加3D边框效果
        nextCtx.strokeStyle = "#fff";
        nextCtx.lineWidth = 2;
        nextCtx.strokeRect(
          (offsetX + c) * BLOCK_SIZE,
          (offsetY + r) * BLOCK_SIZE,
          BLOCK_SIZE,
          BLOCK_SIZE
        );

        // 添加高光效果
        nextCtx.fillStyle = "rgba(255, 255, 255, 0.2)";
        nextCtx.fillRect(
          (offsetX + c) * BLOCK_SIZE + 2,
          (offsetY + r) * BLOCK_SIZE + 2,
          BLOCK_SIZE - 4,
          4
        );
      }
    }
  }
}

// ================ 碰撞检测函数 ================
function collision(offsetX, offsetY, newShape = currentPiece.shape) {
  // 遍历方块的每个部分
  for (let r = 0; r < newShape.length; r++) {
    for (let c = 0; c < newShape[r].length; c++) {
      if (!newShape[r][c]) continue; // 跳过形状中的空白部分

      // 计算新位置
      const newX = currentPiece.x + c + offsetX;
      const newY = currentPiece.y + r + offsetY;

      // 检查是否超出左右边界或底部
      if (newX < 0 || newX >= COLS || newY >= ROWS) {
        return true; // 发生碰撞
      }

      // 检查是否超出顶部（只在旋转时可能发生）
      if (newY < 0) {
        continue; // 顶部超出不算碰撞（游戏可以继续）
      }

      // 检查是否与已有方块重叠
      if (board[newY][newX] !== EMPTY) {
        return true; // 发生碰撞
      }
    }
  }
  return false; // 没有碰撞
}

// ================ 锁定方块函数 ================
function lock() {
  // 将当前方块固定到游戏板上
  for (let r = 0; r < currentPiece.shape.length; r++) {
    for (let c = 0; c < currentPiece.shape[r].length; c++) {
      if (!currentPiece.shape[r][c]) continue; // 跳过空白部分

      // 检查是否超出顶部（游戏结束条件）
      if (currentPiece.y + r < 0) {
        gameOver = true; // 设置游戏结束标志
        clearInterval(dropInterval); // 清除下落定时器
        document.getElementById("score-display").classList.add("game-over");
        return; // 直接返回
      }

      // 将方块颜色记录到游戏板
      board[currentPiece.y + r][currentPiece.x + c] = currentPiece.color;
    }
  }

  // 检查并移除完整的行
  removeRows();

  // 创建新方块
  createNewPiece();

  // 重置下落计时器
  dropStart = Date.now();
}

// ================ 移除完整行函数 ================
function removeRows() {
  let rowsCleared = 0; // 记录清除的行数

  // 从底部向上检查每一行
  for (let r = ROWS - 1; r >= 0; r--) {
    let isRowFull = true; // 假设当前行是满的

    // 检查当前行是否所有格子都有方块
    for (let c = 0; c < COLS; c++) {
      if (board[r][c] === EMPTY) {
        isRowFull = false; // 发现空白格子，行不满
        break;
      }
    }

    // 如果行是满的，移除该行
    if (isRowFull) {
      // 将上面的行下移
      for (let y = r; y > 0; y--) {
        for (let c = 0; c < COLS; c++) {
          board[y][c] = board[y - 1][c]; // 复制上一行的内容
        }
      }

      // 清空最顶行
      for (let c = 0; c < COLS; c++) {
        board[0][c] = EMPTY;
      }

      rowsCleared++; // 增加清除行数
      r++; // 重新检查当前行（因为上面的行已经下移）
    }
  }

  // 如果有行被清除，更新分数和等级
  if (rowsCleared > 0) {
    // 根据清除的行数计算得分
    switch (rowsCleared) {
      case 1:
        score += 100 * level; // 单行100分乘以当前等级
        break;
      case 2:
        score += 300 * level; // 双行300分乘以当前等级
        break;
      case 3:
        score += 500 * level; // 三行500分乘以当前等级
        break;
      case 4:
        score += 800 * level; // 四行800分乘以当前等级（俄罗斯方块）
        break;
    }

    lines += rowsCleared; // 更新总消除行数

    // 每10行升一级
    level = Math.floor(lines / 10) + 1;

    // 更新显示
    updateScore();
    updateLevel();
    updateLines();

    // 根据新等级调整下落速度
    clearInterval(dropInterval);
    dropInterval = setInterval(drop, Math.max(100, 1000 - (level - 1) * 100));
  }
}

// ================ 方块下落函数 ================
function drop() {
  // 如果游戏结束或暂停，直接返回
  if (gameOver || isPaused) return;

  // 检查是否可以下落
  if (!collision(0, 1)) {
    currentPiece.y++; // 下落一格
    draw(); // 重绘游戏板
  } else {
    lock(); // 如果不能下落，锁定方块
  }

  // 更新下落开始时间
  dropStart = Date.now();
}

// ================ 游戏控制函数 ================
function control(e) {
  // 如果游戏结束或暂停，忽略按键
  if (gameOver || isPaused) return;

  // 根据按键执行不同操作
  switch (e.keyCode) {
    case 37: // 左箭头 - 左移
      if (!collision(-1, 0)) {
        // 检查是否可以左移
        currentPiece.x--; // 左移一格
        draw(); // 重绘游戏板
      }
      break;
    case 39: // 右箭头 - 右移
      if (!collision(1, 0)) {
        // 检查是否可以右移
        currentPiece.x++; // 右移一格
        draw(); // 重绘游戏板
      }
      break;
    case 40: // 下箭头 - 软降（加速下落）
      if (!collision(0, 1)) {
        // 检查是否可以下落
        currentPiece.y++; // 下落一格
        draw(); // 重绘游戏板
      }
      break;
    case 38: // 上箭头 - 旋转
      rotate(); // 旋转方块
      break;
    case 32: // 空格 - 硬降（直接落到底部）
      hardDrop(); // 执行硬降
      break;
  }
}

// ================ 旋转方块函数 ================
function rotate() {
  // 创建旋转后的新形状
  const newShape = [];
  // 旋转矩阵（行变列，列变行并反转）
  for (let i = 0; i < currentPiece.shape[0].length; i++) {
    newShape[i] = [];
    for (let j = currentPiece.shape.length - 1; j >= 0; j--) {
      newShape[i][currentPiece.shape.length - 1 - j] = currentPiece.shape[j][i];
    }
  }

  // 检查旋转后是否会碰撞
  if (!collision(0, 0, newShape)) {
    // 没有碰撞，应用新形状
    currentPiece.shape = newShape;
    draw(); // 重绘游戏板
  } else {
    // 如果旋转后发生碰撞，尝试墙踢（wall kick）
    // 定义可能的偏移量（左、右、上、下）
    const offsets = [
      { x: -1, y: 0 }, // 向左移动一格
      { x: 1, y: 0 }, // 向右移动一格
      { x: 0, y: -1 }, // 向上移动一格
      { x: 0, y: 1 }, // 向下移动一格
    ];

    // 尝试每个偏移量
    for (let i = 0; i < offsets.length; i++) {
      if (!collision(offsets[i].x, offsets[i].y, newShape)) {
        // 找到可行的偏移量，应用旋转和偏移
        currentPiece.shape = newShape;
        currentPiece.x += offsets[i].x;
        currentPiece.y += offsets[i].y;
        draw(); // 重绘游戏板
        break;
      }
    }
  }
}

// ================ 硬降函数 ================
function hardDrop() {
  // 一直下落直到碰撞
  while (!collision(0, 1)) {
    currentPiece.y++; // 下落一格
  }

  draw(); // 重绘游戏板
  lock(); // 锁定方块
}

// ================ 更新分数显示函数 ================
function updateScore() {
  document.getElementById("score-display").textContent = score;
}

// ================ 更新等级显示函数 ================
function updateLevel() {
  document.getElementById("level-display").textContent = level;
}

// ================ 更新消除行数显示函数 ================
function updateLines() {
  document.getElementById("lines-display").textContent = lines;
}

// ================ 切换暂停状态函数 ================
function togglePause() {
  // 如果游戏结束，重置游戏
  if (gameOver) {
    resetGame();
    document.getElementById("score-display").classList.remove("game-over");
    return;
  }

  // 切换暂停状态
  isPaused = !isPaused;

  if (isPaused) {
    // 暂停游戏，清除下落定时器
    clearInterval(dropInterval);
  } else {
    // 恢复游戏，重置下落定时器
    dropStart = Date.now();
    dropInterval = setInterval(drop, Math.max(100, 1000 - (level - 1) * 100));
  }
}

// ================ 页面加载完成后启动游戏 ================
window.onload = init;
</script>
<style>
body {
  background-color: #000;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  margin: 0;
  font-family: Arial, sans-serif;
}

#game-container {
  display: flex;
  background-color: #333;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
}

#game-canvas {
  border: 2px solid #555;
  background-color: #000;
}

#side-panel {
  margin-left: 20px;
  color: #fff;
  width: 150px;
}

#next-piece {
  border: 2px solid #555;
  background-color: #000;
  margin-bottom: 20px;
}

#score-display {
  font-size: 24px;
  margin-bottom: 20px;
}

#level-display {
  font-size: 24px;
  margin-bottom: 20px;
}

#lines-display {
  font-size: 24px;
  margin-bottom: 20px;
}

.panel-title {
  font-size: 18px;
  color: #ff0;
  margin-bottom: 5px;
}

#start-btn {
  background-color: #f00;
  color: #fff;
  border: none;
  padding: 10px 20px;
  font-size: 18px;
  cursor: pointer;
  border-radius: 5px;
  margin-top: 20px;
}

#start-btn:hover {
  background-color: #d00;
}

.game-over {
  color: #f00 !important;
  font-size: 28px !important;
  animation: blink 0.5s infinite;
}

@keyframes blink {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
  100% {
    opacity: 1;
  }
}
</style>
