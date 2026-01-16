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
            status: "online"
        }],
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

        console.log(`${player.name} reconnected to room ${code}`);
    })

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

        // Save drawing data
        room.drawingData.push(drawData);

        // Broadcast to all other players in the room
        socket.to(drawData.roomCode).emit("draw", drawData);
    });

    // Handle clear canvas
    socket.on("clear-canvas", ({ roomCode }) => {
        const room = rooms.get(roomCode);
        if (!room) return;

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