import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const socketInstance = io('http://localhost:3001', {
      autoConnect: false
    });

    socketInstance.on('connect', () => {
      console.log('Connected to server');
      setConnected(true);
    });

    socketInstance.on('disconnect', () => {
      console.log('Disconnected from server');
      setConnected(false);
    });

    socketInstance.on('connect_error', (error) => {
      console.error('Connection error:', error);
      setConnected(false);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
      socketInstance.removeAllListeners();
    };
  }, []);

  const connect = () => {
    if (socket && !connected) {
      socket.connect();
    }
  };

  const disconnect = () => {
    if (socket && connected) {
      socket.disconnect();
    }
  };

  return (
    <SocketContext.Provider value={{ socket, connected, connect, disconnect }}>
      {children}
    </SocketContext.Provider>
  );
};
