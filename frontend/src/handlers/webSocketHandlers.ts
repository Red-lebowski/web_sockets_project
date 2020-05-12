import {APIResponse, NewTimestampData} from '../@types'
import { Either } from 'fp-ts/lib/Either'
import * as t from 'io-ts';

// TODO: refine the any to be the apiresponse generic
export function validateResponse<c extends t.Mixed>(event: MessageEvent, dataType: c): Either<t.Errors, any>{
    const hack = {
        response_code: 200,
        data: event.data
    }
    const r =  APIResponse(dataType).decode(hack)

    return r
}
