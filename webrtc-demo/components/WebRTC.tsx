// pages/webrtc.js
import React, { useEffect, useRef, useState } from 'react';

const WebRTC = () => {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const [messages, setMessages] = useState([]);
  const [peerConnection, setPeerConnection] = useState(null);
  const [dataChannel, setDataChannel] = useState(null);
  const [messageInput, setMessageInput] = useState('');

  const wsRef = useRef(null);


  


  useEffect(() => {
    wsRef.current = new WebSocket('ws://localhost:8080');
    wsRef.current.onmessage = (event) => {
        if (event.data instanceof Blob) {
            const reader = new FileReader();
            reader.onload = function() {
                // console.log('Received blob text data:', reader.result);
    
                const data = JSON.parse(reader.result);
                console.log('Received parsed data:', data.type);
                switch(data.type) {
                    case 'offer':
                        console.log('handling offer', data.offer)
                        handleOffer(data.offer);
                        break;
                    case 'answer':
                        console.log('handling answer', data.answer)
                        handleAnswer(data.answer);
                        break;
                    case 'candidate':
                        console.log('handling candidate', data.candidate)
                        handleCandidate(data.candidate);
                        break;
                    default:
                        break;
                }
            };
            reader.readAsText(event.data);
        } else {
            console.log('Received text data:', event.data);
        }
    };
  }, [peerConnection]);


  function handleAnswer(answer) {
    console.log('handling answer', peerConnection, answer)
    if (peerConnection) {

        peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
    } else {
        console.log('not handling')
    }
}

function handleCandidate(candidate) {
    console.log('handling candidate', peerConnection, candidate)
    if (peerConnection && candidate) {

        peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    } else {
        console.log('not candidate')
    }
}

  const connect = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localVideoRef.current.srcObject = stream;

    const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
    setPeerConnection(pc);
    console.log(' PEER CONNECTION SET', pc)

    stream.getTracks().forEach(track => pc.addTrack(track, stream));

    pc.ontrack = (event) => {
      remoteVideoRef.current.srcObject = event.streams[0];
    };

    pc.onicecandidate = (event) => {
        
        if (wsRef.current.readyState === WebSocket.OPEN) {
            if (event.candidate) {
                wsRef.current.send(JSON.stringify({ 'type': 'candidate', 'candidate': event.candidate }));
              }
          } else {
            console.error('WebSocket connection is not open yet.');
          }


     
    };

    const dc = pc.createDataChannel("chat");
    setDataChannel(dc);

    dc.onopen = () => console.log("Data Channel is open");
    dc.onmessage = (event) => {
        const message = event.data;
        displayMessage('Peer', message);
    };
    dc.onerror = (error) => {
        console.error("Data Channel Error:", error);
    };
    dc.onclose = () => {
        console.log("Data Channel is closed");
    };

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    if (wsRef.current.readyState === WebSocket.OPEN) {
    wsRef.current.send(JSON.stringify({ 'type': 'offer', 'offer': offer }));
    } else {
    console.error('WebSocket connection is not open yet.');
    }


    
  };

  const handleOffer = async (offer) => {
    await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    wsRef.current.send(JSON.stringify({ 'type': 'answer', 'answer': answer }));
  };

  const sendMessage = () => {
    if (dataChannel && dataChannel.readyState === 'open') {
      dataChannel.send(messageInput);
      displayMessage('You', messageInput);
      setMessageInput(''); // Clear the message input after sending
    } else { 
        console.log('not connected')
    }
  };

  const displayMessage = (sender, message) => {
    setMessages(prevMessages => [...prevMessages, { sender, message }]);
  };

  return (
    <div>
      <button onClick={connect}>Connect</button>
      <video ref={localVideoRef} autoPlay muted style={{ width: '30%' }}></video>
      <video ref={remoteVideoRef} autoPlay style={{ width: '30%' }}></video>
      <input 
        value={messageInput} 
        onChange={(e) => setMessageInput(e.target.value)} 
        type="text" 
        placeholder="Type a message..." 
      />
      <button onClick={sendMessage}>Send Message</button>
      <div>
        {messages.map((msg, index) => (
          <p key={index}><strong>{msg.sender}:</strong> {msg.message}</p>
        ))}
      </div>
    </div>
  );
};

export default WebRTC;
