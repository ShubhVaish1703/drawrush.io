const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const { v4: uuidv4 } = require("uuid");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*",
        credentials: true,
    },
});

// Store all rooms
const rooms = new Map();

// Generate random 6-character room code
const generateRoomCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
};

// Create new room structure
const createRoom = (hostName, playerId) => {
    const code = generateRoomCode();
    return {
        code,
        host: playerId,
        players: [{ id: playerId, name: hostName, score: 0 }],
        maxPlayers: 8,
        messages: [],//msg store here
        currentDrawer: null,
        currentWord: null,
        gameStarted: false,
        round: 0,
        maxRounds: 3,
        drawingData: [],
    };
};

io.on("connection", (socket) => {
    console.log('User connected: ', socket.id);

    // Create a new room
    socket.on("create-room", ({ playerName }) => {
        const playerId = uuidv4();
        const room = createRoom(playerName, playerId);

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
            name: playerName,
            score: 0,
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
            player: { id: playerId, name: playerName, score: 0 },
            players: room.players,
        });

        // Send existing drawing to new player
        socket.emit("load-drawing", room.drawingData);
        //send old messages
        socket.emit("chat-history", room.messages);

        console.log(`${playerName} joined room ${code}`);
    });

    //fetch player

    socket.on("fetch-players", ({ roomId }) => {
        const room = rooms.get(roomId);

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

        socket.emit("all-players", { players: room.players, hostId: room.host });
    });

    //  FETCH CHAT (REFRESH SUPPORT) 
    socket.on("fetch-chat", ({ roomId }) => {
        const room = rooms.get(roomId);
        if (!room) return;

        socket.emit("chat-history", room.messages); // refresh chat
    });

    // ** handle chat messages**
    socket.on("send-message", ({ roomCode, message, senderName }) => {
        const room = rooms.get(roomCode);
        if (!room) return;

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

        // console.log(`[${roomCode}] ${senderName}: ${message}`);
    });

    //  handle disconnect
    socket.on("disconnect", () => {
        console.log("User disconnected: ", socket.id);
        // Remove from rooms if needed
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