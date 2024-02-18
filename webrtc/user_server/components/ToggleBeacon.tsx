// pages/index.js
import { randomUUID } from 'crypto';
import Head from 'next/head';
import { useEffect, useState } from 'react';

const SERVER_IP = 'localhost';

function generateUuidV4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}
  
const uuid = generateUuidV4();

export default function ToggleBeacon() {
    const [beaconActive, setBeaconActive] = useState(false);


    var ws = new WebSocket("ws://" + SERVER_IP + ":8000/ws");
    ws.onmessage = function(event) {
        console.log(event.data);
        // console.log(JSON.parse(event.data));
    };

    const toggleBeacon = () => {
        setBeaconActive(!beaconActive);

        // Beacon is Active -- UHH JANK
        if (!beaconActive) {
            console.log('connect');
            ws.send(JSON.stringify({
                uuid: uuid,
                message: 'connect'
            }));
        } else {
            console.log('disconnect');
            ws.send(JSON.stringify({
                uuid: uuid,
                message: 'disconnect'
            }));
        }
    };


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
        </div>
    );
}
