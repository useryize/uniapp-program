<template>
  <!-- 游戏主容器 -->
  <view class="snake-game-container">
    <!-- Canvas游戏画布 -->
    <canvas 
      canvas-id="snakeCanvas" 
      class="snake-canvas" 
      :style="{width: canvasWidth + 'px', height: canvasHeight + 'px'}"
      @touchstart="handleTouchStart"
      @touchmove="handleTouchMove"
    ></canvas>
    
    <!-- 控制面板 -->
    <view class="control-panel">
      <button @click="startGame">开始游戏</button>
      <button @click="pauseGame">{{ isPaused ? '继续' : '暂停' }}</button>
      <view class="score">得分: {{score}}</view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

/**
 * 游戏配置参数
 */
const canvasWidth = ref(300)   // 画布宽度(像素)
const canvasHeight = ref(300)  // 画布高度(像素)
const gridSize = ref(15)       // 每个网格的大小(像素)
const speed = ref(500)         // 游戏速度(毫秒/帧)

/**
 * 游戏状态变量
 */
const isPlaying = ref(false)   // 游戏是否进行中
const isPaused = ref(false)    // 游戏是否暂停
const score = ref(0)           // 当前得分
const gameLoopId = ref(null)   // 游戏循环ID(用于清除定时器)

/**
 * 游戏数据
 */
// 蛇的数据结构：数组存储每个身体段的网格坐标
const snake = ref([
  {x: 5, y: 5}  // 初始位置(第5行第5列)
])

// 食物位置(网格坐标)
const food = ref({x: 10, y: 10})

// 方向控制
const direction = ref('right')     // 当前移动方向
const nextDirection = ref('right') // 下一帧的方向(用于防止连续按键导致直接反向)

/**
 * 触摸控制相关变量
 */
const touchStartX = ref(0)  // 触摸起始X坐标
const touchStartY = ref(0)  // 触摸起始Y坐标

/**
 * 初始化游戏
 * 重置蛇的位置、方向、分数和食物
 */
const initGame = () => {
  snake.value = [{x: 5, y: 5}]  // 重置蛇的位置
  direction.value = 'right'      // 重置方向
  nextDirection.value = 'right'
  score.value = 0                // 重置分数
  generateFood()                 // 生成新食物
}

/**
 * 随机生成食物位置
 * 确保食物不会出现在蛇身上
 */
const generateFood = () => {
  const maxPos = canvasWidth.value / gridSize.value - 1  // 计算最大网格坐标
  
  // 随机生成食物位置
  food.value = {
    x: Math.floor(Math.random() * maxPos),
    y: Math.floor(Math.random() * maxPos)
  }
  
  // 检查食物是否与蛇身重叠
  for (let segment of snake.value) {
    if (segment.x === food.value.x && segment.y === food.value.y) {
      // 如果重叠则递归重新生成
      return generateFood()
    }
  }
}

/**
 * 绘制游戏画面
 * 包括背景、网格、食物和蛇
 */
const drawGame = () => {
  // 获取Canvas上下文
  const ctx = uni.createCanvasContext('snakeCanvas', this)
  
  // 1. 绘制背景
  ctx.setFillStyle('#f5f5f5')  // 浅灰色背景
  ctx.fillRect(0, 0, canvasWidth.value, canvasHeight.value)
  
  // 2. 绘制网格线
  ctx.setStrokeStyle('#e0e0e0')  // 网格线颜色
  ctx.setLineWidth(0.5)          // 网格线宽度
  
  // 绘制垂直线
  for (let i = 0; i <= canvasWidth.value / gridSize.value; i++) {
    ctx.beginPath()
    ctx.moveTo(i * gridSize.value, 0)
    ctx.lineTo(i * gridSize.value, canvasHeight.value)
    ctx.stroke()
  }
  
  // 绘制水平线
  for (let i = 0; i <= canvasHeight.value / gridSize.value; i++) {
    ctx.beginPath()
    ctx.moveTo(0, i * gridSize.value)
    ctx.lineTo(canvasWidth.value, i * gridSize.value)
    ctx.stroke()
  }
  
  // 3. 绘制食物(红色方块)
  ctx.setFillStyle('#ff5252')
  ctx.fillRect(
    food.value.x * gridSize.value, 
    food.value.y * gridSize.value, 
    gridSize.value, 
    gridSize.value
  )
  
  // 4. 绘制蛇
  for (let i = 0; i < snake.value.length; i++) {
    const segment = snake.value[i]
    
    // 蛇头用深绿色
    if (i === 0) {
      ctx.setFillStyle('#2e7d32')
    } 
    // 蛇身用浅绿色
    else {
      ctx.setFillStyle('#4caf50')
    }
    
    // 绘制蛇身段
    ctx.fillRect(
      segment.x * gridSize.value,
      segment.y * gridSize.value,
      gridSize.value,
      gridSize.value
    )
  }
  
  // 执行绘制
  ctx.draw()
}

/**
 * 更新游戏状态
 * 包括移动蛇、检测碰撞、吃食物等
 */
const updateGame = () => {
  // 游戏未进行或暂停时直接返回
  if (!isPlaying.value || isPaused.value) return
  
  // 1. 更新方向
  direction.value = nextDirection.value
  
  // 2. 计算新蛇头位置
  const head = {...snake.value[0]}  // 复制蛇头
  
  // 根据方向移动蛇头
  switch (direction.value) {
    case 'up':    head.y -= 1; break
    case 'down':  head.y += 1; break
    case 'left':  head.x -= 1; break
    case 'right': head.x += 1; break
  }
  
  // 3. 碰撞检测
  if (checkCollision(head)) {
    gameOver()
    return
  }
  
  // 4. 移动蛇 - 在数组开头添加新头部
  snake.value.unshift(head)
  
  // 5. 检查是否吃到食物
  if (head.x === food.value.x && head.y === food.value.y) {
    // 吃到食物，增加分数
    score.value += 10
    // 生成新食物
    generateFood()
  } else {
    // 没吃到食物，移除尾部保持长度不变
    snake.value.pop()
  }
  
  // 6. 重绘游戏
  drawGame()
}

