import functools
import logging

from inspect import signature
from typing import Callable, Any

from pydantic import ValidationError
from pydantic.decorator import ValidatedFunction

from starlette.status import WS_1003_UNSUPPORTED_DATA

from fastapi.exception_handlers import jsonable_encoder


def validate_websocket_request(func: Callable) -> Callable:
    def decorator(*args: Any, **kwargs: Any) -> None:

        @functools.wraps(func)
        async def wrapped(*args: Any, **kwargs: Any):

            parameters = signature(func).parameters

            if 'websocket' not in  parameters.keys():
                print('Invalid function. No Websocket Found.')
                await func(*args, **kwargs)
                return func

            websocket = args[list(parameters.keys()).index('websocket')]

            try:
                vd: Callable = ValidatedFunction(func)
                await vd.call(*args, **kwargs)
            except ValidationError as exc:
                logging.info('WebSocket - Invalid data received [rejected]')
                close_code = WS_1003_UNSUPPORTED_DATA
                await websocket.send_json(
                    {
                        'ok': False,
                        'status_code': close_code,
                        'detail': jsonable_encoder(exc.errors())
                    }
                )
            return func
        return wrapped(*args, **kwargs)
    return decorator