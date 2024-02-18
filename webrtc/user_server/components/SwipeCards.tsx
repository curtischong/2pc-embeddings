// pages/SwipeCards.tsx
'use client';
import React, { useState } from 'react';
import { useSpring, animated } from 'react-spring';

const questions = [
    { id: 1, text: "Do you prefer reading books over going to a party?" },
    { id: 2, text: "Would you rather spend time in nature than in a shopping mall?" },
    { id: 3, text: "Is your idea of a perfect evening a quiet night with close friends?" },
    { id: 4, text: "Do you find peace in solitude and quiet moments?" },
    { id: 5, text: "Do you enjoy deep conversations about life and the universe?" },
];

export default function SwipeCards() {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);

    const [style, animate] = useSpring(() => ({
        from: { opacity: 1, transform: 'scale(1) translateX(0px)' },
        config: { tension: 250, friction: 20 },
    }));

    const swipe = (direction) => {
        setIsAnimating(true);
        // Animate card out
        animate({
            to: [
                { opacity: 0, transform: `scale(0.8) translateX(${direction * 100}px)` },
            ],
            onRest: () => {
                // Prepare for next card
                setCurrentQuestionIndex((prev) => (prev + 1) % questions.length);
                setIsAnimating(false);
                // Reset without animation
                animate.start({ opacity: 1, transform: 'scale(1) translateX(0px)', immediate: true });
            },
        });
    };

    const question = questions[currentQuestionIndex];

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-pink-50">
            <animated.div
                style={style}
                className="w-96 p-6 bg-white rounded-xl shadow-md overflow-hidden"
            >
                <h2 className="text-center text-2xl text-pink-600 mb-4">Question {question.id}</h2>
                <p className="text-center text-pink-700">{question.text}</p>
            </animated.div>
            <div className="mt-8 flex justify-center gap-4">
                <button
                    onClick={() => swipe(-1)}
                    disabled={isAnimating}
                    className="px-4 py-2 bg-pink-500 text-white rounded-md text-lg font-medium hover:bg-pink-700 transition duration-200 ease-in-out"
                >
                    Swipe Left
                </button>
                <button
                    onClick={() => swipe(1)}
                    disabled={isAnimating}
                    className="px-4 py-2 bg-pink-500 text-white rounded-md text-lg font-medium hover:bg-pink-700 transition duration-200 ease-in-out"
                >
                    Swipe Right
                </button>
            </div>
        </div>
    );
}
