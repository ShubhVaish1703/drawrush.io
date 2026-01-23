import { io } from "socket.io-client";

let socket = null;

const SERVER_URL = "https://draw-rush-server.onrender.com"
// const SERVER_URL = "http://localhost:5000"

export const initSocket = () => {
    if (!socket) {
        socket = io(SERVER_URL, {
            transports: ["websocket", 'polling'],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000
        });
    }
    return socket;
};