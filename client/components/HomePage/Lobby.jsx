'use client';
import { useEffect, useState } from 'react';
import { initSocket } from '@/socket/socket';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation'
import Header from './Header';

export default function DrawRush() {
    const searchParams = useSearchParams()
    const rId = searchParams.get('rid')
    const [name, setName] = useState('');
    const [roomId, setRoomId] = useState(rId || '');
    const [mode, setMode] = useState(''); // 'create' or 'join'
    const [errors, setErrors] = useState({ name: '', roomId: '' });
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const socket = initSocket();
        socket.on("connect", () => {
            // console.log("Connected:", socket.id);
        });

        socket.on("room-created", ({ code, player }) => {
            sessionStorage.setItem("player", JSON.stringify(player));
            sessionStorage.setItem("roomId", code);
            router.push(`/room/${code}`);
        });

        socket.on("room-joined", ({ room, player }) => {
            sessionStorage.setItem("player", JSON.stringify(player));
            sessionStorage.setItem("roomId", room.code);
            router.push(`/room/${room.code}`);
        });

        // Handle errors
        socket.on("error", ({ message }) => {
            setLoading(false);
            alert(message);
        });

        return () => {
            socket.off("room-created");
            socket.off("room-joined");
            socket.off("error");
            socket.off("connect");
        };
    }, []);

    const handleCreateRoom = (e) => {
        e.preventDefault();
        setErrors({ name: '', roomId: '' });
        if (!name.trim()) {
            setErrors({ name: 'Name is required', roomId: '' });
            return;
        }
        if (name.length > 20) {
            setErrors({ name: 'Name should be less than 20 characters.', roomId: '' });
            return;
        }
        setLoading(true);
        const socket = initSocket();
        socket.emit("create-room", { playerName: name.trim() });
    };


    const handleJoinRoom = (e) => {
        e.preventDefault();
        const newErrors = { name: '', roomId: '' };

        if (!name.trim()) {
            newErrors.name = 'Name is required';
        }
        if (!roomId.trim()) {
            newErrors.roomId = 'Room ID is required';
        }
        if (name.length > 20) {
            setErrors({ name: 'Name should be less than 20 characters.', roomId: '' });
            return;
        }

        if (newErrors.name || newErrors.roomId) {
            setErrors(newErrors);
            return;
        }
        setLoading(true);
        const socket = initSocket();
        socket.emit("join-room", {
            code: roomId.toUpperCase().trim(),
            playerName: name.trim(),
        });
    };


    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();

            // If both name and roomId are filled, join room
            if (name.trim() && roomId.trim()) {
                handleJoinRoom(e);
            }
            // If only name is filled, create room
            else if (name.trim() && !roomId.trim()) {
                handleCreateRoom(e);
            }
        }
    };

    return (
        <div
            className="min-h-screen flex flex-col items-center justify-center p-4 relative bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: 'url(/bgImg.jpg)' }}
        >
            <div className="absolute inset-0"></div>
            <div className='w-[95vw] absolute top-5'>
                <Header />
            </div>
            <div className="border border-pink-600 rounded-md md:rounded-3xl bg-white/10 backdrop-blur-md p-4 shadow-2xl w-full max-w-md relative z-10">
                <h1 className="text-2xl flex justify-center items-center gap-2 md:text-3xl  font-bold text-center mb-4 sm:mb-6 pb-2 bg-linear-to-r from-purple-600 via-pink-500 to-pink-600 bg-clip-text text-transparent border-b-2 border-pink-600">
                    CREATE
                    <span className='bg-pink-600 h-3 w-3 rounded-full'></span>
                    JOIN
                    <span className='bg-pink-600 h-3 w-3 rounded-full'></span>
                    PLAY
                </h1>

                <div className="rounded-2xl p-4 sm:p-6 space-y-3 sm:space-y-4">
                    <div>
                        <input
                            type="text"
                            placeholder="Enter name"
                            value={name}
                            onKeyPress={handleKeyPress}
                            onChange={(e) => {
                                setName(e.target.value);
                                if (errors.name) setErrors({ ...errors, name: '' });
                            }}
                            className={`w-full text-white px-4 py-2.5 sm:py-3 rounded-lg border-2 text-sm ${errors.name ? 'border-red-500' : 'border-pink-600'
                                } focus:border-purple-500 focus:outline-none transition-colors`}
                        />
                        {errors.name && (
                            <p className="text-red-500 text-sm mt-1 ml-1">{errors.name}</p>
                        )}
                    </div>


                    {mode === 'join' && (
                        <div>
                            <input
                                type="text"
                                placeholder="Enter room id"
                                value={roomId}
                                onKeyPress={handleKeyPress}
                                onChange={(e) => {
                                    setRoomId(e.target.value);
                                    if (errors.roomId) setErrors({ ...errors, roomId: '' });
                                }}
                                className={`w-full text-white px-4 py-2.5 sm:py-3 rounded-lg border-2 text-sm  ${errors.roomId ? 'border-red-500' : 'border-pink-600'
                                    } focus:border-purple-500 focus:outline-none transition-colors`}
                            />
                            {errors.roomId && (
                                <p className="text-red-500 text-sm mt-1 ml-1">{errors.roomId}</p>
                            )}
                        </div>
                    )}

                    <div className="flex flex-col sm:flex-row gap-3 pt-2">
                        <button
                            disabled={loading}
                            onClick={(e) => {
                                setMode('create');
                                handleCreateRoom(e);
                            }}
                            className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 bg-linear-to-r from-purple-600 to-purple-700 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-purple-800 transition-all shadow-md hover:shadow-lg text-sm cursor-pointer"
                        >
                            Create room
                        </button>
                        <button
                            disabled={loading}
                            onClick={(e) => {
                                setMode('join');
                                handleJoinRoom(e);
                            }}
                            className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 bg-linear-to-r from-pink-500 to-pink-600 text-white rounded-lg font-semibold hover:from-pink-600 hover:to-pink-700 transition-all shadow-md hover:shadow-lg text-sm cursor-pointer"
                        >
                            Join room
                        </button>
                    </div>
                </div>
            </div>
            <div className='w-[95vw] absolute bottom-5'>
                <p className='text-center text-slate-300 text-sm flex flex-col gap-2'>
                    <span>
                        DrawRush.io is a free online multiplayer drawing and guessing pictionary game.
                    </span>
                    <span>
                        A normal game consists of a few rounds, where every round a player has to draw their chosen word and others have to guess it to gain points!
                    </span>
                    <span className='hidden md:inline'>
                        The person with the most points at the end of the game, will then be crowned as the winner! Have fun!
                    </span>
                </p>
            </div>
        </div>
    );
}

