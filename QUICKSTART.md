# 🚀 Quick Start Guide

## Fast Setup (3 steps)

### Step 1: Start the Backend Server

Open a terminal and run:

```bash
cd server
npm start
```

You should see:
```
🚀 Server running on port 3001
🎮 MMO Gaming Platform ready!
```

### Step 2: Start the Frontend

Open a **NEW** terminal and run:

```bash
npm run dev
```

You should see:
```
  VITE ready in X ms

  ➜  Local:   http://localhost:5173/
```

### Step 3: Open and Play!

1. Open your browser to `http://localhost:5173`
2. Enter a username
3. Choose a game to play!

**To test multiplayer**: Open multiple browser tabs or windows!

---

## Testing Multiplayer

### Minesweeper:
1. Open 2+ browser tabs
2. Login with different usernames in each tab
3. Both players click "Minesweeper MMO"
4. Try clicking cells - first to click gets the action!
5. Use chat by pressing 'C'

### Bomberman:
1. Open 2+ browser tabs with different usernames
2. Both click "Bomberman Battle"
3. Use WASD to move, Space to place bombs
4. Watch explosions affect other players!

---

## Troubleshooting

### "Cannot connect to server"
- Make sure the backend is running (`cd server && npm start`)
- Check that nothing else is using port 3001

### "npm command not found"
- Install Node.js from https://nodejs.org/

### Game lag
- Close other tabs/programs
- Check your internet connection

### Port already in use
Backend (3001):
```bash
# Find what's using the port
lsof -ti:3001 | xargs kill -9
```

Frontend (5173):
```bash
# Find what's using the port
lsof -ti:5173 | xargs kill -9
```

---

## Game Controls

### Minesweeper
- **Left Click**: Reveal cell
- **Right Click**: Toggle flag
- **C Key**: Toggle chat
- **Scroll**: Navigate large map

### Bomberman
- **W/↑**: Move up
- **S/↓**: Move down
- **A/←**: Move left
- **D/→**: Move right
- **Space**: Place bomb
- **C Key**: Toggle chat

---

## XP System

### Minesweeper
- +2 XP per safe cell revealed
- -20 XP for hitting a mine

### Bomberman
- +5 XP per block destroyed
- +50 XP per player kill
- +1 XP per second alive
- -30 XP on death

**Level up every 100 XP!**

---

## Next Steps

- Invite friends to play together!
- Try to reach level 10
- Explore both safe and PvP zones in Bomberman
- Check out the player list and chat features

Enjoy! 🎮
