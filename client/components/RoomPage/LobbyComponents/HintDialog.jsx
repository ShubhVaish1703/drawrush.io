'use client'
import React, { useState, useEffect } from 'react';
import { Settings, X, Lightbulb } from 'lucide-react';
import { createPortal } from 'react-dom';

const HintDialog = ({ hint, timeLeft }) => {
    // Check if hint should be shown (only when time <= 20 seconds)
    const canShowHint = timeLeft <= 20 && timeLeft > 0;
    // Don't render button if time is not in the valid range
    if (!canShowHint) {
        return null;
    }

    const [showHint, setShowHint] = useState(false);
    const [animateHint, setAnimateHint] = useState(false);
    const [mounted, setMounted] = useState(false);


    // Set mounted to true after component mounts (client-side only)
    useEffect(() => {
        setMounted(true);
    }, []);

    const openHint = () => {
        setShowHint(true);
        requestAnimationFrame(() => setAnimateHint(true));
    };

    const closeHint = () => {
        setAnimateHint(false);
        setTimeout(() => setShowHint(false), 300);
    };

    const HintModal = () => (
        <div
            className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 transition-opacity duration-300 ${animateHint ? "opacity-100" : "opacity-0"}`}
            onClick={closeHint}
        >
            <div
                className={`bg-white rounded-lg shadow-xl w-full max-w-md transform transition-all duration-300 ease-out
                    ${animateHint
                        ? "scale-100 translate-y-0 opacity-100"
                        : "scale-90 translate-y-6 opacity-0"
                    }`
                }
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-4 border-b border-slate-200 flex items-center justify-between shrink-0 bg-linear-to-r from-blue-50 to-purple-50 rounded-t-lg">
                    <h2 className="font-bold text-slate-800 flex items-center gap-2">
                        <Lightbulb className="w-5 h-5 text-yellow-500" />
                        AI Hint
                    </h2>
                    <button
                        onClick={closeHint}
                        className="p-1 hover:bg-white/50 rounded-full transition-colors cursor-pointer"
                        aria-label="Close hint"
                    >
                        <X className="w-5 h-5 text-slate-600" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {hint ? (
                        <div className="bg-linear-to-br from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-200">
                            <p className="text-slate-700 text-sm font-medium leading-relaxed">
                                {hint}
                            </p>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center py-8">
                            <div className="animate-pulse text-slate-400">
                                Loading hint...
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-200 bg-slate-50 rounded-b-lg">
                    <button
                        onClick={closeHint}
                        className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition-colors cursor-pointer"
                    >
                        Got it!
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <div>
            <button
                onClick={openHint}
                className='bg-linear-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white text-sm font-medium px-2 py-1 rounded-md tracking-wide transition-all duration-200 shadow-md hover:shadow-lg flex items-center gap-1 cursor-pointer'
                aria-label="Show hint"
            >
                <Lightbulb className="w-4 h-4" />
                Hint
            </button>

            {/* Render Modal using Portal - Only on client side */}
            {mounted && showHint && createPortal(
                <HintModal />,
                document.body
            )}
        </div>
    );
};

export default HintDialog;