'use client';
import { useEffect, useState } from 'react';
import { initSocket } from '@/socket/socket';
import { useRouter } from 'next/navigation';

export default function DrawRush() {
    const [name, setName] = useState('');
    const [roomId, setRoomId] = useState('');
    const [mode, setMode] = useState(''); // 'create' or 'join'
    const [errors, setErrors] = useState({ name: '', roomId: '' });
    const router = useRouter();

    useEffect(() => {
        const socket = initSocket();

        socket.on("connect", () => {
            // console.log("Connected:", socket.id);
        });

        socket.on("room-created", ({ code, player }) => {
            sessionStorage.setItem("player", JSON.stringify(player));
            router.push(`/room/${code}`);
        });

        socket.on("room-joined", ({ room, player }) => {
            sessionStorage.setItem("player", JSON.stringify(player))
            router.push(`/room/${room.code}`);
        });

        return () => {
            socket.off("room-created");
            socket.off("room-joined");
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
        const socket = initSocket();
        socket.emit("create-room", { playerName: name });
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

        if (newErrors.name || newErrors.roomId) {
            setErrors(newErrors);
            return;
        }
        const socket = initSocket();
        socket.emit("join-room", {
            code: roomId.toUpperCase(),
            playerName: name,
        });
    };

    return (
        <div
            className="min-h-screen flex items-center justify-center p-4 relative bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: 'url(/bgImg.jpg)' }}
        >
            <div className="absolute inset-0"></div>
            <div className="bg-white/95 rounded-3xl shadow-2xl p-6 sm:p-8 w-full max-w-md relative z-10">
                <h1 className="text-3xl sm:text-4xl font-bold text-center mb-6 sm:mb-8 bg-linear-to-r from-purple-600 via-pink-500 to-pink-600 bg-clip-text text-transparent">
                    DRAWRUSH
                </h1>

                <div className="bg-linear-to-br from-purple-50 to-pink-50 rounded-2xl p-4 sm:p-6 space-y-3 sm:space-y-4 border-2 border-pink-200">
                    <div>
                        <input
                            type="text"
                            placeholder="Enter name"
                            value={name}
                            onChange={(e) => {
                                setName(e.target.value);
                                if (errors.name) setErrors({ ...errors, name: '' });
                            }}
                            className={`w-full px-4 py-2.5 sm:py-3 rounded-lg border-2 text-sm sm:text-base ${errors.name ? 'border-red-500' : 'border-gray-300'
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
                                onChange={(e) => {
                                    setRoomId(e.target.value);
                                    if (errors.roomId) setErrors({ ...errors, roomId: '' });
                                }}
                                className={`w-full px-4 py-2.5 sm:py-3 rounded-lg border-2 text-sm sm:text-base ${errors.roomId ? 'border-red-500' : 'border-gray-300'
                                    } focus:border-purple-500 focus:outline-none transition-colors`}
                            />
                            {errors.roomId && (
                                <p className="text-red-500 text-sm mt-1 ml-1">{errors.roomId}</p>
                            )}
                        </div>
                    )}

                    <div className="flex flex-col sm:flex-row gap-3 pt-2">
                        <button
                            onClick={(e) => {
                                setMode('create');
                                handleCreateRoom(e);
                            }}
                            className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 bg-linear-to-r from-purple-600 to-purple-700 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-purple-800 transition-all shadow-md hover:shadow-lg text-sm sm:text-base cursor-pointer"
                        >
                            Create room
                        </button>
                        <button
                            onClick={(e) => {
                                setMode('join');
                                handleJoinRoom(e);
                            }}
                            className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 bg-linear-to-r from-pink-500 to-pink-600 text-white rounded-lg font-semibold hover:from-pink-600 hover:to-pink-700 transition-all shadow-md hover:shadow-lg text-sm sm:text-base cursor-pointer"
                        >
                            Join room
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}