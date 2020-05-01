import time
from pydantic import BaseModel
from datetime import datetime

from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware

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


@app.websocket("/now-updated")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    while True:
        # data = await websocket.receive_text()
        # time.sleep(1000)
        current_second = get_current_second()
        await websocket.send_text(current_second)

    return


def get_current_second():
    return datetime.now().strftime("%d/%m/ %Y %H:%M:%S")