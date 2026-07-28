require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const { v4: uuidv4 } = require("uuid");
const { getRandomWords } = require("./words");
const { createWordHint, generateHint } = require("./utils/utils");

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
const POINTS = {
    DRAWER: 300,
    FIRST_GUESS: 150,
    OTHER_GUESS: 100
};
const MESSAGE_LIMIT = 5;
const MESSAGE_TIME_WINDOW = 3000; // 3 seconds

// Store all rooms
const rooms = new Map();
const roomTimers = new Map(); // Store active timers

// Generate unique 6-character room code
const generateRoomCode = () => {
    let code;
    do {
        code = Math.random().toString(36).substring(2, 8).toUpperCase();
    } while (rooms.has(code)); // ensure uniqueness
    return code;
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
        settings: {
            maxPlayers: 8,
            roundDuration: 60, // in seconds
            maxRounds: 3,
            difficulty: "easy", // easy, medium, hard
        },
        messages: [],//msg store here
        currentDrawer: null,
        currentDrawerIndex: -1,
        currentWord: null,
        wordOptions: [],
        gameStarted: false,
        gamePhase: "lobby", // lobby, word-selection, drawing, round-end, game-end
        round: 0,
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
        if (room.round >= room.settings.maxRounds) {
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
            if (room.round >= room.settings.maxRounds) {
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
    room.wordOptions = getRandomWords(room.settings.difficulty);
    room.gamePhase = "word-selection";
    room.turnStartTime = Date.now();

    // Notify all players about new turn
    io.to(roomCode).emit("turn-start", {
        drawerId: currentDrawer.id,
        drawerName: currentDrawer.name,
        round: room.round + 1,
        maxRounds: room.settings.maxRounds
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
    const timer = setTimeout(async () => {
        const currentRoom = rooms.get(roomCode);
        // Check room exists, still in word-selection, and no word chosen yet
        if (currentRoom &&
            currentRoom.gamePhase === "word-selection" &&
            !currentRoom.currentWord) {
            const randomWord = currentRoom.wordOptions[Math.floor(Math.random() * currentRoom.wordOptions.length)];
            await selectWord(roomCode, randomWord);
        }
    }, WORD_SELECTION_TIME);

    if (!roomTimers.has(roomCode)) roomTimers.set(roomCode, {});
    roomTimers.get(roomCode).wordSelection = timer;
}

// Handle word selection
const selectWord = async (roomCode, word) => {
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
    const ai_hint = await generateHint(word);

    // Get drawing time in milliseconds from settings
    const DRAWING_TIME = room.settings.roundDuration * 1000;

    // Notify all players
    io.to(roomCode).emit("drawing-phase-start", {
        wordLength: word.length,
        wordHint: wordHint,
        aiHint: ai_hint,
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
            settings: currentRoom.settings,
            message: "Game ended! Ready to play again?"
        });

        console.log(`Room ${roomCode}: Game reset. ${onlinePlayers.length} players remaining.`);
    }, 10000) // Wait 10 seconds to show leaderboard before reset
};

// Check if guess is correct
const checkGuess = (roomCode, playerId, guess, timeLeft) => {
    const room = rooms.get(roomCode);
    if (!room || room.gamePhase !== "drawing") return false;

    const player = room.players.find(p => p.id === playerId);
    if (!player) return false;

    // Drawer can't guess
    if (playerId === room.currentDrawer) return false;

    // Already guessed correctly
    if (player.hasGuessed) return false;
    if (typeof guess !== "string") return false;

    const isCorrect = guess.toLowerCase().trim() === room.currentWord.toLowerCase();
    if (!isCorrect) return false;

    player.hasGuessed = true;

    // Server-authoritative timing — never trust a client-sent value
    const roundDurationSec = room.settings.roundDuration;
    const elapsedSec = Math.min(
        roundDurationSec,
        Math.max(0, (Date.now() - room.turnStartTime) / 1000)
    );

    // Penalty grows with how long the guess took — fast guesses cost less now
    const timePenalty = Math.max(0, Math.ceil(elapsedSec / 2));

    if (room.correctGuessers.length === 0) {
        // First correct guess
        player.score += Math.max(0, POINTS.FIRST_GUESS - timePenalty);

        // Drawer bonus scales proportionally, not via the same flat subtraction
        const drawer = room.players.find(p => p.id === room.currentDrawer);
        if (drawer) {
            const roundDurationSec = room.settings.roundDuration;
            const speedRatio = Math.max(0, Math.min(1, timeLeftSec / roundDurationSec)); // 0..1
            drawer.score += Math.round(POINTS.DRAWER * speedRatio);
        }
    } else {
        player.score += Math.max(0, POINTS.OTHER_GUESS - timePenalty);
    }

    room.correctGuessers.push({
        playerId: player.id,
        playerName: player.name,
        time: Date.now() - room.turnStartTime
    });

    io.to(roomCode).emit("correct-guess", {
        playerId: player.id,
        playerName: player.name,
        players: room.players
    });

    const nonDrawerPlayers = room.players.filter(p => p.id !== room.currentDrawer);
    const allGuessed = nonDrawerPlayers.every(p => p.hasGuessed);
    if (allGuessed) {
        endTurn(roomCode);
    }

    return true;
}
// ==================== CHAT MESSAGE RATE LIMITING ====================
// Map: userId -> timestamps[]
const messageHistory = new Map();
function canSendMessage(userId) {
    const now = Date.now();
    const history = messageHistory.get(userId) || [];

    // remove old timestamps
    const recent = history.filter(ts => now - ts < MESSAGE_TIME_WINDOW);

    if (recent.length >= MESSAGE_LIMIT) {
        return false;
    }

    recent.push(now);
    messageHistory.set(userId, recent);
    return true;
}
const cleanupMessageHistory = (userId) => {
    setTimeout(() => {
        messageHistory.delete(userId);
    }, 5 * 60 * 1000); // Clean after 5 minutes
};

// ==================== VOICE CHAT STORAGE ====================
// Store voice chat users separately - roomCode -> Set of socketIds
const voiceChatUsers = new Map();
// ==================== VOICE CHAT HELPER FUNCTIONS ====================
// Get voice users in a room
const getVoiceUsers = (roomCode) => {
    if (!voiceChatUsers.has(roomCode)) {
        voiceChatUsers.set(roomCode, new Set());
    }
    return voiceChatUsers.get(roomCode);
};

// Add user to voice chat
const addVoiceUser = (roomCode, socketId) => {
    const users = getVoiceUsers(roomCode);
    users.add(socketId);
};

// Remove user from voice chat
const removeVoiceUser = (roomCode, socketId) => {
    const users = getVoiceUsers(roomCode);
    users.delete(socketId);

    // Clean up empty room entries
    if (users.size === 0) {
        voiceChatUsers.delete(roomCode);
    }
};

// Check if user is in voice chat
const isInVoiceChat = (roomCode, socketId) => {
    const users = getVoiceUsers(roomCode);
    return users.has(socketId);
};

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
            settings: room.settings,
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

        if (room.players.length >= room.settings.maxPlayers) {
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
            let wordHint = null;

            // Generate proper word hint if in drawing phase
            if (room.currentWord && room.gamePhase === "drawing") {
                wordHint = createWordHint(room.currentWord);
            }

            socket.emit("game-state-sync", {
                gamePhase: room.gamePhase,
                currentDrawer: room.currentDrawer,
                round: room.round,
                maxRounds: room.settings.maxRounds,
                wordHint: wordHint,
                players: room.players
            });

            // Send word to drawer if reconnecting as drawer
            if (player.id === room.currentDrawer && room.currentWord) {
                socket.emit("your-word", { word: room.currentWord });
            }
        }

        console.log(`${player.name} reconnected to room ${code}`);
    })

    // ** UPDATE GAME SETTINGS (Only host in lobby) **
    socket.on("update-settings", ({ roomCode, settings }) => {
        const room = rooms.get(roomCode);

        if (!room) {
            socket.emit("error", { message: "Room not found" });
            return;
        }

        // Only host can update settings
        const player = room.players.find(p => p.socketId === socket.id);
        if (!player || player.id !== room.host) {
            socket.emit("error", { message: "Only host can update settings" });
            return;
        }

        // Only allow updates in lobby
        if (room.gameStarted) {
            socket.emit("error", { message: "Cannot update settings during game" });
            return;
        }

        // Validate and update settings
        const { maxPlayers, roundDuration, maxRounds, difficulty } = settings;

        // Validate maxPlayers
        if (maxPlayers && maxPlayers >= 4 && maxPlayers <= 10) {
            // Don't allow reducing maxPlayers below current player count
            if (maxPlayers >= room.players.length) {
                room.settings.maxPlayers = maxPlayers;
            } else {
                socket.emit("error", {
                    message: `Cannot set max players below current player count (${room.players.length})`
                });
                return;
            }
        }

        // Validate roundDuration (30, 60, 90, 120 seconds)
        if (roundDuration && [30, 60, 90, 120].includes(roundDuration)) {
            room.settings.roundDuration = roundDuration;
        }

        // Validate maxRounds (3-8)
        if (maxRounds && maxRounds >= 3 && maxRounds <= 8) {
            room.settings.maxRounds = maxRounds;
        }

        // Validate difficulty (easy, medium, hard)
        if (difficulty && ['easy', 'medium', 'hard'].includes(difficulty)) {
            room.settings.difficulty = difficulty;
        }

        // Broadcast updated settings to all players in room
        io.to(roomCode).emit("settings-updated", {
            settings: room.settings,
            updatedBy: player.name
        });

        // console.log(`Settings updated in room ${roomCode}:`, room.settings);
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
            maxRounds: room.settings.maxRounds
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

        // Clean up message history
        cleanupMessageHistory(player.id);

        // Remove from voice chat if in it
        if (isInVoiceChat(roomCode, socket.id)) {
            removeVoiceUser(roomCode, socket.id);
            io.to(roomCode).emit("voice-user-left", {
                playerId: player.id,
                socketId: socket.id
            });
        }

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
    socket.on("select-word", async ({ roomCode, word }) => {
        const room = rooms.get(roomCode);
        if (!room) return;

        const player = room.players.find(p => p.socketId === socket.id);
        if (!player || player.id !== room.currentDrawer) return;

        if (!room.wordOptions.includes(word)) return;

        await selectWord(roomCode, word);
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

    // ** FETCH SETTINGS **
    socket.on("fetch-settings", ({ roomId }) => {
        const room = rooms.get(roomId);
        if (!room) {
            socket.emit("error", { message: "Room not found" });
            return;
        }

        socket.emit("settings-data", {
            settings: room.settings,
            hostId: room.host
        });
    });

    // handle chat messages
    socket.on("send-message", ({ roomCode, message, senderName }) => {
        const room = rooms.get(roomCode);
        if (!room) return;

        const player = room.players.find(p => p.socketId === socket.id);
        if (!player) return;

        // Check if it's a guess during drawing phase
        if (room.gamePhase === "drawing") {
            // let timeLeft = room.settings.roundDuration - timeStamp;
            // if (timeStamp === 0) {
            //     timeLeft = Math.floor(room.settings.roundDuration / 2);
            // }

            // checkGuess(roomCode, player.id, message, timeLeft);

            // // Don't save guess messages to chat if they're correct
            // if (message.toLowerCase().trim() === room.currentWord.toLowerCase()) {
            //     return;
            // }
            const wasCorrect = checkGuess(roomCode, player.id, message);

            // Don't save guess messages to chat if they were the correct answer
            if (wasCorrect) {
                return;
            }
        }

        // Rate limiting - if player is not guessing, we can apply rate limit
        if (!canSendMessage(player.id)) {
            socket.emit("spam-warning", "Slow down bro 😅, Don't Spam!");
            return;
        }

        // Create message object
        const msgData = {
            message,
            senderName,
            senderId: player.id,
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

        // Only allow drawing during drawing phase
        if (room.gamePhase !== "drawing") return;

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

    // ==================== SOCKET HANDLERS ====================
    // When a user joins voice chat
    socket.on("join-voice", ({ roomCode, playerId }) => {
        const room = rooms.get(roomCode);
        if (!room) return;

        const player = room.players.find(p => p.id === playerId && p.socketId === socket.id);
        if (!player) return;

        // Add to voice chat
        addVoiceUser(roomCode, socket.id);

        // Notify all OTHER players in the room that this player joined voice
        socket.to(roomCode).emit("voice-user-joined", {
            playerId: playerId,
            socketId: socket.id
        });

        // Send list of all players already in voice chat to the new joiner
        const voiceUsers = getVoiceUsers(roomCode);
        const voicePlayers = room.players
            .filter(p => voiceUsers.has(p.socketId) && p.socketId !== socket.id)
            .map(p => ({ playerId: p.id, socketId: p.socketId }));

        socket.emit("voice-users-list", { users: voicePlayers });

        console.log(`${player.name} joined voice chat in room ${roomCode}`);
    });

    // When a user leaves voice chat
    socket.on("leave-voice", ({ roomCode, playerId }) => {
        const room = rooms.get(roomCode);
        if (!room) return;

        const player = room.players.find(p => p.id === playerId);
        if (!player) return;

        // Remove from voice chat
        removeVoiceUser(roomCode, socket.id);

        // Notify all players in the room
        io.to(roomCode).emit("voice-user-left", {
            playerId: playerId,
            socketId: socket.id
        });

        console.log(`${player.name} left voice chat in room ${roomCode}`);
    });

    // WebRTC Offer
    socket.on("webrtc-offer", ({ targetSocketId, offer, senderId }) => {
        // Forward the offer to the target peer
        io.to(targetSocketId).emit("webrtc-offer", {
            offer: offer,
            senderSocketId: socket.id,
            senderId: senderId
        });
    });

    // WebRTC Answer
    socket.on("webrtc-answer", ({ targetSocketId, answer, senderId }) => {
        // Forward the answer to the target peer
        io.to(targetSocketId).emit("webrtc-answer", {
            answer: answer,
            senderSocketId: socket.id,
            senderId: senderId
        });
    });

    // ICE Candidate
    socket.on("webrtc-ice-candidate", ({ targetSocketId, candidate, senderId }) => {
        // Forward ICE candidate to the target peer
        io.to(targetSocketId).emit("webrtc-ice-candidate", {
            candidate: candidate,
            senderSocketId: socket.id,
            senderId: senderId
        });
    });

    // Handle disconnect
    socket.on("disconnect", () => {
        console.log("User disconnected: ", socket.id);

        // Clean up voice chat first
        for (const [roomCode, users] of voiceChatUsers.entries()) {
            if (users.has(socket.id)) {
                removeVoiceUser(roomCode, socket.id);
            }
        }

        // Find player and set status to offline
        for (const [code, room] of rooms.entries()) {
            const playerIndex = room.players.findIndex(p => p.socketId === socket.id);

            if (playerIndex !== -1) {
                const player = room.players[playerIndex];

                // Set player status to offline (don't remove from room)
                room.players[playerIndex].status = "offline";
                // Clean up message history for this player
                cleanupMessageHistory(player.id);

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
app.get("/", async (req, res) => {
    res.json({
        status: "Server is healthy",
        success: true,
    });
});


const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});