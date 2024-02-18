import { MessageType } from '@/types';
import React, { useState, useCallback, useEffect } from 'react';
import useWebSocket, { ReadyState } from 'react-use-websocket';
import { aliceCalcFinalSum, aliceInit2pc, aliceReceiveVFromBob, bobReceive2pc, bobResolveInputs } from '../2pc/src/calculate';

interface Props {
  currentPerson: string;
  setCurrentPerson: (person: string) => void;
}


export const WebSocketDemo = ({ currentPerson, setCurrentPerson }: Props) => {
  //Public API that will echo messages sent to it back to the client
  const [socketUrl, setSocketUrl] = useState('ws://localhost:8080');


  const { sendMessage, lastMessage, readyState } = useWebSocket(socketUrl);
  const [messages, setMessages] = useState([])
  useEffect(() => {
    const blobToText = (blob: any) => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          resolve(reader.result);
        };
        reader.onerror = reject;
        reader.readAsText(blob);
      });
    }

    if (lastMessage !== null) {
      console.log('message received:', lastMessage, 'From', currentPerson,)
      // keep alice as alice and bob as bob
      const message = lastMessage as any
      const messageType = message.messageType
      console.log(messageType)
      switch (messageType) {
        case MessageType.AliceInit2pc:
          // setCurrentPerson('Bob')
          bobReceive2pc(message.garbledCircuit, message.bobOtInputs, message.aliceInputLabels, message.subEmbeddingIdx, sendMessage)
          break;
        case MessageType.BobReceive2pc:
          aliceReceiveVFromBob(message.aliceVVals, sendMessage)
          break;
        case MessageType.AliceReceiveVFromBob:
          bobResolveInputs(message.bobVVals, sendMessage)
          break;
        case MessageType.BobResolveInputs:
          aliceCalcFinalSum(message.outputLabels)
          break;
        case MessageType.AliceComputeDotProduct:
          console.log('Alice computed dot product:', message.totalDotProduct)
          break;
        default:

          blobToText(lastMessage.data).then(receivedMessage => {
            console.log('wtf', receivedMessage, typeof (receivedMessage), receivedMessage == MessageType.EndConversation)
            if (receivedMessage == MessageType.EndConversation) {
              setMessages([])
              setCurrentPerson('')
            } else {
              if (currentPerson === '') {
                setCurrentPerson('Bob')
              }
              const sender = currentPerson === 'Bob' ? 'Alice' : 'Bob'
              const newMessage = { 'content': receivedMessage, 'sender': sender }
              setMessages(pastMessages => [...pastMessages, newMessage])
            }
          })
          break;
      }
    }
  }, [lastMessage, sendMessage, currentPerson, setMessages, setCurrentPerson]);


  const handleClickSendMessage = useCallback(() => {
    // Set default to 'Alice' if currentPerson is an empty string
    if (currentPerson === '') {
      setCurrentPerson('Alice')
    }
    // TODO: add your message 
    const receivingPerson = currentPerson === 'Alice' ? 'Bob' : 'Alice'
    const messageToSend = { 'sender': currentPerson, 'content': 'Hello' }

    setMessages((prev) => [...prev, messageToSend]);

    sendMessage(messageToSend.content);

  }, [currentPerson]);


  const connectionStatus = {
    [ReadyState.CONNECTING]: 'Connecting',
    [ReadyState.OPEN]: 'Open',
    [ReadyState.CLOSING]: 'Closing',
    [ReadyState.CLOSED]: 'Closed',
    [ReadyState.UNINSTANTIATED]: 'Uninstantiated',
  }[readyState];

  const clearConversation = () => {
    sendMessage(MessageType.EndConversation)
    setMessages([])
    setCurrentPerson('')
  }
  return (
    <div>
      <button
        onClick={handleClickSendMessage}
        disabled={readyState !== ReadyState.OPEN}
        className={`bg-${readyState === ReadyState.OPEN ? 'green' : 'green'}-500 
                  ${readyState === ReadyState.OPEN ? 'hover:bg-green-700' : ''} 
                  text-white font-bold py-2 px-4 rounded`}
      >
        Click Me to send 'Hello'
      </button>
      <button
        onClick={clearConversation}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
      >
        Click Me to Clear Conversation
      </button>
      <span>The WebSocket is currently {connectionStatus}</span>
      <ul>
        {messages.map((message, idx) => (
          <li key={idx} className="mb-2">
            {message?.sender === currentPerson ? message?.content : `From ${message?.sender} ${message?.content}`}
          </li>
        ))}
      </ul>
    </div>
  );
};