'use client'

import { useEffect, useState, useRef } from "react";
import {
    Gamepad2,
    MessageCircle,
    SendHorizontal,
    Trophy,
    Clock,
    Palette,
    Copy
} from 'lucide-react';
import MessageBox from "./MessageBox";
import { initSocket } from "@/socket/socket";
import PlayerCard from "./PlayerCard";
import Header from "./Header";
import DrawingBoard from "./DrawingBoard";
import Link from "next/link";
import { capitalizeFirst, truncateText } from "@/utils/utils";
import toast from "react-hot-toast";
import PlayerJoined from "./ChatUpdates/PlayerJoined";
import PlayerGuessed from "./ChatUpdates/PlayerGuessed";
import { useRouter } from "next/navigation";
import Updates from "./ChatUpdates/Updates";
import GameEndedPlayersLeft from "./ChatUpdates/GameEndedPlayersLeft";
import WaitingScreen from "./LobbyComponents/WaitingScreen";
// import VoiceChat from "./VoiceChat/VoiceChat";
import SettingsScreen from "./LobbyComponents/SettingsScreen";
import HintDialog from "./LobbyComponents/HintDialog";
import VoiceChat from "./VoiceChat/VoiceChat";
import GameSoundEffects from "./GameSoundEffects/GameSoundEffects";

