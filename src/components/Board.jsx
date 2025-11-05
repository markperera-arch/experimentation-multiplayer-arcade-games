import React from 'react';
import Cell from './Cell';
import '../styles/Board.css';

const Board = ({ board, rows, cols, onCellClick, onCellRightClick, gameOver, gameWon }) => {
  return (
    <div className="board" style={{
      gridTemplateColumns: `repeat(${cols}, 1fr)`,
      gridTemplateRows: `repeat(${rows}, 1fr)`,
    }}>
      {board.map((row, rowIndex) =>
        row.map((cell, colIndex) => (
          <Cell
            key={`${rowIndex}-${colIndex}`}
            cell={cell}
            onClick={() => onCellClick(rowIndex, colIndex)}
            onContextMenu={() => onCellRightClick(rowIndex, colIndex)}
            gameOver={gameOver}
            gameWon={gameWon}
          />
        ))
      )}
    </div>
  );
};

export default Board;


