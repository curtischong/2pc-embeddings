from fastapi import FastAPI, WebSocket
import json

app = FastAPI()

known_ip = set()

@app.websocket("/connect")
async def websocket_endpoint(websocket: WebSocket):
    '''everytime /connect endpoint receives a msg, it sends the updated known_ip list'''
    await websocket.accept()
    client_host = websocket.client.host
    known_ip.add(client_host)
    print(f'Client connected: {client_host}')
    while True:
        data = await websocket.receive_text()
        known_hosts_data = {
            'known_ip': list(known_ip)
        }
        await websocket.send_text(json.dumps(known_hosts_data))

@app.websocket("/disonnect")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    client_host = websocket.client.host
    try: known_ip.remove(client_host)
    except: return
    print(f'Client disconnected: {client_host}')
    while True:
        data = await websocket.receive_text()
        known_ip_data = {
            'status': True
        }
        await websocket.send_text(json.dumps(known_ip_data))