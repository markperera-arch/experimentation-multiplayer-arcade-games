# 🏗️ Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT BROWSER                           │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    React Application                       │  │
│  │  ┌─────────────┐  ┌──────────────┐  ┌─────────────────┐  │  │
│  │  │   Router    │  │   Contexts   │  │   Components    │  │  │
│  │  │             │  │              │  │                 │  │  │
│  │  │ • Home      │  │ • Socket     │  │ • LoginModal    │  │  │
│  │  │ • Minesweep │  │ • Player     │  │ • GameSelector  │  │  │
│  │  │ • Bomberman │  │              │  │ • Chat          │  │  │
│  │  │             │  │              │  │ • PlayerList    │  │  │
│  │  │             │  │              │  │ • PlayerStats   │  │  │
│  │  └─────────────┘  └──────────────┘  └─────────────────┘  │  │
│  └───────────────────────────────────────────────────────────┘  │
│                              │                                   │
│                              │ Socket.io Client                  │
│                              │ (WebSocket)                       │
└──────────────────────────────┼───────────────────────────────────┘
                               │
                               │ Real-time bidirectional
                               │ communication
                               │
┌──────────────────────────────▼───────────────────────────────────┐
│                       NODE.JS SERVER                             │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                  Socket.io Server                          │  │
│  │                                                            │  │
│  │  Event Handlers:                                          │  │
│  │  • player:login                                           │  │
│  │  • game:join / game:leave                                 │  │
│  │  • minesweeper:reveal / minesweeper:flag                  │  │
│  │  • bomberman:move / bomberman:place_bomb                  │  │
│  │  • chat:message                                           │  │
│  └───────────────────────────────────────────────────────────┘  │
│                              │                                   │
│                              ▼                                   │
│  ┌────────────────┐  ┌────────────────┐  ┌──────────────────┐  │
│  │  Game Manager  │  │ Player Manager │  │  Chat Manager    │  │
│  │                │  │                │  │                  │  │
│  │ • Route to     │  │ • XP tracking  │  │ • Messages       │  │
│  │   games        │  │ • Leveling     │  │ • Filtering      │  │
│  │ • Manage rooms │  │ • Persistence  │  │ • History        │  │
│  └────────┬───────┘  └────────────────┘  └──────────────────┘  │
│           │                                                      │
│           ▼                                                      │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              Game Instances                              │   │
│  │  ┌──────────────────┐      ┌──────────────────┐        │   │
│  │  │  Minesweeper     │      │  Bomberman       │        │   │
│  │  │                  │      │                  │        │   │
│  │  │ • 50x80 board    │      │ • 100x100 map    │        │   │
│  │  │ • Mine logic     │      │ • Movement       │        │   │
│  │  │ • Reveal cells   │      │ • Collision      │        │   │
│  │  │ • Flag system    │      │ • Bombs/Explosions│       │   │
│  │  │                  │      │ • Power-ups      │        │   │
│  │  └──────────────────┘      └──────────────────┘        │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                   │
│                              ▼                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                  Data Persistence                          │  │
│  │                                                            │  │
│  │  server/data/players.json                                 │  │
│  │  • Username -> { totalXP, level, stats, gamesPlayed }    │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Flow

### 1. Player Login
```
Client                Server               PlayerManager
  │                     │                      │
  ├─ player:login ─────>│                      │
  │   {username}        ├─ loginPlayer() ─────>│
  │                     │                      ├─ Load/Create
  │                     │                      │  player data
  │                     │<─── {player} ────────┤
  │<─ callback ─────────┤
  │   {success, player} │
```

### 2. Join Game
```
Client                Server            GameManager          Game Instance
  │                     │                    │                    │
  ├─ game:join ────────>│                    │                    │
  │   {gameName}        ├─ joinGame() ──────>│                    │
  │                     │                    ├─ addPlayer() ─────>│
  │                     │                    │                    ├─ Create
  │                     │                    │                    │  player state
  │                     │                    │<─ {gameState} ─────┤
  │                     │<─ {gameState} ─────┤                    │
  │<─ callback ─────────┤                    │                    │
  │   {success, state}  │                    │                    │
  │                     │                    │                    │
  │<─ game:players ─────┤ (broadcast to room)                     │
```

