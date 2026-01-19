'use client'
// import { createAvatar } from '@dicebear/core';
// import { bottts } from '@dicebear/collection';
// import Image from 'next/image';
// import { Crown } from 'lucide-react';
// import { capitalizeFirst } from '@/utils/utils';

// const PlayerCard = ({ player, hostId, isCurrentUser }) => {
//     const isHost = player.id === hostId;
//     const isOnline = player.status === "online";

//     const avatar = createAvatar(bottts, {
//         seed: player.name,
//         backgroundColor: ["b6e3f4", "c0aede", "d1d4f9"]
//     });

//     const image = avatar.toDataUri();

//     return (
//         <div
//             className={` rounded-lg p-3 border  transition-all ${isCurrentUser
//                 ? 'bg-blue-500/20 border border-blue-400/50'
//                 : 'bg-slate-700/50 hover:bg-slate-700/70'
//                 }`}
//         >
//             <div className="flex items-center justify-between mb-2">
//                 <div className="flex items-center gap-2">
//                     <div className='rounded-full'>
//                         <Image
//                             src={image}
//                             width={25}
//                             height={25}
//                             className='rounded-full'
//                             alt={player.name}
//                         />
//                     </div>
//                     <span className="text-white font-semibold">{capitalizeFirst(player.name)}</span>
//                     {
//                         isCurrentUser &&
//                         <span className="text-white font-semibold bg-slate-800 text-[10px] rounded-full px-2 py-1">YOU</span>
//                     }
//                     {
//                         isHost &&
//                         <Crown className="w-4 h-4 text-yellow-400" />
//                     }
//                 </div>
//             </div>
//             <div className='flex justify-between items-center'>
//                 <div className="text-purple-300 text-sm flex gap-1">
//                     <span className="font-semibold">Score:</span>
//                     <span>{player.score} pts</span>
//                 </div>
//                 <div className="text-xs flex gap-1">
//                     <span className={`font-semibold tracking-wide rounded-full px-1.5 py-0.5 text-white ${isOnline ? 'bg-green-500' : 'bg-red-500'
//                         }`}>
//                         {isOnline ? 'Online' : 'Offline'}
//                     </span>
//                 </div>
//             </div>
//         </div>
//     )
// }

// export default PlayerCard

import { Crown, User, Wifi, WifiOff, Palette } from 'lucide-react';
import { createAvatar } from '@dicebear/core';
import Image from 'next/image';
import { bottts } from '@dicebear/collection';
import { capitalizeFirst } from '@/utils/utils';

const PlayerCard = ({ player, hostId, isCurrentUser, isDrawing = false, showScore = false }) => {
    const isHost = player.id === hostId;
    const isOnline = player.status === "online";

    const avatar = createAvatar(bottts, {
        seed: player.name,
        backgroundColor: ["b6e3f4", "c0aede", "d1d4f9"]
    });

    const image = avatar.toDataUri();

    return (
        <div
            className={`relative p-3 rounded-lg transition-all ${isCurrentUser
                ? 'bg-linear-to-r from-blue-600 to-purple-600 border-2 border-white/50'
                : isDrawing
                    ? 'bg-linear-to-r from-green-600 to-emerald-600 border-2 border-green-400'
                    : 'bg-slate-700/50 border border-white/10'
                } ${!isOnline && 'opacity-50'}`}
        >
            {/* Drawing indicator */}
            {isDrawing && (
                <div className="absolute -top-1 -right-1 bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1 shadow-lg">
                    <Palette className="w-3 h-3" />
                    Drawing
                </div>
            )}

            <div className="flex items-center gap-3">
                {/* Avatar */}
                <div className={`w-10 h-10 rounded-full overflow-hidden flex items-center justify-center`}>
                    <Image
                        src={image}
                        width={40}
                        height={40}
                        className='rounded-full'
                        alt={player.name}
                    />
                </div>

                {/* Player Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <span className={`font-semibold truncate ${isCurrentUser || isDrawing ? 'text-white' : 'text-gray-200'
                            }`}>
                            {capitalizeFirst(player.name)}
                        </span>
                        {isHost && (
                            <Crown className="w-4 h-4 text-yellow-400 shrink-0" />
                        )}
                        {isCurrentUser && (
                            <span className="text-xs bg-white/20 px-2 py-0.5 rounded text-white shrink-0">
                                You
                            </span>
                        )}
                    </div>

                    {/* Score display */}
                    {showScore && (
                        <div className="text-sm font-bold text-yellow-300 mt-1">
                            {player.score || 0} points
                        </div>
                    )}
                </div>

                {/* Status indicator */}
                <div className="shrink-0">
                    {isOnline ? (
                        <Wifi className="w-4 h-4 text-green-400" />
                    ) : (
                        <WifiOff className="w-4 h-4 text-red-400" />
                    )}
                </div>
            </div>
        </div>
    );
};

export default PlayerCard;