import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../contexts/SocketContext';
import { usePlayer } from '../contexts/PlayerContext';
import Chat from '../components/shared/Chat';
import PlayerList from '../components/shared/PlayerList';
import PlayerStats from '../components/shared/PlayerStats';
import '../styles/MinesweeperGame.css';

const MinesweeperGame = () => {
  const navigate = useNavigate();
  const { socket } = useSocket();
  const { player, leaveGame } = usePlayer();
  const [gameState, setGameState] = useState(null);
  const [board, setBoard] = useState([]);
  const [playerFlags, setPlayerFlags] = useState(new Set());
  const [viewport, setViewport] = useState({ x: 0, y: 0 });
  const [chatVisible, setChatVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const boardRef = useRef(null);

  const CELL_SIZE = 30;
  const VIEWPORT_ROWS = 20;
  const VIEWPORT_COLS = 30;

  useEffect(() => {
    if (!socket || !player) {
      navigate('/');
      return;
    }

    // Join the minesweeper game
    const joinMinesweeper = async () => {
      try {
        const response = await new Promise((resolve, reject) => {
          socket.emit('game:join', 'minesweeper', (res) => {
            if (res.success) resolve(res);
            else reject(new Error(res.error));
          });
        });

        setGameState(response.gameState);
        setBoard(response.gameState.board);
        setPlayerFlags(new Set(response.gameState.playerFlags));
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    joinMinesweeper();

    // Listen for board updates
    socket.on('minesweeper:update', (data) => {
      setBoard((prevBoard) => {
        const newBoard = [...prevBoard];
        data.cells.forEach((cell) => {
          if (newBoard[cell.row] && newBoard[cell.row][cell.col]) {
            newBoard[cell.row][cell.col] = {
              ...newBoard[cell.row][cell.col],
              isRevealed: true,
              isMine: cell.isMine,
              neighborMines: cell.neighborMines,
              revealedBy: cell.revealedBy
            };
          }
        });
        return newBoard;
      });
    });

    socket.on('minesweeper:flag_update', (data) => {
      setPlayerFlags((prev) => {
        const newFlags = new Set(prev);
        const key = `${data.row},${data.col}`;
        if (data.action === 'add') {
          newFlags.add(key);
        } else {
          newFlags.delete(key);
        }
        return newFlags;
      });
    });

    return () => {
      socket.off('minesweeper:update');
      socket.off('minesweeper:flag_update');
      leaveGame();
    };
  }, [socket, player, navigate, leaveGame]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'c' || e.key === 'C') {
        setChatVisible((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  const handleCellClick = (row, col) => {
    if (!socket) return;

    socket.emit('minesweeper:reveal', { row, col }, (response) => {
      if (!response.success) {
        console.log('Reveal failed:', response.error);
      }
    });
  };

  const handleCellRightClick = (e, row, col) => {
    e.preventDefault();
    if (!socket) return;

    socket.emit('minesweeper:flag', { row, col }, (response) => {
      if (!response.success) {
        console.log('Flag failed:', response.error);
      }
    });
  };

  const handleScroll = (e) => {
    const scrollLeft = e.target.scrollLeft;
    const scrollTop = e.target.scrollTop;
    setViewport({
      x: Math.floor(scrollLeft / CELL_SIZE),
      y: Math.floor(scrollTop / CELL_SIZE)
    });
  };

  const getCellContent = (cell, row, col) => {
    const flagKey = `${row},${col}`;
    
    if (playerFlags.has(flagKey)) {
      return '🚩';
    }

    if (!cell.isRevealed) {
      return '';
    }

    if (cell.isMine) {
      return '💣';
    }

    if (cell.neighborMines === 0) {
      return '';
    }

    return cell.neighborMines;
  };

  const getCellClass = (cell) => {
    let className = 'mine-cell';

    if (cell.isRevealed) {
      className += ' revealed';
      if (cell.isMine) {
        className += ' mine';
      } else if (cell.neighborMines > 0) {
        className += ` number-${cell.neighborMines}`;
      }
    } else {
      className += ' hidden';
    }

    return className;
  };

  const handleBackToMenu = () => {
    leaveGame();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="game-loading">
        <h2>Loading Minesweeper...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div className="game-error">
        <h2>Error: {error}</h2>
        <button onClick={handleBackToMenu}>Back to Menu</button>
      </div>
    );
  }

  return (
    <div className="minesweeper-game">
      <PlayerStats />
      <PlayerList />

      <div className="game-header">
        <button className="back-btn" onClick={handleBackToMenu}>
          ← Back to Menu
        </button>
        <h1>💣 Minesweeper MMO</h1>
        <div className="game-info">
          <span>Map: {gameState?.rows}x{gameState?.cols}</span>
          <span>Mines: {gameState?.mineCount}</span>
        </div>
      </div>

      <div
        className="board-scroll-container"
        onScroll={handleScroll}
        ref={boardRef}
      >
        <div
          className="minesweeper-board"
          style={{
            width: gameState?.cols * CELL_SIZE,
            height: gameState?.rows * CELL_SIZE,
            gridTemplateColumns: `repeat(${gameState?.cols}, ${CELL_SIZE}px)`,
            gridTemplateRows: `repeat(${gameState?.rows}, ${CELL_SIZE}px)`
          }}
        >
          {board.map((row, rowIndex) =>
            row.map((cell, colIndex) => (
              <div
                key={`${rowIndex}-${colIndex}`}
                className={getCellClass(cell)}
                onClick={() => handleCellClick(rowIndex, colIndex)}
                onContextMenu={(e) => handleCellRightClick(e, rowIndex, colIndex)}
              >
                {getCellContent(cell, rowIndex, colIndex)}
              </div>
            ))
          )}
        </div>
      </div>

      <div className="game-instructions">
        <p>🖱️ Left click to reveal | 🖱️ Right click to flag | 🎯 First to click gets the XP!</p>
        <p>Press <kbd>C</kbd> to toggle chat</p>
      </div>

      <Chat visible={chatVisible} onToggle={() => setChatVisible(!chatVisible)} />
    </div>
  );
};

export default MinesweeperGame;
