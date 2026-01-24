import React from 'react'

const SpamWarning = ({ message }) => {
    return (
        <div className='border flex gap-2  items-center text-white text-sm rounded-lg px-4 py-2 border-red-600 bg-red-600/50 backdrop-blur-md'>
            {message}
        </div>
    )
}

export default SpamWarning
