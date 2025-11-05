import React, { useState, useEffect } from 'react';
import Board from './components/Board';
import {
  DIFFICULTY,
  createEmptyBoard,
  placeMines,
  calculateNeighborMines,
  revealCell,
  toggleFlag,
  checkWin,
  revealAllMines,
} from './utils/gameLogic';
import './styles/App.css';

function App() {
  const [difficulty, setDifficulty] = useState('EASY');
  const [board, setBoard] = useState([]);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [flagCount, setFlagCount] = useState(0);
  const [timer, setTimer] = useState(0);
  const [timerActive, setTimerActive] = useState(false);

  const { rows, cols, mines } = DIFFICULTY[difficulty];

  // Initialize board
  useEffect(() => {
    initializeGame();
  }, [difficulty]);

  // Timer
  useEffect(() => {
    let interval = null;
    if (timerActive && !gameOver && !gameWon) {
      interval = setInterval(() => {
        setTimer((time) => time + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [timerActive, gameOver, gameWon]);

  const initializeGame = () => {
    const emptyBoard = createEmptyBoard(rows, cols);
    setBoard(emptyBoard);
    setGameStarted(false);
    setGameOver(false);
    setGameWon(false);
    setFlagCount(0);
    setTimer(0);
    setTimerActive(false);
  };

  const handleCellClick = (row, col) => {
    if (gameOver || gameWon) return;

    const cell = board[row][col];
    if (cell.isRevealed || cell.isFlagged) return;

    // First click - place mines
    if (!gameStarted) {
      let newBoard = placeMines(board, rows, cols, mines, row, col);
      newBoard = calculateNeighborMines(newBoard, rows, cols);
      setBoard(newBoard);
      setGameStarted(true);
      setTimerActive(true);

      // Reveal the clicked cell
      newBoard = revealCell(newBoard, rows, cols, row, col);
      setBoard(newBoard);
      return;
    }

    // Check if clicked on mine
    if (cell.isMine) {
      const revealedBoard = revealAllMines(board, rows, cols);
      setBoard(revealedBoard);
      setGameOver(true);
      setTimerActive(false);
      return;
    }

    // Reveal cell
    const newBoard = revealCell(board, rows, cols, row, col);
    setBoard(newBoard);

    // Check for win
    if (checkWin(newBoard, rows, cols, mines)) {
      setGameWon(true);
      setTimerActive(false);
    }
  };

  const handleCellRightClick = (row, col) => {
    if (gameOver || gameWon || !gameStarted) return;

    const cell = board[row][col];
    if (cell.isRevealed) return;

    const newBoard = toggleFlag(board, row, col);
    setBoard(newBoard);

    // Update flag count
    const newFlagCount = cell.isFlagged ? flagCount - 1 : flagCount + 1;
    setFlagCount(newFlagCount);
  };

  const handleDifficultyChange = (newDifficulty) => {
    setDifficulty(newDifficulty);
  };

  const handleRestart = () => {
    initializeGame();
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="app">
      <div className="container">
        <h1 className="title">💣 Minesweeper</h1>
        
        <div className="controls">
          <div className="difficulty-buttons">
            <button
              className={`difficulty-btn ${difficulty === 'EASY' ? 'active' : ''}`}
              onClick={() => handleDifficultyChange('EASY')}
            >
              Easy
            </button>
            <button
              className={`difficulty-btn ${difficulty === 'MEDIUM' ? 'active' : ''}`}
              onClick={() => handleDifficultyChange('MEDIUM')}
            >
              Medium
            </button>
            <button
              className={`difficulty-btn ${difficulty === 'HARD' ? 'active' : ''}`}
              onClick={() => handleDifficultyChange('HARD')}
            >
              Hard
            </button>
          </div>

          <button className="restart-btn" onClick={handleRestart}>
            🔄 New Game
          </button>
        </div>

        <div className="game-info">
          <div className="info-item">
            <span className="info-label">Mines:</span>
            <span className="info-value">{mines - flagCount}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Time:</span>
            <span className="info-value">{formatTime(timer)}</span>
          </div>
          {gameOver && (
            <div className="game-status game-over">
              💥 Game Over!
            </div>
          )}
          {gameWon && (
            <div className="game-status game-won">
              🎉 You Won!
            </div>
          )}
        </div>

        <div className="board-container">
          <Board
            board={board}
            rows={rows}
            cols={cols}
            onCellClick={handleCellClick}
            onCellRightClick={handleCellRightClick}
            gameOver={gameOver}
            gameWon={gameWon}
          />
        </div>

        <div className="instructions">
          <p><strong>How to play:</strong></p>
          <p>🖱️ Left click to reveal a cell</p>
          <p>🖱️ Right click to flag a mine</p>
          <p>🎯 Reveal all non-mine cells to win!</p>
        </div>
      </div>
    </div>
  );
}

export default App;


