import { capitalizeFirst } from '@/utils/utils'
import { Gamepad2 } from 'lucide-react'
import React from 'react'


const PlayerJoined = ({ message }) => {
    return (
        <div className='border flex gap-2 items-center text-white text-sm rounded-lg px-4 py-2 border-blue-400 bg-white/10 backdrop-blur-md'>
            <Gamepad2 className="w-5 h-5 text-blue-500 min-w-fit" />
            <p>
                {" "}
                <span className='font-bold text-blue-500'>
                    {capitalizeFirst(message)}
                </span>
                {" "}
                joined the room.
            </p>
        </div>
    )
}


export default PlayerJoined



