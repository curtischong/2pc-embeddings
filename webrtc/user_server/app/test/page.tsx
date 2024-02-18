'use client'
import React, { useState, useCallback, useEffect } from 'react';
import { WebSocketDemo } from '../../components/WebRTC';
import { aliceComputeDotProduct, aliceInit2pc, aliceReceiveVFromBob } from '../../2pc/src/calculate';



const Home = () => {

  const [currentPerson, setCurrentPerson] = useState('')
  const [messageHistory, setMessageHistory] = useState([]);
  const [textMessages, setTextMessages] = useState([])




  const syncConversation = async () => {
    try {
      const ws = new WebSocket('ws://localhost:8000/connect');

      ws.onopen = () => {
        console.log('WebSocket connection established');
        const userId = getOrCreateUserID();
        ws.send(JSON.stringify({ userId, messageHistory }));

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

  function generateUniqueID() {
    return 'id-' + Math.random().toString(36).substr(2, 16);
  }

  function getOrCreateUserID() {
    let userID = localStorage.getItem('userID');
    if (!userID) {
      userID = generateUniqueID();
      localStorage.setItem('userID', userID);
    }
    return userID;
  }

  const disconnectConversation = async () => {
    try {
      const ws = new WebSocket('ws://localhost:8000/disconnect');

      ws.onopen = () => {
        //  Send user ID when connecting and accessed when disconnected
        // REMOVE THIS CONVERSATION ID
        const userId = getOrCreateUserID();
        ws.send(JSON.stringify({ userId }));

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


  // Initializing your profile gets your uuid and sends it to the server
  const getProfile = async () => {
      const response = await fetch('http://localhost:8000/embeddings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        //  TODO: make form that lets you input this data from About Me section
        body: JSON.stringify({
          MBTI: 'example',
          Love_Languages: 'example',
          Hobbies: 'example'
        })
      });

      const data = await response.json();
      console.log("data", data)
      const embedding = JSON.stringify(data.embeddings)
      // setResponseText(embedding);
      setProfile(embedding)
      const userId = getOrCreateUserID();
      syncConversation()
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

  // New state for managing About Me content and edit mode
  const [aboutMe, setAboutMe] = useState('This is my default about me');
  const [editAboutMe, setEditAboutMe] = useState(false);

  // Handlers for About Me section
  const handleAboutMeChange = (event) => {
    setAboutMe(event.target.value);
  };

  const toggleEditAboutMe = () => {
    setEditAboutMe(!editAboutMe);
  };

  return (
    <div className="text-center m-4">
      <h1 className="text-2xl font-bold mb-4">You are {currentPerson || 'Uninitialized'} profile={profile}</h1>
      {editAboutMe ? (
        <div>
          <textarea
            className="textarea textarea-bordered m-2"
            value={aboutMe}
            onChange={handleAboutMeChange}
          />
          <button onClick={toggleEditAboutMe} className="btn btn-primary">Save About Me</button>
        </div>
      ) : (
        <div>
          <p>{aboutMe}</p>
          <button onClick={toggleEditAboutMe} className="btn">Edit About Me</button>
        </div>
      )}
      <div className="flex justify-center gap-4">
        <div>

          <button onClick={getProfile} className="px-4 py-2 rounded-md bg-green-500 text-white hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50">Upload Profile for Matches</button>
        </div>
        <button onClick={syncConversation} className="px-4 py-2 rounded-md bg-blue-500 text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50">Connect WebSocket</button>
        <button onClick={disconnectConversation} className="px-4 py-2 rounded-md bg-red-500 text-white hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50">Disconnect WebSocket</button>
        <WebSocketDemo currentPerson={currentPerson} setCurrentPerson={setCurrentPerson} setProfile={setProfile} disconnectConversation={disconnectConversation} syncConversation={syncConversation} messageHistory={messageHistory} setMessageHistory={setMessageHistory} />
      </div>
    </div>
  );
};

export default Home;
