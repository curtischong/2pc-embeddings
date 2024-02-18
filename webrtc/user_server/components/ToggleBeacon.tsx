// pages/index.js
import { randomUUID } from 'crypto';
import Head from 'next/head';
import { useCallback, useEffect, useState } from 'react';
import { MessageType } from '../types';
import { aliceCalcFinalSum, aliceInit2pc, aliceReceiveVFromBob, bobReceive2pc, bobResolveInputs } from '../2pc/src/calculate';

const SERVER_IP = 'localhost';

function generateUuidV4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

const ws = new WebSocket("ws://" + SERVER_IP + ":8000/ws");

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
            const json_data = JSON.parse(event.data);
            if ('uuids' in json_data) {
                setKnownUUIDS(json_data.uuids);
            }
        } catch {}
        
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
        ws.send(JSON.stringify({
            uuid: uuid,
            message: 'share ' + target_uuid
        }));
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
