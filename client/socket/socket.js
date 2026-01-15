import { io } from "socket.io-client";

let socket = null;

export const initSocket = () => {
    if (!socket) {
        socket = io("http://localhost:5000", {
            transports: ["websocket"],
            reconnection: true,
            reconnectionAttempts: 5,
        });
    }
    return socket;
};
