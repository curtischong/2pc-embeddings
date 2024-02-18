// pages/index.tsx
'use client';
import React from 'react';
import Image from 'next/image';

export default function Home() {
  return (
    <div className="flex flex-col items-center bg-pink-50">
      <div className="text-center p-12">
        <h1 className="text-5xl font-bold text-pink-600">
          Welcome to LoveBeacon ❤️
        </h1>
        <p className="mt-3 text-pink-700">
          Finding love by securely sharing your {' '}
          <code className="p-1 font-mono text-sm bg-pink-200 rounded-md">
            personality embeddings
          </code>
        </p>
        <div className="mt-6">
          <a
        href="swipe"
            className="px-6 py-3 bg-pink-500 text-white rounded-md text-lg font-medium hover:bg-pink-700 transition duration-200 ease-in-out"
          >
            Find Your Match
          </a>
        </div>
      </div>

      {/* Technology explanation section */}
      <div className="w-full px-6 py-16 bg-pink-100 border-t-4 border-pink-300">
        <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="md:flex">
            <div className="md:flex-shrink-0">
              {/* Ensure the path to the image is correct */}
              <Image
                src="/lighthouse.png"
                alt="Love image"
                width={192}  // Adjust as needed
                height={192} // Adjust as needed
                objectFit="cover"
                className="h-48 w-full object-cover md:h-full md:w-48"
              />
            </div>
            <div className="p-8">
              <h2 className="text-3xl text-pink-600 font-semibold mb-6">
                How LoveBeacon Works
              </h2>
              <p className="text-pink-700 mb-4">
                LoveBeacon uses two-person compute technology to match you with potential partners in a private, secure way. It's like a digital cupid working behind the scenes. Here's how it connects hearts:
              </p>
              <ul className="list-disc list-inside text-pink-700 mb-4 space-y-2">
                <li>Upload your profile and let LoveBeacon create your unique love print.</li>
                <li>Our matchmaking algorithm weaves its magic to find your perfect match.</li>
                <li>Privacy-first approach ensures your personal details are always under wraps.</li>
                <li>Receive curated matches that are in tune with your heart's desires.</li>
              </ul>
              <p className="text-pink-700">
                With LoveBeacon, finding your soulmate is safe, private, and enchanting.
              </p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
