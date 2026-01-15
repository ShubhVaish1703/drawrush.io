'use client'
import { createAvatar } from '@dicebear/core';
import { bottts } from '@dicebear/collection';
import Image from 'next/image';
import { Crown } from 'lucide-react';
import { useEffect, useState } from "react";
import { capitalizeFirst } from '@/utils/utils';

const PlayerCard = ({ player, hostId, isCurrentUser }) => {
    const avatar = createAvatar(bottts, {
        seed: player.name,
        backgroundColor: ["b6e3f4", "c0aede", "d1d4f9"]
    });

    const image = avatar.toDataUri();

    return (
        <div
            className="bg-linear-to-r from-slate-700/80 to-slate-600/80 rounded-lg p-3 border border-white/10 hover:border-white/30 transition-all"
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
                        hostId === player.id &&
                        <Crown className="w-4 h-4 text-yellow-400" />
                    }
                </div>
            </div>
            <div className="text-purple-300 text-sm flex items-center gap-1">
                <span className="font-semibold">Score:</span>
                <span>{player.score} pts</span>
            </div>
        </div>
    )
}

export default PlayerCard
