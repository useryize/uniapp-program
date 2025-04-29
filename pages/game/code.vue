<template>
  <view class="game-container">
    <canvas
      type="2d"
      id="gameCanvas"
      class="game-canvas"
      @touchstart="handleTouchStart"
      @touchmove="handleTouchMove"
      @touchend="handleTouchEnd"
    ></canvas>
    <view class="game-info">
      <text class="score">分数: {{ score }}</text>
      <text class="level">等级: {{ level }}</text>
    </view>
    <view v-if="!isPlaying" class="start-screen">
      <view class="start-btn" @tap="startGame">开始游戏</view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

// 游戏配置
const COLS = 10
const ROWS = 20
let BLOCK_SIZE = 30
const COLORS = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500']

// 方块形状定义
const SHAPES = [
  [[1, 1, 1, 1]], // I
  [[1, 1], [1, 1]], // O
  [[1, 1, 1], [0, 1, 0]], // T
  [[1, 1, 1], [1, 0, 0]], // L
  [[1, 1, 1], [0, 0, 1]], // J
  [[1, 1, 0], [0, 1, 1]], // S
  [[0, 1, 1], [1, 1, 0]]  // Z
]

// 游戏状态
const score = ref(0)
const level = ref(1)
const gameOver = ref(false)
const isPlaying = ref(false)
let canvas = null
let ctx = null
let currentBlock = null
let gameBoard = []
let gameLoop = null
let touchStartX = 0
let touchStartY = 0

// 初始化游戏板
const initGameBoard = () => {
  gameBoard = Array(ROWS).fill().map(() => Array(COLS).fill(0))
}

// 创建新方块
const createNewBlock = () => {
  const shapeIndex = Math.floor(Math.random() * SHAPES.length)
  const shape = SHAPES[shapeIndex]
  const color = COLORS[shapeIndex]
  
  return {
    shape,
    color,
    x: Math.floor((COLS - shape[0].length) / 2),
    y: 0
  }
}

// 绘制方块
const drawBlock = (block, x, y) => {
  ctx.fillStyle = block.color
  block.shape.forEach((row, i) => {
    row.forEach((value, j) => {
      if (value) {
        ctx.fillRect(
          (x + j) * BLOCK_SIZE,
          (y + i) * BLOCK_SIZE,
          BLOCK_SIZE - 1,
          BLOCK_SIZE - 1
        )
      }
    })
  })
}

// 绘制游戏板
const drawBoard = () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  
  // 绘制已固定的方块
  gameBoard.forEach((row, i) => {
    row.forEach((value, j) => {
      if (value) {
        ctx.fillStyle = value
        ctx.fillRect(
          j * BLOCK_SIZE,
          i * BLOCK_SIZE,
          BLOCK_SIZE - 1,
          BLOCK_SIZE - 1
        )
      }
    })
  })
  
  // 绘制当前方块
  if (currentBlock) {
    drawBlock(currentBlock, currentBlock.x, currentBlock.y)
  }
}

// 碰撞检测
const checkCollision = (block, x, y) => {
  return block.shape.some((row, i) => {
    return row.some((value, j) => {
      if (!value) return false
      const newX = x + j
      const newY = y + i
      return (
        newX < 0 ||
        newX >= COLS ||
        newY >= ROWS ||
        (newY >= 0 && gameBoard[newY][newX])
      )
    })
  })
}

// 固定方块
const lockBlock = () => {
  currentBlock.shape.forEach((row, i) => {
    row.forEach((value, j) => {
      if (value) {
        const y = currentBlock.y + i
        if (y < 0) {
          gameOver.value = true
          isPlaying.value = false
          return
        }
        gameBoard[y][currentBlock.x + j] = currentBlock.color
      }
    })
  })
}

// 清除完整的行
const clearLines = () => {
  let linesCleared = 0
  for (let i = ROWS - 1; i >= 0; i--) {
    if (gameBoard[i].every(cell => cell !== 0)) {
      gameBoard.splice(i, 1)
      gameBoard.unshift(Array(COLS).fill(0))
      linesCleared++
      i++
    }
  }
  if (linesCleared > 0) {
    score.value += linesCleared * 100 * level.value
    level.value = Math.floor(score.value / 1000) + 1
  }
}

// 移动方块
const moveBlock = (dx, dy) => {
  if (!currentBlock || gameOver.value || !isPlaying.value) return false
  
  const newX = currentBlock.x + dx
  const newY = currentBlock.y + dy
  
  // 检查新位置是否有效
  if (!checkCollision(currentBlock, newX, newY)) {
    currentBlock.x = newX
    currentBlock.y = newY
    drawBoard()
    return true
  }
  
  // 如果是向下移动且发生碰撞，则锁定方块
  if (dy > 0) {
    lockBlock()
    clearLines()
    currentBlock = createNewBlock()
    // 检查新方块是否可以放置
    if (checkCollision(currentBlock, currentBlock.x, currentBlock.y)) {
      gameOver.value = true
      isPlaying.value = false
    }
  }
  return false
}

