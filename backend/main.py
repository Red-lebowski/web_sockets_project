import time
import json
import asyncio
from pydantic import BaseModel
from datetime import datetime

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from starlette.websockets import WebSocket
from starlette.endpoints import WebSocketEndpoint


app = FastAPI()

origins = [
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"Hello": "World"}


@app.get("/now")
def read_item():
    now_formatted = datetime.now().strftime("%d/%m/%Y %H:%M:%S")
    return {"time": now_formatted}


@app.websocket_route("/now-updated")
class SendTime(WebSocketEndpoint):
    task = None

    async def on_connect(self, websocket: WebSocket):
        await websocket.accept()
        loop = asyncio.get_running_loop()
        task = asyncio.create_task(self.send_time(websocket))
        self.task = task
        asyncio.ensure_future(task, loop=loop)

    async def on_disconnect(self, websocket: WebSocket, close_code: int):
        self.task.cancel()
        await websocket.close()
        print('WebSocket connection closed')
    
    async def send_time(self, websocket: WebSocket):
        while True:
            await asyncio.sleep(1)
            current_second = get_current_second()
            await websocket.send_text(current_second)


@app.websocket_route("/is-odd")
class IsOdd(WebSocketEndpoint):
    task = None

    async def on_connect(self, websocket: WebSocket):
        await websocket.accept()
    
    async def on_receive(self, websocket: WebSocket, data):
        data = json.loads(data)
        print(data)
        is_odd = 'yep' if data['number'] % 2 == 1 else 'nope'
        await websocket.send_json({
            'number': data['number'],
            'is_odd': is_odd
        })

    async def on_disconnect(self, websocket: WebSocket, close_code: int):
        await websocket.close()
        print('WebSocket connection closed')


def get_current_second():
    return datetime.now().strftime("%d/%m/ %Y %H:%M:%S")