### 3. Minesweeper Action
```
Client A             Server              Minesweeper          PlayerManager
  │                    │                     Game                 │
  ├─ reveal ──────────>│                     │                    │
  │   {row, col}       ├─ revealCell() ─────>│                    │
  │                    │                     ├─ Calculate         │
  │                    │                     │  revealed cells    │
  │                    │                     ├─ Check mine        │
  │                    │<─ {cells, xp} ──────┤                    │
  │                    ├─ addXP() ──────────────────────────────>│
  │                    │                     │                    ├─ Update
  │                    │                     │                    │  player XP
  │<─ callback ────────┤                     │                    │
  │   {success}        │                     │                    │
  │                    │                     │                    │
  │<─ player:update ───┤ (to Client A)       │                    │
  │   {updatedPlayer}  │                     │                    │
  │                    │                     │                    │
All Clients            │                     │                    │
  │<─ minesweeper: ────┤ (broadcast to room) │                    │
  │   update           │                     │                    │
  │   {cells, action}  │                     │                    │
```

### 4. Bomberman Movement
```
Client               Server              Bomberman Game
  │                    │                      │
  ├─ move ────────────>│                      │
  │   {x,y,direction}  ├─ movePlayer() ──────>│
  │                    │                      ├─ Validate
  │                    │                      │  position
  │                    │                      ├─ Check
  │                    │                      │  collision
  │                    │<─ {success} ─────────┤
  │                    │                      │
All Clients            │                      │
  │<─ player_move ─────┤ (broadcast)          │
  │   {playerId,x,y,dir}                      │
```

### 5. Bomberman Bomb
```
Client              Server           Bomberman Game      PlayerManager
  │                   │                    │                   │
  ├─ place_bomb ─────>│                    │                   │
  │   {x, y}          ├─ placeBomb() ─────>│                   │
  │                   │                    ├─ Create bomb      │
  │                   │                    ├─ Schedule         │
  │                   │                    │  explosion        │
  │                   │<─ {bombId} ────────┤                   │
  │<─ callback ───────┤                    │                   │
  │   {success}       │                    │                   │
  │                   │                    │                   │
All Clients           │                    │                   │
  │<─ bomb_placed ────┤ (broadcast)        │                   │
  │   {bombId,x,y}    │                    │                   │
  │                   │                    │                   │
  │    ... 3 seconds later ...             │                   │
  │                   │                    │                   │
  │                   │<─ explode() ───────┤                   │
  │                   │   {cells, damage}  │                   │
  │                   ├─ addXP() ──────────────────────────────>│
  │                   │   (for destroyed   │                   │
  │                   │    blocks)         │                   │
  │                   │                    │                   │
All Clients           │                    │                   │
  │<─ explosion ──────┤ (broadcast)        │                   │
  │   {cells,powerups,│                    │                   │
  │    damage}        │                    │                   │
```

---

## Component Hierarchy

```
App.jsx (Router)
│
├─ SocketProvider (WebSocket connection)
│  └─ PlayerProvider (Player state)
│     │
│     ├─ LoginModal (if not logged in)
│     │
│     └─ Routes
│        │
│        ├─ Home
│        │  └─ GameSelector
│        │
│        ├─ MinesweeperGame
│        │  ├─ PlayerStats
│        │  ├─ PlayerList
│        │  ├─ Game Board (scrollable)
│        │  └─ Chat
│        │
│        └─ BombermanGame
│           ├─ PlayerStats
│           ├─ PlayerList
│           ├─ Canvas (game rendering)
│           └─ Chat
```

---

## State Management

### Server State (In-Memory)
```javascript
GameManager {
  games: Map {
    'minesweeper' => MinesweeperServer {
      board: Cell[][]
      players: Map<playerId, player>
      playerFlags: Map<playerId, Set<cellKey>>
    }
    'bomberman' => BombermanServer {
      map: Tile[][]
      players: Map<playerId, player>
      bombs: Map<bombId, bomb>
      powerups: Map<powerupId, powerup>
    }
  }
}

PlayerManager {
  players: Map<socketId, sessionPlayer>
  persistentPlayers: Object {
    username: {
      totalXP, level, stats, gamesPlayed
    }
  }
}

ChatManager {
  chatHistories: Map<gameName, messages[]>
}
```

