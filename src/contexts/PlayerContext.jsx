import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSocket } from './SocketContext';

const PlayerContext = createContext(null);

export const usePlayer = () => {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error('usePlayer must be used within PlayerProvider');
  }
  return context;
};

export const PlayerProvider = ({ children }) => {
  const { socket, connected } = useSocket();
  const [player, setPlayer] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentGame, setCurrentGame] = useState(null);

  useEffect(() => {
    if (!socket) return;

    socket.on('player:update', (updatedPlayer) => {
      setPlayer(updatedPlayer);
    });

    return () => {
      socket.off('player:update');
    };
  }, [socket]);

  const login = (username) => {
    return new Promise((resolve, reject) => {
      if (!socket || !connected) {
        reject(new Error('Not connected to server'));
        return;
      }

      socket.emit('player:login', username, (response) => {
        if (response.success) {
          setPlayer(response.player);
          setIsLoggedIn(true);
          resolve(response.player);
        } else {
          reject(new Error(response.error));
        }
      });
    });
  };

  const joinGame = (gameName) => {
    return new Promise((resolve, reject) => {
      if (!socket || !isLoggedIn) {
        reject(new Error('Must be logged in'));
        return;
      }

      socket.emit('game:join', gameName, (response) => {
        if (response.success) {
          setCurrentGame(gameName);
          resolve(response.gameState);
        } else {
          reject(new Error(response.error));
        }
      });
    });
  };

  const leaveGame = () => {
    if (socket && currentGame) {
      socket.emit('game:leave');
      setCurrentGame(null);
    }
  };

  const logout = () => {
    leaveGame();
    setPlayer(null);
    setIsLoggedIn(false);
  };

  return (
    <PlayerContext.Provider
      value={{
        player,
        isLoggedIn,
        currentGame,
        login,
        logout,
        joinGame,
        leaveGame
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
};
