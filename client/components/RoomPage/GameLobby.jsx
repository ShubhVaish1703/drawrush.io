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
import Header from "./Header";
import DrawingBoard from "./DrawingBoard";
import Link from "next/link";


const GameLobby = ({ roomId }) => { // Added playerName prop
    const [players, setPlayers] = useState([]);
    const socket = initSocket();
    const [currentPlayer, setCurrentPlayer] = useState(null);
    const [messages, setMessages] = useState([]);
    const [messageInput, setMessageInput] = useState("");
    const [hostId, setHostId] = useState();
    const [isReconnecting, setIsReconnecting] = useState(true);
    const [invalidUser, setInvalidUser] = useState(false);


    const desktopChatRef = useRef(null);
    const mobileChatRef = useRef(null);


    useEffect(() => {
        // Handle reconnection on mount
        const storedPlayer = sessionStorage.getItem("player");
        const storedRoomId = sessionStorage.getItem("roomId");


        if (storedPlayer && storedRoomId === roomId) {
            const player = JSON.parse(storedPlayer);
            // console.log(player);
            setCurrentPlayer(player);


            // Reconnect to room with existing playerId
            socket.emit("reconnect-room", {
                code: roomId,
                playerId: player.id
            });
        } else {
            // This is a fresh join (shouldn't happen in GameLobby, but handle it)
            setInvalidUser(true);
            setIsReconnecting(false);
        }


        // Listen for reconnection success
        const handleRoomReconnected = ({ room, player }) => {
            setCurrentPlayer(player);
            setPlayers(room.players);
            setHostId(room.host);
            setMessages(room.messages || []);
            setIsReconnecting(false);


            // Update sessionStorage with latest data
            sessionStorage.setItem("player", JSON.stringify(player));
            sessionStorage.setItem("roomId", roomId);
        };


        socket.on("room-reconnected", handleRoomReconnected);


        // Cleanup
        return () => {
            socket.off("room-reconnected", handleRoomReconnected);
        };
    }, [roomId]);


    // Fetch players and chat on mount
    useEffect(() => {
        if (isReconnecting) return;


        socket.emit("fetch-players", { roomId });
        socket.emit("fetch-chat", { roomId });


        const handleAllPlayers = ({ players, hostId }) => {
            setPlayers(players);
            setHostId(hostId);
        };


        socket.on("all-players", handleAllPlayers);


        return () => {
            socket.off("all-players", handleAllPlayers);
        };
    }, [roomId, isReconnecting]);


    // Chat history listener
    useEffect(() => {
        const handleChatHistory = (msgs) => {
            setMessages(msgs);
        };


        socket.on("chat-history", handleChatHistory);


        return () => {
            socket.off("chat-history", handleChatHistory);
        };
    }, []);


    // Player joined/left/status changed listeners
    useEffect(() => {
        const handlePlayerJoined = ({ players }) => {
            setPlayers(players);
        };


        const handlePlayerStatusChanged = ({ players }) => {
            setPlayers(players);
        };


        socket.on("player-joined", handlePlayerJoined);
        socket.on("player-status-changed", handlePlayerStatusChanged);


        return () => {
            socket.off("player-joined", handlePlayerJoined);
            socket.off("player-status-changed", handlePlayerStatusChanged);
        };
    }, []);


    // Receive messages listener
    useEffect(() => {
        const handleReceiveMessage = (data) => {
            setMessages((prev) => [...prev, data]);
        };


        socket.on("receive-message", handleReceiveMessage);


        return () => {
            socket.off("receive-message", handleReceiveMessage);
        };
    }, []);


    // Auto-scroll chat to bottom
    useEffect(() => {
        const isDesktop = window.innerWidth >= 1024;


        const activeRef = isDesktop ? desktopChatRef : mobileChatRef;


        if (activeRef.current) {
            activeRef.current.scrollTop =
                activeRef.current.scrollHeight;
        }
    }, [messages]);


    // Handle error
    useEffect(() => {
        const handleError = ({ message }) => {
            console.error("Socket error:", message);
            alert(message);
        };


        socket.on("error", handleError);


        return () => {
            socket.off("error", handleError);
        };
    }, []);


    //sending msg to server
    const handleSendMessage = () => {
        if (!messageInput.trim()) return;


        // Create message object
        const msgData = {
            roomCode: roomId,
            message: messageInput.trim(),
            senderName: currentPlayer?.name || "Guest",
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


    // Show loading state while reconnecting
    if (isReconnecting) {
        return (
            <div className="h-screen flex items-center justify-center bg-slate-900">
                <div className="text-white text-xl">Reconnecting to room...</div>
            </div>
        );
    }


    // show invalid screen, if someone tries to sneak-in the room without joining the room
    if (invalidUser) {
        return (
            <div className="h-screen flex flex-col items-center justify-center bg-slate-900 text-white text-xl ">
                <p>Oops! Please continue by joining the room.</p>
                <Link href={'/'} className="text-center w-full text-lg underline text-slate-200">
                    Go to home
                </Link>
            </div>
        );
    }


    return (
        <div className="fixed inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: 'url(/bgImg.jpg)' }}>
            {/* Background overlay */}
            <div className="absolute inset-0 bg-black/20"></div>


            {/* Desktop Layout (lg and above) */}
            <div className="relative hidden lg:flex flex-col h-full p-4 gap-4">
                <Header roomId={roomId} />


                <div className="flex gap-4 flex-1 min-h-0">
                    {/* PLAYERS PANEL */}
                    <div className="bg-slate-800/90 backdrop-blur-sm flex flex-col w-72 rounded-xl overflow-hidden border border-white/20 shadow-2xl">
                        <div className="flex text-white items-center gap-2 border-b border-white/20 p-4 bg-slate-900/50">
                            <Gamepad2 className="w-5 h-5 text-purple-400" />
                            <span className="text-lg font-semibold uppercase">Players</span>
                            <span className="ml-auto bg-purple-500 text-white text-xs px-2 py-1 rounded-full">
                                {players.length}
                            </span>
                        </div>


                        <div className="flex-1 overflow-y-auto p-3 space-y-2">
                            {players.map((player) => (
                                <PlayerCard
                                    key={player.id}
                                    player={player}
                                    hostId={hostId}
                                    isCurrentUser={currentPlayer?.id === player.id}
                                />
                            ))}
                        </div>


                        <div className="p-3 border-t border-white/20 bg-slate-900/50">
                            <button
                                className="w-full cursor-pointer bg-linear-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-3 rounded-lg transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={currentPlayer?.id !== hostId}
                            >
                                {currentPlayer?.id === hostId ? 'Start Game' : 'Waiting for host...'}
                            </button>
                        </div>
                    </div>


                    {/* GAME CANVAS */}
                    {/* <div className="bg-white flex-1 rounded-xl shadow-2xl flex items-center justify-center border-4 border-white/30 relative overflow-hidden">
                        <div className="absolute inset-0 bg-linear-to-br from-blue-50 to-purple-50"></div>
                        <div className="relative text-center p-8">
                            <div className="text-6xl mb-4">🎨</div>
                            <h2 className="text-3xl font-bold text-gray-700 mb-2">Drawing Canvas</h2>
                            <p className="text-gray-500">Waiting for game to start...</p>
                        </div>
                    </div> */}




                    {/* CANVAS */}
                    <div className="bg-slate-800/90 backdrop-blur-sm flex-1 rounded-xl overflow-hidden border border-white/20 shadow-2xl">
                        <DrawingBoard roomId={roomId} />
                    </div>


                    {/* CHAT PANEL */}
                    <div className="bg-slate-800/90 backdrop-blur-sm flex flex-col w-80 rounded-xl overflow-hidden border border-white/20 shadow-2xl">
                        <div className="flex text-white items-center gap-2 border-b border-white/20 p-4 bg-slate-900/50 shrink-0">
                            <MessageCircle className="w-5 h-5 text-blue-400" />
                            <span className="text-lg font-semibold uppercase">Chat</span>
                        </div>


                        <div
                            ref={desktopChatRef}
                            className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0"
                        >
                            {messages.map((msg, index) => (
                                <MessageBox
                                    key={`${msg.time}-${index}`}
                                    SenderName={msg.senderName}
                                    message={msg.message}
                                    isOwnMessage={msg.senderName === currentPlayer?.name}
                                />
                            ))}
                        </div>


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


            {/* Mobile Layout (below lg) */}
            <div className="relative lg:hidden flex flex-col h-full">
                <div className="shrink-0 p-3">
                    <Header roomId={roomId} />
                </div>


                {/* Fixed Canvas - Always Visible */}
                <div className="shrink-0 px-3">
                    <div className="bg-slate-800/90 backdrop-blur-sm rounded-lg overflow-hidden border border-white/20 shadow-2xl" style={{ height: '40vh', minHeight: '280px' }}>
                        <DrawingBoard roomId={roomId} />
                    </div>
                </div>


                {/* Scrollable Chat and Players */}
                <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 min-h-0">
                    {/* CHAT */}
                    <div className="bg-slate-800/90 backdrop-blur-sm flex flex-col rounded-lg overflow-hidden border border-white/20 shadow-2xl" style={{ minHeight: '250px' }}>
                        <div className="flex text-white items-center gap-2 border-b border-white/20 p-3 bg-slate-900/50 shrink-0">
                            <MessageCircle className="w-4 h-4 text-blue-400" />
                            <span className="text-sm font-semibold uppercase">Chat</span>
                        </div>


                        <div
                            ref={mobileChatRef}
                            className="flex-1 overflow-y-auto p-2 space-y-2"
                            style={{ minHeight: '150px', maxHeight: '300px' }}
                        >
                            {messages.map((msg, index) => (
                                <MessageBox
                                    key={`${msg.time}-${index}`}
                                    SenderName={msg.senderName}
                                    message={msg.message}
                                    isOwnMessage={msg.senderName === currentPlayer?.name}
                                />
                            ))}
                        </div>


                        <div className="p-2 border-t border-white/20 bg-slate-900/50 shrink-0">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={messageInput}
                                    onChange={(e) => setMessageInput(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    className="bg-white w-full px-3 font-medium py-2 text-sm rounded-lg border-none outline-none focus:ring-2 focus:ring-blue-400 transition-all"
                                    placeholder="Type a message..."
                                />
                                <button
                                    onClick={handleSendMessage}
                                    className="px-3 text-white bg-blue-500 hover:bg-blue-600 rounded-lg cursor-pointer transition-all flex items-center justify-center shadow-lg hover:shadow-xl"
                                >
                                    <SendHorizontal className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>


                    {/* PLAYERS */}
                    <div className="bg-slate-800/90 backdrop-blur-sm flex flex-col rounded-lg overflow-hidden border border-white/20 shadow-2xl" style={{ minHeight: '200px' }}>
                        <div className="flex text-white items-center gap-2 border-b border-white/20 p-3 bg-slate-900/50">
                            <Gamepad2 className="w-4 h-4 text-purple-400" />
                            <span className="text-sm font-semibold uppercase">Players</span>
                            <span className="ml-auto bg-purple-500 text-white text-xs px-2 py-1 rounded-full">
                                {players.length}
                            </span>
                        </div>


                        <div className="flex-1 overflow-y-auto p-2 space-y-2" style={{ minHeight: '100px', maxHeight: '250px' }}>
                            {players.map((player) => (
                                <PlayerCard
                                    key={player.id}
                                    player={player}
                                    hostId={hostId}
                                    isCurrentUser={currentPlayer?.id === player.id}
                                />
                            ))}
                        </div>


                        <div className="p-2 border-t border-white/20 bg-slate-900/50">
                            <button
                                className="w-full cursor-pointer bg-linear-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-2.5 text-sm rounded-lg transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={currentPlayer?.id !== hostId}
                            >
                                {currentPlayer?.id === hostId ? 'Start Game' : 'Waiting for host...'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};


export default GameLobby;

