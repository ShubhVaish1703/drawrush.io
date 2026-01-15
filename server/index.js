const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

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
const createRoom = (hostId, hostName) => {
    const code = generateRoomCode();
    return {
        code,
        host: hostId,
        players: [{ id: hostId, name: hostName, score: 0 }],
        maxPlayers: 8,
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
        const room = createRoom(socket.id, playerName);
        rooms.set(room.code, room);
        socket.join(room.code);

        socket.emit("room-created", {
            code: room.code,
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

        // Add player to room
        room.players.push({
            id: socket.id,
            name: playerName,
            score: 0,
        });

        socket.join(code);
        socket.emit("room-joined", { room });

        // Notify all players in room
        io.to(code).emit("player-joined", {
            player: { id: socket.id, name: playerName, score: 0 },
            players: room.players,
        });

        // Send existing drawing to new player
        socket.emit("load-drawing", room.drawingData);

        console.log(`${playerName} joined room ${code}`);
    });

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

        socket.emit("all-players", { players: room.players });
    })

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