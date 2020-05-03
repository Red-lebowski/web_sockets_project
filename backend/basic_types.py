from pydantic import BaseModel
from enum import Enum

class IsOddEnum(str, Enum):
    yes = 'yep'
    no = 'nope'
    

class NewSecondObject(BaseModel):
    formatted_timestamp: str


class IsOddRequest(BaseModel):
    number: int


class IsOddResponse(BaseModel):
    number: int
    is_odd: IsOddEnum
    