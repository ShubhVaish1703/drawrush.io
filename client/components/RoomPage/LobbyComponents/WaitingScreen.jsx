import React from 'react'


const WaitingScreen = () => {
    return (
        <div className="flex flex-col h-full">
            <div className='p-3'>
                <div className="text-center font-bold text-gray-300 text-sm py-2">
                    👀 Watch and guess!
                </div>
            </div>
            <div className="flex-1 p-2 flex items-center justify-center bg-white min-h-0 overflow-hidden"
            >
                <p className='font-semibold tracking-wide text-slate-700 max-md:text-sm text-center'>
                    Hang tight! The host will start the game soon.
                </p>
            </div>
        </div>
    )
}


export default WaitingScreen



