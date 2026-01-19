const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const { v4: uuidv4 } = require("uuid");
const { getRandomWords } = require("./words");
const { createWordHint } = require("./utils/utils");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
        credentials: true,
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000,
    maxHttpBufferSize: 1e6,
    allowEIO3: true
});

// Game constants
const WORD_SELECTION_TIME = 10000; // 10 seconds
const DRAWING_TIME = 60000; // 600 seconds
const POINTS = {
    DRAWER: 300,
    FIRST_GUESS: 150,
    OTHER_GUESS: 75
};

// Store all rooms
const rooms = new Map();
const roomTimers = new Map(); // Store active timers

// Generate random 6-character room code
const generateRoomCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
};

// Create new room structure
const createRoom = (hostName, playerId, socketId) => {
    const code = generateRoomCode();
    return {
        code,
        host: playerId,
        players: [{
            id: playerId,
            socketId: socketId,
            name: hostName,
            score: 0,
            status: "online",
            hasGuessed: false,
        }],
        maxPlayers: 8,
        messages: [],//msg store here
        currentDrawer: null,
        currentDrawerIndex: -1,
        currentWord: null,
        wordOptions: [],
        gameStarted: false,
        gamePhase: "lobby", // lobby, word-selection, drawing, round-end, game-end
        round: 0,
        maxRounds: 3,
        drawingData: [],
        correctGuessers: [], // Track who guessed correctly and when
        turnStartTime: null,
    };
};

// Clear all timers for a room
const clearRoomTimers = (roomCode) => {
    const timers = roomTimers.get(roomCode);
    if (timers) {
        Object.values(timers).forEach(timer => clearTimeout(timer));
        roomTimers.delete(roomCode);
    }
};

// Start next turn
const startNextTurn = (roomCode) => {
    const room = rooms.get(roomCode);
    if (!room) return;

    // Clear previous turn data
    room.drawingData = [];
    room.correctGuessers = [];
    room.currentWord = null;
    room.players.forEach(p => p.hasGuessed = false);

    // Clear canvas for all players
    io.to(roomCode).emit("clear-canvas");

    // Move to next drawer
    room.currentDrawerIndex++;

    // Check if round is complete
    if (room.currentDrawerIndex >= room.players.length) {
        room.currentDrawerIndex = -1;
        room.round++;

        // Check if game is complete
        if (room.round >= room.maxRounds) {
            endGame(roomCode);
            return;
        }

        // Show round end screen
        room.gamePhase = "round-end";
        io.to(roomCode).emit("round-end", {
            round: room.round,
            players: room.players
        });


        // Start next round after 5 seconds
        const timer = setTimeout(() => {
            startNextTurn(roomCode);
        }, 5000);


        if (!roomTimers.has(roomCode)) roomTimers.set(roomCode, {});
        roomTimers.get(roomCode).roundEnd = timer;
        return;
    }

    // Get current drawer
    let currentDrawer = room.players[room.currentDrawerIndex];

    // Skip offline players - find next online player
    let attempts = 0;
    while (currentDrawer.status === "offline" && attempts < room.players.length) {
        console.log(`Skipping offline player: ${currentDrawer.name}`);

        room.currentDrawerIndex++;
        attempts++;

        // Check if we've completed the round while skipping
        if (room.currentDrawerIndex >= room.players.length) {
            room.currentDrawerIndex = -1;
            room.round++;

            // Check if game is complete
            if (room.round >= room.maxRounds) {
                endGame(roomCode);
                return;
            }
            // Show round end screen
            room.gamePhase = "round-end";
            io.to(roomCode).emit("round-end", {
                round: room.round,
                players: room.players
            });

            // Start next round after 5 seconds
            const timer = setTimeout(() => {
                startNextTurn(roomCode);
            }, 5000);

            if (!roomTimers.has(roomCode)) roomTimers.set(roomCode, {});
            roomTimers.get(roomCode).roundEnd = timer;
            return;
        }

        currentDrawer = room.players[room.currentDrawerIndex];
    }

    // If all players are offline, end the game
    if (attempts >= room.players.length) {
        console.log(`All players offline in room ${roomCode}. Ending game.`);
        endGame(roomCode);
        return;
    }

    room.currentDrawer = currentDrawer.id;

    // Generate 3 random words
    room.wordOptions = getRandomWords();
    room.gamePhase = "word-selection";
    room.turnStartTime = Date.now();

    // Notify all players about new turn
    io.to(roomCode).emit("turn-start", {
        drawerId: currentDrawer.id,
        drawerName: currentDrawer.name,
        round: room.round + 1,
        maxRounds: room.maxRounds
    });

    // Send word options only to drawer
    const drawerSocket = io.sockets.sockets.get(currentDrawer.socketId);
    if (drawerSocket) {
        drawerSocket.emit("word-options", {
            words: room.wordOptions,
            timeLimit: WORD_SELECTION_TIME
        });
    }

    // Auto-select word after 10 seconds if not selected
    const timer = setTimeout(() => {
        if (room.gamePhase === "word-selection") {
            const randomWord = room.wordOptions[Math.floor(Math.random() * room.wordOptions.length)];
            selectWord(roomCode, randomWord);
        }
    }, WORD_SELECTION_TIME);

    if (!roomTimers.has(roomCode)) roomTimers.set(roomCode, {});
    roomTimers.get(roomCode).wordSelection = timer;
}

