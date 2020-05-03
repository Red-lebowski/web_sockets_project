import uvicorn
import time
import json
import asyncio

from devtools import debug
from datetime import datetime

from fastapi import FastAPI, Request 
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError

from starlette.websockets import WebSocket
from starlette.endpoints import WebSocketEndpoint

from pydantic import BaseModel
from pydantic import validate_arguments, ValidationError

from custom_type_validators import validate_websocket_request
from basic_types import IsOddRequest, IsOddResponse

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

@app.get("/now")
def read_item():
    now_formatted = datetime.now().strftime("%d/%m/%Y %H:%M:%S")
    return {"time": now_formatted}


@app.websocket_route("/now-updated")
class SendTime(WebSocketEndpoint):
    encoding = 'json'
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
    encoding = 'json'
    task = None

    async def on_connect(self, websocket: WebSocket):
        await websocket.accept()
    
    @validate_websocket_request
    async def on_receive(self, websocket, data: IsOddRequest):
        is_odd = 'yep' if data.number % 2 == 1 else 'nope'
        response_body: IsOddResponse = {
            'number': data.number,
            'is_odd': is_odd
        }
        await websocket.send_json(response_body)

    async def on_disconnect(self, websocket: WebSocket, close_code: int):
        await websocket.close()
        print('WebSocket connection closed')


def get_current_second():
    return datetime.now().strftime("%d/%m/ %Y %H:%M:%S")


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)