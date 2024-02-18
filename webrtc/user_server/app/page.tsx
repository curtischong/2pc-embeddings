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


 


  return (
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

  );
};

export default Home;
