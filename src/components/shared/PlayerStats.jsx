import React from 'react';
import { usePlayer } from '../../contexts/PlayerContext';
import '../../styles/PlayerStats.css';

const PlayerStats = () => {
  const { player } = usePlayer();

  if (!player) return null;

  const xpInCurrentLevel = player.totalXP % 100;
  const xpProgress = xpInCurrentLevel / 100;

  return (
    <div className="player-stats">
      <div className="player-info">
        <span className="player-username">{player.username}</span>
        <span className="player-level">Level {player.level}</span>
      </div>
      <div className="xp-bar-container">
        <div className="xp-bar" style={{ width: `${xpProgress * 100}%` }} />
        <span className="xp-text">
          {xpInCurrentLevel} / 100 XP
        </span>
      </div>
    </div>
  );
};

export default PlayerStats;
