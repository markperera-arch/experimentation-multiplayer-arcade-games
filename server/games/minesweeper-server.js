class MinesweeperServer {
  constructor() {
    this.rows = 50;
    this.cols = 80;
    this.mineCount = 400;
    
    this.board = this.createBoard();
    this.players = new Map(); // playerId -> player info
    this.playerFlags = new Map(); // playerId -> Set of flagged cells
    this.playerCursors = new Map(); // playerId -> {row, col}
  }

  createBoard() {
    const board = Array(this.rows).fill(null).map(() =>
      Array(this.cols).fill(null).map(() => ({
        isMine: false,
        isRevealed: false,
        neighborMines: 0,
        revealedBy: null // playerId who revealed it
      }))
    );

    // Place mines randomly
    let minesPlaced = 0;
    while (minesPlaced < this.mineCount) {
      const row = Math.floor(Math.random() * this.rows);
      const col = Math.floor(Math.random() * this.cols);

      if (!board[row][col].isMine) {
        board[row][col].isMine = true;
        minesPlaced++;
      }
    }

    // Calculate neighbor mines
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        if (!board[row][col].isMine) {
          let count = 0;
          
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              if (dr === 0 && dc === 0) continue;
              
              const newRow = row + dr;
              const newCol = col + dc;
              
              if (newRow >= 0 && newRow < this.rows && newCol >= 0 && newCol < this.cols) {
                if (board[newRow][newCol].isMine) {
                  count++;
                }
              }
            }
          }
          
          board[row][col].neighborMines = count;
        }
      }
    }

    return board;
  }

  addPlayer(playerId, player) {
    this.players.set(playerId, {
      ...player,
      joinedAt: Date.now()
    });
    this.playerFlags.set(playerId, new Set());

    // Return initial game state for this player
    return {
      board: this.getVisibleBoard(),
      rows: this.rows,
      cols: this.cols,
      mineCount: this.mineCount,
      playerFlags: Array.from(this.playerFlags.get(playerId))
    };
  }

  removePlayer(playerId) {
    this.players.delete(playerId);
    this.playerFlags.delete(playerId);
    this.playerCursors.delete(playerId);
  }

  getPlayers() {
    return Array.from(this.players.entries()).map(([id, player]) => ({
      socketId: id,
      playerId: id,
      username: player.username,
      level: player.level,
      ...player
    }));
  }

  getPlayerCount() {
    return this.players.size;
  }

  getVisibleBoard() {
    // Return only revealed cells (hide mine locations)
    return this.board.map(row =>
      row.map(cell => ({
        isRevealed: cell.isRevealed,
        neighborMines: cell.isRevealed ? cell.neighborMines : 0,
        isMine: cell.isRevealed && cell.isMine,
        revealedBy: cell.revealedBy
      }))
    );
  }

  revealCell(playerId, row, col) {
    // Validate bounds
    if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) {
      return { success: false, error: 'Out of bounds' };
    }

    const cell = this.board[row][col];

    // Check if already revealed
    if (cell.isRevealed) {
      return { success: false, error: 'Already revealed' };
    }

    // Check if flagged by this player
    const playerFlagSet = this.playerFlags.get(playerId);
    const cellKey = `${row},${col}`;
    if (playerFlagSet && playerFlagSet.has(cellKey)) {
      return { success: false, error: 'Cell is flagged' };
    }

    // Reveal the cell
    const revealedCells = this.revealCellRecursive(row, col, playerId);

    // Check if mine
    if (cell.isMine) {
      return {
        success: true,
        type: 'mine',
        cells: revealedCells,
        xpChange: -20,
        message: 'You hit a mine!'
      };
    }

    // Safe reveal - award XP based on cells revealed
    const xpGain = revealedCells.length * 2;

    return {
      success: true,
      type: 'safe',
      cells: revealedCells,
      xpChange: xpGain,
      message: `+${xpGain} XP`
    };
  }

  revealCellRecursive(row, col, playerId) {
    const revealedCells = [];
    const visited = new Set();
    const queue = [[row, col]];

    while (queue.length > 0) {
      const [r, c] = queue.shift();
      const key = `${r},${c}`;

      if (visited.has(key)) continue;
      visited.add(key);

      // Check bounds
      if (r < 0 || r >= this.rows || c < 0 || c >= this.cols) continue;

      const cell = this.board[r][c];

      // Skip if already revealed
      if (cell.isRevealed) continue;

      // Reveal the cell
      cell.isRevealed = true;
      cell.revealedBy = playerId;

      revealedCells.push({
        row: r,
        col: c,
        isMine: cell.isMine,
        neighborMines: cell.neighborMines,
        revealedBy: playerId
      });

      // If no neighboring mines, reveal neighbors recursively
      if (cell.neighborMines === 0 && !cell.isMine) {
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue;
            queue.push([r + dr, c + dc]);
          }
        }
      }
    }

    return revealedCells;
  }

  toggleFlag(playerId, row, col) {
    // Validate bounds
    if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) {
      return { success: false, error: 'Out of bounds' };
    }

    const cell = this.board[row][col];

    // Can't flag revealed cells
    if (cell.isRevealed) {
      return { success: false, error: 'Cannot flag revealed cell' };
    }

    const playerFlagSet = this.playerFlags.get(playerId);
    const cellKey = `${row},${col}`;

    if (playerFlagSet.has(cellKey)) {
      playerFlagSet.delete(cellKey);
      return {
        success: true,
        action: 'remove',
        row,
        col
      };
    } else {
      playerFlagSet.add(cellKey);
      return {
        success: true,
        action: 'add',
        row,
        col
      };
    }
  }

  updateCursor(playerId, row, col) {
    this.playerCursors.set(playerId, { row, col });
  }

  getCursors() {
    return Array.from(this.playerCursors.entries()).map(([playerId, pos]) => ({
      playerId,
      username: this.players.get(playerId)?.username,
      ...pos
    }));
  }
}

module.exports = MinesweeperServer;
