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

connected_devices = {}

class WSResponse(BaseModel):
    uuid: str
    message: str

async def share_embedding(new_uuid: str):
    new_websocket = connected_devices[new_uuid]
    coros = []
    for uuid, websocket in connected_devices.items():
        if uuid == new_uuid: continue
        coros.append(websocket.send_text(f"new uuid joined: {new_uuid}"))
        coros.append(new_websocket.send_text(f"connected with uuid: {uuid}"))
    # await asyncio.gather(coros)
    for coro in coros:
        await coro

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
            connected_devices[data.uuid] = websocket
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