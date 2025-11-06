const fs = require('fs');
const path = require('path');

const PLAYER_DATA_FILE = path.join(__dirname, 'data', 'players.json');

class PlayerManager {
  constructor() {
    this.players = new Map(); // socketId -> player data
    this.loadPlayerData();
  }

  loadPlayerData() {
    try {
      if (fs.existsSync(PLAYER_DATA_FILE)) {
        const data = fs.readFileSync(PLAYER_DATA_FILE, 'utf8');
        this.persistentPlayers = JSON.parse(data);
      } else {
        this.persistentPlayers = {};
      }
    } catch (error) {
      console.error('Error loading player data:', error);
      this.persistentPlayers = {};
    }
  }

  savePlayerData() {
    try {
      const dir = path.dirname(PLAYER_DATA_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      fs.writeFileSync(
        PLAYER_DATA_FILE,
        JSON.stringify(this.persistentPlayers, null, 2)
      );
    } catch (error) {
      console.error('Error saving player data:', error);
    }
  }

  loginPlayer(socketId, username) {
    if (!username || username.trim().length === 0) {
      throw new Error('Username is required');
    }

    if (username.length > 20) {
      throw new Error('Username must be 20 characters or less');
    }

    // Load or create persistent player data
    let persistentData = this.persistentPlayers[username];
    if (!persistentData) {
      persistentData = {
        username,
        totalXP: 0,
        level: 1,
        gamesPlayed: {
          minesweeper: 0,
          bomberman: 0
        },
        stats: {
          minesweeper: {
            cellsRevealed: 0,
            minesHit: 0
          },
          bomberman: {
            blocksDestroyed: 0,
            kills: 0,
            deaths: 0
          }
        }
      };
      this.persistentPlayers[username] = persistentData;
      this.savePlayerData();
    }

    // Create session player data
    const player = {
      socketId,
      username: persistentData.username,
      totalXP: persistentData.totalXP,
      level: this.calculateLevel(persistentData.totalXP),
      gamesPlayed: persistentData.gamesPlayed,
      stats: persistentData.stats,
      currentGame: null,
      connectedAt: Date.now()
    };

    this.players.set(socketId, player);
    return player;
  }

  getPlayer(socketId) {
    return this.players.get(socketId);
  }

  getAllPlayers() {
    return Array.from(this.players.values());
  }

  getPlayerCount() {
    return this.players.size;
  }

  calculateLevel(totalXP) {
    return Math.floor(totalXP / 100) + 1;
  }

  addXP(socketId, xp) {
    const player = this.players.get(socketId);
    if (!player) return null;

    player.totalXP = Math.max(0, player.totalXP + xp);
    player.level = this.calculateLevel(player.totalXP);

    // Update persistent data
    if (this.persistentPlayers[player.username]) {
      this.persistentPlayers[player.username].totalXP = player.totalXP;
      this.persistentPlayers[player.username].level = player.level;
      this.savePlayerData();
    }

    return player;
  }

  updateStats(socketId, gameName, statUpdates) {
    const player = this.players.get(socketId);
    if (!player) return;

    if (!player.stats[gameName]) {
      player.stats[gameName] = {};
    }

    Object.keys(statUpdates).forEach(key => {
      if (!player.stats[gameName][key]) {
        player.stats[gameName][key] = 0;
      }
      player.stats[gameName][key] += statUpdates[key];
    });

    // Update persistent data
    if (this.persistentPlayers[player.username]) {
      this.persistentPlayers[player.username].stats = player.stats;
      this.savePlayerData();
    }
  }

  disconnectPlayer(socketId) {
    const player = this.players.get(socketId);
    if (player) {
      console.log(`Player ${player.username} disconnected`);
      this.players.delete(socketId);
    }
  }
}

module.exports = PlayerManager;
