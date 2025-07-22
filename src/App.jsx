



import React, { useState, useRef, useEffect } from 'react';
import './App.css';
import { generateSudokuBoard, getCorrectCells, getErrorRegions } from './sudokuUtils';

// Custom hook for persistent state
function usePersistentSudokuState() {
  const loadState = () => {
    try {
      const saved = JSON.parse(localStorage.getItem('sudoku-state'));
      if (!saved) return null;
      return {
        ...saved,
        initialBoard: saved.initialBoard?.map(row => [...row]) ?? undefined,
        board: saved.board?.map(row => [...row]) ?? undefined,
        flashCells: new Set(saved.flashCells ?? []),
        errorCells: {
          rowErrors: new Set(saved.errorCells?.rowErrors ?? []),
          colErrors: new Set(saved.errorCells?.colErrors ?? []),
          blockErrors: new Set(saved.errorCells?.blockErrors ?? [])
        },
        history: (saved.history ?? []).map(h => ({
          ...h,
          board: h.board?.map(row => [...row]),
          errorCells: {
            rowErrors: new Set(h.errorCells?.rowErrors ?? []),
            colErrors: new Set(h.errorCells?.colErrors ?? []),
            blockErrors: new Set(h.errorCells?.blockErrors ?? [])
          },
          flashCells: new Set(h.flashCells ?? [])
        }))
      };
    } catch {
      return null;
    }
  };

  const saved = loadState();
  const [level, setLevel] = useState(saved?.level ?? 'easy');
  const [initialBoard, setInitialBoard] = useState(() => saved?.initialBoard ?? generateSudokuBoard(saved?.level ?? 'easy'));
  const [board, setBoard] = useState(saved?.board ?? initialBoard.map(row => [...row]));
  const [flashCells, setFlashCells] = useState(saved?.flashCells ?? new Set());
  const [errorCells, setErrorCells] = useState(saved?.errorCells ?? { rowErrors: new Set(), colErrors: new Set(), blockErrors: new Set() });
  const [mistakes, setMistakes] = useState(saved?.mistakes ?? 0);
  const [score, setScore] = useState(saved?.score ?? 0);
  const [time, setTime] = useState(saved?.time ?? 0); // seconds
  const [history, setHistory] = useState(saved?.history ?? []);

  // Save state to localStorage on relevant changes
  useEffect(() => {
    const stateToSave = {
      level,
      initialBoard,
      board,
      mistakes,
      score,
      time,
      flashCells: Array.from(flashCells),
      errorCells: {
        rowErrors: Array.from(errorCells.rowErrors),
        colErrors: Array.from(errorCells.colErrors),
        blockErrors: Array.from(errorCells.blockErrors)
      },
      history: history.map(h => ({
        ...h,
        board: h.board,
        errorCells: {
          rowErrors: Array.from(h.errorCells.rowErrors),
          colErrors: Array.from(h.errorCells.colErrors),
          blockErrors: Array.from(h.errorCells.blockErrors)
        },
        flashCells: Array.from(h.flashCells)
      }))
    };
    localStorage.setItem('sudoku-state', JSON.stringify(stateToSave));
  }, [level, initialBoard, board, mistakes, score, time, flashCells, errorCells, history]);

  return {
    level, setLevel,
    initialBoard, setInitialBoard,
    board, setBoard,
    flashCells, setFlashCells,
    errorCells, setErrorCells,
    mistakes, setMistakes,
    score, setScore,
    time, setTime,
    history, setHistory
  };
}





