'use client'
import { Copy, Link } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import toast from "react-hot-toast";


const Header = ({ roomId }) => {
    const [origin, setOrigin] = useState('');


    useEffect(() => {
        setOrigin(window.location.origin);
    }, []);


    const url = origin + `?rid=${roomId}`;


    return (
        <div className="border border-pink-600 rounded-md md:rounded-xl bg-white/10 backdrop-blur-md p-4 shadow-2xl">
            <h1 className="text-3xl sm:text-5xl font-bold text-center  bg-linear-to-r from-purple-600 via-pink-500 to-pink-600 bg-clip-text text-transparent">
                DRAWRUSH
            </h1>
            <div className="text-center text-white/70 text-xs md:text-sm mt-1 font-semibold flex justify-center items-center gap-x-1">
                <span>Room ID: {roomId}</span>
                <button
                    className='cursor-pointer'
                    onClick={() => {
                        navigator.clipboard.writeText(roomId);
                        toast.success("Copied successfully!");
                    }}
                >
                    <Copy className='size-3 md:size-4' />
                </button>
                <button
                    onClick={() => {
                        navigator.clipboard.writeText(url);
                        toast.success("Invite link copied!");
                    }}
                    className='flex gap-1 justify-center items-center text-pink-600 underline cursor-pointer  px-2 py-0.5'>
                    <Link className='size-3 md:size-4' />
                    Invite
                </button>
            </div>
        </div>
    )
}


export default Header



