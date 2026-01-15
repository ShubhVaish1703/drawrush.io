'use client'

import { useEffect, useState } from "react";
import {
    Gamepad2,
    MessageCircle,
    SendHorizontal,
    Crown
} from 'lucide-react';
import MessageBox from "./MessageBox";
import { initSocket } from "@/socket/socket";
import PlayerCard from "./PlayerCard";

const messages = [
    { id: 1, SenderName: "Alice", message: "Hello!" },
    { id: 2, SenderName: "Bob", message: "How are you?" },
    { id: 3, SenderName: "Alice", message: "Welcome to the app" },
    { id: 4, SenderName: "Bob", message: "Message sent successfully" },
    { id: 5, SenderName: "System", message: "Something went wrong" },
    { id: 6, SenderName: "Alice", message: "Did you check the update?" },
    { id: 7, SenderName: "Bob", message: "Yes, it's working fine." },
    { id: 8, SenderName: "Alice", message: "Great to hear!" },
    { id: 9, SenderName: "Bob", message: "Let's deploy it today." },
    { id: 10, SenderName: "System", message: "Deployment started" },
    { id: 11, SenderName: "Alice", message: "Server status?" },
    { id: 12, SenderName: "Bob", message: "All services are running." },
    { id: 13, SenderName: "System", message: "New notification received" },
    { id: 14, SenderName: "Alice", message: "Pushing new changes now." },
    { id: 15, SenderName: "Bob", message: "I'll review them." },
    { id: 16, SenderName: "Alice", message: "Any feedback?" },
    { id: 17, SenderName: "Bob", message: "Looks good overall." },
    { id: 18, SenderName: "System", message: "Build successful" },
    { id: 19, SenderName: "Alice", message: "Awesome 🎉" },
    { id: 20, SenderName: "Bob", message: "Merging to main branch." },
    { id: 21, SenderName: "System", message: "Merge completed" },
    { id: 22, SenderName: "Alice", message: "Ready for release?" },
    { id: 23, SenderName: "Bob", message: "Yes, releasing now." },
    { id: 24, SenderName: "System", message: "Release successful" },
    { id: 25, SenderName: "Alice", message: "Great work team!" },
    { id: 26, SenderName: "Bob", message: "Nice collaboration 👍" },
    { id: 27, SenderName: "System", message: "Session will expire soon" },
    { id: 28, SenderName: "Alice", message: "Let's wrap up." },
    { id: 29, SenderName: "Bob", message: "Sure, see you!" },
    { id: 30, SenderName: "System", message: "Chat ended" }
];

const GameLobby = ({ roomId }) => {
    const [players, setPlayers] = useState([]);
    const socket = initSocket();

    useEffect(() => {
        // ask server for players
        socket.emit("fetch-players", { roomId });

        const handleAllPlayers = ({ players }) => {
            setPlayers(players);
        };

        socket.on("all-players", handleAllPlayers);

        return () => {
            socket.off("all-players", handleAllPlayers);
        };
    }, [roomId]);

    useEffect(() => {
        const handlePlayerJoined = ({ players }) => {
            setPlayers(players);
        };

        socket.on("player-joined", handlePlayerJoined);

        return () => {
            socket.off("player-joined", handlePlayerJoined);
        };
    }, []);

    const [messageInput, setMessageInput] = useState("");

    const handleSendMessage = () => {
        if (messageInput.trim()) {
            console.log("Sending message:", messageInput);
            setMessageInput("");
        }
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
                                <PlayerCard key={player.id} player={player} />
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
                            {messages.map((msg) => (
                                <MessageBox
                                    key={msg.id}
                                    SenderName={msg.SenderName}
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

            <style jsx>{`
                .hide-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .hide-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
        </div>
    );
};

export default GameLobby;