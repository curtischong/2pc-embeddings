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

ws.onmessage = (message) => {
    console.log(message.data);
    const data = JSON.parse(message.data);
    switch(data.type) {
        case 'offer':
            handleOffer(data.offer);
            break;
        case 'answer':
            handleAnswer(data.answer);
            break;
        case 'candidate':
            handleCandidate(data.candidate);
            break;
        default:
            break;
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
    ws.send(JSON.stringify({'type': 'answer', 'answer': answer}));

    peerConnection.ontrack = (event) => {
        remoteVideo.srcObject = event.streams[0];
    };

    peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
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
    dataChannel.onopen = () => console.log("Data Channel is open");
    dataChannel.onmessage = (event) => {
        const message = event.data;
        displayMessage('Peer', message);
    };
}

sendMessageButton.onclick = () => {
    const message = messageInput.value;
    dataChannel.send(message);
    displayMessage('You', message);
    messageInput.value = ''; // Clear the input after sending
};

function displayMessage(sender, message) {
    const messageElement = document.createElement('p');
    messageElement.textContent = `${sender}: ${message}`;
    messagesDiv.appendChild(messageElement);
}
