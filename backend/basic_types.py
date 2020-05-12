from typing import List, Generic, TypeVar, Optional, Sequence, Any, Union, Type

from enum import Enum
from datetime import datetime
from starlette.responses import Response

from pydantic import BaseModel, validator, ValidationError
from pydantic.generics import GenericModel
from pydantic.error_wrappers import ErrorList, ErrorWrapper


class IsOddEnum(str, Enum):
    yes = 'yep'
    no = 'nope'
    

class NewTimestampObject(BaseModel):
    timestamp: str


class IsOddRequest(BaseModel):
    number: int


class NumberMetadata(BaseModel):
    number_pronunciation_string: str
    number_pronunciation_length: int
    number_pronunciation_parts: List[str]


class IsOddResult(BaseModel):
    number: int
    is_odd: IsOddEnum
    response_time: datetime
    number_metadata: NumberMetadata

    class Config:
        orm_mode=True


class ApiError(BaseModel):
    loc: Optional[Union[str, 'loc']] = None
    msg: str
    type: str


ResponseDataModel = TypeVar('ResponseDataModel')
class WebSocketResponse(GenericModel, Generic[ResponseDataModel]):

    response_code: int
    data: Optional[ResponseDataModel]
    errors: Optional[Sequence[ApiError]]

    @validator('errors', always=True)
    def check_consistency(cls, v, values):
        if v is not None and values['data'] is not None:
            raise ValueError('must not provide both data and error')
        if v is None and values.get('data') is None:
            raise ValueError('must provide data or error')
        return v
    

class IsOddResponse(WebSocketResponse[IsOddResult]):
    pass

class NewTimestampResponse(WebSocketResponse[NewTimestampObject]):
    pass