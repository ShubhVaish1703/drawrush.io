'use client'
import React, { useState, useEffect } from 'react';
import { Settings, Users, Clock, Trophy, X } from 'lucide-react';
import { initSocket } from '@/socket/socket';
import { createPortal } from 'react-dom';


const SettingsScreen = ({ roomCode, playerId, hostId }) => {
    const socket = initSocket();
    const [settings, setSettings] = useState({
        maxPlayers: 8,
        roundDuration: 60,
        maxRounds: 3
    });
    const [showSettings, setShowSettings] = useState(false);
    const [animateSettings, setAnimateSettings] = useState(false);
    const [tempSettings, setTempSettings] = useState(settings);
    const [isHost, setIsHost] = useState(false);
    const [mounted, setMounted] = useState(false);


    useEffect(() => {
        setMounted(true);
        setIsHost(playerId === hostId);
    }, [playerId, hostId]);


    useEffect(() => {
        // Fetch current settings on mount
        if (socket && roomCode) {
            socket.emit('fetch-settings', { roomId: roomCode });
        }


        // Listen for settings updates
        const handleSettingsUpdated = (data) => {
            setSettings(data.settings);
            setTempSettings(data.settings);
            // Show notification if not the one who updated
            if (data.updatedBy) {
                console.log(`Settings updated by ${data.updatedBy}`);
            }
        };


        const handleSettingsData = (data) => {
            setSettings(data.settings);
            setTempSettings(data.settings);
        };


        if (socket) {
            socket.on('settings-updated', handleSettingsUpdated);
            socket.on('settings-data', handleSettingsData);
        }


        return () => {
            if (socket) {
                socket.off('settings-updated', handleSettingsUpdated);
                socket.off('settings-data', handleSettingsData);
            }
        };
    }, [socket, roomCode]);


    const handleSettingChange = (key, value) => {
        setTempSettings(prev => ({
            ...prev,
            [key]: value
        }));
    };


    const handleSaveSettings = () => {
        if (socket && roomCode) {
            socket.emit('update-settings', {
                roomCode,
                settings: tempSettings
            });
            closeSettings();
        }
    };


    const handleCancelSettings = () => {
        setTempSettings(settings);
        closeSettings();
    };


    const openSettings = () => {
        setShowSettings(true);
        requestAnimationFrame(() => setAnimateSettings(true));
    };


    const closeSettings = () => {
        setAnimateSettings(false);
        setTimeout(() => setShowSettings(false), 300);
    };


    const SettingsModal = () => (
        <div
            className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 transition-opacity duration-300 ${animateSettings ? "opacity-100" : "opacity-0"}`}
            onClick={closeSettings}
        >
            <div
                className={`bg-white rounded-lg shadow-xl w-full max-w-md transform transition-all duration-300 ease-out
                                ${animateSettings
                        ? "scale-100 translate-y-0 opacity-100"
                        : "scale-90 translate-y-6 opacity-0"
                    }`
                }
                onClick={(e) => e.stopPropagation()}
            >


                <div className="p-4 border-b border-slate-200 flex items-center justify-between shrink-0 bg-white rounded-t-lg">
                    <h2 className="font-bold text-slate-800 flex items-center gap-2">
                        <Settings className="w-5 h-5" />
                        Game Settings
                    </h2>
                    <button
                        onClick={closeSettings}
                        className="p-1 hover:bg-slate-100 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5 text-slate-600" />
                    </button>
                </div>


                <div className="p-4 space-y-4">
                    {/* Max Players */}
                    <div>
                        <label className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            Maximum Players
                        </label>
                        <select
                            value={tempSettings.maxPlayers}
                            onChange={(e) => handleSettingChange('maxPlayers', parseInt(e.target.value))}
                            className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none"
                        >
                            {[4, 5, 6, 7, 8, 9, 10].map(num => (
                                <option key={num} value={num}>{num} players</option>
                            ))}
                        </select>
                        <p className="text-xs text-slate-500 mt-1">
                            How many players can join the room
                        </p>
                    </div>


                    {/* Round Duration */}
                    <div>
                        <label className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            Round Duration
                        </label>
                        <select
                            value={tempSettings.roundDuration}
                            onChange={(e) => handleSettingChange('roundDuration', parseInt(e.target.value))}
                            className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none"
                        >
                            {[30, 60, 90, 120].map(duration => (
                                <option key={duration} value={duration}>
                                    {duration} seconds
                                </option>
                            ))}
                        </select>
                        <p className="text-xs text-slate-500 mt-1">
                            Time limit for each drawing round
                        </p>
                    </div>


                    {/* Number of Rounds */}
                    <div>
                        <label className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                            <Trophy className="w-4 h-4" />
                            Number of Rounds
                        </label>
                        <select
                            value={tempSettings.maxRounds}
                            onChange={(e) => handleSettingChange('maxRounds', parseInt(e.target.value))}
                            className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none"
                        >
                            {[3, 4, 5, 6, 7, 8].map(rounds => (
                                <option key={rounds} value={rounds}>
                                    {rounds} rounds
                                </option>
                            ))}
                        </select>
                        <p className="text-xs text-slate-500 mt-1">
                            Total number of rounds in the game
                        </p>
                    </div>
                </div>


                <div className="p-4 border-t border-slate-200 flex gap-2">
                    <button
                        onClick={handleCancelSettings}
                        className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium cursor-pointer text-sm"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSaveSettings}
                        className="flex-1 px-4 py-2 bg-blue-500 text-sm text-white rounded-lg hover:bg-blue-600 transition-colors font-medium cursor-pointer"
                    >
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    )


    return (
        <div className="flex flex-col h-full">
            <div className='p-3'>
                <div className="text-center font-bold text-gray-300 text-md py-2">
                    ⚙️ Game Settings
                </div>
            </div>


            <div className="flex-1 p-4 flex flex-col items-center justify-center bg-white min-h-0 overflow-hidden">
                {/* Current settings display */}
                <div className="bg-slate-900/90 rounded-lg px-4 py-8 w-full max-w-md mb-4">
                    <div className="space-y-4 text-sm text-white">
                        <div className="flex items-center justify-between">
                            <span className="flex items-center gap-2 font-medium tracking-wide">
                                <Users className="w-4 h-4" />
                                Max Players:
                            </span>
                            <span className="font-semibold">{settings.maxPlayers}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="flex items-center gap-2 font-medium tracking-wide">
                                <Clock className="w-4 h-4" />
                                Round Duration:
                            </span>
                            <span className="font-semibold">{settings.roundDuration}s</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="flex items-center gap-2 font-medium tracking-wide">
                                <Trophy className="w-4 h-4" />
                                Total Rounds:
                            </span>
                            <span className="font-semibold">{settings.maxRounds}</span>
                        </div>
                    </div>
                </div>


                {/* Settings button (only for host) */}
                {isHost && (
                    <button
                        onClick={openSettings}
                        className="flex items-center gap-2 px-4 py-2  text-white rounded-lg bg-blue-600 hover:bg-blue-700 cursor-pointer transition-colors font-medium text-sm tracking-wide"
                    >
                        <Settings className="w-4 h-4" />
                        Configure Settings
                    </button>
                )}


                {!isHost && (
                    <p className="text-xs text-black mt-2">
                        Only the host can change game settings
                    </p>
                )}
            </div>


            {/* Render Modal using Portal - This ensures it's above everything */}
            {mounted && showSettings && isHost && createPortal(
                <SettingsModal />,
                document.body
            )}


        </div>
    );
};


export default SettingsScreen;

