<<<<<<< HEAD
// pages/index.tsx
'use client';
import React from 'react';
import Image from 'next/image';
=======
'use client'
import React, { useState, useCallback, useEffect } from 'react';
import {WebSocketDemo} from '../components/WebRTC';
import  { aliceComputeDotProduct, aliceInit2pc, aliceReceiveVFromBob } from '../2pc/src/calculate';



const Home = () => {

const [currentPerson , setCurrentPerson] = useState('')

const [responseText, setResponseText] = useState('');

const handleConnect = async () => {
  try {
    const ws = new WebSocket('ws://localhost:8000/connect');

ws.onopen = () => {
  console.log('WebSocket connection established');
};

ws.onmessage = (event) => {
  console.log('Message received:', event.data);
};

ws.onerror = (error) => {
  console.error('WebSocket error:', error);
};

ws.onclose = () => {
  console.log('WebSocket connection closed');
};

  } catch (error) {
    console.error('Error:', error);
  }
};

const handleDisconnect = async () => {
  try {
    const ws = new WebSocket('ws://localhost:8000/disconnect');

ws.onopen = () => {
  console.log('WebSocket connection established');
};

ws.onmessage = (event) => {
  console.log('Message received:', event.data);
};

ws.onerror = (error) => {
  console.error('WebSocket error:', error);
};

ws.onclose = () => {
  console.log('WebSocket connection closed');
};

  } catch (error) {
    console.error('Error:', error);
  }
};

const handlePostEmbeddings = async () => {
  try {
    const response = await fetch('http://localhost:8000/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        MBTI: 'example',
        Love_Languages: 'example',
        Hobbies: 'example'
      })
    });
    const data = await response.json();
    setResponseText(JSON.stringify(data));
  } catch (error) {
    console.error('Error:', error);
  }
};

const initAlice =  () => {
  try {
    setCurrentPerson('Alice')
    return aliceInit2pc(0)
  
  } catch (error) {
    console.error('Error:', error);
  }
};

const computeA =  () => {
  try {
    return aliceComputeDotProduct()
  
  } catch (error) {
    console.error('Error:', error);
  }
};

   // Initialize state with the value from localStorage or a default value
   const [profile, setProfile] = useState(() => {
    const saved = localStorage.getItem('profile');
    return saved ? JSON.parse(saved) : '';
  });

  // Effect to update localStorage when twopcKey changes
  useEffect(() => {
    // Use JSON.stringify to handle complex data types
    localStorage.setItem('profile', JSON.stringify(profile));
  }, [profile]);


 

>>>>>>> refs/remotes/origin/main

export default function Home() {
  return (
<<<<<<< HEAD
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
=======
    <div className="text-center m-4">
  <h1 className="text-2xl font-bold mb-4">You are {currentPerson || 'Uninitialized'} profile={profile}</h1>
  <div className="flex justify-center gap-4">
  <div>
      <p>Current 2PC Key: {profile}</p>
      <button onClick={() => setProfile('updatedProfile')} className="px-4 py-2 rounded-md bg-green-500 text-white hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50">Set 2PC KEY</button>
    </div>
    <button onClick={handleConnect} className="px-4 py-2 rounded-md bg-blue-500 text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50">Connect WebSocket</button>
    <button onClick={handleDisconnect} className="px-4 py-2 rounded-md bg-red-500 text-white hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50">Disconnect WebSocket</button>
    <button onClick={handlePostEmbeddings} className="px-4 py-2 rounded-md bg-green-500 text-white hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50">Post Embeddings</button>
    <button onClick={initAlice} className="px-4 py-2 rounded-md bg-blue-500 text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50">Initialize Alice. You are currently {currentPerson}</button>
    <button onClick={computeA} className="px-4 py-2 rounded-md bg-red-500 text-white hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50">Compute Alice Dot Product</button>
    <WebSocketDemo currentPerson={currentPerson} setCurrentPerson={setCurrentPerson} setProfile={setProfile} />
  </div>
  <div className="mt-4 text-lg">{responseText}</div>
</div>
>>>>>>> refs/remotes/origin/main

    </div>
  );
}
