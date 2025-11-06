import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../contexts/SocketContext';
import { usePlayer } from '../contexts/PlayerContext';
import Chat from '../components/shared/Chat';
import PlayerList from '../components/shared/PlayerList';
import PlayerStats from '../components/shared/PlayerStats';
import '../styles/BombermanGame.css';

const BombermanGame = () => {
  const navigate = useNavigate();
  const { socket } = useSocket();
  const { player, leaveGame } = usePlayer();
  const [gameState, setGameState] = useState(null);
  const [map, setMap] = useState([]);
  const [players, setPlayers] = useState({});
  const [bombs, setBombs] = useState({});
  const [powerups, setPowerups] = useState({});
  const [myPlayer, setMyPlayer] = useState(null);
  const [chatVisible, setChatVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [keys, setKeys] = useState({});
  const canvasRef = useRef(null);

  const TILE_SIZE = 32;
  const VIEWPORT_WIDTH = 20;
  const VIEWPORT_HEIGHT = 15;

  useEffect(() => {
    if (!socket || !player) {
      navigate('/');
      return;
    }

    const joinBomberman = async () => {
      try {
        const response = await new Promise((resolve, reject) => {
          socket.emit('game:join', 'bomberman', (res) => {
            if (res.success) resolve(res);
            else reject(new Error(res.error));
          });
        });

        setGameState(response.gameState);
        setMap(response.gameState.map.tiles);
        setMyPlayer(response.gameState.playerState);
        
        const playerMap = {};
        response.gameState.players.forEach(p => {
          playerMap[p.playerId] = p;
        });
        setPlayers(playerMap);
        
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    joinBomberman();

    // Listen for game events
    socket.on('bomberman:player_move', (data) => {
      setPlayers((prev) => ({
        ...prev,
        [data.playerId]: {
          ...prev[data.playerId],
          x: data.x,
          y: data.y,
          direction: data.direction
        }
      }));
    });

    socket.on('bomberman:bomb_placed', (data) => {
      setBombs((prev) => ({
        ...prev,
        [data.bombId]: data
      }));
    });

    socket.on('bomberman:explosion', (data) => {
      // Remove bomb
      setBombs((prev) => {
        const newBombs = { ...prev };
        delete newBombs[data.bombId];
        return newBombs;
      });

      // Update map
      data.cells.forEach(({ x, y }) => {
        setMap((prevMap) => {
          const newMap = [...prevMap];
          if (newMap[y] && newMap[y][x]) {
            newMap[y][x] = { ...newMap[y][x], type: 'empty' };
          }
          return newMap;
        });
      });

      // Add powerups
      if (data.powerUps) {
        data.powerUps.forEach(powerup => {
          setPowerups((prev) => ({
            ...prev,
            [powerup.id]: powerup
          }));
        });
      }

      // Handle player deaths
      if (data.playerDeaths && data.playerDeaths.includes(socket.id)) {
        // Respawned by server
      }
    });

    socket.on('bomberman:powerup_picked', (data) => {
      setPowerups((prev) => {
        const newPowerups = { ...prev };
        delete newPowerups[data.powerupId];
        return newPowerups;
      });
    });

    return () => {
      socket.off('bomberman:player_move');
      socket.off('bomberman:bomb_placed');
      socket.off('bomberman:explosion');
      socket.off('bomberman:powerup_picked');
      leaveGame();
    };
  }, [socket, player, navigate, leaveGame]);

  // Movement and controls
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'c' || e.key === 'C') {
        setChatVisible((prev) => !prev);
        return;
      }

      setKeys((prev) => ({ ...prev, [e.key.toLowerCase()]: true }));
    };

    const handleKeyUp = (e) => {
      setKeys((prev) => ({ ...prev, [e.key.toLowerCase()]: false }));
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Game loop for movement
  useEffect(() => {
    if (!socket || !myPlayer) return;

    const gameLoop = setInterval(() => {
      let newX = myPlayer.x;
      let newY = myPlayer.y;
      let direction = myPlayer.direction;
      let moved = false;

      if (keys['w'] || keys['arrowup']) {
        newY -= 1;
        direction = 'up';
        moved = true;
      }
      if (keys['s'] || keys['arrowdown']) {
        newY += 1;
        direction = 'down';
        moved = true;
      }
      if (keys['a'] || keys['arrowleft']) {
        newX -= 1;
        direction = 'left';
        moved = true;
      }
      if (keys['d'] || keys['arrowright']) {
        newX += 1;
        direction = 'right';
        moved = true;
      }

      if (moved) {
        // Check collision
        if (map[newY] && map[newY][newX] && map[newY][newX].type === 'empty') {
          setMyPlayer((prev) => ({ ...prev, x: newX, y: newY, direction }));
          socket.emit('bomberman:move', { x: newX, y: newY, direction });
        }
      }

      // Place bomb
      if (keys[' '] || keys['space']) {
        socket.emit('bomberman:place_bomb', { x: myPlayer.x, y: myPlayer.y }, (response) => {
          if (!response.success) {
            console.log('Cannot place bomb:', response.error);
          }
        });
        setKeys((prev) => ({ ...prev, ' ': false, 'space': false }));
      }
    }, 100);

    return () => clearInterval(gameLoop);
  }, [socket, myPlayer, keys, map]);

  // Render game
  useEffect(() => {
    if (!canvasRef.current || !myPlayer || !map.length) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // Clear canvas
    ctx.fillStyle = '#2d5016';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Calculate camera offset (center on player)
    const cameraX = myPlayer.x - Math.floor(VIEWPORT_WIDTH / 2);
    const cameraY = myPlayer.y - Math.floor(VIEWPORT_HEIGHT / 2);

    // Render map
    for (let y = 0; y < VIEWPORT_HEIGHT; y++) {
      for (let x = 0; x < VIEWPORT_WIDTH; x++) {
        const mapX = cameraX + x;
        const mapY = cameraY + y;

        if (mapY >= 0 && mapY < map.length && mapX >= 0 && mapX < map[0].length) {
          const tile = map[mapY][mapX];
          
          if (tile.type === 'indestructible') {
            ctx.fillStyle = '#333';
            ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
          } else if (tile.type === 'destructible') {
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
          } else {
            ctx.fillStyle = tile.isPvpZone ? '#4a7c2f' : '#7cb342';
            ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
          }

          // Grid lines
          ctx.strokeStyle = 'rgba(0,0,0,0.1)';
          ctx.strokeRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        }
      }
    }

    // Render powerups
    Object.values(powerups).forEach(powerup => {
      const screenX = (powerup.x - cameraX) * TILE_SIZE;
      const screenY = (powerup.y - cameraY) * TILE_SIZE;

      if (screenX >= 0 && screenX < canvas.width && screenY >= 0 && screenY < canvas.height) {
        const emoji = powerup.type === 'speed' ? '⚡' : powerup.type === 'bomb' ? '💣' : '💥';
        ctx.font = '24px Arial';
        ctx.fillText(emoji, screenX + 4, screenY + 24);
      }
    });

    // Render bombs
    Object.values(bombs).forEach(bomb => {
      const screenX = (bomb.x - cameraX) * TILE_SIZE;
      const screenY = (bomb.y - cameraY) * TILE_SIZE;

      if (screenX >= 0 && screenX < canvas.width && screenY >= 0 && screenY < canvas.height) {
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(screenX + TILE_SIZE/2, screenY + TILE_SIZE/2, TILE_SIZE/3, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // Render players
    Object.values(players).forEach(p => {
      const screenX = (p.x - cameraX) * TILE_SIZE;
      const screenY = (p.y - cameraY) * TILE_SIZE;

      if (screenX >= 0 && screenX < canvas.width && screenY >= 0 && screenY < canvas.height) {
        // Player body
        ctx.fillStyle = p.playerId === socket.id ? '#4CAF50' : '#F44336';
        ctx.fillRect(screenX + 6, screenY + 6, TILE_SIZE - 12, TILE_SIZE - 12);

        // Player name
        ctx.fillStyle = '#FFF';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(p.username, screenX + TILE_SIZE/2, screenY - 2);

        // HP hearts
        let heartsText = '❤️'.repeat(p.hp);
        ctx.font = '8px Arial';
        ctx.fillText(heartsText, screenX + TILE_SIZE/2, screenY + TILE_SIZE + 10);
      }
    });

  }, [myPlayer, map, players, bombs, powerups]);

  const handleBackToMenu = () => {
    leaveGame();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="game-loading">
        <h2>Loading Bomberman...</h2>
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
    <div className="bomberman-game">
      <PlayerStats />
      <PlayerList />

      <div className="game-header">
        <button className="back-btn" onClick={handleBackToMenu}>
          ← Back to Menu
        </button>
        <h1>💥 Bomberman Battle</h1>
        <div className="player-game-stats">
          <span>HP: {'❤️'.repeat(myPlayer?.hp || 0)}</span>
          <span>Bombs: {myPlayer?.maxBombs}</span>
          <span>Range: {myPlayer?.explosionRange}</span>
        </div>
      </div>

      <div className="game-canvas-container">
        <canvas
          ref={canvasRef}
          width={VIEWPORT_WIDTH * TILE_SIZE}
          height={VIEWPORT_HEIGHT * TILE_SIZE}
          className="game-canvas"
        />
      </div>

      <div className="game-instructions">
        <p>🎮 WASD or Arrow Keys to move | <kbd>Space</kbd> to place bomb</p>
        <p>Press <kbd>C</kbd> to toggle chat | 💚 = Safe Zone | ❤️ = PvP Zone</p>
      </div>

      <Chat visible={chatVisible} onToggle={() => setChatVisible(!chatVisible)} />
    </div>
  );
};

export default BombermanGame;
