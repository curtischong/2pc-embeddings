// app/match/page.tsx
'use client';

import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';

const MatchPage = () => {
    useEffect(() => {
        // Trigger confetti on component mount
        confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
        });
    }, []);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-pink-100">
            <div className="text-center">
                <h1 className="text-4xl font-bold text-pink-600 mb-4">Its a Match!</h1>
                <p className="text-2xl text-pink-700 mb-8">💖✨🎉</p>
                <div className="animate-pulse text-5xl">
                    💕
                </div>
            </div>
        </div>
    );
};

export default MatchPage;
