import { io } from "socket.io-client";

let socket = null;

const SERVER_URL = "10.34.109.167:5000"
// const SERVER_URL = "http://localhost:5000"

export const initSocket = () => {
    if (!socket) {
        socket = io(SERVER_URL, {
            transports: ["websocket"],
            reconnection: true,
            reconnectionAttempts: 5,
        });
    }
    return socket;
};
