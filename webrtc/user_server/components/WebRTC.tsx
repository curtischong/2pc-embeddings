import { MessageType } from '@/types';
import React, { useState, useCallback, useEffect, useRef } from 'react';
import useWebSocket, { ReadyState } from 'react-use-websocket';
import { aliceCalcFinalSum, aliceInit2pc, aliceReceiveVFromBob, bobReceive2pc, bobResolveInputs } from '../2pc/src/calculate';

interface Props {
  currentPerson: string;
  setCurrentPerson: (person: string) => void;
}


export const WebSocketDemo = ({ currentPerson, setCurrentPerson }: Props) => {
  //Public API that will echo messages sent to it back to the client
  const [socketUrl, setSocketUrl] = useState('ws://localhost:8080');

  const inputRef = useRef(null)

  const { sendMessage, lastMessage, readyState } = useWebSocket(socketUrl);
  const [messages, setMessages] = useState([])
  useEffect(() => {
    // TODO: move this
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
    const messageToSend = { 'sender': currentPerson, 'content': inputRef.current }

    setMessages((prev) => [...prev, messageToSend]);

    if (inputRef.current) {
      inputRef.current = '';
    }
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
    inputRef.current.value = '';
  }
  return (
    <div className="flex flex-col h-screen bg-gray-100 w-3/5">
      <div className="flex items-center justify-between p-4 bg-blue-500 text-white">
        <button
          onClick={clearConversation}
          className="hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Clear Conversation
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {messages.map((message, idx) => (
          <div key={idx} className={`message ${message?.sender === currentPerson ? 'sent' : 'received'}`} style={{ backgroundColor: message?.sender === currentPerson ? 'lightblue' : 'white', borderRadius: '5px', marginBottom: '10px' }}>
            {message?.sender === currentPerson ? message?.content : <span className="">{`${message?.content}`}</span>}
          </div>
        ))}
      </div>
      <div className="p-4">
        <input type="text" onChange={e => inputRef.current = e.target.value} onKeyPress={e => { if (e.key === 'Enter') { handleClickSendMessage(); } }} ref={inputRef} className="w-full p-2 border border-gray-300 rounded" style={{ width: '100%', maxWidth: '800px' }} />
      </div>
    </div>
  );
};