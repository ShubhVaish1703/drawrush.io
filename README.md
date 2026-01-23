# DrawRush 🎨

A real-time multiplayer drawing and guessing game built with Next.js, Node.js, and Socket.io. Players take turns drawing while others guess the word, similar to Pictionary.

## 🔗 Live Demo

- **Frontend (Vercel)**:  
  👉 https://drawrush-io.vercel.app/

- **Backend (Render)**:  
  👉 https://draw-rush-server.onrender.com/

> ⚠️ **Note**: The backend is hosted on Render and may go to sleep after inactivity.  
> If the game doesn’t connect initially, open the backend link once to wake the server, then refresh the frontend and start playing.


## Features

- **Real-time Multiplayer Gaming**: Play with friends using WebSocket connections
- **Drawing Board**: Interactive canvas for drawing with real-time synchronization
- **Chat**: Integrated message communication using Socket.io
- **Game Lobby**: Room creation and player management
- **Score Tracking**: Points awarded for drawing and correct guesses
- **Word Hints**: AI-powered hints using Cohere AI
- **Responsive Design**: Mobile-friendly interface with Tailwind CSS
- **Toast Notifications**: User feedback with react-hot-toast

## Tech Stack

### Frontend
- **Framework**: Next.js 16.1.2 with React 19.2.3
- **Real-time Communication**: Socket.io Client
- **UI Library**: Lucide React (icons)
- **Styling**: Tailwind CSS 4
- **Notifications**: react-hot-toast
- **Avatar Generation**: DiceBear

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Real-time Communication**: Socket.io
- **AI Integration**: Cohere AI (for hints)
- **Utilities**: UUID, CORS, dotenv

## Project Structure

```
draw-rush-hackathon/
├── client/                 # Next.js frontend application
│   ├── app/               # App directory with pages
│   │   ├── page.js        # Home page
│   │   ├── layout.js      # Root layout
│   │   └── room/          # Room pages
│   ├── components/
│   │   ├── HomePage/      # Home page components
│   │   │   ├── Header.jsx
│   │   │   └── Lobby.jsx
│   │   └── RoomPage/      # Room page components
│   │       ├── DrawingBoard.jsx
│   │       ├── GameLobby.jsx
│   │       ├── MessageBox.jsx
│   │       ├── PlayerCard.jsx
│   │       ├── ChatUpdates/
│   │       ├── LobbyComponents/
│   │       └── VoiceChat/
│   ├── providers/
│   │   └── ToasterProvider.jsx
│   ├── socket/
│   │   └── socket.js      # Socket.io client configuration
│   ├── utils/
│   │   └── utils.js
│   └── public/            # Static assets
│
├── server/                 # Express backend application
│   ├── index.js           # Main server entry point
│   ├── words.js           # Word list for the game
│   ├── package.json
│   └── utils/
│       └── utils.js       # Utility functions
└── README.md
```

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- Environment variables configured

### Installation

1. **Clone the repository** (if applicable)
   ```bash
   git clone <repository-url>
   cd draw-rush-hackathon
   ```

2. **Setup Backend**
   ```bash
   cd server
   npm install
   ```

3. **Setup Frontend**
   ```bash
   cd ../client
   npm install
   ```

### Environment Variables

Create a `.env` file in the `server` directory:
```
COHERE_API_KEY=your_cohere_api_key
PORT=5000
NODE_ENV=development
```

### Running the Application

**Terminal 1 - Start Backend Server**
```bash
cd server
npm run dev
```

The server will run on `http://localhost:5000` by default.

**Terminal 2 - Start Frontend Development Server**
```bash
cd client
npm run dev
```

The client will run on `http://localhost:3000`.

### Building for Production

**Frontend Build**
```bash
cd client
npm run build
npm start
```

**Backend**
```bash
cd server
npm start
```

## Gameplay

1. **Create a Room**: Enter your name and click "Create Room" to generate a room code
2. **Join a Room**: Share the room code with friends or enter it to join
3. **Game Flow**:
   - One player is designated as the drawer
   - The drawer sees a word and has limited time to draw it
   - Other players guess what's being drawn
   - Points are awarded based on correct guesses and drawing
   - Players take turns as the drawer
4. **Game Settings**: Room host has the right to modify the game settings in game lobby.

## Game Constants

- **Word Selection Time**: 10 seconds
- **Points**:
  - Drawer: 300 points per correct guess
  - First Guesser: 150 points
  - Other Guessers: 75 points each

## Key Technologies Explained

### Socket.io
Handles real-time communication between clients and server for:
- Game state updates
- Drawing synchronization
- Chat messages
- Player joins/leaves

### Cohere AI
Generates helpful hints for:
- Stuck players who need help guessing
- Word-related suggestions

## API Endpoints & Socket Events

### Main Socket Events
- `joinRoom`: Player joins a game room
- `leaveRoom`: Player leaves the game
- `draw`: Drawing stroke synchronized to other players
- `guess`: Player submits a guess
- `startGame`: Initiates the game round
- `gameOver`: Signals the end of a round

## Future Enhancements

- Improve hint quality with contextual embeddings and ranking
- Add user authentication and persistent profiles
- Reconnect/resume game for dropped players
- Spectator mode with replay of recent strokes
- Mobile gesture support and pressure-sensitive drawing
- Microtransactions / cosmetic items (avatars, brushes)
- Add automated tests for socket event flows

---

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is open source and available for educational use.

## Support

For issues or questions, please create an issue in the repository.

---

Built with ❤️ using NodeJS, ExpressJS, NextJS and Socket.io.
