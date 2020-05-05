import json

from devtools import debug

from starlette.testclient import TestClient
from starlette.websockets import WebSocket

from main import app as MainApp

def test_is_odd():
    client = TestClient(MainApp)

    with client.websocket_connect("/is-odd") as websocket:
        websocket.send_json({
            'number': 27
        })
        data = websocket.receive_json()
        debug(data)

    return

if __name__ == "__main__":
    test_is_odd()