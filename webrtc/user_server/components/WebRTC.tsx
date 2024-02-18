import { MessageType } from '@/types';
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import useWebSocket, { ReadyState } from 'react-use-websocket';
import { aliceCalcFinalSum, aliceInit2pc, aliceReceiveVFromBob, bobReceive2pc, bobResolveInputs } from '../2pc/src/calculate';

interface Props {
  currentPerson: string;
  setCurrentPerson: (person: string) => void;
}

const SERVER_IP = 'localhost';

// var ws = new WebSocket("ws://" + SERVER_IP + ":8000/ws");
// const sendMessage = (message:any) => {
//   ws.send(JSON.stringify(message));
// }

export const WebSocketDemo = ({ currentPerson, setCurrentPerson }: Props) => {
  //Public API that will echo messages sent to it back to the client
  const [socketUrl, setSocketUrl] = useState('ws://localhost:8080');
  const [messageHistory, setMessageHistory] = useState([]);
  const ws = useMemo(() =>new WebSocket("ws://" + SERVER_IP + ":8000/ws"), [SERVER_IP]);
  const sendMessage = useCallback((message) => () => {
    ws.send(JSON.stringify(message))
  }, [ws]);

  useEffect(() => {
    localStorage.setItem('embedding', JSON.stringify([1,1,1,1,1,1,1,1,1,1]))

    ws.onmessage = function(event) {
      const message = event.data;
      // console.log(event.data);
      // console.log(JSON.parse(event.data));


      console.log('message received:', message , 'From', currentPerson)
      // keep alice as alice and bob as bob
      // const message = lastMessage as any
      setMessageHistory((prev) => prev.concat(message));

      const messageType = message.messageType
      switch (messageType) {
        case MessageType.AliceInit2pc:
          setCurrentPerson('Bob')
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
          console.error('Unknown message type:', messageType)
          break;
      }
    }

    // return () => {
    //   ws.close()
    // }
  }, [ws])

  // const { sendMessage, lastMessage, readyState } = useWebSocket(socketUrl);

  // useEffect(() => {
  //   // TODO: move this
  //   localStorage.setItem('embedding', JSON.stringify([1,1,1,1,1,1,1,1,1,1]))


  //   if (lastMessage !== null) {
  //     console.log('message received:', lastMessage , 'From', currentPerson)
  //     // keep alice as alice and bob as bob
  //     const message = lastMessage as any
  //     setMessageHistory((prev) => prev.concat(message));

  //     const messageType = message.messageType
  //     switch (messageType) {
  //       case MessageType.AliceInit2pc:
  //         setCurrentPerson('Bob')
  //         bobReceive2pc(message.garbledCircuit, message.bobOtInputs, message.aliceInputLabels, message.subEmbeddingIdx, sendMessage)
  //         break;
  //       case MessageType.BobReceive2pc:
  //         aliceReceiveVFromBob(message.aliceVVals, sendMessage)
  //         break;
  //       case MessageType.AliceReceiveVFromBob:
  //         bobResolveInputs(message.bobVVals, sendMessage)
  //         break;
  //       case MessageType.BobResolveInputs:
  //         aliceCalcFinalSum(message.outputLabels)
  //         break;
  //       case MessageType.AliceComputeDotProduct:
  //         console.log('Alice computed dot product:', message.totalDotProduct)
  //         break;
  //       default:
  //         console.error('Unknown message type:', messageType)
  //         break;
  //     }
  //   }
  // }, [lastMessage, setMessageHistory]);

  const handleClickChangeSocketUrl = useCallback(
    () => setSocketUrl('ws://localhost:8080'),
    []
  );


  function blobToText(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve(reader.result);
      };
      reader.onerror = reject;
      reader.readAsText(blob);
    });
  }

  // const clearProfile = useCallback(() => {
  //   setCurrentPerson('')
  //   setProfile('')
  //   localStorage.removeItem('profile')
  //   setMessageHistory([])
  //   // Clears the conversation on receiver end
  //   sendMessage(MessageType.EndConversation);
  // }, []);
  
  
  const [textMessages, setTextMessages] = useState([])
  // useEffect(() => {
  //   // Your asynchronous operations to convert Blobs to text
  //   const convertBlobsToText = async () => {
  //     const textMessages = await Promise.all(messageHistory.map(async (message, idx) => {
  //       if (message) {
  //         message = await blobToText(message.data);

  //         if (message === MessageType.EndConversation) {
  //           clearProfile()
  //         }

  //         if (currentPerson === '' && message !== MessageType.EndConversation) {
  //           setCurrentPerson('Bob')
  //         }


  //         return message 
  //       }
  //       return null;
  //     }));
  //     setTextMessages(textMessages)
  //     return textMessages
  //   };

  //   convertBlobsToText()

    
  // }, [messageHistory]);


  const handleClickSendMessage = useCallback(() => {
    // Set default to 'Alice' if currentPerson is an empty string
    if (currentPerson === '') {
      setCurrentPerson('Alice')
    }
    // sendMessage(`Hello ${currentPerson === 'Alice' ? 'Bob' : 'Alice'} from ${currentPerson}`);

  }, [currentPerson]);


  // const connectionStatus = {
  //   [ReadyState.CONNECTING]: 'Connecting',
  //   [ReadyState.OPEN]: 'Open',
  //   [ReadyState.CLOSING]: 'Closing',
  //   [ReadyState.CLOSED]: 'Closed',
  //   [ReadyState.UNINSTANTIATED]: 'Uninstantiated',
  // }[readyState];

  return (
    <div>
    <button 
      onClick={handleClickChangeSocketUrl}
      className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
    >
      Click Me to change Socket Url
    </button>
  {/* <button 
      onClick={clearProfile}
      className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
    >
      Click Me to Clear Conversation
    </button> */}
    <button 
      onClick={() => {
        aliceInit2pc(0, sendMessage)
      }}
      className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
    >
      Click Me to start the 2pc
    </button>

    <ul>
      {textMessages.map((message, idx) => (
        <li key={idx} className="mb-2">{message ? message : null}</li>
      ))}
    </ul>
  </div>
  );
};