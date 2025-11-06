const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const GameManager = require('./game-manager');
const PlayerManager = require('./player-manager');
const ChatManager = require('./chat-manager');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;

// Initialize managers
const gameManager = new GameManager();
const playerManager = new PlayerManager();
const chatManager = new ChatManager();

// XP per second timers for Bomberman players
const bombermanXPTimers = new Map(); // socketId -> intervalId

// Helper functions for Bomberman XP per second
function startBombermanXPTimer(socketId) {
  // Stop existing timer if any
  stopBombermanXPTimer(socketId);

  const intervalId = setInterval(() => {
    const socket = io.sockets.sockets.get(socketId);
    if (!socket || socket.currentGame !== 'bomberman') {
      stopBombermanXPTimer(socketId);
      return;
    }

    const player = playerManager.getPlayer(socketId);
    if (!player) {
      stopBombermanXPTimer(socketId);
      return;
    }

    // Get player game state to check HP
    // Use game manager's internal access (we'll need to expose a method)
    try {
      const gamePlayers = gameManager.getPlayersInGame('bomberman');
      const gamePlayer = gamePlayers.find(p => p.socketId === socketId || p.playerId === socketId);
      if (gamePlayer && gamePlayer.hp > 0) {
        // Award +1 XP per second while alive
        const updatedPlayer = playerManager.addXP(socketId, 1);
        socket.emit('player:update', updatedPlayer);
      }
    } catch (error) {
      // Game might not exist, stop timer
      stopBombermanXPTimer(socketId);
    }
  }, 1000); // Every second

  bombermanXPTimers.set(socketId, intervalId);
}

