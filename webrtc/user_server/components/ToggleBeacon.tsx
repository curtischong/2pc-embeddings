// pages/index.js
import { randomUUID } from 'crypto';
import Head from 'next/head';
import { useCallback, useEffect, useState } from 'react';
import { MessageType } from '../types';
import { aliceCalcFinalSum, aliceInit2pc, aliceReceiveVFromBob, bobReceive2pc, bobResolveInputs } from '../2pc/src/calculate';
import { Message } from 'postcss';

const SERVER_IP = 'localhost';

function generateUuidV4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

const ws = new WebSocket("ws://" + SERVER_IP + ":8000/ws");
const sendMessage = (message: any, messageType: MessageType) => {
    // ws.send(JSON.stringify({
    //     ...message,
    //     "2pc": true,
    //     messageType,
    // }));
    console.log('sending message', message)
    ws.send(JSON.stringify({
        uuid: message.uuid,
        message: 'send',
        target_uuid: message.target_uuid,
        data: {
            ...message,
            "2pc": true,
            messageType,
        }
    }));
}

export default function ToggleBeacon() {
    const [beaconActive, setBeaconActive] = useState(false);
    const [knownUUIDS, setKnownUUIDS] = useState([]);

    let uuid: string | null;

    useEffect(() => {
        uuid = localStorage.getItem('uuid');
      if (!uuid) {
        uuid = generateUuidV4();
        localStorage.setItem('uuid', uuid);
      }
      console.log(uuid);
    })

        
    ws.onmessage = function(event) {
        console.log(event.data);
        // console.log(JSON.parse(event.data));


        try {
            const message = JSON.parse(event.data);
            if ('uuids' in message) {
                setKnownUUIDS(message.uuids);
            }

            if('2pc' in message){
                const aliceUUID = message.uuid
                const bobUUID = message.target_uuid
                const sendBobMessage = (message: any, messageType: MessageType) => {
                    sendMessage({
                        ...message,
                        uuid: aliceUUID,
                        target_uuid: bobUUID,
                    }, messageType)
                }
                const sendAliceMessage = (message: any, messageType: MessageType) => {
                    sendMessage({
                        ...message,
                        uuid: bobUUID,
                        target_uuid: aliceUUID,
                    },messageType)
                }

                const messageType = message.messageType
                console.log(messageType)
                switch (messageType) {
                case MessageType.AliceInit2pc:
                    // setCurrentPerson('Bob')
                    bobReceive2pc(message.garbledCircuit, message.bobOtInputs, message.aliceInputLabels, message.subEmbeddingIdx, sendAliceMessage)
                    break;
                case MessageType.BobReceive2pc:
                    aliceReceiveVFromBob(message.aliceVVals, sendBobMessage)
                    break;
                case MessageType.AliceReceiveVFromBob:
                    bobResolveInputs(message.bobVVals, sendAliceMessage)
                    break;
                case MessageType.BobResolveInputs:
                    aliceCalcFinalSum(message.outputLabels)
                    break;
                case MessageType.AliceComputeDotProduct:
                    console.log('Alice computed dot product:', message.totalDotProduct)
                    break;
                default:
                    console.log("unhandled msgType", messageType)
                    break;
                }
            }
        } catch(e) {
            console.warn(e);
        }
    };

    ws.onopen = function(event) {
        if (beaconActive)
        ws.send(JSON.stringify({
            uuid: uuid,
            message: 'connect'
        }));
    }

    ws.onclose = function(event) {
        ws.send(JSON.stringify({
            uuid: uuid,
            message: 'disconnect'
        }));
    }

    const toggleBeacon = () => {

        // Beacon is Active -- UHH JANK
        if (!beaconActive) {
            console.log('connect');
            try {
                if (ws)
                ws.send(JSON.stringify({
                    uuid: uuid,
                    message: 'connect'
                }));
            } catch {}
        } else {
            console.log('disconnect');
            try {
                if (ws)
                ws.send(JSON.stringify({
                    uuid: uuid,
                    message: 'disconnect'
                }));
            } catch {}
        }
        setBeaconActive(!beaconActive);
    };

    // return () => {
    //   ws.close()
    // }

    const connectWithOther = (target_uuid: string) => {
        // ws.send(JSON.stringify({
        //     uuid: uuid,
        //     message: 'share ' + target_uuid
        // }));
        
        aliceInit2pc(0, (message:any, messageType:MessageType) => {
            sendMessage({ // we are alice sending to bob
                ...message,
                uuid: uuid,
                target_uuid: target_uuid,
            }, messageType)
        });
        // ws.send(JSON.stringify({
        //     uuid: uuid,
        //     message: 'send',
        //     target_uuid: target_uuid,
        //     data: {
        //     } 
        // }));
    }


    return (
        <div>
            <h1 className="text-3xl font-bold text-pink-600">Love Beacon</h1>
            <p className="text-pink-600 mt-2 text-sm">Find Love Nearby</p>
            
            {/* Conditional Beacon Icon */}
            <div className={`mt-4 text-3xl ${beaconActive ? 'animate-ping' : ''}`}>
                {beaconActive ? '📡' : '📶'}
            </div>

            <button 
                onClick={toggleBeacon} 
                className={`mt-8 px-6 py-2 rounded-lg shadow transition duration-200 ease-in-out font-medium
                ${beaconActive ? 'bg-red-500 text-white' : 'bg-pink-500 text-white hover:bg-pink-700'}`}
            >
                {beaconActive ? 'Deactivate Beacon' : 'Activate Beacon'}
            </button>

            {beaconActive && knownUUIDS.map((uuid, index) => (
                <button
                    key={uuid}
                    className={`flex items-center justify-center flex-1 py-2 px-4 text-sm font-medium leading-5 text-blue-700 rounded-lg`}
                    onClick={() => connectWithOther(uuid)}
                >
                    Connect with {uuid}
                </button>
            ))}
        </div>
    );
}
