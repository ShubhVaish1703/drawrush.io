import { capitalizeFirst } from '@/utils/utils'
import React from 'react'


const GameEndedPlayersLeft = ({ message }) => {
    return (
        <div className='border flex gap-2 items-center text-white text-sm rounded-lg px-4 py-2 border-green-600 bg-white/10 backdrop-blur-md'>
            <p>
                {" "}
                <span className='font-bold text-green-500'>
                    {capitalizeFirst(message)}
                </span>
                {" "}
                Wins. Other Players left the game.
            </p>
        </div>
    )
}
export default GameEndedPlayersLeft