/**
 * 碰撞检测
 * @param {Object} head - 蛇头位置
 * @returns {boolean} 是否发生碰撞
 */
const checkCollision = (head) => {
  // 1. 边界检测
  const maxPos = canvasWidth.value / gridSize.value
  if (head.x < 0 || head.y < 0 || head.x >= maxPos || head.y >= maxPos) {
    return true
  }
  
  // 2. 自身碰撞检测(跳过蛇头)
  for (let i = 1; i < snake.value.length; i++) {
    const segment = snake.value[i]
    if (segment.x === head.x && segment.y === head.y) {
      return true
    }
  }
  
  return false
}

/**
 * 游戏主循环
 */
const gameLoop = () => {
  updateGame()  // 更新游戏状态
  // 设置下一帧回调
  gameLoopId.value = setTimeout(gameLoop, speed.value)
}

/**
 * 开始游戏
 */
const startGame = () => {
  if (isPlaying.value) return  // 防止重复开始
  
  initGame()          // 初始化游戏
  isPlaying.value = true
  isPaused.value = false
  drawGame()          // 初始绘制
  gameLoop()          // 启动游戏循环
}

/**
 * 暂停/继续游戏
 */
const pauseGame = () => {
  if (!isPlaying.value) return
  
  isPaused.value = !isPaused.value
  
  if (!isPaused.value) {
    // 继续游戏
    gameLoop()
  } else {
    // 暂停游戏
    clearTimeout(gameLoopId.value)
  }
}

/**
 * 游戏结束处理
 */
const gameOver = () => {
  isPlaying.value = false
  clearTimeout(gameLoopId.value)
  
  // 显示游戏结束弹窗
  uni.showModal({
    title: '游戏结束',
    content: `你的得分: ${score.value}`,
    showCancel: false,
    success: () => {
      // 重新初始化游戏
      initGame()
      drawGame()
    }
  })
}

/**
 * 键盘控制处理(PC端)
 */
const handleKeyDown = (e) => {
  if (!isPlaying.value || isPaused.value) return
  
  // 不允许直接反向移动
  switch (e.key) {
    case 'ArrowUp':
      if (direction.value !== 'down') nextDirection.value = 'up'
      break
    case 'ArrowDown':
      if (direction.value !== 'up') nextDirection.value = 'down'
      break
    case 'ArrowLeft':
      if (direction.value !== 'right') nextDirection.value = 'left'
      break
    case 'ArrowRight':
      if (direction.value !== 'left') nextDirection.value = 'right'
      break
  }
}

/**
 * 触摸控制处理(移动端)
 */
const handleTouchStart = (e) => {
  // 记录触摸起始位置
  touchStartX.value = e.touches[0].clientX
  touchStartY.value = e.touches[0].clientY
}

const handleTouchMove = (e) => {
  if (!isPlaying.value || isPaused.value) return
  
  const touchEndX = e.touches[0].clientX
  const touchEndY = e.touches[0].clientY
  
  // 计算滑动距离
  const dx = touchEndX - touchStartX.value
  const dy = touchEndY - touchStartY.value
  
  // 确定主要滑动方向
  if (Math.abs(dx) > Math.abs(dy)) {
    // 水平滑动
    if (dx > 0 && direction.value !== 'left') {
      nextDirection.value = 'right'  // 向右滑动
    } else if (dx < 0 && direction.value !== 'right') {
      nextDirection.value = 'left'   // 向左滑动
    }
  } else {
    // 垂直滑动
    if (dy > 0 && direction.value !== 'up') {
      nextDirection.value = 'down'   // 向下滑动
    } else if (dy < 0 && direction.value !== 'down') {
      nextDirection.value = 'up'    // 向上滑动
    }
  }
  
  // 更新起始位置
  touchStartX.value = touchEndX
  touchStartY.value = touchEndY
}

/**
 * 生命周期钩子
 */
onMounted(() => {
  // 初始绘制
  drawGame()
  
  // 监听键盘事件(PC端)
  if (typeof window !== 'undefined') {
    window.addEventListener('keydown', handleKeyDown)
  }
})

onUnmounted(() => {
  // 清除游戏循环
  if (gameLoopId.value) {
    clearTimeout(gameLoopId.value)
  }
  
  // 移除键盘事件监听
  if (typeof window !== 'undefined') {
    window.removeEventListener('keydown', handleKeyDown)
  }
})
</script>

<style scoped>
/* 游戏容器样式 */
.snake-game-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
}

/* 画布样式 */
.snake-canvas {
  border: 1px solid #ccc;  /* 灰色边框 */
  margin-bottom: 20px;     /* 底部间距 */
  background-color: #f5f5f5; /* 浅灰色背景 */
}

/* 控制面板样式 */
.control-panel {
  display: flex;
  justify-content: space-around;
  align-items: center;
  width: 100%;
  max-width: 300px;
  margin-top: 10px;
}

/* 按钮样式 */
button {
  padding: 8px 16px;
  margin: 0 5px;
  background-color: #4caf50; /* 绿色按钮 */
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 14px;
}

/* 分数显示样式 */
.score {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin: 0 10px;
}
</style>