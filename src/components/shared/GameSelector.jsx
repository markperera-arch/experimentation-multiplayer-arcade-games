import React from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlayer } from '../../contexts/PlayerContext';
import '../../styles/GameSelector.css';

const GameSelector = () => {
  const navigate = useNavigate();
  const { player, logout } = usePlayer();

  const games = [
    {
      id: 'minesweeper',
      name: 'Minesweeper MMO',
      emoji: '💣',
      description: 'A massive shared minesweeper board where everyone plays together. First to click gets the XP!',
      players: 'Up to 50 players',
      color: '#4CAF50'
    },
    {
      id: 'bomberman',
      name: 'Bomberman Battle',
      emoji: '💥',
      description: 'Real-time multiplayer bomberman with PvP zones, power-ups, and epic explosions!',
      players: 'Up to 50 players',
      color: '#ff5722'
    }
  ];

  const handleGameSelect = (gameId) => {
    navigate(`/${gameId}`);
  };

  return (
    <div className="game-selector-container">
      <div className="game-selector-header">
        <h1>🎮 Choose Your Game</h1>
        <div className="player-welcome">
          <span>Welcome, {player?.username}!</span>
          <button className="logout-btn" onClick={logout}>
            Logout
          </button>
        </div>
      </div>

      <div className="games-grid">
        {games.map((game) => (
          <div
            key={game.id}
            className="game-card"
            style={{ borderColor: game.color }}
            onClick={() => handleGameSelect(game.id)}
          >
            <div className="game-emoji">{game.emoji}</div>
            <h2 className="game-name">{game.name}</h2>
            <p className="game-description">{game.description}</p>
            <div className="game-players">{game.players}</div>
            <button
              className="play-btn"
              style={{ backgroundColor: game.color }}
            >
              Play Now
            </button>
          </div>
        ))}
      </div>

      <div className="coming-soon">
        <h3>🚀 More games coming soon!</h3>
        <p>Snake, Tetris Battle, and more...</p>
      </div>
    </div>
  );
};

export default GameSelector;
