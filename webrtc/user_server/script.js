const connectButton = document.getElementById('connect');
const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');
const messageInput = document.getElementById('messageInput');
const sendMessageButton = document.getElementById('sendMessage');
const messagesDiv = document.getElementById('messages');
let localStream;
let peerConnection;
const config = { 'iceServers': [{ 'urls': 'stun:stun.l.google.com:19302' }] };
const ws = new WebSocket('ws://localhost:8080');
let dataChannel;

console.log({ws})
ws.onmessage = (message) => {
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

connectButton.onclick = async () => {
    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localVideo.srcObject = localStream;

    peerConnection = new RTCPeerConnection(config);
    dataChannel = peerConnection.createDataChannel("chat");
    
    setupDataChannel();

    
    localStream.getTracks().forEach(track => {
        
        peerConnection.addTrack(track, localStream);
    });

    peerConnection.ontrack = (event) => {
        remoteVideo.srcObject = event.streams[0];
    };

    peerConnection.onicecandidate = (event) => {
        
        if (event.candidate) {
            ws.send(JSON.stringify({'type': 'candidate', 'candidate': event.candidate}));
        }
    };

    const offer = await peerConnection.createOffer();
    
    await peerConnection.setLocalDescription(offer);
    ws.send(JSON.stringify({'type': 'offer', 'offer': offer}));
    
};

async function handleOffer(offer) {
    peerConnection = new RTCPeerConnection(config);
    peerConnection.ondatachannel = (event) => {
        dataChannel = event.channel;
        setupDataChannel();
    };

    peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);

    if (wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ 'type': 'offer', 'offer': offer }));
      } else {
        console.error('WebSocket connection is not open yet.');
      }

    

    peerConnection.ontrack = (event) => {
        remoteVideo.srcObject = event.streams[0];
    };

    peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            console.log('w:', w)
            ws.send(JSON.stringify({'type': 'candidate', 'candidate': event.candidate}));
        }
    };
}

function handleAnswer(answer) {
    peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
}

function handleCandidate(candidate) {
    peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
}

function setupDataChannel() {
    dataChannel.onopen = () => {
        console.log("Data Channel is open");
    };
    dataChannel.onmessage = (event) => {
        const message = event.data;
        displayMessage('Peer', message);
    };
    dataChannel.onerror = (error) => {
        console.error("Data Channel Error:", error);
    };
    dataChannel.onclose = () => {
        console.log("Data Channel is closed");
    };
}

sendMessageButton.onclick = () => {
    
    if (dataChannel && dataChannel.readyState === 'open') {
        const message = messageInput.value;
        dataChannel.send(message);
        displayMessage('You', message);
        messageInput.value = ''; // Clear the input after sending
    } else {
        console.log('Your Data channel is not open.', dataChannel);
    }
};
function displayMessage(sender, message) {
    const messageElement = document.createElement('p');
    messageElement.textContent = `${sender}: ${message}`;
    messagesDiv.appendChild(messageElement);
}