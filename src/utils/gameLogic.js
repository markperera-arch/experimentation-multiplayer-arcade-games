// Game difficulty settings
export const DIFFICULTY = {
  EASY: { rows: 9, cols: 9, mines: 10 },
  MEDIUM: { rows: 16, cols: 16, mines: 40 },
  HARD: { rows: 16, cols: 30, mines: 99 },
};

// Create an empty board
export const createEmptyBoard = (rows, cols) => {
  return Array(rows).fill(null).map(() => 
    Array(cols).fill(null).map(() => ({
      isMine: false,
      isRevealed: false,
      isFlagged: false,
      neighborMines: 0,
    }))
  );
};

// Place mines randomly on the board
export const placeMines = (board, rows, cols, mineCount, firstClickRow, firstClickCol) => {
  let minesPlaced = 0;
  const newBoard = board.map(row => row.map(cell => ({ ...cell })));

  while (minesPlaced < mineCount) {
    const row = Math.floor(Math.random() * rows);
    const col = Math.floor(Math.random() * cols);

    // Don't place mine on first click or if already has mine
    const isFirstClick = row === firstClickRow && col === firstClickCol;
    const isAdjacentToFirstClick = Math.abs(row - firstClickRow) <= 1 && 
                                    Math.abs(col - firstClickCol) <= 1;
    
    if (!newBoard[row][col].isMine && !isFirstClick && !isAdjacentToFirstClick) {
      newBoard[row][col].isMine = true;
      minesPlaced++;
    }
  }

  return newBoard;
};

// Calculate neighbor mine counts for all cells
export const calculateNeighborMines = (board, rows, cols) => {
  const newBoard = board.map(row => row.map(cell => ({ ...cell })));

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (!newBoard[row][col].isMine) {
        let count = 0;
        
        // Check all 8 neighbors
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue;
            
            const newRow = row + dr;
            const newCol = col + dc;
            
            if (newRow >= 0 && newRow < rows && newCol >= 0 && newCol < cols) {
              if (newBoard[newRow][newCol].isMine) {
                count++;
              }
            }
          }
        }
        
        newBoard[row][col].neighborMines = count;
      }
    }
  }

  return newBoard;
};

// Reveal cell and adjacent cells if no neighboring mines
export const revealCell = (board, rows, cols, row, col) => {
  const newBoard = board.map(row => row.map(cell => ({ ...cell })));
  
  const reveal = (r, c) => {
    // Check bounds
    if (r < 0 || r >= rows || c < 0 || c >= cols) return;
    
    const cell = newBoard[r][c];
    
    // Don't reveal if already revealed or flagged
    if (cell.isRevealed || cell.isFlagged) return;
    
    // Reveal the cell
    cell.isRevealed = true;
    
    // If no neighboring mines, reveal neighbors recursively
    if (cell.neighborMines === 0 && !cell.isMine) {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          reveal(r + dr, c + dc);
        }
      }
    }
  };
  
  reveal(row, col);
  return newBoard;
};

// Toggle flag on a cell
export const toggleFlag = (board, row, col) => {
  const newBoard = board.map(row => row.map(cell => ({ ...cell })));
  
  if (!newBoard[row][col].isRevealed) {
    newBoard[row][col].isFlagged = !newBoard[row][col].isFlagged;
  }
  
  return newBoard;
};

// Check if the game is won
export const checkWin = (board, rows, cols, mineCount) => {
  let revealedCount = 0;
  let correctFlags = 0;
  
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const cell = board[row][col];
      
      if (cell.isRevealed && !cell.isMine) {
        revealedCount++;
      }
      
      if (cell.isFlagged && cell.isMine) {
        correctFlags++;
      }
    }
  }
  
  // Win if all non-mine cells are revealed
  const totalCells = rows * cols;
  return revealedCount === totalCells - mineCount;
};

// Reveal all mines (for game over)
export const revealAllMines = (board, rows, cols) => {
  const newBoard = board.map(row => row.map(cell => ({ ...cell })));
  
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (newBoard[row][col].isMine) {
        newBoard[row][col].isRevealed = true;
      }
    }
  }
  
  return newBoard;
};


