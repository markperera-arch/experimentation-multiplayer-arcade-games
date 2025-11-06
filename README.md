# 🎮 MMO Gaming Platform

A real-time multiplayer gaming platform featuring Minesweeper and Bomberman with up to 50 concurrent players per game!

## 🌟 Features

### Games
- **💣 Minesweeper MMO**: One massive shared board (50x80) where all players compete together
  - First to click gets the XP
  - Personal flag system (your flags vs others)
  - Viewport system for easy navigation
  - Real-time cell reveals visible to all players

- **💥 Bomberman Battle**: Real-time multiplayer arena with PvP zones
  - 100x100 map with destructible blocks
  - Power-ups (speed, bomb count, explosion range)
  - Safe zones and PvP zones
  - HP system with respawning

### Core Features
- **Leveling System**: Earn XP and level up across all games
- **Real-time Chat**: Communicate with other players
- **Player List**: See who's online
- **Persistent Progress**: Your stats are saved
- **Beautiful UI**: Modern, responsive design

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

1. **Install Backend Dependencies**
```bash
cd server
npm install
```

2. **Install Frontend Dependencies**
```bash
cd ..
npm install
```

### Running the Application

1. **Start the Backend Server**
```bash
cd server
npm start
```
The server will run on `http://localhost:3001`

2. **Start the Frontend (in a new terminal)**
```bash
npm run dev
```
The frontend will run on `http://localhost:5173`

3. **Open Multiple Tabs** to test multiplayer functionality!

## 🎯 How to Play

### Minesweeper MMO
- **Left Click**: Reveal a cell (first to click gets XP)
- **Right Click**: Place your flag
- **Navigation**: Scroll to explore the large map
- **Rewards**: +2 XP per safe cell, -20 XP for hitting a mine

### Bomberman Battle
- **WASD or Arrow Keys**: Move your player
- **Space**: Place a bomb
- **Collect Power-ups**: 
  - ⚡ Speed boost
  - 💣 Extra bomb capacity
  - 💥 Larger explosion range
- **Rewards**: 
  - +5 XP per block destroyed
  - +50 XP per player kill
  - +1 XP per second alive
  - -30 XP on death

### General
- Press **C** to toggle chat in any game
- Your XP and level persist across games and sessions

## 📁 Project Structure

```
/
├── server/                 # Backend server
│   ├── index.js           # Main server file
│   ├── game-manager.js    # Game routing
│   ├── player-manager.js  # Player data & XP
│   ├── chat-manager.js    # Chat system
│   └── games/
│       ├── minesweeper-server.js
│       └── bomberman-server.js
├── src/                   # Frontend
│   ├── pages/            # Game pages
│   ├── components/       # React components
│   │   └── shared/      # Reusable multiplayer components
│   ├── contexts/        # React contexts (Socket, Player)
│   └── styles/          # CSS files
└── package.json
```

## 🔧 Configuration

### Server Configuration
Edit `server/index.js` to change:
- Port (default: 3001)
- CORS settings

### Game Settings

**Minesweeper** (`server/games/minesweeper-server.js`):
- Board size: 50x80
- Mine count: 400
- XP rewards

**Bomberman** (`server/games/bomberman-server.js`):
- Map size: 100x100
- HP, speed, bomb settings
- Power-up spawn rates

### Frontend
Edit `src/contexts/SocketContext.jsx` to change server URL if needed.

## 🎨 Tech Stack

### Backend
- Node.js
- Express.js
- Socket.io (real-time communication)
- JSON file storage (easily upgradeable to MongoDB)

### Frontend
- React 18
- React Router v6
- Socket.io Client
- CSS3 (modern gradients and animations)

## 🚧 Roadmap

### Planned Features
- [ ] More games (Snake, Tetris Battle, etc.)
- [ ] User authentication system
- [ ] Global leaderboards
- [ ] Game statistics and history
- [ ] Cosmetic unlocks
- [ ] Voice chat
- [ ] Mobile responsive design
- [ ] Tournament mode

## 🐛 Troubleshooting

**Server won't start:**
- Make sure port 3001 is not in use
- Check that all dependencies are installed

**Frontend can't connect:**
- Ensure backend server is running
- Check browser console for errors
- Verify server URL in SocketContext.jsx

**Game lag:**
- Check your internet connection
- Close other tabs/applications
- Server supports up to 50 players per game

## 📝 License

MIT License - Feel free to use this project for learning or building your own games!

## 🙏 Acknowledgments

Built with React, Socket.io, and lots of ☕

---

**Have fun playing! 🎮**