function App() {
  const {
    level, setLevel,
    initialBoard, setInitialBoard,
    board, setBoard,
    flashCells, setFlashCells,
    errorCells, setErrorCells,
    mistakes, setMistakes,
    score, setScore,
    time, setTime,
    history, setHistory
  } = usePersistentSudokuState();
  const [selectedCell, setSelectedCell] = useState(null);
  const [timerRunning, setTimerRunning] = useState(true);
  const timerRef = useRef(null);
  const flashTimeout = useRef(null);
  // Save state to localStorage on relevant changes
  useEffect(() => {
    const stateToSave = {
      level,
      initialBoard,
      board,
      mistakes,
      score,
      time,
      flashCells: Array.from(flashCells),
      errorCells: {
        rowErrors: Array.from(errorCells.rowErrors),
        colErrors: Array.from(errorCells.colErrors),
        blockErrors: Array.from(errorCells.blockErrors)
      },
      history: history.map(h => ({
        ...h,
        board: h.board,
        errorCells: {
          rowErrors: Array.from(h.errorCells.rowErrors),
          colErrors: Array.from(h.errorCells.colErrors),
          blockErrors: Array.from(h.errorCells.blockErrors)
        },
        flashCells: Array.from(h.flashCells)
      }))
    };
    localStorage.setItem('sudoku-state', JSON.stringify(stateToSave));
  }, [level, initialBoard, board, mistakes, score, time, flashCells, errorCells, history]);

  // Timer effect
  // Start/stop timer based on timerRunning
  useEffect(() => {
    if (timerRunning) {
      timerRef.current = setInterval(() => {
        setTime(t => t + 1);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timerRunning]);



  // Format time as mm:ss
  function formatTime(secs) {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  // Helper to check if a row has an error (for row highlighting)


  // Update handleChange to only be used by button input
  const handleInput = (num) => {
    if (mistakes >= 3) return;
    if (!selectedCell) return;
    // If timer is paused, resume it on any input
    if (!timerRunning) setTimerRunning(true);
    const [rowIdx, colIdx] = selectedCell;
    if (initialBoard[rowIdx][colIdx] !== 0) return;
    const newBoard = board.map(r => [...r]);
    const prevValue = newBoard[rowIdx][colIdx];
    // Only push to history if the value is actually changing
    if (prevValue !== num) {
      setHistory(h => [...h, {
        board: board.map(r => [...r]),
        mistakes,
        score,
        errorCells: {
          rowErrors: new Set(errorCells.rowErrors),
          colErrors: new Set(errorCells.colErrors),
          blockErrors: new Set(errorCells.blockErrors)
        },
        flashCells: new Set(flashCells),
        selectedCell,
      }]);
    }
    newBoard[rowIdx][colIdx] = num;
    setBoard(newBoard);
    // Error highlighting
    const errors = getErrorRegions(newBoard);
    setErrorCells(errors);
    // Mistake logic: if user enters a nonzero value and it causes an error, increment mistakes
    if (
      num !== 0 &&
      (errors.rowErrors.has(`${rowIdx},${colIdx}`) ||
        errors.colErrors.has(`${rowIdx},${colIdx}`) ||
        errors.blockErrors.has(`${rowIdx},${colIdx}`))
    ) {
      // Only increment if this is a new mistake (not just re-entering the same wrong value)
      if (prevValue !== num) setMistakes(m => m + 1);
    } else {
      // Score logic: increment based on level
      if (num !== 0 && prevValue !== num) {
        const levelScore = {
          easy: 1,
          medium: 2,
          hard: 3,
          expert: 4,
          master: 5,
          extreme: 6
        };
        setScore(s => s + (levelScore[level] || 1));
      }
    }
    // Flash correct cells if any row, col, or block is correct
    const correct = getCorrectCells(newBoard);
    if (correct.size > 0) {
      setFlashCells(correct);
      if (flashTimeout.current) clearTimeout(flashTimeout.current);
      flashTimeout.current = setTimeout(() => setFlashCells(new Set()), 2000);
    }
  };

  // Undo handler
  const handleUndo = () => {
    if (mistakes >= 3) return;
    setHistory(h => {
      if (h.length === 0) return h;
      const last = h[h.length - 1];
      setBoard(last.board.map(r => [...r]));
      // Do NOT restore mistakes from history
      setScore(last.score);
      setErrorCells({
        rowErrors: new Set(last.errorCells.rowErrors),
        colErrors: new Set(last.errorCells.colErrors),
        blockErrors: new Set(last.errorCells.blockErrors)
      });
      setFlashCells(new Set(last.flashCells));
      setSelectedCell(last.selectedCell);
      return h.slice(0, -1);
    });
  };



  return (
    <div className="sudoku-container">
      {/* Top Bar */}
      <div className="top-bar">
        <div className="difficulty">
          Difficulty:
          {["easy", "medium", "hard", "expert", "master", "extreme"].map(lvl => (
            <button
              key={lvl}
              className={level === lvl ? "difficulty-btn active" : "difficulty-btn"}
              onClick={() => {
                setLevel(lvl);
                const newInitial = generateSudokuBoard(lvl);
                setInitialBoard(newInitial);
                setBoard(newInitial.map(row => [...row]));
                setFlashCells(new Set());
                setErrorCells({ rowErrors: new Set(), colErrors: new Set(), blockErrors: new Set() });
                setSelectedCell(null);
              }}
            >
              {lvl.charAt(0).toUpperCase() + lvl.slice(1)}
            </button>
          ))}
        </div>
        <div className="stats">
          <span>Score <b>{score}</b></span>
          <span>Mistakes <b>{mistakes}/3</b></span>
          <span>
            Time <b>{formatTime(time)}</b>{' '}
            <button
              style={{ border: 'none', background: 'none', color: '#4a5568', fontSize: '1.1rem', cursor: 'pointer' }}
              onClick={() => setTimerRunning(r => !r)}
              aria-label={timerRunning ? 'Pause timer' : 'Resume timer'}
            >
              {timerRunning ? '⏸' : '▶️'}
            </button>
          </span>
        </div>
      </div>
      {/* Board and Numpad Area */}
      <div className="board-area">
        {/* Sudoku Board */}
        <div className="sudoku-board">
          {board.map((row, rowIdx) => (
            <div className="sudoku-row" key={rowIdx}>
              {row.map((cell, colIdx) => {
                const key = `${rowIdx},${colIdx}`;
                const isErrorCell = errorCells.rowErrors.has(key) || errorCells.colErrors.has(key) || errorCells.blockErrors.has(key);
                // Removed unused variables: isErrorCol, isErrorBlock, isErrorRow
                const isFlashing = flashCells.has(key);
                const isSelected = selectedCell && selectedCell[0] === rowIdx && selectedCell[1] === colIdx;
                let cellClass = "sudoku-cell";
                if (initialBoard[rowIdx][colIdx] !== 0) cellClass += " prefill";
                if (isSelected) cellClass += " selected";
                else if (isFlashing) cellClass += " flash";
                if (isErrorCell) cellClass += " error";
                return (
                  <div key={colIdx} style={{ position: 'relative', width: '100%', height: '100%' }}>
                    <input
                      className={cellClass}
                      type="text"
                      maxLength={1}
                      value={cell === 0 ? '' : cell}
                      readOnly
                      onClick={() => setSelectedCell([rowIdx, colIdx])}
                      disabled={initialBoard[rowIdx][colIdx] !== 0}
                      inputMode="none"
                    />
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        {/* Numpad Area */}
        <div className="numpad-area">
          <div className="numpad">
            {[1,2,3,4,5,6,7,8,9].map(num => (
              <button
                key={num}
                className="numpad-btn"
                onClick={() => handleInput(num)}
                disabled={mistakes >= 3}
              >
                {num}
              </button>
            ))}
          </div>
          <div className="action-btn-row">
            <button className="clear-btn" onClick={() => handleInput(0)} disabled={mistakes >= 3}>Clear</button>
            <button className="undo-btn" onClick={handleUndo} disabled={history.length === 0 || mistakes >= 3}>Undo</button>
            <button className="newgame-btn" onClick={() => {
              const newInitial = generateSudokuBoard(level);
              setInitialBoard(newInitial);
              setBoard(newInitial.map(row => [...row]));
              setFlashCells(new Set());
              setErrorCells({ rowErrors: new Set(), colErrors: new Set(), blockErrors: new Set() });
              setSelectedCell(null);
              setHistory([]);
              setMistakes(0);
              setTime(0);
              setTimerRunning(true);
            }}>New Game</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App