### Client State (React)
```javascript
SocketContext {
  socket: Socket.io instance
  connected: boolean
}

PlayerContext {
  player: {username, level, totalXP, ...}
  isLoggedIn: boolean
  currentGame: string
}

Game Components {
  gameState: from server
  localState: UI-specific
}
```

---

## Network Protocol

### Socket.io Events

#### Client → Server
| Event | Payload | Response |
|-------|---------|----------|
| `player:login` | `{username}` | `{success, player}` |
| `game:join` | `{gameName}` | `{success, gameState}` |
| `game:leave` | - | - |
| `minesweeper:reveal` | `{row, col}` | `{success, cells, xp}` |
| `minesweeper:flag` | `{row, col}` | `{success, action}` |
| `bomberman:move` | `{x, y, direction}` | - |
| `bomberman:place_bomb` | `{x, y}` | `{success, bombId}` |
| `bomberman:pickup_powerup` | `{powerupId}` | `{success}` |
| `chat:message` | `{message}` | - |

#### Server → Client
| Event | Payload | Scope |
|-------|---------|-------|
| `player:update` | `{player}` | Individual |
| `game:players` | `[players]` | Room |
| `minesweeper:update` | `{cells, action}` | Room |
| `minesweeper:flag_update` | `{row, col, action}` | Individual |
| `bomberman:player_move` | `{playerId, x, y}` | Room |
| `bomberman:bomb_placed` | `{bombId, x, y}` | Room |
| `bomberman:explosion` | `{cells, powerups}` | Room |
| `bomberman:powerup_picked` | `{powerupId, playerId}` | Room |
| `chat:message` | `{id, username, message}` | Room |

---

## Performance Considerations

### Backend
- **In-memory state**: Fast access, supports 50+ players
- **Event-driven**: Only processes on player actions
- **Room-based broadcasting**: Efficient message routing
- **JSON persistence**: Simple, works for MVP

### Frontend
- **React Context**: Efficient state updates
- **Canvas rendering**: Smooth 60 FPS for Bomberman
- **Viewport system**: Only render visible cells in Minesweeper
- **Event delegation**: Efficient click handling

### Network
- **WebSocket**: Low latency (~10-50ms)
- **Binary data**: Could optimize further with msgpack
- **Throttling**: Movement updates at 100ms intervals

---

## Scalability Path

### Current (MVP)
- 50 players per game ✅
- Single server instance ✅
- JSON file storage ✅

### Next Steps
1. **Redis for game state** (multiple server instances)
2. **MongoDB/PostgreSQL** (proper database)
3. **Load balancer** (distribute players)
4. **Microservices** (separate game servers)
5. **CDN** (static asset delivery)

---

## Security Considerations

### Current Implementation
- ✅ Server-authoritative (all validation server-side)
- ✅ Input sanitization (chat messages)
- ✅ CORS configuration
- ⚠️ No authentication (username only)
- ⚠️ No rate limiting
- ⚠️ No encryption (use WSS in production)

### Production Requirements
- 🔒 User authentication (JWT tokens)
- 🔒 Rate limiting (prevent spam)
- 🔒 WSS (encrypted WebSocket)
- 🔒 Input validation (all events)
- 🔒 SQL injection prevention (if using SQL DB)
- 🔒 CSRF protection

---

## Testing Strategy

### Manual Testing
1. Open 2+ browser tabs
2. Login with different usernames
3. Join same game
4. Test interactions
5. Verify real-time updates

### Automated Testing (Future)
- Unit tests (game logic)
- Integration tests (Socket.io events)
- Load tests (multiple clients)
- End-to-end tests (Playwright/Cypress)

---

This architecture is **production-ready for LAN/local deployment** and easily extensible for cloud deployment! 🚀
