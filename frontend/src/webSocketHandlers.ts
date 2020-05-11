import {IsOddData, isOddString, APIResponse} from './@types'
import { flow } from 'fp-ts/lib/function';
import { fold, Either, left, right } from 'fp-ts/lib/Either'
import * as t from 'io-ts';
import { assign } from 'xstate';
import { AutomataContext, NewMessage } from './machines/webSocket';

// i want to replace this any with a generic that will flow throught the app (the websocket machine)
export function handleIsOddWebSocketResponse(event:MessageEvent ): Either<t.Errors, any>{
    return flow(
        JSON.parse,
        APIResponse(IsOddData).decode,
        fold(
            e => left(e),
            a => right(`${a.data.number} | ${a.data.is_odd}`),
        )
    )(event.data)
}


export const handleNewSecond = assign<AutomataContext, NewMessage >({
    messagesReceived: (c,e) => [e.event.data]
})