// Handle word selection
const selectWord = (roomCode, word) => {
    const room = rooms.get(roomCode);
    if (!room || room.gamePhase !== "word-selection") return;

    // Clear word selection timer
    const timers = roomTimers.get(roomCode);
    if (timers && timers.wordSelection) {
        clearTimeout(timers.wordSelection);
    }

    room.currentWord = word;
    room.gamePhase = "drawing";
    room.turnStartTime = Date.now();

    // Create word hint (e.g., "apple" -> "_ _ _ l _")
    const wordHint = createWordHint(word);

    // Notify all players
    io.to(roomCode).emit("drawing-phase-start", {
        wordLength: word.length,
        wordHint: wordHint,
        timeLimit: DRAWING_TIME
    });

    // Send actual word only to drawer
    const drawer = room.players.find(p => p.id === room.currentDrawer);
    if (drawer) {
        const drawerSocket = io.sockets.sockets.get(drawer.socketId);
        if (drawerSocket) {
            drawerSocket.emit("your-word", { word });
        }
    }

    // End drawing phase after 60 seconds
    const timer = setTimeout(() => {
        endTurn(roomCode);
    }, DRAWING_TIME);

    if (!roomTimers.has(roomCode)) roomTimers.set(roomCode, {});
    roomTimers.get(roomCode).drawing = timer;
}

// End current turn
const endTurn = (roomCode) => {
    const room = rooms.get(roomCode);
    if (!room || room.gamePhase !== "drawing") return;

    // Clear drawing timer
    const timers = roomTimers.get(roomCode);
    if (timers && timers.drawing) {
        clearTimeout(timers.drawing);
    }

    room.gamePhase = "turn-end";

    // Award points to drawer if anyone guessed
    if (room.correctGuessers.length > 0) {
        const drawer = room.players.find(p => p.id === room.currentDrawer);
        if (drawer) {
            drawer.score += POINTS.DRAWER;
        }
    }

    // Reveal the word
    io.to(roomCode).emit("turn-end", {
        word: room.currentWord,
        correctGuessers: room.correctGuessers,
        players: room.players
    });

    // Start next turn after 5 seconds
    const timer = setTimeout(() => {
        startNextTurn(roomCode);
    }, 5000);

    if (!roomTimers.has(roomCode)) roomTimers.set(roomCode, {});
    roomTimers.get(roomCode).turnEnd = timer;
}

// End game
const endGame = (roomCode) => {
    const room = rooms.get(roomCode);
    if (!room) return;

    clearRoomTimers(roomCode);

    room.gamePhase = "game-end";
    room.gameStarted = false;

    // Sort players by score
    const leaderboard = [...room.players].sort((a, b) => b.score - a.score);

    io.to(roomCode).emit("game-end", {
        leaderboard,
        winner: leaderboard[0]
    });

    // After showing leaderboard, reset game state
    setTimeout(() => {
        const currentRoom = rooms.get(roomCode);
        if (!currentRoom) return;

        // Remove offline players
        const onlinePlayers = currentRoom.players.filter(p => p.status === "online");
        console.log(`Room ${roomCode}: Removing ${currentRoom.players.length - onlinePlayers.length} offline players`);

        // Reset scores for remaining online players
        onlinePlayers.forEach(p => {
            p.score = 0;
            p.hasGuessed = false;
        });

        // Update room with only online players
        currentRoom.players = onlinePlayers;

        // Reset game state
        currentRoom.currentDrawer = null;
        currentRoom.currentDrawerIndex = -1;
        currentRoom.currentWord = null;
        currentRoom.wordOptions = [];
        currentRoom.gamePhase = "lobby";
        currentRoom.round = 0;
        currentRoom.drawingData = [];
        currentRoom.correctGuessers = [];
        currentRoom.turnStartTime = null;

        // Check if any players remain
        if (onlinePlayers.length === 0) {
            console.log(`Room ${roomCode}: No players remaining. Deleting room.`);
            clearRoomTimers(roomCode);
            rooms.delete(roomCode);
            return;
        }

        // If host was removed, assign new host
        const hostExists = onlinePlayers.find(p => p.id === currentRoom.host);
        if (!hostExists && onlinePlayers.length > 0) {
            currentRoom.host = onlinePlayers[0].id;
            console.log(`Room ${roomCode}: New host assigned to ${onlinePlayers[0].name}`);
        }

        // Notify remaining players of the reset state
        io.to(roomCode).emit("game-reset", {
            players: currentRoom.players,
            hostId: currentRoom.host,
            message: "Game ended! Ready to play again?"
        });

        console.log(`Room ${roomCode}: Game reset. ${onlinePlayers.length} players remaining.`);
    }, 10000) // Wait 10 seconds to show leaderboard before reset
};

