import React from 'react';
import '../styles/Cell.css';

const Cell = ({ cell, onClick, onContextMenu, gameOver, gameWon }) => {
  const { isMine, isRevealed, isFlagged, neighborMines } = cell;

  const handleClick = () => {
    if (!isRevealed && !isFlagged && !gameOver && !gameWon) {
      onClick();
    }
  };

  const handleContextMenu = (e) => {
    e.preventDefault();
    if (!isRevealed && !gameOver && !gameWon) {
      onContextMenu();
    }
  };

  const getCellContent = () => {
    if (isFlagged) {
      return '🚩';
    }

    if (!isRevealed) {
      return '';
    }

    if (isMine) {
      return '💣';
    }

    if (neighborMines === 0) {
      return '';
    }

    return neighborMines;
  };

  const getCellClass = () => {
    let className = 'cell';

    if (isRevealed) {
      className += ' revealed';
      if (isMine) {
        className += ' mine';
      } else if (neighborMines > 0) {
        className += ` number-${neighborMines}`;
      }
    } else {
      className += ' hidden';
    }

    if (isFlagged) {
      className += ' flagged';
    }

    return className;
  };

  return (
    <div
      className={getCellClass()}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
    >
      {getCellContent()}
    </div>
  );
};

export default Cell;


