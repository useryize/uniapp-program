<template>
  <h1>消掉笑脸游戏（修复动画问题）</h1>
  <div id="score">分数: 0</div>
  <div id="game-board"></div>
  <button id="restart">重新开始</button>
</template>
<script>
document.addEventListener("DOMContentLoaded", () => {
  const gameBoard = document.getElementById("game-board");
  const scoreDisplay = document.getElementById("score");
  const restartButton = document.getElementById("restart");

  const emojis = ["😀", "😂", "😍", "😎", "🥳", "😊", "🤩", "😜"];
  const boardSize = 8;
  let board = [];
  let selectedTile = null;
  let score = 0;
  let isAnimating = false;
  let animationQueue = []; // 动画队列

  // 初始化游戏
  function initGame() {
    board = [];
    score = 0;
    scoreDisplay.textContent = `分数: ${score}`;
    gameBoard.innerHTML = "";
    isAnimating = false;
    animationQueue = [];

    // 创建游戏板
    for (let row = 0; row < boardSize; row++) {
      board[row] = [];
      for (let col = 0; col < boardSize; col++) {
        const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
        board[row][col] = randomEmoji;
        createTile(row, col, randomEmoji);
      }
    }
  }

  function createTile(row, col, emoji) {
    const tile = document.createElement("div");
    tile.className = "tile";
    tile.textContent = emoji;
    tile.dataset.row = row;
    tile.dataset.col = col;

    tile.addEventListener("click", () => {
      if (!isAnimating) {
        handleTileClick(row, col, tile);
      }
    });

    gameBoard.appendChild(tile);
    return tile;
  }

  function handleTileClick(row, col, tileElement) {
    if (selectedTile !== null) {
      if (selectedTile.row === row && selectedTile.col === col) {
        // 点击同一个格子，取消选择
        selectedTile.element.classList.remove("selected");
        selectedTile = null;
        return;
      }

      if (isAdjacent(selectedTile.row, selectedTile.col, row, col)) {
        // 交换前先取消选择状态
        selectedTile.element.classList.remove("selected");
        const firstTile = selectedTile;
        selectedTile = null;

        // 加入交换动画到队列
        animationQueue.push(() => {
          swapTilesWithAnimation(firstTile.row, firstTile.col, row, col, () => {
            // 交换完成后检查匹配
            const matches = checkMatches();
            if (matches.length > 0) {
              // 有匹配，加入消除动画到队列
              animationQueue.push(() => {
                removeMatches(matches, () => {
                  score += matches.length;
                  scoreDisplay.textContent = `分数: ${score}`;
                  processAnimationQueue(); // 继续处理队列
                });
              });
            } else {
              // 无匹配，交换回去
              animationQueue.push(() => {
                swapTilesWithAnimation(firstTile.row, firstTile.col, row, col, () => {
                  processAnimationQueue(); // 继续处理队列
                });
              });
            }
            processAnimationQueue(); // 开始处理队列
          });
        });

        processAnimationQueue(); // 开始处理队列
      } else {
        // 不相邻，选择新格子
        selectedTile.element.classList.remove("selected");
        selectedTile = { row, col, element: tileElement };
        tileElement.classList.add("selected");
      }
    } else {
      // 第一次选择
      selectedTile = { row, col, element: tileElement };
      tileElement.classList.add("selected");
    }
  }

  // 处理动画队列
  function processAnimationQueue() {
    if (!isAnimating && animationQueue.length > 0) {
      const nextAnimation = animationQueue.shift();
      nextAnimation();
    }
  }

  function isAdjacent(row1, col1, row2, col2) {
    return (
      (Math.abs(row1 - row2) === 1 && col1 === col2) ||
      (Math.abs(col1 - col2) === 1 && row1 === row2)
    );
  }

  function swapTilesWithAnimation(row1, col1, row2, col2, callback) {
    isAnimating = true;

    const tile1 = document.querySelector(`.tile[data-row="${row1}"][data-col="${col1}"]`);
    const tile2 = document.querySelector(`.tile[data-row="${row2}"][data-col="${col2}"]`);

    const rect1 = tile1.getBoundingClientRect();
    const rect2 = tile2.getBoundingClientRect();

    const dx = rect2.left - rect1.left;
    const dy = rect2.top - rect1.top;

    tile1.classList.add("moving");
    tile2.classList.add("moving");

    tile1.style.transform = `translate(${dx}px, ${dy}px)`;
    tile2.style.transform = `translate(${-dx}px, ${-dy}px)`;

    setTimeout(() => {
      // 交换数组中的值
      const temp = board[row1][col1];
      board[row1][col1] = board[row2][col2];
      board[row2][col2] = temp;

      // 更新DOM
      tile1.textContent = board[row1][col1];
      tile2.textContent = board[row2][col2];

      // 重置样式
      tile1.style.transform = "";
      tile2.style.transform = "";
      tile1.classList.remove("moving");
      tile2.classList.remove("moving");

      isAnimating = false;

      if (callback) callback();
    }, 300);
  }

  function checkMatches() {
    const matches = new Set();

    // 水平检查
    for (let row = 0; row < boardSize; row++) {
      for (let col = 0; col < boardSize - 2; col++) {
        if (
          board[row][col] === board[row][col + 1] &&
          board[row][col] === board[row][col + 2]
        ) {
          let endCol = col + 2;
          while (endCol + 1 < boardSize && board[row][endCol + 1] === board[row][col]) {
            endCol++;
          }
          for (let c = col; c <= endCol; c++) {
            matches.add(`${row},${c}`);
          }
        }
      }
    }

    // 垂直检查
    for (let col = 0; col < boardSize; col++) {
      for (let row = 0; row < boardSize - 2; row++) {
        if (
          board[row][col] === board[row + 1][col] &&
          board[row][col] === board[row + 2][col]
        ) {
          let endRow = row + 2;
          while (endRow + 1 < boardSize && board[endRow + 1][col] === board[row][col]) {
            endRow++;
          }
          for (let r = row; r <= endRow; r++) {
            matches.add(`${r},${col}`);
          }
        }
      }
    }

    return Array.from(matches);
  }

  function removeMatches(matches, callback) {
    isAnimating = true;

    // 标记要移除的格子
    matches.forEach((match) => {
      const [row, col] = match.split(",").map(Number);
      board[row][col] = null;

      const tile = document.querySelector(`.tile[data-row="${row}"][data-col="${col}"]`);
      if (tile) {
        tile.classList.add("removing");
      }
    });

    setTimeout(() => {
      // 下落现有表情
      for (let col = 0; col < boardSize; col++) {
        let emptyRow = boardSize - 1;
        for (let row = boardSize - 1; row >= 0; row--) {
          if (board[row][col] !== null) {
            board[emptyRow][col] = board[row][col];
            if (emptyRow !== row) {
              board[row][col] = null;
            }
            emptyRow--;
          }
        }

        // 补充新表情
        for (let row = emptyRow; row >= 0; row--) {
          board[row][col] = emojis[Math.floor(Math.random() * emojis.length)];
        }
      }

      // 重新渲染整个游戏板
      updateBoard();

      // 检查是否有新的匹配
      const newMatches = checkMatches();
      if (newMatches.length > 0) {
        animationQueue.push(() => {
          removeMatches(newMatches, () => {
            score += newMatches.length;
            scoreDisplay.textContent = `分数: ${score}`;
            if (callback) callback();
          });
        });
      } else {
        isAnimating = false;
        if (callback) callback();
      }

      processAnimationQueue();
    }, 300);
  }

  function updateBoard() {
    gameBoard.innerHTML = "";
    for (let row = 0; row < boardSize; row++) {
      for (let col = 0; col < boardSize; col++) {
        createTile(row, col, board[row][col]);
      }
    }
  }

  restartButton.addEventListener("click", initGame);
  initGame();
});
</script>
<style>
body {
  font-family: Arial, sans-serif;
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: #f0f0f0;
}
h1 {
  color: #333;
}
#game-board {
  display: grid;
  grid-template-columns: repeat(8, 60px);
  grid-template-rows: repeat(8, 60px);
  gap: 5px;
  margin: 20px;
  position: relative;
}
.tile {
  width: 60px;
  height: 60px;
  background-color: #fff;
  border-radius: 8px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 30px;
  cursor: pointer;
  user-select: none;
  transition: all 0.3s ease;
  position: relative;
  z-index: 1;
}
.tile.selected {
  background-color: #ffeb3b;
  transform: scale(1.05);
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
  z-index: 2;
}
.tile.moving {
  z-index: 3;
  transition: all 0.3s ease;
}
.tile.removing {
  transform: scale(0);
  opacity: 0;
  transition: all 0.3s ease;
}
#score {
  font-size: 24px;
  margin: 10px;
}
#restart {
  padding: 10px 20px;
  font-size: 18px;
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  margin: 10px;
  transition: background-color 0.3s;
}
#restart:hover {
  background-color: #45a049;
}
</style>
