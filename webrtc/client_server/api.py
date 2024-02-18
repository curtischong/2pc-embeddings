from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
import asyncio

import json
from pydantic import BaseModel
from embeddings import generate_embeddings

app = FastAPI()

# Allow all origins, methods, and headers for CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# # Set up CORS
# origins = ["http://localhost:3000"]  # Add the origins you want to allow here

# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=origins,
#     allow_credentials=True,
#     allow_methods=["GET", "POST"],
#     allow_headers=["*"],
# )

class DeviceInfo(BaseModel):
    websocket: any
    profile: dict
    embedding: list

    class Config:
        arbitrary_types_allowed = True

connected_devices: dict = {}

class WSResponse(BaseModel):
    uuid: str
    message: str

async def share_embedding(new_uuid: str):
    new_device = connected_devices[new_uuid]
    coros = []
    for uuid, device_info in connected_devices.items():
        if uuid == new_uuid: continue
        coros.append(device_info.websocket.send_text(f"new uuid joined: {new_uuid}\n" + json.dumps(device_info.embedding)))
        coros.append(new_device.websocket.send_text(f"connected with uuid: {uuid}\n" + json.dumps(new_device.embedding)))
    # await asyncio.gather(coros)
    for coro in coros:
        try: await coro
        except: pass

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    '''everytime /connect endpoint receives a msg, it sends the updated known_ip list'''
    await websocket.accept()
    client_host = websocket.client.host
    print(f'Client connected: {client_host}')
    while True:
        data = await websocket.receive_text()
        data = WSResponse(**json.loads(data))
        if data.message == 'connect':
            profile = {
                "MBTI": "INFP - imaginative, open-minded, and curious. Loves exploring new ideas and values personal freedom.",
                "Love_Languages": "Quality Time, Words of Affirmation - enjoys deep conversations, feeling appreciated through words.",
                "Hobbies": "reading fantasy novels, hiking in nature, creative writing."
            }

            connected_devices[data.uuid] = DeviceInfo(
                websocket=websocket,
                profile=profile,
                embedding=generate_embeddings(profile)
            )
            await share_embedding(data.uuid)
        elif data.message == 'disconnect':
            try: del connected_devices[data.uuid]
            except: pass

        known_hosts_data = {
            'num_clients': len(connected_devices)
        }
        await websocket.send_text(json.dumps(known_hosts_data))

class EmbeddingsData(BaseModel):
    MBTI: str
    Love_Languages: str
    Hobbies: str

@app.post("/embeddings")
async def create_embeddings(data: EmbeddingsData) -> dict[str, list]:
    embed_list = generate_embeddings(data.dict())
    return {"embeddings": embed_list}
    
@app.get('/test')
async def test():
    return 'test'