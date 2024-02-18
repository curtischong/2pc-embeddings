'use client'
import React, { useState, useCallback, useEffect } from 'react';
import {WebSocketDemo} from '../components/WebRTC';



const Home = () => {


const [responseText, setResponseText] = useState('');

const handleConnect = async () => {
  try {
    const response = await fetch('http://localhost:8000/connect');
    const data = await response.json();
    setResponseText(JSON.stringify(data));
  } catch (error) {
    console.error('Error:', error);
  }
};

const handleDisconnect = async () => {
  try {
    const response = await fetch('http://localhost:8000/disconnect');
    const data = await response.json();
    setResponseText(JSON.stringify(data));
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

  return (
    <div>
    <h1>WebRTC and WebSocket Demo</h1>
    <button onClick={handleConnect}>Connect WebSocket</button>
    <button onClick={handleDisconnect}>Disconnect WebSocket</button>
    <button onClick={handlePostEmbeddings}>Post Embeddings</button>
    <div>{responseText}</div>
  </div>
  );
};

export default Home;
