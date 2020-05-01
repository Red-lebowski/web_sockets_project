import time
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


class Item(BaseModel):
    name: str
    price: float
    is_offer: bool = None


@app.get("/")
def read_root():
    return {"Hello": "World"}


@app.get("/now")
def read_item():
    now_formatted = datetime.now().strftime("%d/%m/%Y %H:%M:%S")
    return {"time": now_formatted}


@app.websocket_route("/now-updated")
class App(WebSocketEndpoint):
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
        print('WebSocket closed')
    
    async def send_time(self, websocket: WebSocket):
        while True:
            await asyncio.sleep(1)
            current_second = get_current_second()
            print(current_second)
            await websocket.send_text(current_second)


def get_current_second():
    return datetime.now().strftime("%d/%m/ %Y %H:%M:%S")