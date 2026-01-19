import { capitalizeFirst } from '@/utils/utils'
import { Gamepad2 } from 'lucide-react'
import React from 'react'


const PlayerGuessed = ({ message }) => {
    return (
        <div className='border flex gap-2 items-center text-white text-sm rounded-lg px-4 py-2 border-green-500 bg-white/10 backdrop-blur-md'>
            <Gamepad2 className="w-5 h-5 text-green-500 min-w-fit" />
            <p className=' font-semibold'>
                {" "}
                <span className='font-bold text-green-500'>
                    {capitalizeFirst(message)}
                </span>
                {" "}
                guessed the word.
            </p>
        </div>
    )
}




export default PlayerGuessed



