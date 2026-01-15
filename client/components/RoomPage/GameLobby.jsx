'use client'

import { useEffect, useState, useRef } from "react";
import {
    Gamepad2,
    MessageCircle,
    SendHorizontal,
} from 'lucide-react';
import MessageBox from "./MessageBox";
import { initSocket } from "@/socket/socket";
import PlayerCard from "./PlayerCard";

const GameLobby = ({ roomId, playerName }) => { // Added playerName prop
    const [players, setPlayers] = useState([]);
    const socket = useRef(initSocket()).current; // Keep same socket instance
    const [username, setUsername] = useState(playerName || ""); // Initialize username
    const [messages, setMessages] = useState([]);
    const [messageInput, setMessageInput] = useState("");
    const [hostId, setHostId] = useState();

    const messagesEndRef = useRef(null); // For auto-scrolling chat

    //chat history

    useEffect(() => {
        const handleChatHistory = (msgs) => {
            setMessages(msgs);
        };

        socket.on("chat-history", handleChatHistory);

        return () => {
            socket.off("chat-history", handleChatHistory);
        };
    }, [socket]);

    // Scroll chat to bottom whenever messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    useEffect(() => {
        // ask server for players
        socket.emit("fetch-players", { roomId });
        socket.emit("fetch-chat", { roomId });

        const handleAllPlayers = ({ players, hostId }) => {
            setPlayers(players);
            setHostId(hostId);
            // Set username if not already set
            if (!username) {
                const me = players.find(p => p.id === socket.id);
                if (me) setUsername(me.name);
            }
        };

        socket.on("all-players", handleAllPlayers);

        return () => {
            socket.off("all-players", handleAllPlayers);
        };
    }, [roomId]);

    //player joined listener
    useEffect(() => {
        const handlePlayerJoined = ({ players }) => {
            setPlayers(players);
        };

        socket.on("player-joined", handlePlayerJoined);

        return () => {
            socket.off("player-joined", handlePlayerJoined);
        };
    }, [socket]);

    //receive messages
    useEffect(() => {
        const handleReceiveMessage = (data) => {
            setMessages((prev) => [...prev, data]);
        };

        socket.on("receive-message", handleReceiveMessage);

        return () => {
            socket.off("receive-message", handleReceiveMessage);
        };
    }, [socket]);

    //sending msg to server 
    const handleSendMessage = () => {
        if (!messageInput.trim()) return;

        // Create message object
        const msgData = {
            roomCode: roomId,
            message: messageInput,
            senderName: username || "Guest",
        };
        //send to server
        socket.emit("send-message", msgData); // Send to server

        setMessageInput("");
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSendMessage();
        }
    };

    return (
        <div
            className="h-screen p-4 relative bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: 'url(/bgImg.jpg)' }}
        >
            {/* Background overlay */}
            <div className="absolute inset-0 bg-black/20"></div>

            <div className="relative flex flex-col h-full gap-4">
                {/* HEADER */}
                <div className="border border-white/30 rounded-xl bg-white/10 backdrop-blur-md p-4 shadow-2xl">
                    <h1 className="text-3xl sm:text-5xl font-bold text-center  bg-linear-to-r from-purple-600 via-pink-500 to-pink-600 bg-clip-text text-transparent">
                        DRAWRUSH
                    </h1>
                    <p className="text-center text-white/70 text-sm mt-1 font-semibold">Room ID: {roomId}</p>
                </div>

                {/* MAIN CONTENT - min-h-0 is crucial for flex children with overflow */}
                <div className="flex gap-4 flex-1 min-h-0">
                    {/* PLAYERS PANEL */}
                    <div className="bg-slate-800/90 backdrop-blur-sm flex flex-col w-72 rounded-xl overflow-hidden border border-white/20 shadow-2xl">
                        {/* Header */}
                        <div className="flex text-white items-center gap-2 border-b border-white/20 p-4 bg-slate-900/50">
                            <Gamepad2 className="w-5 h-5 text-purple-400" />
                            <span className="text-lg font-semibold uppercase">
                                Players
                            </span>
                            <span className="ml-auto bg-purple-500 text-white text-xs px-2 py-1 rounded-full">
                                {players.length}
                            </span>
                        </div>

                        {/* Players List - scrollable */}
                        <div className="flex-1 overflow-y-auto p-3 space-y-2">
                            {players.map((player) => (
                                <PlayerCard key={player.id} player={player} hostId={hostId} />
                            ))}
                        </div>

                        {/* Start Game Button */}
                        <div className="p-3 border-t border-white/20 bg-slate-900/50">
                            <button className="w-full cursor-pointer bg-linear-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-3 rounded-lg transition-all shadow-lg hover:shadow-xl">
                                Start Game
                            </button>
                        </div>
                    </div>

                    {/* GAME CANVAS */}
                    <div className="bg-white flex-1 rounded-xl shadow-2xl flex items-center justify-center border-4 border-white/30 relative overflow-hidden">
                        <div className="absolute inset-0 bg-linear-to-br from-blue-50 to-purple-50"></div>
                        <div className="relative text-center p-8">
                            <div className="text-6xl mb-4">🎨</div>
                            <h2 className="text-3xl font-bold text-gray-700 mb-2">Drawing Canvas</h2>
                            <p className="text-gray-500">Waiting for game to start...</p>
                        </div>
                    </div>

                    {/* CHAT PANEL */}
                    <div className="bg-slate-800/90 backdrop-blur-sm flex flex-col w-80 rounded-xl overflow-hidden border border-white/20 shadow-2xl">
                        {/* Header */}
                        <div className="flex text-white items-center gap-2 border-b border-white/20 p-4 bg-slate-900/50 shrink-0">
                            <MessageCircle className="w-5 h-5 text-blue-400" />
                            <span className="text-lg font-semibold uppercase">
                                Chat
                            </span>
                        </div>

                        {/* Messages - scrollable area that takes remaining space */}
                        <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
                            {messages.map((msg, index) => (
                                <MessageBox
                                    key={index}
                                    SenderName={msg.senderName}
                                    message={msg.message}
                                />
                            ))}
                        </div>

                        {/* Input - fixed at bottom */}
                        <div className="p-3 border-t border-white/20 bg-slate-900/50 shrink-0">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={messageInput}
                                    onChange={(e) => setMessageInput(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    className="bg-white w-full px-3 font-medium py-2 rounded-lg border-none outline-none focus:ring-2 focus:ring-blue-400 transition-all"
                                    placeholder="Type a message..."
                                />
                                <button
                                    onClick={handleSendMessage}
                                    className="px-3 text-white bg-blue-500 hover:bg-blue-600 rounded-lg cursor-pointer transition-all flex items-center justify-center shadow-lg hover:shadow-xl"
                                >
                                    <SendHorizontal className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GameLobby;