// Check if guess is correct
const checkGuess = (roomCode, playerId, guess) => {
    const room = rooms.get(roomCode);
    if (!room || room.gamePhase !== "drawing") return;

    const player = room.players.find(p => p.id === playerId);
    if (!player) return;

    // Drawer can't guess
    if (playerId === room.currentDrawer) return;

    // Already guessed correctly
    if (player.hasGuessed) return;

    // Check if guess is correct (case-insensitive)
    if (guess.toLowerCase().trim() === room.currentWord.toLowerCase()) {
        player.hasGuessed = true;

        // Award points
        if (room.correctGuessers.length === 0) {
            // First correct guess
            player.score += POINTS.FIRST_GUESS;
        } else {
            // Subsequent correct guesses
            player.score += POINTS.OTHER_GUESS;
        }

        room.correctGuessers.push({
            playerId: player.id,
            playerName: player.name,
            time: Date.now() - room.turnStartTime
        });

        // Notify all players
        io.to(roomCode).emit("correct-guess", {
            playerId: player.id,
            playerName: player.name,
            players: room.players
        });

        // If all players guessed, end turn early
        const nonDrawerPlayers = room.players.filter(p => p.id !== room.currentDrawer);
        const allGuessed = nonDrawerPlayers.every(p => p.hasGuessed);
        if (allGuessed) {
            endTurn(roomCode);
        }
    }
}

