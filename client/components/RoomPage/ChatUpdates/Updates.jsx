import React from 'react'

const Updates = ({ message }) => {
    return (
        <div className='border flex gap-2 items-center text-white text-sm rounded-lg px-4 py-2 border-violet-600 bg-white/10 backdrop-blur-md'>
            {message}
        </div>
    )
}

export default Updates
