# 🃏 Öyhy - Finnish Promise Card Game

A real-time multiplayer card game where players bid on the number of tricks they will take and try to fulfill their promises. Built with Node.js, Express, and Socket.IO.

**🎮 Play online:** [https://promise-cardgame.onrender.com/](https://promise-cardgame.onrender.com/)

## 📋 Table of Contents

- [Features](#features)
- [Game Rules](#game-rules)
- [Technology Stack](#technology-stack)
- [Installation](#installation)
- [Usage](#usage)
- [Project Structure](#project-structure)
- [Architecture](#architecture)
- [API and Socket Events](#api-and-socket-events)
- [Development](#development)
- [Deployment](#deployment)
- [Known Issues and Limitations](#known-issues-and-limitations)
- [Contributing](#contributing)

## ✨ Features

### Game Features
- **3-5 Players**: Supports 3-5 players per room
- **Real-time Gameplay**: Socket.IO-based synchronization
- **Automatic Scoring**: Live scoreboard updates
- **Round Tracking**: Visual display of rounds and progress
- **Last Bidder Rule**: Prevents bids from summing to the number of cards
- **Tie Handling**: First highest bidder starts the round
- **Trick Delay**: 2-second display time before clearing the table

### User Interface
- **Responsive Design**: Works on mobile, tablet, and desktop
- **Real-time Updates**: All actions update instantly across clients
- **Visual Indicators**: Clear markers for turns, status, and progress
- **Card Animations**: Smooth transitions and effects
- **Connection Status**: Shows network connection state
- **Finnish UI**: Authentic Finnish card game experience

### Technical Features
- **Session Management**: Automatic reconnection after browser refresh
- **Disconnection Handling**: 2-minute grace period for reconnection
- **Race Condition Prevention**: Locking mechanism for trick processing
- **Error Handling**: Comprehensive error messaging
- **Health Monitoring**: `/health` endpoint for server status

## 🎮 Game Rules

### Basic Concept
Öyhy (also known as "Promise" or "Oh Hell!") is a trick-taking card game where players bid on how many tricks they will take in each round. The catch? You must take exactly the number you bid to score points.

### Game Flow

1. **Card Dealing**
   - First round: 10 cards per player
   - Subsequent rounds: Cards decrease (9, 8, 7... 1)
   - After the minimum: Cards increase (2, 3, 4... 10)
   - Total of 19 rounds (10 → 1 → 10)

2. **Bidding Phase**
   - Each player bids how many tricks they will take
   - Bidding starts with the dealer and goes clockwise
   - **Last Bidder Rule**: The last bidder cannot bid a number that makes the total bids equal to the number of cards in play
   - Example: With 5 cards and current bids totaling 4, the last player cannot bid 1

3. **Playing Phase**
   - The player with the highest bid leads the first trick
   - In case of a tie, the first player to bid that amount leads
   - Players must follow suit if possible
   - Highest card in the leading suit wins the trick
   - Trick winner leads the next trick

4. **Scoring**
   - **Exact bid fulfilled**: 10 + bid amount points
   - **Bid not met**: 0 points
   - Examples:
     - Bid 3, took 3 → 13 points
     - Bid 3, took 2 or 4 → 0 points
     - Bid 0, took 0 → 10 points

### Strategy Tips
- Assess your hand strength realistically
- Pay attention to other players' bids
- The last bidder has mathematical information
- Don't overbid - zero points hurt!
- High cards are valuable, but so are low cards for avoiding tricks

## 🛠 Technology Stack

### Backend
- **Node.js** - Runtime environment
- **Express** - Web application framework
- **Socket.IO** - Real-time bidirectional communication
- **Crypto** - UUID generation for sessions

### Frontend
- **Vanilla JavaScript (ES6 Modules)** - Modular architecture
- **Socket.IO Client** - Server connection
- **CSS3** - Responsive and animated UI
- **LocalStorage** - Session data persistence

### Architecture Principles
- **MVC-style Structure**: Separation of logic, state, and view
- **Event-driven**: Based on Socket.IO events
- **State Management**: Centralized game state handling
- **Modularity**: Separated modules for different functionalities

## 📦 Installation

### Prerequisites
- Node.js (v14 or newer)
- npm or yarn

### Installation Steps

1. **Clone the repository**
```bash
git clone <repository-url>
cd oyhy-korttipeli
```

2. **Install dependencies**
```bash
npm install
```

3. **Start the server**
```bash
npm start
```

4. **Open in browser**
```
http://localhost:3000
```

### Dependencies

```json
{
  "dependencies": {
    "express": "^4.18.0",
    "socket.io": "^4.5.0"
  }
}
```

## 🚀 Usage

### Starting a Game

1. **Open the game** at [https://promise-cardgame.onrender.com/](https://promise-cardgame.onrender.com/)
2. **Enter your name** and click "Liity peliin" (Join Game)
3. **Wait for other players** (3-5 players required)
4. **Start the game** when enough players have joined

### Playing

**Bidding Phase:**
- Wait for your turn
- Enter your bid (0 to number of cards)
- Click "Lupaa" (Promise)
- Last player will see the forbidden bid highlighted

**Playing Phase:**
- Wait for your turn
- Click a card to play it
- Must follow suit if you have cards of the leading suit
- Watch in real-time who is winning the trick

**Round End:**
- View the results
- Click "Seuraava kierros" (Next Round)
- Continue until all rounds are completed

### Special Situations

**Connection Loss:**
- Game pauses for 2 minutes waiting for reconnection
- Other players see a pause overlay
- Automatic reconnection when you return
- Browser refresh maintains your session

**Session Management:**
- Browser refresh doesn't disconnect you
- LocalStorage preserves session data
- Automatic identification on return

## 📁 Project Structure

```
oyhy-korttipeli/
├── server.js                    # Main server file
├── package.json                 # Project configuration
├── README.md                    # Documentation
│
├── game/                        # Game logic (backend)
│   ├── GameRoom.js              # Game room management
│   ├── Deck.js                  # Card deck creation and shuffling
│   ├── Rules.js                 # Game rules and validation
│   └── ScoreCalculator.js       # Scoring system
│
├── socket/                      # Socket.IO handlers
│   └── socketHandlers.js        # Event handlers and room management
│
└── public/                      # Frontend files
    ├── index.html               # Main HTML file
    ├── styles.css               # Styling
    │
    └── scripts/                 # JavaScript modules
        ├── main.js              # Entry point
        ├── socket.js            # Socket.IO client
        ├── session.js           # Session management
        ├── utils.js             # Utility functions
        │
        ├── game/                # Game logic (frontend)
        │   ├── state.js         # Game state management
        │   └── cards.js         # Card rendering
        │
        └── ui/                  # UI components
            ├── lobby.js         # Lobby screen
            ├── bidding.js       # Bidding interface
            ├── playing.js       # Playing interface
            ├── results.js       # Results display
            ├── scoreboard.js    # Scoreboard
            └── overlays.js      # Pause overlay
```

## 🏗 Architecture

### Backend Architecture

**GameRoom Class** (`game/GameRoom.js`)
- Manages game state for a single room
- Handles player management (join, leave, reconnect)
- Implements game flow (bidding, playing, scoring)
- Includes trick processing lock to prevent race conditions
- Manages disconnection timeouts (2 minutes)

**Key Features:**
- `trickProcessing` flag prevents multiple cards being played simultaneously
- Session-based reconnection using UUID
- Automatic pause when player disconnects
- Comprehensive game state tracking

**Socket Handlers** (`socket/socketHandlers.js`)
- Manages Socket.IO events
- Routes client requests to GameRoom instances
- Implements 2-second trick delay for better UX
- Handles reconnection logic

### Frontend Architecture

**Modular Structure:**
- **State Management** (`game/state.js`): Centralized game state
- **Socket Communication** (`socket.js`): Server connection and event handling
- **Session Management** (`session.js`): LocalStorage-based session persistence
- **UI Components**: Separated by functionality (lobby, bidding, playing, etc.)

**Key Design Patterns:**
- Event-driven updates via Socket.IO
- Centralized state with reactive UI updates
- Module-based organization for maintainability

## 🔌 API and Socket Events

### HTTP Endpoints

```
GET /                    # Serve game interface
GET /health             # Health check endpoint
GET /api/rooms          # Get room statistics
```

### Socket Events

**Client → Server:**
```javascript
'joinGame'              // Join or create a game room
'reconnectGame'         // Reconnect to existing session
'startGame'             // Start the game (requires 3-5 players)
'submitBid'             // Submit your bid
'playCard'              // Play a card
'nextRound'             // Start next round
'getFinalScores'        // Request final scores
'disconnect'            // Player disconnection
```

**Server → Client:**
```javascript
'connect'               // Connection established
'disconnect'            // Connection lost
'reconnected'           // Successfully reconnected
'reconnectFailed'       // Reconnection failed
'joinSuccess'           // Successfully joined game
'joinError'             // Error joining game
'gameStateUpdate'       // Game state changed
'receiveHand'           // Receive your cards
'gameStarted'           // Game has started
'gameFinished'          // Game completed
'playerLeft'            // Player left the game
'playerDisconnected'    // Player lost connection
'playerReconnected'     // Player reconnected
'gameAborted'           // Game was aborted
'error'                 // Error message
```

## 💻 Development

### Running Locally

1. **Development mode with auto-restart:**
```bash
npm install -g nodemon
nodemon server.js
```

2. **Debug mode:**
```bash
# Enable debug console in browser
# Check browser console for DEBUG commands
DEBUG.gameState()       # View current game state
DEBUG.myHand()          # View your cards
clearSession()          # Clear session data
showSession()           # Show session info
```

3. **Testing:**
- Open multiple browser windows/tabs
- Use different browsers for different players
- Test reconnection by refreshing browser

### Development Tips

**Adding New Features:**
1. Backend logic goes in `game/` or `socket/`
2. Frontend logic goes in `public/scripts/`
3. UI components go in `public/scripts/ui/`
4. Update socket events in both client and server
5. Test with multiple clients

**Common Issues:**
- Socket.IO CORS issues: Check allowed origins in server.js
- Session persistence: Verify LocalStorage is enabled
- Trick processing: Check `trickProcessing` flag state

## 🌐 Deployment

### Render.com Deployment

The game is hosted on Render.com at: [https://promise-cardgame.onrender.com/](https://promise-cardgame.onrender.com/)

**Deployment Configuration:**

1. **Build Command:**
```bash
npm install
```

2. **Start Command:**
```bash
npm start
```

3. **Environment:**
- Node.js environment
- Auto-deploy from main branch
- Free tier may experience cold starts (first load takes ~30 seconds)

4. **Environment Variables:**
```
PORT=3000  # Automatically set by Render
```

### Manual Deployment Steps

1. **Prepare for production:**
```bash
# Ensure all dependencies are in package.json
npm install --production
```

2. **Set environment variables:**
```bash
export PORT=3000
export NODE_ENV=production
```

3. **Start server:**
```bash
npm start
```

### Render.com Free Tier Notes

- **Cold Starts**: Service spins down after 15 minutes of inactivity
- **Wake-up Time**: First request after sleep takes ~30-60 seconds


## 🐛 Known Issues and Limitations

### Current Limitations

1. **Single Room**: Currently supports only one game room ("default")
   - Future: Multiple independent game rooms
   
2. **No Game History**: Games are not persisted to database
   - Future: Add MongoDB/PostgreSQL for game history

3. **No User Accounts**: No persistent user profiles
   - Future: User registration and statistics

4. **Cold Start on Free Tier**: Render.com free tier sleeps after inactivity
   - First load after sleep takes 30-60 seconds
   - Solution: Upgrade to paid tier or implement ping service

### Known Bugs

- None currently identified after race condition fix

### Planned Features

- [ ] Multiple game rooms with room codes
- [ ] Chat functionality
- [ ] Game settings (starting cards, time limits)
- [ ] Spectator mode
- [ ] Player statistics and rankings
- [ ] Tournament mode
- [ ] Sound effects and music
- [ ] Mobile app (React Native)
- [ ] Internationalization (English)

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/AmazingFeature`)
3. **Commit your changes** (`git commit -m 'Add some AmazingFeature'`)
4. **Push to the branch** (`git push origin feature/AmazingFeature`)
5. **Open a Pull Request**

### Coding Standards

- Use ES6+ features
- Follow existing code style
- Comment complex logic
- Test with multiple clients before submitting PR

### Bug Reports

Please include:
- Description of the bug
- Steps to reproduce
- Expected vs actual behavior
- Browser and OS information
- Console error messages (if any)

## 📄 License

This project is open source and available under the MIT License.

## 👨‍💻 Author

**Joonas Lahti**
- Full Stack Developer


## 🙏 Acknowledgments

- Finnish card game tradition
- Socket.IO for real-time capabilities
- The Node.js community
- Render.com for free hosting

## 📞 Support

For issues, questions, or suggestions:
- Open an issue on GitHub
- Play online: [https://promise-cardgame.onrender.com/](https://promise-cardgame.onrender.com/)

---

**Enjoy playing Öyhy! 🃏🎉**

*Made with ❤️ in Finland*