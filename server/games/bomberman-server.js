class BombermanServer {
  constructor() {
    this.mapWidth = 100;
    this.mapHeight = 100;
    this.tileSize = 32; // pixels
    
    this.map = this.generateMap();
    this.players = new Map(); // playerId -> player state
    this.bombs = new Map(); // bombId -> bomb data
    this.powerups = new Map(); // powerupId -> powerup data
    
    this.bombIdCounter = 0;
    this.powerupIdCounter = 0;
  }

  generateMap() {
    const map = Array(this.mapHeight).fill(null).map(() =>
      Array(this.mapWidth).fill(null).map(() => ({
        type: 'empty', // 'empty', 'indestructible', 'destructible'
        isPvpZone: true
      }))
    );

    // Add indestructible blocks in a grid pattern
    for (let row = 0; row < this.mapHeight; row++) {
      for (let col = 0; col < this.mapWidth; col++) {
        if (row % 2 === 1 && col % 2 === 1) {
          map[row][col].type = 'indestructible';
        }
      }
    }

    // Add destructible blocks randomly (40% of empty cells)
    for (let row = 0; row < this.mapHeight; row++) {
      for (let col = 0; col < this.mapWidth; col++) {
        if (map[row][col].type === 'empty' && Math.random() < 0.4) {
          map[row][col].type = 'destructible';
        }
      }
    }

    // Create safe zones (25% of map, top-left corner area)
    const safeZoneWidth = Math.floor(this.mapWidth * 0.25);
    const safeZoneHeight = Math.floor(this.mapHeight * 0.25);
    
    for (let row = 0; row < safeZoneHeight; row++) {
      for (let col = 0; col < safeZoneWidth; col++) {
        map[row][col].isPvpZone = false;
        // Clear some space in safe zone
        if (map[row][col].type === 'destructible') {
          map[row][col].type = 'empty';
        }
      }
    }

    // Clear starting positions
    const startPositions = [
      [1, 1], [1, this.mapWidth - 2],
      [this.mapHeight - 2, 1], [this.mapHeight - 2, this.mapWidth - 2]
    ];
    
    startPositions.forEach(([row, col]) => {
      map[row][col].type = 'empty';
      // Clear around starting positions
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const r = row + dr;
          const c = col + dc;
          if (r >= 0 && r < this.mapHeight && c >= 0 && c < this.mapWidth) {
            if (map[r][c].type === 'destructible') {
              map[r][c].type = 'empty';
            }
          }
        }
      }
    });

    return map;
  }

  addPlayer(playerId, player) {
    // Find a spawn position
    const spawnPos = this.findSpawnPosition();
    
    this.players.set(playerId, {
      ...player,
      x: spawnPos.x,
      y: spawnPos.y,
      hp: 3,
      maxHp: 3,
      speed: 1,
      bombCount: 1,
      maxBombs: 1,
      explosionRange: 2,
      direction: 'down',
      activeBombs: 0,
      joinedAt: Date.now()
    });

    return {
      map: this.getMapData(),
      players: this.getPlayersData(),
      playerState: this.players.get(playerId),
      mapWidth: this.mapWidth,
      mapHeight: this.mapHeight,
      tileSize: this.tileSize
    };
  }

  findSpawnPosition() {
    // Try to find an empty spot
    for (let attempts = 0; attempts < 100; attempts++) {
      const x = Math.floor(Math.random() * this.mapWidth);
      const y = Math.floor(Math.random() * this.mapHeight);
      
      if (this.map[y][x].type === 'empty' && !this.isPositionOccupied(x, y)) {
        return { x, y };
      }
    }
    
    // Fallback to corner
    return { x: 1, y: 1 };
  }

  isPositionOccupied(x, y) {
    for (const player of this.players.values()) {
      if (player.x === x && player.y === y) {
        return true;
      }
    }
    return false;
  }

  removePlayer(playerId) {
    this.players.delete(playerId);
  }

  getPlayers() {
    return Array.from(this.players.values());
  }

  getPlayerCount() {
    return this.players.size;
  }

  getPlayersData() {
    return Array.from(this.players.entries()).map(([id, player]) => ({
      playerId: id,
      username: player.username,
      level: player.level,
      x: player.x,
      y: player.y,
      hp: player.hp,
      maxHp: player.maxHp,
      direction: player.direction
    }));
  }

  getMapData() {
    // Return only necessary map data
    return {
      width: this.mapWidth,
      height: this.mapHeight,
      tiles: this.map.map(row =>
        row.map(cell => ({
          type: cell.type,
          isPvpZone: cell.isPvpZone
        }))
      )
    };
  }

  movePlayer(playerId, x, y, direction) {
    const player = this.players.get(playerId);
    if (!player) {
      return { success: false, error: 'Player not found' };
    }

    // Validate position (check collision)
    if (x < 0 || x >= this.mapWidth || y < 0 || y >= this.mapHeight) {
      return { success: false, error: 'Out of bounds' };
    }

    if (this.map[y][x].type !== 'empty') {
      return { success: false, error: 'Collision' };
    }

    player.x = x;
    player.y = y;
    player.direction = direction;

    return { success: true };
  }

  placeBomb(playerId, x, y) {
    const player = this.players.get(playerId);
    if (!player) {
      return { success: false, error: 'Player not found' };
    }

    // Check if player can place more bombs
    if (player.activeBombs >= player.maxBombs) {
      return { success: false, error: 'Max bombs reached' };
    }

    // Check if there's already a bomb at this position
    for (const bomb of this.bombs.values()) {
      if (bomb.x === x && bomb.y === y) {
        return { success: false, error: 'Bomb already exists here' };
      }
    }

    const bombId = `bomb_${this.bombIdCounter++}`;
    
    this.bombs.set(bombId, {
      id: bombId,
      x,
      y,
      playerId,
      explosionRange: player.explosionRange,
      placedAt: Date.now()
    });

    player.activeBombs++;

    return {
      success: true,
      bombId,
      explosionRange: player.explosionRange
    };
  }

  explodeBomb(bombId) {
    const bomb = this.bombs.get(bombId);
    if (!bomb) {
      return { success: false, error: 'Bomb not found' };
    }

    const player = this.players.get(bomb.playerId);
    if (player) {
      player.activeBombs = Math.max(0, player.activeBombs - 1);
    }

    // Calculate explosion cells
    const explosionCells = this.calculateExplosion(bomb.x, bomb.y, bomb.explosionRange);
    
    // Destroy blocks and spawn powerups
    const destroyedBlocks = [];
    const newPowerups = [];
    
    explosionCells.forEach(({ x, y }) => {
      const cell = this.map[y][x];
      if (cell.type === 'destructible') {
        cell.type = 'empty';
        destroyedBlocks.push({ x, y });
        
        // 20% chance to spawn powerup
        if (Math.random() < 0.2) {
          const powerup = this.spawnPowerup(x, y);
          newPowerups.push(powerup);
        }
      }
    });

    // Check for player damage
    const damagedPlayers = [];
    const playerDeaths = [];
    
    for (const [pId, p] of this.players.entries()) {
      for (const { x, y } of explosionCells) {
        if (p.x === x && p.y === y) {
          // Check if in PvP zone
          if (this.map[y][x].isPvpZone) {
            p.hp--;
            damagedPlayers.push(pId);
            
            if (p.hp <= 0) {
              // Respawn player
              const spawnPos = this.findSpawnPosition();
              p.x = spawnPos.x;
              p.y = spawnPos.y;
              p.hp = p.maxHp;
              playerDeaths.push(pId);
            }
          }
          break;
        }
      }
    }

    this.bombs.delete(bombId);

    return {
      success: true,
      cells: explosionCells,
      powerUps: newPowerups,
      blocksDestroyed: destroyedBlocks.length,
      damagedPlayers,
      playerDeaths
    };
  }

  calculateExplosion(x, y, range) {
    const cells = [{ x, y }];
    
    // Explosion in 4 directions
    const directions = [[0, 1], [0, -1], [1, 0], [-1, 0]];
    
    directions.forEach(([dx, dy]) => {
      for (let i = 1; i <= range; i++) {
        const newX = x + dx * i;
        const newY = y + dy * i;
        
        if (newX < 0 || newX >= this.mapWidth || newY < 0 || newY >= this.mapHeight) {
          break;
        }
        
        const cell = this.map[newY][newX];
        cells.push({ x: newX, y: newY });
        
        // Stop at indestructible blocks
        if (cell.type === 'indestructible') {
          break;
        }
        
        // Stop after destructible blocks (but include them)
        if (cell.type === 'destructible') {
          break;
        }
      }
    });
    
    return cells;
  }

  spawnPowerup(x, y) {
    const types = ['speed', 'bomb', 'range'];
    const type = types[Math.floor(Math.random() * types.length)];
    
    const powerupId = `powerup_${this.powerupIdCounter++}`;
    
    const powerup = {
      id: powerupId,
      x,
      y,
      type,
      spawnedAt: Date.now()
    };
    
    this.powerups.set(powerupId, powerup);
    return powerup;
  }

  pickupPowerup(playerId, powerupId) {
    const powerup = this.powerups.get(powerupId);
    if (!powerup) {
      return { success: false, error: 'Powerup not found' };
    }

    const player = this.players.get(playerId);
    if (!player) {
      return { success: false, error: 'Player not found' };
    }

    // Check if player is at powerup position
    if (player.x !== powerup.x || player.y !== powerup.y) {
      return { success: false, error: 'Not at powerup position' };
    }

    // Apply powerup effect
    switch (powerup.type) {
      case 'speed':
        player.speed = Math.min(player.speed + 0.2, 2);
        break;
      case 'bomb':
        player.maxBombs = Math.min(player.maxBombs + 1, 5);
        break;
      case 'range':
        player.explosionRange = Math.min(player.explosionRange + 1, 6);
        break;
    }

    this.powerups.delete(powerupId);

    return {
      success: true,
      powerup,
      playerState: {
        speed: player.speed,
        maxBombs: player.maxBombs,
        explosionRange: player.explosionRange
      }
    };
  }
}

module.exports = BombermanServer;
