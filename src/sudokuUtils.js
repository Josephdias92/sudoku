// sudokuUtils.js
// Utility functions for Sudoku logic

// Generate a random valid Sudoku board (with some cells removed for play)
export function generateSudokuBoard(level = 'easy') {
  function isSafe(board, row, col, num) {
    for (let x = 0; x < 9; x++) {
      if (board[row][x] === num || board[x][col] === num) return false;
    }
    const startRow = row - row % 3, startCol = col - col % 3;
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) {
      if (board[i + startRow][j + startCol] === num) return false;
    }
    return true;
  }

  function fillBoard(board) {
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (board[row][col] === 0) {
          let nums = [1,2,3,4,5,6,7,8,9].sort(() => Math.random() - 0.5);
          for (let num of nums) {
            if (isSafe(board, row, col, num)) {
              board[row][col] = num;
              if (fillBoard(board)) return true;
              board[row][col] = 0;
            }
          }
          return false;
        }
      }
    }
    return true;
  }

  function removeCells(board, level) {
    const levelEmptyCounts = {
      easy: 35,
      medium: 45,
      hard: 55,
      expert: 60,
      master: 64,
      extreme: 68
    };
    let emptyCount = levelEmptyCounts[level] ?? 45;
    let attempts = emptyCount;
    while (attempts > 0) {
      let row = Math.floor(Math.random() * 9);
      let col = Math.floor(Math.random() * 9);
      if (board[row][col] !== 0) {
        board[row][col] = 0;
        attempts--;
      }
    }
    return board;
  }

  let board = Array.from({ length: 9 }, () => Array(9).fill(0));
  fillBoard(board);
  return removeCells(board, level);
}

export function getCorrectCells(board) {
  let correct = new Set();
  for (let i = 0; i < 9; i++) {
    let seen = new Map();
    for (let j = 0; j < 9; j++) {
      let v = board[i][j];
      if (v === 0) continue;
      if (!seen.has(v)) seen.set(v, []);
      seen.get(v).push([i, j]);
    }
    if (seen.size === 9 && Array.from(seen.values()).every(arr => arr.length === 1)) {
      for (let arr of seen.values()) correct.add(arr[0].join(','));
    }
  }
  for (let j = 0; j < 9; j++) {
    let seen = new Map();
    for (let i = 0; i < 9; i++) {
      let v = board[i][j];
      if (v === 0) continue;
      if (!seen.has(v)) seen.set(v, []);
      seen.get(v).push([i, j]);
    }
    if (seen.size === 9 && Array.from(seen.values()).every(arr => arr.length === 1)) {
      for (let arr of seen.values()) correct.add(arr[0].join(','));
    }
  }
  for (let blockRow = 0; blockRow < 3; blockRow++) {
    for (let blockCol = 0; blockCol < 3; blockCol++) {
      let seen = new Map();
      for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) {
        let r = blockRow * 3 + i, c = blockCol * 3 + j;
        let v = board[r][c];
        if (v === 0) continue;
        if (!seen.has(v)) seen.set(v, []);
        seen.get(v).push([r, c]);
      }
      if (seen.size === 9 && Array.from(seen.values()).every(arr => arr.length === 1)) {
        for (let arr of seen.values()) correct.add(arr[0].join(','));
      }
    }
  }
  return correct;
}

export function getErrorRegions(board) {
  let rowErrors = new Set();
  let colErrors = new Set();
  let blockErrors = new Set();
  for (let i = 0; i < 9; i++) {
    let seen = new Map();
    for (let j = 0; j < 9; j++) {
      let v = board[i][j];
      if (v === 0) continue;
      if (!seen.has(v)) seen.set(v, []);
      seen.get(v).push(j);
    }
    for (let js of seen.values()) {
      if (js.length > 1) {
        for (let j of js) rowErrors.add(`${i},${j}`);
      }
    }
  }
  for (let j = 0; j < 9; j++) {
    let seen = new Map();
    for (let i = 0; i < 9; i++) {
      let v = board[i][j];
      if (v === 0) continue;
      if (!seen.has(v)) seen.set(v, []);
      seen.get(v).push(i);
    }
    for (let is of seen.values()) {
      if (is.length > 1) {
        for (let i of is) colErrors.add(`${i},${j}`);
      }
    }
  }
  for (let blockRow = 0; blockRow < 3; blockRow++) {
    for (let blockCol = 0; blockCol < 3; blockCol++) {
      let seen = new Map();
      for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) {
        let r = blockRow * 3 + i, c = blockCol * 3 + j;
        let v = board[r][c];
        if (v === 0) continue;
        if (!seen.has(v)) seen.set(v, []);
        seen.get(v).push([r, c]);
      }
      for (let arr of seen.values()) {
        if (arr.length > 1) {
          for (let [r, c] of arr) blockErrors.add(`${r},${c}`);
        }
      }
    }
  }
  return { rowErrors, colErrors, blockErrors };
}
