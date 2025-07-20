import { useState, useRef } from 'react'
import './App.css'

// Generate a random valid Sudoku board (with some cells removed for play)
function generateSudokuBoard(level = 'easy') {
  // Helper to check if placing num at (row, col) is valid
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

  // Backtracking Sudoku solver/filler
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

  // Remove cells to create a puzzle
  function removeCells(board, level) {
    let emptyCount;
    if (level === 'easy') emptyCount = 35;
    else if (level === 'medium') emptyCount = 45;
    else if (level === 'hard') emptyCount = 55;
    else emptyCount = 45;
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

function getCorrectCells(board) {
  // Returns a set of [row,col] for all cells that are correct in their row, col, and block
  let correct = new Set();
  // Check rows
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
  // Check cols
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
  // Check blocks
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

function getErrorRegions(board) {
  // Returns sets of cell keys for rows, cols, and blocks with errors
  let rowErrors = new Set();
  let colErrors = new Set();
  let blockErrors = new Set();

  // Check rows
  for (let i = 0; i < 9; i++) {
    let seen = new Map();
    for (let j = 0; j < 9; j++) {
      let v = board[i][j];
      if (v === 0) continue;
      if (!seen.has(v)) seen.set(v, []);
      seen.get(v).push(j);
    }
    for (let [_, js] of seen.entries()) {
      if (js.length > 1) {
        for (let j of js) rowErrors.add(`${i},${j}`);
      }
    }
  }
  // Check columns
  for (let j = 0; j < 9; j++) {
    let seen = new Map();
    for (let i = 0; i < 9; i++) {
      let v = board[i][j];
      if (v === 0) continue;
      if (!seen.has(v)) seen.set(v, []);
      seen.get(v).push(i);
    }
    for (let [_, is] of seen.entries()) {
      if (is.length > 1) {
        for (let i of is) colErrors.add(`${i},${j}`);
      }
    }
  }
  // Check blocks
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

function App() {
  const [level, setLevel] = useState('easy');
  const [initialBoard, setInitialBoard] = useState(() => generateSudokuBoard(level));
  const [board, setBoard] = useState(initialBoard.map(row => [...row]));
  const [message, setMessage] = useState('');
  const [flashCells, setFlashCells] = useState(new Set());
  const [errorCells, setErrorCells] = useState({ rowErrors: new Set(), colErrors: new Set(), blockErrors: new Set() });
  const [selectedCell, setSelectedCell] = useState(null);
  const flashTimeout = useRef(null);

  // Helper to get error rows, cols, blocks
  function getErrorRowsColsBlocks(errors) {
    const errorRows = new Set();
    const errorCols = new Set();
    const errorBlocks = new Set();
    errors.rowErrors.forEach(key => errorRows.add(key.split(',')[0]));
    errors.colErrors.forEach(key => errorCols.add(key.split(',')[1]));
    errors.blockErrors.forEach(key => {
      const [r, c] = key.split(',').map(Number);
      errorBlocks.add(`${Math.floor(r/3)},${Math.floor(c/3)}`);
    });
    return { errorRows, errorCols, errorBlocks };
  }

  // Update handleChange to only be used by button input
  const handleInput = (num) => {
    if (!selectedCell) return;
    const [rowIdx, colIdx] = selectedCell;
    if (initialBoard[rowIdx][colIdx] !== 0) return;
    const newBoard = board.map(r => [...r]);
    newBoard[rowIdx][colIdx] = num;
    setBoard(newBoard);
    // Error highlighting
    const errors = getErrorRegions(newBoard);
    setErrorCells(errors);
    if (
      errors.rowErrors.size > 0 ||
      errors.colErrors.size > 0 ||
      errors.blockErrors.size > 0
    ) {
      setMessage('There is a mistake!');
    } else {
      setMessage('');
    }
    // Flash correct cells if any row, col, or block is correct
    const correct = getCorrectCells(newBoard);
    if (correct.size > 0) {
      setFlashCells(correct);
      if (flashTimeout.current) clearTimeout(flashTimeout.current);
      flashTimeout.current = setTimeout(() => setFlashCells(new Set()), 2000);
    }
  };

  const { errorRows, errorCols, errorBlocks } = getErrorRowsColsBlocks(errorCells);

  // Helper to check if a row has an error (for row highlighting)
  function isRowInError(rowIdx) {
    for (let colIdx = 0; colIdx < 9; colIdx++) {
      if (errorCells.rowErrors.has(`${rowIdx},${colIdx}`)) return true;
    }
    return false;
  }

  return (
    <div className="sudoku-container">
      <h1>Sudoku Game</h1>
      <div style={{ marginBottom: '1rem' }}>
        <label htmlFor="level-select">Level: </label>
        <select id="level-select" value={level} onChange={e => {
          const newLevel = e.target.value;
          setLevel(newLevel);
          const newInitial = generateSudokuBoard(newLevel);
          setInitialBoard(newInitial);
          setBoard(newInitial.map(row => [...row]));
          setMessage('');
          setFlashCells(new Set());
          setErrorCells({ rowErrors: new Set(), colErrors: new Set(), blockErrors: new Set() });
          setSelectedCell(null);
        }}>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
      </div>
      <div className="sudoku-board" style={{
        display: 'grid',
        gridTemplateRows: `repeat(${board.length}, 1fr)`
      }}>
        {board.map((row, rowIdx) => (
          <div
            className="sudoku-row"
            key={rowIdx}
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${row.length}, 1fr)`
            }}
          >
            {row.map((cell, colIdx) => {
              const key = `${rowIdx},${colIdx}`;
              const isErrorCell = errorCells.rowErrors.has(key) || errorCells.colErrors.has(key) || errorCells.blockErrors.has(key);
              const isErrorCol = errorCols.has(String(colIdx));
              const isErrorBlock = errorBlocks.has(`${Math.floor(rowIdx/3)},${Math.floor(colIdx/3)}`);
              const isErrorRow = isRowInError(rowIdx);
              const isFlashing = flashCells.has(key);
              const isSelected = selectedCell && selectedCell[0] === rowIdx && selectedCell[1] === colIdx;
              return (
                <input
                  key={colIdx}
                  className={`sudoku-cell${isErrorCell ? ' error' : ''}${isErrorCol ? ' error-col' : ''}${isErrorBlock ? ' error-block' : ''}${isErrorRow ? ' error-row' : ''}${isFlashing ? ' flash' : ''}${isSelected ? ' selected' : ''}`}
                  type="text"
                  maxLength={1}
                  value={cell === 0 ? '' : cell}
                  readOnly
                  onClick={() => setSelectedCell([rowIdx, colIdx])}
                  disabled={initialBoard[rowIdx][colIdx] !== 0}
                />
              );
            })}
          </div>
        ))}
      </div>
      <div className="numpad">
        {[1,2,3,4,5,6,7,8,9].map(num => (
          <button key={num} className="numpad-btn" onClick={() => handleInput(num)}>{num}</button>
        ))}
      </div>
      <button onClick={() => handleInput(0)}>Clear</button>

      <div className="message">{message}</div>
    </div>
  );
}

export default App