// 旋转方块
const rotateBlock = () => {
  if (!currentBlock || gameOver.value) return
  
  const rotated = currentBlock.shape[0].map((_, i) =>
    currentBlock.shape.map(row => row[i]).reverse()
  )
  
  const originalShape = currentBlock.shape
  currentBlock.shape = rotated
  
  if (checkCollision(currentBlock, currentBlock.x, currentBlock.y)) {
    currentBlock.shape = originalShape
  }
}

// 开始游戏
const startGame = () => {
  isPlaying.value = true
  gameOver.value = false
  score.value = 0
  level.value = 1
  initGameBoard()
  currentBlock = createNewBlock()
  if (gameLoop) clearInterval(gameLoop)
  gameLoop = setInterval(gameUpdate, 1000)
}

// 游戏主循环
const gameUpdate = () => {
  if (gameOver.value || !isPlaying.value) {
    clearInterval(gameLoop)
    if (gameOver.value) {
      uni.showModal({
        title: '游戏结束',
        content: `最终得分: ${score.value}`,
        showCancel: false
      })
    }
    return
  }
  
  // 尝试向下移动，如果失败则创建新方块
  if (!moveBlock(0, 1)) {
    drawBoard()
  }
}

// 触摸事件处理
const handleTouchStart = (e) => {
  touchStartX = e.touches[0].clientX
  touchStartY = e.touches[0].clientY
}

const handleTouchMove = (e) => {
  if (gameOver.value || !isPlaying.value) return
  
  const touchX = e.touches[0].clientX
  const touchY = e.touches[0].clientY
  const deltaX = touchX - touchStartX
  const deltaY = touchY - touchStartY
  
  // 水平移动
  if (Math.abs(deltaX) > 30) {
    moveBlock(deltaX > 0 ? 1 : -1, 0)
    touchStartX = touchX
  }
  
  // 垂直移动
  if (deltaY > 50) { // 增加垂直移动的阈值
    moveBlock(0, 1)
    touchStartY = touchY
  }
}

const handleTouchEnd = (e) => {
  if (!isPlaying.value) return
  
  // 检测是否为点击事件（移动距离很小）
  const touchEndX = e.changedTouches[0].clientX
  const touchEndY = e.changedTouches[0].clientY
  const deltaX = Math.abs(touchEndX - touchStartX)
  const deltaY = Math.abs(touchEndY - touchStartY)
  
  // 如果移动距离小于30像素，认为是点击事件，执行旋转
  if (deltaX < 30 && deltaY < 30) {
    rotateBlock()
  }
  
  touchStartX = 0
  touchStartY = 0
}

// 生命周期钩子
onMounted(() => {
  // 获取系统信息
  const systemInfo = uni.getSystemInfoSync()
  const screenWidth = systemInfo.windowWidth
  const screenHeight = systemInfo.windowHeight
  
  // 计算合适的方块大小
  BLOCK_SIZE = Math.min(
    Math.floor(screenWidth / COLS),
    Math.floor((screenHeight * 0.7) / ROWS)
  )
  
  const query = uni.createSelectorQuery()
  query.select('#gameCanvas')
    .fields({ node: true, size: true })
    .exec((res) => {
      canvas = res[0].node
      ctx = canvas.getContext('2d')
      
      // 设置canvas大小
      canvas.width = COLS * BLOCK_SIZE
      canvas.height = ROWS * BLOCK_SIZE
      
      // 初始化游戏板
      initGameBoard()
      drawBoard()
    })
})

onUnmounted(() => {
  if (gameLoop) clearInterval(gameLoop)
})
</script>

<style scoped>
.game-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20rpx;
  background-color: #f0f0f0;
  height: 100vh;
  box-sizing: border-box;
  position: relative;
}

.game-canvas {
  width: 100%;
  height: calc(100vh - 120rpx);
  background-color: #fff;
  border: 2px solid #333;
}

.game-info {
  margin: 20rpx 0;
  display: flex;
  gap: 40rpx;
  padding: 0 20rpx;
  width: 100%;
  justify-content: center;
}

.score, .level {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.start-screen {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
}

.start-btn {
  background-color: #007AFF;
  color: white;
  padding: 30rpx 60rpx;
  border-radius: 50rpx;
  font-size: 36rpx;
  font-weight: bold;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.2);
}

.start-btn:active {
  background-color: #0056b3;
  transform: scale(0.98);
}
</style>
