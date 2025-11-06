import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { SocketProvider } from './contexts/SocketContext';
import { PlayerProvider, usePlayer } from './contexts/PlayerContext';
import { useSocket } from './contexts/SocketContext';
import LoginModal from './components/shared/LoginModal';
import Home from './pages/Home';
import MinesweeperGame from './pages/MinesweeperGame';
import BombermanGame from './pages/BombermanGame';
import './styles/App.css';

function AppContent() {
  const { connected, connect } = useSocket();
  const { isLoggedIn, login } = usePlayer();
  const [loginError, setLoginError] = useState(null);

  useEffect(() => {
    if (!connected) {
      connect();
    }
  }, [connected, connect]);

  const handleLogin = async (username) => {
    try {
      setLoginError(null);
      await login(username);
    } catch (error) {
      setLoginError(error.message);
      throw error;
    }
  };

  if (!connected) {
    return (
      <div className="app-loading">
        <h2>Connecting to server...</h2>
        <p>Please make sure the server is running on port 3001</p>
      </div>
    );
  }

  if (!isLoggedIn) {
    return <LoginModal onLogin={handleLogin} error={loginError} />;
  }

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/minesweeper" element={<MinesweeperGame />} />
      <Route path="/bomberman" element={<BombermanGame />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <SocketProvider>
        <PlayerProvider>
          <AppContent />
        </PlayerProvider>
      </SocketProvider>
    </Router>
  );
}

export default App;


