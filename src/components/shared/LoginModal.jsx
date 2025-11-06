import React, { useState } from 'react';
import '../../styles/LoginModal.css';

const LoginModal = ({ onLogin, error }) => {
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim()) return;

    setIsLoading(true);
    try {
      await onLogin(username);
    } catch (err) {
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-modal-overlay">
      <div className="login-modal">
        <h1 className="login-title">🎮 MMO Gaming Platform</h1>
        <p className="login-subtitle">Enter your username to start playing!</p>

        <form onSubmit={handleSubmit} className="login-form">
          <input
            type="text"
            className="login-input"
            placeholder="Enter username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            maxLength={20}
            disabled={isLoading}
            autoFocus
          />

          {error && <div className="login-error">{error}</div>}

          <button
            type="submit"
            className="login-btn"
            disabled={!username.trim() || isLoading}
          >
            {isLoading ? 'Connecting...' : 'Join Game'}
          </button>
        </form>

        <div className="login-features">
          <h3>Features:</h3>
          <ul>
            <li>🎯 Multiplayer Minesweeper - One big map, everyone plays together!</li>
            <li>💣 Bomberman - Real-time action with up to 50 players!</li>
            <li>📊 Level up and earn XP as you play</li>
            <li>💬 Chat with other players</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;