const GameLobby = ({ roomId }) => { // Added playerName prop
    const [players, setPlayers] = useState([]);
    const socket = initSocket();
    const [currentPlayer, setCurrentPlayer] = useState(null);
    const [messages, setMessages] = useState([]);
    const [messageInput, setMessageInput] = useState("");
    const [hostId, setHostId] = useState();
    const [isReconnecting, setIsReconnecting] = useState(true);
    const [invalidUser, setInvalidUser] = useState(false);
    const router = useRouter();

    // Game state
    const [gameStarted, setGameStarted] = useState(false);
    const [gamePhase, setGamePhase] = useState("lobby");
    const [currentDrawer, setCurrentDrawer] = useState(null);
    const [currentRound, setCurrentRound] = useState(0);
    const [maxRounds, setMaxRounds] = useState(3);
    const [wordOptions, setWordOptions] = useState([]);
    const [selectedWord, setSelectedWord] = useState(null);
    const [wordHint, setWordHint] = useState("");
    const [aiHint, setAiHint] = useState("");
    const [timeLeft, setTimeLeft] = useState(0);
    const [correctGuessers, setCorrectGuessers] = useState([]);
    const [revealedWord, setRevealedWord] = useState("");
    const [leaderboard, setLeaderboard] = useState([]);
    const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

    const desktopChatRef = useRef(null);
    const mobileChatRef = useRef(null);
    const timerRef = useRef(null);

    // useEffect render at first, loads all initial state and data  ,, reconnecting logic
    useEffect(() => {
        // Handle reconnection on mount
        const storedPlayer = sessionStorage.getItem("player");
        const storedRoomId = sessionStorage.getItem("roomId");

        if (storedPlayer && storedRoomId === roomId) {
            const player = JSON.parse(storedPlayer);
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
            setGameStarted(room.gameStarted);
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

    // Chat listeners
    useEffect(() => {
        const handleChatHistory = (msgs) => {
            setMessages(msgs);
        };

        const handleReceiveMessage = (data) => {
            setMessages((prev) => [...prev, data]);
        };

        socket.on("chat-history", handleChatHistory);
        socket.on("receive-message", handleReceiveMessage);

        return () => {
            socket.off("chat-history", handleChatHistory);
            socket.off("receive-message", handleReceiveMessage);
        };
    }, []);

    // Player joined/left/status changed listeners
    useEffect(() => {
        const handlePlayerJoined = ({ players, player }) => {
            // add a temporary mesg to messages array, that player it joined and show it in a custom way
            const mesg = {
                message: `${player.name}`,
                type: "player-joined"
            }
            setMessages((prev) => [...prev, mesg]);
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

    // Game event listeners
    useEffect(() => {
        // Game started
        const handleGameStarted = ({ maxRounds }) => {
            setGameStarted(true);
            setMaxRounds(maxRounds);
            setGamePhase("starting");
        };

        // Turn start
        const handleTurnStart = ({ drawerId, drawerName, round, maxRounds }) => {
            setCurrentDrawer(drawerId);
            setCurrentRound(round);
            setMaxRounds(maxRounds);
            setGamePhase("turn-start");
            setCorrectGuessers([]);
            setRevealedWord("");
            setWordHint("");
            setSelectedWord(null);
        };

        // Word options (only for drawer)
        const handleWordOptions = ({ words, timeLimit }) => {
            setWordOptions(words);
            setGamePhase("word-selection");
            setTimeLeft(Math.floor(timeLimit / 1000));
        };

        // Drawing phase start
        const handleDrawingPhaseStart = ({ wordHint, timeLimit, aiHint }) => {
            setGamePhase("drawing");
            setWordHint(wordHint);
            setAiHint(aiHint);
            setTimeLeft(Math.floor(timeLimit / 1000));
            setWordOptions([]);
        };

        // Your word (only for drawer)
        const handleYourWord = ({ word }) => {
            setSelectedWord(word);
        };

        // Correct guess
        const handleCorrectGuess = ({ playerId, playerName, players }) => {
            setPlayers(players);
            // add a temporary mesg to messages array, that this player guess is correct
            const mesg = {
                message: `${playerName}`,
                type: "player-guessed"
            }
            setMessages((prev) => [...prev, mesg]);
            setCorrectGuessers(prev => [...prev, { playerId, playerName }]);
        };

        // Turn end
        const handleTurnEnd = ({ word, players }) => {
            setRevealedWord(word);
            setPlayers(players);
            setGamePhase("turn-end");
            setTimeLeft(0);
        };

        // Round end
        const handleRoundEnd = ({ round, players }) => {
            setPlayers(players);
            setGamePhase("round-end");
            // add round ended message to chat, new round will start soon
            // Show notification in chat
            const notification = {
                type: 'updates',
                message: `Round ${round} completed! Next Round will start soon.`,
            };
            setMessages(prev => [...prev, notification]);
            setCurrentRound(round);
        };

        // Game end
        const handleGameEnd = ({ leaderboard, winner }) => {
            setLeaderboard(leaderboard);
            setGamePhase("game-end");
            setGameStarted(false);
        };

        // Game reset (after leaderboard)
        const handleGameReset = ({ players, hostId, message }) => {
            setPlayers(players);
            setHostId(hostId);
            setGamePhase("lobby");
            setGameStarted(false);
            setCurrentDrawer(null);
            setCurrentRound(0);
            setLeaderboard([]);
            setCorrectGuessers([]);
            setWordHint("");
            setSelectedWord(null);
            setRevealedWord("");

            // Show notification to players
            toast(message, {
                icon: '👏',
            });
        };

        // handle player left
        const handlePlayerLeft = ({ playerName, players, hostId, wasDrawing }) => {
            // Update player list
            setPlayers(players);
            setHostId(hostId);

            // Show notification in chat
            const notification = {
                type: 'updates',
                message: `${capitalizeFirst(playerName)} left the room`,
            };
            setMessages(prev => [...prev, notification]);

            // Extra notification if drawer left
            if (wasDrawing) {
                const drawerLeftNotification = {
                    type: 'updates',
                    message: `${capitalizeFirst(playerName)} left the room. Moving to next turn...`,
                };
                setMessages(prev => [...prev, drawerLeftNotification]);
            }
        };

        const handleLeftRoom = ({ redirect }) => {
            if (redirect) {
                // Clear session storage
                sessionStorage.removeItem("player");
                sessionStorage.removeItem("roomId");

                toast.success("You have left the room. Redirecting to home...");

                // Small delay to ensure socket disconnect is processed
                setTimeout(() => {
                    router.push("/");
                }, 100);
            }
        };

        const handleGameEndedInsufficientPlayers = ({ message, players, hostId }) => {
            // Update state
            setPlayers(players);
            setHostId(hostId);
            setGameStarted(false);
            setGamePhase("lobby");
            setCurrentDrawer(null);
            setCurrentRound(0);
            setCorrectGuessers([]);
            setWordHint("");
            setSelectedWord(null);
            setRevealedWord("");
            setLeaderboard([]);

            const GameEndedNotSufficientPLayersMessage = {
                type: 'game-ended',
                message: `${players[0]?.name}`,
            };
            setMessages(prev => [...prev, GameEndedNotSufficientPLayersMessage]);

            // Show alert
            setTimeout(() => {
                toast.error(message);
            }, 300);
        };

        // Game state sync (for reconnection)
        const handleGameStateSync = ({ gamePhase, currentDrawer, round, maxRounds, wordHint, players }) => {
            setGamePhase(gamePhase);
            setCurrentDrawer(currentDrawer);
            setCurrentRound(round);
            setMaxRounds(maxRounds);
            setWordHint(wordHint || "");
            setPlayers(players);
        };

        socket.on("game-started", handleGameStarted);
        socket.on("turn-start", handleTurnStart);
        socket.on("word-options", handleWordOptions);
        socket.on("drawing-phase-start", handleDrawingPhaseStart);
        socket.on("your-word", handleYourWord);
        socket.on("correct-guess", handleCorrectGuess);
        socket.on("turn-end", handleTurnEnd);
        socket.on("round-end", handleRoundEnd);
        socket.on("game-end", handleGameEnd);
        socket.on("game-reset", handleGameReset);

        // Leave room events (NEW!)
        socket.on("player-left", handlePlayerLeft);
        socket.on("left-room", handleLeftRoom);
        socket.on("game-ended-insufficient-players", handleGameEndedInsufficientPlayers);

        socket.on("game-state-sync", handleGameStateSync);

        return () => {
            socket.off("game-started", handleGameStarted);
            socket.off("turn-start", handleTurnStart);
            socket.off("word-options", handleWordOptions);
            socket.off("drawing-phase-start", handleDrawingPhaseStart);
            socket.off("your-word", handleYourWord);
            socket.off("correct-guess", handleCorrectGuess);
            socket.off("turn-end", handleTurnEnd);
            socket.off("round-end", handleRoundEnd);
            socket.off("game-end", handleGameEnd);
            socket.off("game-reset", handleGameReset);
            socket.off("player-left", handlePlayerLeft);
            socket.off("left-room", handleLeftRoom);
            socket.off("game-ended-insufficient-players", handleGameEndedInsufficientPlayers);
            socket.off("game-state-sync", handleGameStateSync);
        };
    }, []);

    // Timer countdown
    useEffect(() => {
        if (timeLeft > 0) {
            timerRef.current = setInterval(() => {
                setTimeLeft(prev => Math.max(0, prev - 1));
            }, 1000);
        } else {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        }

        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, [timeLeft]);

    // Auto-scroll chat to bottom
    useEffect(() => {
        const isDesktop = window.innerWidth >= 1024;
        const activeRef = isDesktop ? desktopChatRef : mobileChatRef;

        if (activeRef.current) {
            activeRef.current.scrollTop = activeRef.current.scrollHeight;
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

    // Send message
    const handleSendMessage = () => {
        if (!messageInput.trim()) return;

        // Create message object
        const msgData = {
            roomCode: roomId,
            message: messageInput.trim(),
            senderName: currentPlayer?.name || "Guest",
        };

        // Send to server
        socket.emit("send-message", msgData); // Send to server
        setMessageInput("");
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSendMessage();
        }
    };

    // Start game
    const handleStartGame = () => {
        setGameStarted(true);
        socket.emit("start-game", { roomCode: roomId });
    };

    // Select word
    const handleSelectWord = (word) => {
        socket.emit("select-word", { roomCode: roomId, word });
    };

    // Leave room
    const handleLeaveRoom = () => {
        setShowLeaveConfirm(true);
    };

    const confirmLeaveRoom = () => {
        socket.emit("leave-room", { roomCode: roomId });
        setShowLeaveConfirm(false);
    };

    const cancelLeaveRoom = () => {
        setShowLeaveConfirm(false);
    };

    // Get current drawer name
    const getCurrentDrawerName = () => {
        const drawer = players.find(p => p.id === currentDrawer);
        return drawer ? drawer.name : "";
    };

    // Check if current player is drawer
    const isCurrentPlayerDrawer = currentPlayer?.id === currentDrawer;

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
            <div className="absolute inset-0 bg-black/20"></div>

            {/* Add Sound Effects Component */}
            <GameSoundEffects
                gamePhase={gamePhase}
                timeLeft={timeLeft}
                currentRound={currentRound}
                gameStarted={gameStarted}
            />

            {/* Leave Room Confirmation Modal */}
            {showLeaveConfirm
                &&
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
                    <div className="bg-slate-800 p-6 rounded-xl border-2 border-slate-600 shadow-2xl max-w-md w-full mx-4">
                        <h2 className="text-white text-xl font-bold mb-4">Leave Room?</h2>
                        <p className="text-gray-300 mb-6">
                            Are you sure you want to leave? {gameStarted && "The game is in progress."}
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={confirmLeaveRoom}
                                className="flex-1 bg-red-700 hover:bg-red-600 cursor-pointer text-white font-bold py-3 rounded-lg transition-all"
                            >
                                Yes, Leave
                            </button>
                            <button
                                onClick={cancelLeaveRoom}
                                className="flex-1 bg-slate-600 hover:bg-slate-700 cursor-pointer text-white font-bold py-3 rounded-lg transition-all"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            }

            {/* Word Selection Popup */}
            {
                gamePhase === "word-selection" && isCurrentPlayerDrawer &&
                (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
                        <div className="bg-slate-800 p-8 rounded-xl border-2 border-pink-600 shadow-2xl max-w-md w-full mx-4">
                            <h2 className="text-white text-2xl font-bold text-center mb-4">Choose a Word!</h2>
                            <div className="text-center text-gray-300 mb-6 flex items-center justify-center gap-2">
                                <Clock className="w-5 h-5 text-yellow-400" />
                                <span className="text-xl font-bold text-yellow-400">{timeLeft}s</span>
                            </div>
                            <div className="space-y-3">
                                {wordOptions.map((word, index) => (
                                    <button
                                        key={index}
                                        onClick={() => handleSelectWord(word)}
                                        className="w-full bg-linear-to-r from-pink-500 to-pink-600 hover:cursor-pointer hover:from-pink-600 hover:to-pink-700 text-white font-bold py-4 px-6 rounded-lg transition-all transform hover:scale-105 text-xl"
                                    >
                                        {capitalizeFirst(word)}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

            {/* Turn End Popup */}
            {gamePhase === "turn-end" && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
                    <div className="bg-slate-800 p-8 rounded-xl border-2 border-pink-600 shadow-2xl max-w-md w-full mx-4">
                        <h2 className="text-white text-2xl font-bold text-center mb-4">
                            The word was: <span className="text-purple-600">{capitalizeFirst(revealedWord)}</span>
                        </h2>
                        {correctGuessers.length > 0 ? (
                            <div>
                                <p className="text-gray-300 text-center mb-4">Players who guessed correctly:</p>
                                <ul className="space-y-2">
                                    {correctGuessers.map((guesser, index) => (
                                        <li key={index} className="text-white text-center bg-green-600/50 py-2 rounded">
                                            🎉 {capitalizeFirst(guesser.playerName)}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ) : (
                            <p className="text-gray-400 text-center">Nobody guessed the word!</p>
                        )}
                    </div>
                </div>
            )}

            {/* Game End Popup */}
            {gamePhase === "game-end" && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
                    <div className="bg-slate-800 p-8 rounded-xl border-2 border-pink-600 shadow-2xl max-w-lg w-full mx-4">
                        <div className="text-center mb-6">
                            <Trophy className="w-16 h-16 text-pink-600 mx-auto mb-4" />
                            <h2 className="text-pink-600 text-2xl font-bold">Game Over!</h2>
                        </div>
                        <div className="space-y-3 mb-6">
                            {leaderboard.slice(0, 3).map((player, index) => (
                                <div
                                    key={player.id}
                                    className={`flex items-center justify-between p-4 rounded-lg 
                                        ${index === 0 ? 'bg-yellow-600' :
                                            index === 1 ? 'bg-gray-400' :
                                                index === 2 ? 'bg-orange-600' :
                                                    'bg-slate-700'
                                        }
                                        `}
                                >
                                    <span className="text-white font-bold flex items-center gap-2">
                                        <span className="text-2xl">
                                            {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`}
                                        </span>
                                        {capitalizeFirst(player.name)}
                                    </span>
                                    <span className="text-white font-bold">{player.score} pts</span>
                                </div>
                            ))}
                        </div>
                        <button
                            // onClick={() => setGamePhase("lobby")}
                            className="w-full bg-linear-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 cursor-pointer text-white font-bold py-3 rounded-lg transition-all"
                        >
                            Returning to Lobby…
                        </button>
                    </div>
                </div>
            )}

            {/* Desktop Layout */}
            <div className="relative hidden lg:flex flex-col h-full p-4 gap-4">
                {
                    !gameStarted &&
                    <Header roomId={roomId} />
                }

                {/* Game Info Bar */}
                {
                    gameStarted && gamePhase !== "game-end" && (
                        <div className="bg-white/10 backdrop-blur-md rounded-md md:rounded-xl shadow-2xl p-4 border border-pink-600 flex items-center justify-between">
                            {/* round and current drawer name */}
                            <div className="flex items-center gap-6 text-white flex-[25%]">
                                <div className="flex items-center gap-2">
                                    <Palette className="w-5 h-5 text-purple-400" />
                                    <p className="font-semibold">
                                        Drawing:
                                        {" "}
                                        <span className="text-purple-400">
                                            {truncateText(capitalizeFirst(getCurrentDrawerName()), 12)}
                                        </span>
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Trophy className="w-5 h-5 text-yellow-400" />
                                    <p className="font-semibold">
                                        Round
                                        {" "}
                                        <span className="text-purple-400">
                                            {currentRound == 0 ? 1 : currentRound}/{maxRounds}
                                        </span>
                                    </p>
                                </div>
                            </div>

                            {/* logo and copy button */}
                            <div className="flex-[50%]">
                                <h1 className="text-3xl sm:text-5xl font-bold text-center  bg-linear-to-r from-purple-600 via-pink-500 to-pink-600 bg-clip-text text-transparent">
                                    DRAWRUSH
                                </h1>
                                <div className="text-center text-white/70 text-xs md:text-sm mt-1 font-semibold flex justify-center items-center gap-x-2">
                                    <span>Room ID: {roomId}</span>
                                    <button
                                        className='cursor-pointer'
                                        onClick={() => {
                                            navigator.clipboard.writeText(roomId);
                                            toast.success("Copied successfully!");
                                        }}
                                    >
                                        <Copy className='size-3 md:size-4' />
                                    </button>
                                </div>
                            </div>

                            {/* timer and word */}
                            <div className="flex-[25%] flex justify-between gap-6 shrink-0 items-center">
                                {gamePhase === "drawing" && (
                                    <div className="flex items-center gap-2 flex-1">
                                        {isCurrentPlayerDrawer ? (
                                            <p className="font-semibold text-white ">Your word:
                                                {" "}
                                                <span className="text-purple-400 underline tracking-wider">
                                                    {capitalizeFirst(selectedWord)}
                                                </span>
                                            </p>
                                        ) : (
                                            <div className="flex flex-col gap-2">
                                                <p className="font-semibold text-white">Word
                                                    {" "}(
                                                    {wordHint?.replace(/\s+/g, '')?.length}
                                                    ){" "}
                                                    :
                                                    {" "}
                                                    <span className="text-purple-400 text-sm tracking-wider pl-1">
                                                        {wordHint}
                                                    </span>
                                                </p>
                                                <HintDialog hint={aiHint} timeLeft={timeLeft} />
                                            </div>
                                        )}
                                    </div>
                                )}
                                <div className="flex items-center gap-2 bg-slate-900/50 px-4 py-2 rounded-lg ">
                                    <Clock className="w-5 h-5 text-yellow-400" />
                                    {
                                        timeLeft > 0 ?
                                            <span className="text-yellow-400 font-bold text-xl">{timeLeft}s</span>
                                            :
                                            <span className="text-yellow-400 font-semibold">Waiting</span>
                                    }
                                </div>
                            </div>
                        </div>
                    )
                }

                {/* Game Screen */}
                <div className="flex gap-4 flex-1 min-h-0">
                    {/* PLAYERS PANEL */}
                    <div className="bg-slate-800/90 backdrop-blur-sm flex flex-col w-72 rounded-xl overflow-hidden border border-white/20 shadow-2xl">
                        <div className="flex text-white items-center justify-between gap-2 border-b border-white/20 p-4 bg-slate-900/50">
                            <div className="flex justify-center items-center gap-2">
                                <Gamepad2 className="w-5 h-5 text-purple-400" />
                                <span className="text-lg font-semibold uppercase">Players</span>
                                <span className="ml-auto bg-purple-500 text-white text-xs px-2 py-1 rounded-full">
                                    {players.length}
                                </span>
                            </div>
                            <div>
                                <button
                                    onClick={handleLeaveRoom}
                                    className={`px-1.5 py-1 md:px-3 md:py-2 rounded-lg tracking-wider text-sm bg-red-700 text-white hover:bg-red-600 transition font-semibold cursor-pointer`}
                                >
                                    Leave
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-3 space-y-2">
                            {players.map((player) => (
                                <PlayerCard
                                    key={player.id}
                                    player={player}
                                    hostId={hostId}
                                    isCurrentUser={currentPlayer?.id === player.id}
                                    isDrawing={player.id === currentDrawer}
                                    showScore={gameStarted}
                                />
                            ))}
                        </div>

                        {!gameStarted && (
                            <div className="p-3 border-t border-white/20 bg-slate-900/50">
                                <button
                                    onClick={handleStartGame}
                                    className="w-full cursor-pointer bg-linear-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-3 rounded-lg transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={currentPlayer?.id !== hostId || players.length < 2}
                                >
                                    {currentPlayer?.id === hostId ? 'Start Game' : 'Waiting for host...'}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* CANVAS */}
                    <div className="bg-slate-800/90 backdrop-blur-sm flex-1 rounded-xl overflow-hidden border border-white/20 shadow-2xl">
                        {!gameStarted && currentPlayer?.id !== hostId && (
                            <WaitingScreen />
                        )}

                        {!gameStarted && currentPlayer?.id === hostId && (
                            <SettingsScreen
                                roomCode={roomId}
                                playerId={currentPlayer?.id}
                                hostId={hostId}
                            />
                        )}
                        {
                            gameStarted &&
                            <DrawingBoard
                                roomId={roomId}
                                canDraw={isCurrentPlayerDrawer && gamePhase === "drawing"}
                            />
                        }
                    </div>

                    {/* CHAT PANEL */}
                    <div className="bg-slate-800/90 backdrop-blur-sm flex flex-col w-80 rounded-xl overflow-hidden border border-white/20 shadow-2xl">
                        <div className="flex text-white items-center gap-2 border-b border-white/20 p-4 bg-slate-900/50 shrink-0">
                            <MessageCircle className="w-5 h-5 text-blue-400" />
                            <span className="text-lg font-semibold uppercase">Chat</span>

                            <div className="flex w-full justify-end">
                                <VoiceChat
                                    isCurrentPlayerDrawer={isCurrentPlayerDrawer}
                                    roomCode={roomId}
                                    playerId={currentPlayer?.id}
                                />
                            </div>
                        </div>

                        <div ref={desktopChatRef} className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
                            {messages.map((msg, index) => {
                                if (msg?.type == "player-joined") {
                                    return (
                                        <PlayerJoined
                                            key={index}
                                            message={msg?.message}
                                        />
                                    )
                                }
                                else if (msg?.type == "player-guessed") {
                                    return (
                                        <PlayerGuessed
                                            key={index}
                                            message={msg?.message}
                                        />
                                    )
                                }
                                else if (msg?.type == "updates") {
                                    return (
                                        <Updates
                                            key={index}
                                            message={msg?.message}
                                        />
                                    )
                                }
                                else if (msg?.type == "game-ended") {
                                    return (
                                        <GameEndedPlayersLeft
                                            key={index}
                                            message={msg?.message}
                                        />
                                    )
                                }
                                else {
                                    return (
                                        <MessageBox
                                            key={`${msg.time}-${index}`}
                                            SenderName={msg.senderName}
                                            message={msg.message}
                                            isOwnMessage={msg.senderName === currentPlayer?.name}
                                        />
                                    )
                                }
                            })}
                        </div>

                        {/* message input  */}
                        <div className="p-3 border-t border-white/20 bg-slate-900/50 shrink-0">
                            {/* if current player is drawer , dont show player the message input */}
                            {
                                (!isCurrentPlayerDrawer) ?

                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={messageInput}
                                            onChange={(e) => setMessageInput(e.target.value)}
                                            onKeyPress={handleKeyPress}
                                            className="bg-white w-full text-sm px-3 font-medium py-2 rounded-lg border-none outline-none focus:ring-2 focus:ring-blue-400 transition-all"
                                            placeholder={gamePhase === "drawing" && !isCurrentPlayerDrawer ? "Guess the word..." : "Type a message..."}
                                        />
                                        <button
                                            onClick={handleSendMessage}
                                            className="px-3 text-white bg-blue-500 hover:bg-blue-600 rounded-lg cursor-pointer transition-all flex items-center justify-center shadow-lg hover:shadow-xl"
                                        >
                                            <SendHorizontal className="w-5 h-5" />
                                        </button>
                                    </div>
                                    :
                                    <div className="py-2">
                                        <p className="text-slate-300 text-center text-sm">
                                            Chat is disabled while drawing.
                                        </p>
                                    </div>
                            }
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Layout - Similar structure with responsive adjustments */}
            <div className="relative lg:hidden flex flex-col h-full">
                {/* Name Header */}
                <>
                    {
                        !gameStarted ?
                            <div className="shrink-0 p-3">
                                <Header roomId={roomId} />
                            </div>
                            :
                            <div className="py-4">
                                <h1 className="text-3xl font-bold text-center  bg-linear-to-r from-purple-600 via-pink-500 to-pink-600 bg-clip-text text-transparent">
                                    DRAWRUSH
                                </h1>
                            </div>
                    }
                </>

                {/* Game Info Bar */}
                {
                    gameStarted && gamePhase !== "game-end" && (
                        <div className="shrink-0 px-3 pb-3">
                            <div className="bg-white/10 backdrop-blur-md rounded-md md:rounded-xl shadow-2xl p-2 border border-pink-600 flex items-center justify-between text-xs gap-6 flex-wrap">
                                {/* round and current drawer name */}
                                <div className="flex flex-col items-start justify-center gap-y-2 text-white">
                                    <div className="flex items-center gap-2">
                                        <Palette className="w-5 h-5 text-purple-400" />
                                        <p className="font-semibold">
                                            Drawing:
                                            {" "}
                                            <span className="text-purple-400">
                                                {truncateText(capitalizeFirst(getCurrentDrawerName()), 12)}
                                            </span>
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Trophy className="w-5 h-5 text-yellow-400" />
                                        <p className="font-semibold">
                                            Round
                                            {" "}
                                            <span className="text-purple-400">
                                                {currentRound == 0 ? 1 : currentRound}/{maxRounds}
                                            </span>
                                        </p>
                                    </div>
                                </div>

                                {/* timer and word */}
                                <div className="flex-1 flex flex-col gap-y-2 shrink-0 items-start justify-center">
                                    {gamePhase === "drawing" && (
                                        <div className="flex items-center gap-2 flex-1">
                                            {isCurrentPlayerDrawer ? (
                                                <p className="font-semibold text-white ">Your word:
                                                    {" "}
                                                    <span className="text-purple-400 underline tracking-wider">
                                                        {capitalizeFirst(selectedWord)}
                                                    </span>
                                                </p>
                                            ) : (
                                                <div className="flex gap-2">
                                                    <p className="font-semibold text-white">Word
                                                        {" "}(
                                                        {wordHint?.replace(/\s+/g, '')?.length}
                                                        ){" "}
                                                        :
                                                        {" "}
                                                        <span className="text-purple-400 tracking-wider pl-1">
                                                            {wordHint}
                                                        </span>
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    <div className="flex justify-between items-center gap-2">
                                        <div className="flex items-center justify-center gap-2 bg-slate-900/50 px-2 py-1 rounded-lg ">
                                            <Clock className="w-4 h-4 text-yellow-400" />
                                            {
                                                timeLeft > 0 ?
                                                    <span className="text-yellow-400 font-bold text-base">{timeLeft}s</span>
                                                    :
                                                    <span className="text-yellow-400 font-semibold">Waiting</span>
                                            }
                                        </div>
                                        <HintDialog hint={aiHint} timeLeft={timeLeft} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                }

                {/* Game Secion- Drawing board */}
                {
                    !gameStarted &&
                    <div className="shrink-0 px-3">
                        <div className="bg-slate-800/90 backdrop-blur-sm flex-1 rounded-xl overflow-hidden border border-white/20 shadow-2xl">
                            {!gameStarted && currentPlayer?.id !== hostId && (
                                <div style={{ height: '35vh', minHeight: '280px' }}>
                                    <WaitingScreen />
                                </div>
                            )}

                            {!gameStarted && currentPlayer?.id === hostId && (
                                <SettingsScreen
                                    roomCode={roomId}
                                    playerId={currentPlayer?.id}
                                    hostId={hostId}
                                />
                            )}
                        </div>
                    </div>
                }
                {
                    gameStarted &&
                    <div className="shrink-0 px-3">
                        <div className="bg-slate-800/90 z-100 backdrop-blur-sm rounded-lg overflow-hidden border border-white/20 shadow-2xl" style={{ height: '40vh', minHeight: '280px' }}>
                            <DrawingBoard
                                roomId={roomId}
                                canDraw={isCurrentPlayerDrawer && gamePhase === "drawing"}
                            />
                        </div>
                    </div>
                }

                {/* PLayer card and chats */}
                <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 min-h-0">
                    {/* chat box */}
                    <div className="bg-slate-800/90 backdrop-blur-sm flex flex-col rounded-lg overflow-hidden border border-white/20 shadow-2xl" style={{ minHeight: '250px' }}>
                        {/* header for chat */}
                        <div className="flex text-white items-center gap-2 border-b border-white/20 p-3 bg-slate-900/50 shrink-0">
                            <MessageCircle className="w-4 h-4 text-blue-400" />
                            <span className=" font-semibold uppercase">Chat</span>

                            <div className="flex w-full justify-end">
                                <VoiceChat
                                    isCurrentPlayerDrawer={isCurrentPlayerDrawer}
                                    roomCode={roomId}
                                    playerId={currentPlayer?.id}
                                />
                            </div>
                        </div>

                        {/* display messages */}
                        <div ref={mobileChatRef} className="flex-1 overflow-y-auto p-2 space-y-2" style={{ minHeight: '200px', maxHeight: '350px' }}>
                            {messages.map((msg, index) => {
                                if (msg?.type == "player-joined") {
                                    return (
                                        <PlayerJoined
                                            key={index}
                                            message={msg?.message}
                                        />
                                    )
                                }
                                else if (msg?.type == "player-guessed") {
                                    return (
                                        <PlayerGuessed
                                            key={index}
                                            message={msg?.message}
                                        />
                                    )
                                }
                                else if (msg?.type == "updates") {
                                    return (
                                        <Updates
                                            key={index}
                                            message={msg?.message}
                                        />
                                    )
                                }
                                else if (msg?.type == "game-ended") {
                                    return (
                                        <GameEndedPlayersLeft
                                            key={index}
                                            message={msg?.message}
                                        />
                                    )
                                }
                                else {
                                    return (
                                        <MessageBox
                                            key={`${msg.time}-${index}`}
                                            SenderName={msg.senderName}
                                            message={msg.message}
                                            isOwnMessage={msg.senderName === currentPlayer?.name}
                                        />
                                    )
                                }
                            })}
                        </div>

                        {/* input message */}
                        <div className="p-3 border-t border-white/20 bg-slate-900/50 shrink-0">
                            {/* if current player is drawer , dont show player the message input */}
                            {
                                (!isCurrentPlayerDrawer) ?
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={messageInput}
                                            onChange={(e) => setMessageInput(e.target.value)}
                                            onKeyPress={handleKeyPress}
                                            className="bg-white w-full text-sm px-3 font-medium py-2 rounded-lg border-none outline-none focus:ring-2 focus:ring-blue-400 transition-all"
                                            placeholder={gamePhase === "drawing" && !isCurrentPlayerDrawer ? "Guess the word..." : "Type a message..."}
                                        />
                                        <button
                                            onClick={handleSendMessage}
                                            className="px-3 text-white bg-blue-500 hover:bg-blue-600 rounded-lg cursor-pointer transition-all flex items-center justify-center shadow-lg hover:shadow-xl"
                                        >
                                            <SendHorizontal className="w-5 h-5" />
                                        </button>
                                    </div>
                                    :
                                    <div className="py-2">
                                        <p className="text-slate-300 text-center text-sm">
                                            Chat is disabled while drawing.
                                        </p>
                                    </div>
                            }
                        </div>
                    </div>

                    <div className="bg-slate-800/90 backdrop-blur-sm flex flex-col rounded-lg overflow-hidden border border-white/20 shadow-2xl" style={{ minHeight: '250px' }}>

                        <div className="flex text-white items-center justify-between gap-2 border-b border-white/20 p-4 bg-slate-900/50">
                            <div className="flex justify-center items-center gap-2">
                                <Gamepad2 className="w-4 h-4 text-purple-400" />
                                <span className="font-semibold uppercase">Players</span>
                                <span className="ml-auto bg-purple-500 text-white text-xs px-2 py-1 rounded-full">
                                    {players.length}
                                </span>
                            </div>
                            <div>
                                <button
                                    onClick={handleLeaveRoom}
                                    className={`px-3 py-1.5 rounded-lg tracking-wider text-sm bg-red-700 text-white hover:bg-red-600 transition font-semibold cursor-pointer`}
                                >
                                    Leave
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-2 space-y-2" style={{ minHeight: '100px', maxHeight: '250px' }}>
                            {players.map((player) => (
                                <PlayerCard
                                    key={player.id}
                                    player={player}
                                    hostId={hostId}
                                    isCurrentUser={currentPlayer?.id === player.id}
                                    isDrawing={player.id === currentDrawer}
                                    showScore={gameStarted}
                                />
                            ))}
                        </div>

                        {!gameStarted && (
                            <div className="p-2 border-t border-white/20 bg-slate-900/50">
                                <button
                                    onClick={handleStartGame}
                                    className="w-full cursor-pointer bg-linear-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-2.5 text-sm rounded-lg transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={currentPlayer?.id !== hostId || players.length < 2}
                                >
                                    {currentPlayer?.id === hostId ? 'Start Game' : 'Waiting for host...'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};


export default GameLobby;

