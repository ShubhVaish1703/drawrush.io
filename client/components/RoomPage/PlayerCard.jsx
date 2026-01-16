'use client'
import { createAvatar } from '@dicebear/core';
import { bottts } from '@dicebear/collection';
import Image from 'next/image';
import { Crown } from 'lucide-react';
import { useEffect, useState } from "react";
import { capitalizeFirst } from '@/utils/utils';

const PlayerCard = ({ player, hostId, isCurrentUser }) => {
    const isHost = player.id === hostId;
    const isOnline = player.status === "online";

    const avatar = createAvatar(bottts, {
        seed: player.name,
        backgroundColor: ["b6e3f4", "c0aede", "d1d4f9"]
    });

    const image = avatar.toDataUri();

    return (
        <div
            className={` rounded-lg p-3 border  transition-all ${isCurrentUser
                ? 'bg-blue-500/20 border border-blue-400/50'
                : 'bg-slate-700/50 hover:bg-slate-700/70'
                }`}
        >
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <div className='rounded-full'>
                        <Image
                            src={image}
                            width={25}
                            height={25}
                            className='rounded-full'
                            alt={player.name}
                        />
                    </div>
                    <span className="text-white font-semibold">{capitalizeFirst(player.name)}</span>
                    {
                        isCurrentUser &&
                        <span className="text-white font-semibold bg-slate-800 text-[10px] rounded-full px-2 py-1">YOU</span>
                    }
                    {
                        isHost &&
                        <Crown className="w-4 h-4 text-yellow-400" />
                    }
                </div>
            </div>
            <div className='flex justify-between items-center'>
                <div className="text-purple-300 text-sm flex gap-1">
                    <span className="font-semibold">Score:</span>
                    <span>{player.score} pts</span>
                </div>
                <div className="text-xs flex gap-1">
                    <span className={`font-semibold tracking-wide rounded-full px-1.5 py-0.5 text-white ${isOnline ? 'bg-green-500' : 'bg-red-500'
                        }`}>
                        {isOnline ? 'Online' : 'Offline'}
                    </span>
                </div>
            </div>
        </div>
    )
}

export default PlayerCard
