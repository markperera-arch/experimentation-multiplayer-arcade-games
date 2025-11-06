import React, { useState, useEffect } from 'react';
import { useSocket } from '../../contexts/SocketContext';
import '../../styles/PlayerList.css';

const PlayerList = () => {
  const { socket } = useSocket();
  const [players, setPlayers] = useState([]);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (!socket) return;

    socket.on('game:players', (playerList) => {
      setPlayers(playerList);
    });

    return () => {
      socket.off('game:players');
    };
  }, [socket]);

  const getLevelColor = (level) => {
    if (level >= 10) return '#ffd700';
    if (level >= 5) return '#c0c0c0';
    return '#cd7f32';
  };

  return (
    <div className={`player-list ${collapsed ? 'collapsed' : ''}`}>
      <div className="player-list-header" onClick={() => setCollapsed(!collapsed)}>
        <h3>Players ({players.length})</h3>
        <button className="collapse-btn">{collapsed ? '▼' : '▲'}</button>
      </div>

      {!collapsed && (
        <div className="player-list-content">
          {players.map((player) => (
            <div key={player.socketId} className="player-item">
              <span
                className="player-level"
                style={{ color: getLevelColor(player.level) }}
              >
                [{player.level}]
              </span>
              <span className="player-name">{player.username}</span>
            </div>
          ))}
          {players.length === 0 && (
            <div className="no-players">No players online</div>
          )}
        </div>
      )}
    </div>
  );
};

export default PlayerList;