function stopBombermanXPTimer(socketId) {
  const intervalId = bombermanXPTimers.get(socketId);
  if (intervalId) {
    clearInterval(intervalId);
    bombermanXPTimers.delete(socketId);
  }
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    players: playerManager.getPlayerCount(),
    games: {
      minesweeper: gameManager.getPlayerCountInGame('minesweeper'),
      bomberman: gameManager.getPlayerCountInGame('bomberman')
    }
  });
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log(`Player connected: ${socket.id}`);

  // Player login/registration
  socket.on('player:login', (username, callback) => {
    try {
      const player = playerManager.loginPlayer(socket.id, username);
      socket.username = username;
      socket.playerId = socket.id;
      
      callback({ success: true, player });
      console.log(`Player logged in: ${username} (${socket.id})`);
    } catch (error) {
      callback({ success: false, error: error.message });
    }
  });

  // Join game room
  socket.on('game:join', (gameName, callback) => {
    try {
      if (!socket.username) {
        callback({ success: false, error: 'Must login first' });
        return;
      }

      const player = playerManager.getPlayer(socket.id);
      socket.join(gameName);
      
      const gameState = gameManager.joinGame(gameName, socket.id, player);
      socket.currentGame = gameName;

      // Start XP per second timer for Bomberman players
      if (gameName === 'bomberman') {
        startBombermanXPTimer(socket.id);
      }

      callback({ success: true, gameState });
      
      // Broadcast updated player list to room
      const players = gameManager.getPlayersInGame(gameName);
      io.to(gameName).emit('game:players', players);
      
      console.log(`${socket.username} joined ${gameName}`);
    } catch (error) {
      callback({ success: false, error: error.message });
    }
  });

  // Leave game room
  socket.on('game:leave', () => {
    if (socket.currentGame) {
      // Stop XP timer if leaving Bomberman
      if (socket.currentGame === 'bomberman') {
        stopBombermanXPTimer(socket.id);
      }

      gameManager.leaveGame(socket.currentGame, socket.id);
      socket.leave(socket.currentGame);
      
      // Broadcast updated player list
      const players = gameManager.getPlayersInGame(socket.currentGame);
      io.to(socket.currentGame).emit('game:players', players);
      
      socket.currentGame = null;
    }
  });

  // Minesweeper actions
  socket.on('minesweeper:reveal', (data, callback) => {
    try {
      const result = gameManager.handleMinesweeperReveal(
        socket.currentGame,
        socket.id,
        data.row,
        data.col
      );
      
      if (result.success) {
        // Update player XP
        if (result.xpChange) {
          const player = playerManager.addXP(socket.id, result.xpChange);
          socket.emit('player:update', player);
        }
        
        // Broadcast board update to all players in room
        io.to(socket.currentGame).emit('minesweeper:update', {
          cells: result.cells,
          action: {
            playerId: socket.id,
            username: socket.username,
            row: data.row,
            col: data.col,
            type: result.type
          }
        });
      }
      
      callback(result);
    } catch (error) {
      callback({ success: false, error: error.message });
    }
  });

  socket.on('minesweeper:flag', (data, callback) => {
    try {
      const result = gameManager.handleMinesweeperFlag(
        socket.currentGame,
        socket.id,
        data.row,
        data.col
      );
      
      if (result.success) {
        // Broadcast flag update (only visible to the player who placed it)
        socket.emit('minesweeper:flag_update', result);
      }
      
      callback(result);
    } catch (error) {
      callback({ success: false, error: error.message });
    }
  });

  // Bomberman actions
  socket.on('bomberman:move', (data) => {
    try {
      const result = gameManager.handleBombermanMove(
        socket.currentGame,
        socket.id,
        data.x,
        data.y,
        data.direction
      );
      
      if (result.success) {
        // Broadcast player position to all players
        io.to(socket.currentGame).emit('bomberman:player_move', {
          playerId: socket.id,
          x: data.x,
          y: data.y,
          direction: data.direction
        });

        // Handle automatic powerup pickup
        if (result.powerupPicked) {
          const pickupResult = gameManager.handleBombermanPickupPowerup(
            socket.currentGame,
            socket.id,
            result.powerupPicked
          );

          if (pickupResult.success) {
            // Broadcast powerup pickup
            io.to(socket.currentGame).emit('bomberman:powerup_picked', {
              powerupId: result.powerupPicked,
              playerId: socket.id,
              playerState: {
                speed: pickupResult.playerState.speed,
                maxBombs: pickupResult.playerState.maxBombs,
                explosionRange: pickupResult.playerState.explosionRange
              }
            });

            // Update player stats on client
            const player = playerManager.getPlayer(socket.id);
            socket.emit('bomberman:player_stats', {
              speed: pickupResult.playerState.speed,
              maxBombs: pickupResult.playerState.maxBombs,
              explosionRange: pickupResult.playerState.explosionRange,
              hp: player ? player.hp : 3
            });
          }
        }
      }
    } catch (error) {
      console.error('Bomberman move error:', error);
    }
  });

  socket.on('bomberman:place_bomb', (data, callback) => {
    try {
      const result = gameManager.handleBombermanPlaceBomb(
        socket.currentGame,
        socket.id,
        data.x,
        data.y
      );
      
      if (result.success) {
        // Broadcast bomb placement
        io.to(socket.currentGame).emit('bomberman:bomb_placed', {
          bombId: result.bombId,
          x: data.x,
          y: data.y,
          playerId: socket.id,
          explosionRange: result.explosionRange
        });
        
        // Schedule explosion
        setTimeout(() => {
          const explosionResult = gameManager.handleBombermanExplosion(
            socket.currentGame,
            result.bombId
          );
          
          if (explosionResult.success) {
            // Award XP for blocks destroyed
            if (explosionResult.blocksDestroyed > 0) {
              const xp = explosionResult.blocksDestroyed * 5;
              const player = playerManager.addXP(socket.id, xp);
              socket.emit('player:update', player);
            }
            
            // Handle player damage
            explosionResult.damagedPlayers.forEach(damagedPlayerId => {
              const damagedSocket = io.sockets.sockets.get(damagedPlayerId);
              if (damagedSocket) {
                const player = playerManager.getPlayer(damagedPlayerId);
                
                // Check if player died
                if (explosionResult.playerDeaths.includes(damagedPlayerId)) {
                  // Death penalty
                  playerManager.addXP(damagedPlayerId, -30);
                  
                  // Award kill XP to bomb placer
                  if (socket.id !== damagedPlayerId) {
                    const killerPlayer = playerManager.addXP(socket.id, 50);
                    socket.emit('player:update', killerPlayer);
                  }

                  // Broadcast respawn position - get from game players list
                  const gamePlayers = gameManager.getPlayersInGame('bomberman');
                  const gamePlayer = gamePlayers.find(p => 
                    (p.socketId === damagedPlayerId || p.playerId === damagedPlayerId)
                  );
                  if (gamePlayer) {
                    io.to(socket.currentGame).emit('bomberman:player_move', {
                      playerId: damagedPlayerId,
                      x: gamePlayer.x,
                      y: gamePlayer.y,
                      direction: gamePlayer.direction,
                      hp: gamePlayer.hp
                    });
                  }
                }
                
                damagedSocket.emit('player:update', playerManager.getPlayer(damagedPlayerId));
              }
            });
            
            // Broadcast explosion
            io.to(socket.currentGame).emit('bomberman:explosion', {
              bombId: result.bombId,
              cells: explosionResult.cells,
              powerUps: explosionResult.powerUps,
              damagedPlayers: explosionResult.damagedPlayers,
              playerDeaths: explosionResult.playerDeaths
            });
          }
        }, 3000); // 3 second bomb timer
      }
      
      callback(result);
    } catch (error) {
      callback({ success: false, error: error.message });
    }
  });

  socket.on('bomberman:pickup_powerup', (data, callback) => {
    try {
      const result = gameManager.handleBombermanPickupPowerup(
        socket.currentGame,
        socket.id,
        data.powerupId
      );
      
      if (result.success) {
        // Broadcast powerup pickup
        io.to(socket.currentGame).emit('bomberman:powerup_picked', {
          powerupId: data.powerupId,
          playerId: socket.id
        });
      }
      
      callback(result);
    } catch (error) {
      callback({ success: false, error: error.message });
    }
  });

  // Chat messages
  socket.on('chat:message', (message) => {
    if (!socket.username || !socket.currentGame) return;
    
    const chatMessage = chatManager.addMessage(
      socket.currentGame,
      socket.id,
      socket.username,
      message,
      playerManager.getPlayer(socket.id)
    );
    
    // Broadcast to room
    io.to(socket.currentGame).emit('chat:message', chatMessage);
  });

  // Disconnect handling
  socket.on('disconnect', () => {
    console.log(`Player disconnected: ${socket.id}`);
    
    // Stop XP timer
    stopBombermanXPTimer(socket.id);
    
    if (socket.currentGame) {
      gameManager.leaveGame(socket.currentGame, socket.id);
      
      // Broadcast updated player list
      const players = gameManager.getPlayersInGame(socket.currentGame);
      io.to(socket.currentGame).emit('game:players', players);
    }
    
    playerManager.disconnectPlayer(socket.id);
  });
});

httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🎮 MMO Gaming Platform ready!`);
});