io.on("connection", (socket) => {
    console.log('User connected: ', socket.id);

    // Create a new room
    socket.on("create-room", ({ playerName }) => {
        const playerId = uuidv4();
        const room = createRoom(playerName, playerId, socket.id);

        rooms.set(room.code, room);
        socket.join(room.code);

        socket.emit("room-created", {
            code: room.code,
            player: room.players[0],
        });

        console.log(`Room ${room.code} created by ${playerName}`);
    });

    // Join existing room
    socket.on("join-room", ({ code, playerName }) => {
        const room = rooms.get(code);

        if (!room) {
            socket.emit("error", { message: "Room not found" });
            return;
        }

        if (room.players.length >= room.maxPlayers) {
            socket.emit("error", { message: "Room is full" });
            return;
        }

        if (room.gameStarted) {
            socket.emit("error", { message: "Game already started" });
            return;
        }

        const playerId = uuidv4();
        const player = {
            id: playerId,
            socketId: socket.id,
            name: playerName,
            score: 0,
            status: "online",
            hasGuessed: false
        }

        // Add player to room
        room.players.push(player);

        socket.join(code);
        socket.emit("room-joined", {
            room,
            player,
        });

        // Notify all players in room
        io.to(code).emit("player-joined", {
            player: player,
            players: room.players,
        });

        // Send existing drawing to new player
        socket.emit("load-drawing", room.drawingData);
        //send old messages
        socket.emit("chat-history", room.messages);

        console.log(`${playerName} joined room ${code}`);
    });

    // ** RECONNECT TO ROOM (for page refresh) **
    socket.on("reconnect-room", ({ code, playerId }) => {
        const room = rooms.get(code);

        if (!room) {
            socket.emit("error", { message: "Room not found" });
            return;
        }

        // Find the player by their UUID
        const playerIndex = room.players.findIndex(p => p.id === playerId);
        if (playerIndex === -1) {
            socket.emit("error", { message: "Player not found in room" });
            return;
        }

        // Update the socketId for this player
        room.players[playerIndex].socketId = socket.id;
        room.players[playerIndex].status = "online";
        const player = room.players[playerIndex];

        // Join the room again
        socket.join(code);

        // Send room data back
        socket.emit("room-reconnected", {
            room,
            player,
        });

        // Notify other players that this player is back online
        socket.to(code).emit("player-status-changed", {
            playerId: player.id,
            status: "online",
            players: room.players
        });

        // Send chat history
        socket.emit("chat-history", room.messages);

        // Send existing drawing
        socket.emit("load-drawing", room.drawingData);

        // If game is in progress, send current game state
        if (room.gameStarted) {
            socket.emit("game-state-sync", {
                gamePhase: room.gamePhase,
                currentDrawer: room.currentDrawer,
                round: room.round,
                maxRounds: room.maxRounds,
                wordHint: room.currentWord ? room.currentWord.split('').map(() => '_').join(' ') : null,
                players: room.players
            });

            // Send word to drawer if reconnecting as drawer
            if (player.id === room.currentDrawer && room.currentWord) {
                socket.emit("your-word", { word: room.currentWord });
            }
        }

        console.log(`${player.name} reconnected to room ${code}`);
    })

    // Start game
    socket.on("start-game", ({ roomCode }) => {
        const room = rooms.get(roomCode);

        if (!room) {
            socket.emit("error", { message: "Room not found" });
            return;
        }

        // Only host can start
        const player = room.players.find(p => p.socketId === socket.id);
        if (!player || player.id !== room.host) {
            socket.emit("error", { message: "Only host can start the game" });
            return;
        }

        if (room.players.length < 2) {
            socket.emit("error", { message: "Need at least 2 players to start" });
            return;
        }

        room.gameStarted = true;
        room.round = 0;
        room.currentDrawerIndex = -1;

        // Reset all player scores
        room.players.forEach(p => {
            p.score = 0;
            p.hasGuessed = false;
        });

        io.to(roomCode).emit("game-started", {
            maxRounds: room.maxRounds
        });

        // Start first turn after 3 seconds
        setTimeout(() => {
            startNextTurn(roomCode);
        }, 3000);

        console.log(`Game started in room ${roomCode}`);
    })

    // Leave room
    socket.on("leave-room", ({ roomCode }) => {
        const room = rooms.get(roomCode);
        if (!room) {
            socket.emit("error", { message: "Room not found" });
            return;
        }

        const playerIndex = room.players.findIndex(p => p.socketId === socket.id);
        if (playerIndex === -1) {
            socket.emit("error", { message: "Player not found in room" });
            return;
        }

        const player = room.players[playerIndex];
        const wasHost = player.id === room.host;
        const wasDrawing = player.id === room.currentDrawer;

        // Remove player from room
        room.players.splice(playerIndex, 1);

        console.log(`${player.name} left room ${roomCode}. ${room.players.length} players remaining.`);

        // Leave the socket room
        socket.leave(roomCode);

        // Confirm to the player who left
        socket.emit("left-room", {
            message: "You have left the room",
            redirect: true
        });

        // Check if room is now empty
        if (room.players.length === 0) {
            console.log(`Room ${roomCode} is now empty. Deleting room.`);
            clearRoomTimers(roomCode);
            rooms.delete(roomCode);
            return;
        }

        // Reassign host if needed
        if (wasHost) {
            room.host = room.players[0].id;
            console.log(`New host in room ${roomCode}: ${room.players[0].name}`);
        }

        // If player was drawing during an active game, end the turn
        if (wasDrawing && room.gameStarted && room.gamePhase === "drawing") {
            console.log(`Current drawer left. Ending turn early.`);
            endTurn(roomCode);
        }

        // Notify remaining players
        io.to(roomCode).emit("player-left", {
            playerName: player.name,
            players: room.players,
            hostId: room.host,
            wasDrawing: wasDrawing
        });

        // If only 1 player remains during game, end the game
        if (room.gameStarted && room.players.length < 2) {
            console.log(`Only 1 player remaining in room ${roomCode}. Ending game.`);

            // Clear timers
            clearRoomTimers(roomCode);

            // Reset game state
            room.gameStarted = false;
            room.gamePhase = "lobby";
            room.currentDrawer = null;
            room.currentDrawerIndex = -1;
            room.round = 0;
            room.drawingData = [];
            room.correctGuessers = [];

            // Reset player scores
            room.players.forEach(p => {
                p.score = 0;
                p.hasGuessed = false;
            });

            io.to(roomCode).emit("game-ended-insufficient-players", {
                message: "Game ended: Not enough players",
                players: room.players,
                hostId: room.host
            });
        }
    })

    // Word selection
    socket.on("select-word", ({ roomCode, word }) => {
        const room = rooms.get(roomCode);
        if (!room) return;

        const player = room.players.find(p => p.socketId === socket.id);
        if (!player || player.id !== room.currentDrawer) return;

        if (!room.wordOptions.includes(word)) return;

        selectWord(roomCode, word);
    });

    // Fetch players
    socket.on("fetch-players", ({ roomId }) => {
        const room = rooms.get(roomId);

        if (!room) {
            socket.emit("error", { message: "Room not found" });
            return;
        }

        socket.emit("all-players", {
            players: room.players,
            hostId: room.host
        });
    });

    //  FETCH CHAT (REFRESH SUPPORT) 
    socket.on("fetch-chat", ({ roomId }) => {
        const room = rooms.get(roomId);
        if (!room) return;

        socket.emit("chat-history", room.messages); // refresh chat
    });

    // handle chat messages
    socket.on("send-message", ({ roomCode, message, senderName }) => {
        const room = rooms.get(roomCode);
        if (!room) return;

        const player = room.players.find(p => p.socketId === socket.id);
        if (!player) return;

        // Check if it's a guess during drawing phase
        if (room.gamePhase === "drawing") {
            checkGuess(roomCode, player.id, message);

            // Don't save guess messages to chat if they're correct
            if (message.toLowerCase().trim() === room.currentWord.toLowerCase()) {
                return;
            }
        }

        // Create message object
        const msgData = {
            message,
            senderName,
            time: Date.now(),
        };
        // Save message
        room.messages.push(msgData);

        // Broadcast to all players in the room, including sender
        io.to(roomCode).emit("receive-message", msgData);
    });

    // ** DRAWING EVENTS **
    // Handle drawing
    socket.on("draw", (drawData) => {
        const room = rooms.get(drawData.roomCode);
        if (!room) return;

        // Only current drawer can draw
        const player = room.players.find(p => p.socketId === socket.id);
        if (!player || player.id !== room.currentDrawer) return;

        // Save drawing data
        room.drawingData.push(drawData);

        // Broadcast to all other players in the room
        socket.to(drawData.roomCode).emit("draw", drawData);
    });

    // Handle clear canvas
    socket.on("clear-canvas", ({ roomCode }) => {
        const room = rooms.get(roomCode);
        if (!room) return;

        // Only current drawer can clear
        const player = room.players.find(p => p.socketId === socket.id);
        if (!player || player.id !== room.currentDrawer) return;

        // Clear drawing data
        room.drawingData = [];

        // Broadcast to all players in the room
        io.to(roomCode).emit("clear-canvas");
    });

    // Fetch drawing data (for reconnection)
    socket.on("fetch-drawing", ({ roomId }) => {
        const room = rooms.get(roomId);
        if (!room) return;

        socket.emit("load-drawing", room.drawingData);
    });

    // Handle disconnect
    socket.on("disconnect", () => {
        console.log("User disconnected: ", socket.id);

        // Find player and set status to offline
        for (const [code, room] of rooms.entries()) {
            const playerIndex = room.players.findIndex(p => p.socketId === socket.id);

            if (playerIndex !== -1) {
                const player = room.players[playerIndex];

                // Set player status to offline (don't remove from room)
                room.players[playerIndex].status = "offline";

                console.log(`${player.name} went offline in room ${code}`);

                // Notify all players in the room about status change
                io.to(code).emit("player-status-changed", {
                    playerId: player.id,
                    status: "offline",
                    players: room.players
                });

                // Check if all players are offline
                const allOffline = room.players.every(p => p.status === "offline");

                if (allOffline) {
                    console.log(`All players offline in room ${code}. Scheduling cleanup in 1 minutes...`);

                    // Schedule cleanup after 1 minutes
                    const cleanupTimer = setTimeout(() => {
                        // Double-check all still offline
                        const currentRoom = rooms.get(code);
                        if (currentRoom && currentRoom.players.every(p => p.status === "offline")) {
                            clearRoomTimers(code);
                            rooms.delete(code);
                            console.log(`Room ${code} deleted after inactivity`);
                        }
                    }, 1 * 60 * 1000);

                    // Store cleanup timer
                    if (!roomTimers.has(code)) roomTimers.set(code, {});
                    roomTimers.get(code).cleanup = cleanupTimer;
                }

                break;
            }
        }
    });

});

// Health check
app.get("/", (req, res) => {
    res.json({
        status: "Server is healthy",
        success: true,
    });
});


const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});