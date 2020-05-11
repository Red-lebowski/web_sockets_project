import {APIResponse} from './@types'
import { flow } from 'fp-ts/lib/function';
import { Either } from 'fp-ts/lib/Either'
import * as t from 'io-ts';

// TODO: refine the any to be the apiresponse generic
export function validateResponse<c extends t.Mixed>(event: MessageEvent, dataType: c): Either<t.Errors, any>{
    return flow(
        JSON.parse,
        APIResponse(dataType).decode
    )(event.data)
}
