'use client'
import { Copy } from 'lucide-react'
import React from 'react'
import toast from "react-hot-toast";

const Header = ({ roomId }) => {
    return (
        <div className="border border-white/30 rounded-xl bg-white/10 backdrop-blur-md p-4 shadow-2xl">
            <h1 className="text-3xl sm:text-5xl font-bold text-center  bg-linear-to-r from-purple-600 via-pink-500 to-pink-600 bg-clip-text text-transparent">
                DRAWRUSH
            </h1>
            <div className="text-center text-white/70 text-sm mt-1 font-semibold flex justify-center items-center gap-x-2">
                <span>Room ID: {roomId}</span>
                <button
                    className='cursor-pointer'
                    onClick={() => {
                        navigator.clipboard.writeText(roomId);
                        toast.success("Copied successfully!");
                    }}
                >
                    <Copy className='size-4' />
                </button>
            </div>
        </div>
    )
}

export default Header
