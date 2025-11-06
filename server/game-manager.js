const MinesweeperServer = require('./games/minesweeper-server');
const BombermanServer = require('./games/bomberman-server');

class GameManager {
  constructor() {
    this.games = new Map();
    
    // Initialize game instances
    this.games.set('minesweeper', new MinesweeperServer());
    this.games.set('bomberman', new BombermanServer());
  }

  joinGame(gameName, playerId, player) {
    const game = this.games.get(gameName);
    if (!game) {
      throw new Error(`Game ${gameName} not found`);
    }

    return game.addPlayer(playerId, player);
  }

  leaveGame(gameName, playerId) {
    const game = this.games.get(gameName);
    if (game) {
      game.removePlayer(playerId);
    }
  }

  getPlayersInGame(gameName) {
    const game = this.games.get(gameName);
    return game ? game.getPlayers() : [];
  }

  getPlayerCountInGame(gameName) {
    const game = this.games.get(gameName);
    return game ? game.getPlayerCount() : 0;
  }

  // Minesweeper methods
  handleMinesweeperReveal(gameName, playerId, row, col) {
    const game = this.games.get(gameName);
    if (!game || !(game instanceof MinesweeperServer)) {
      return { success: false, error: 'Invalid game' };
    }

    return game.revealCell(playerId, row, col);
  }

  handleMinesweeperFlag(gameName, playerId, row, col) {
    const game = this.games.get(gameName);
    if (!game || !(game instanceof MinesweeperServer)) {
      return { success: false, error: 'Invalid game' };
    }

    return game.toggleFlag(playerId, row, col);
  }

  // Bomberman methods
  handleBombermanMove(gameName, playerId, x, y, direction) {
    const game = this.games.get(gameName);
    if (!game || !(game instanceof BombermanServer)) {
      return { success: false, error: 'Invalid game' };
    }

    return game.movePlayer(playerId, x, y, direction);
  }

  handleBombermanPlaceBomb(gameName, playerId, x, y) {
    const game = this.games.get(gameName);
    if (!game || !(game instanceof BombermanServer)) {
      return { success: false, error: 'Invalid game' };
    }

    return game.placeBomb(playerId, x, y);
  }

  handleBombermanExplosion(gameName, bombId) {
    const game = this.games.get(gameName);
    if (!game || !(game instanceof BombermanServer)) {
      return { success: false, error: 'Invalid game' };
    }

    return game.explodeBomb(bombId);
  }

  handleBombermanPickupPowerup(gameName, playerId, powerupId) {
    const game = this.games.get(gameName);
    if (!game || !(game instanceof BombermanServer)) {
      return { success: false, error: 'Invalid game' };
    }

    return game.pickupPowerup(playerId, powerupId);
  }
}

module.exports = GameManager;
