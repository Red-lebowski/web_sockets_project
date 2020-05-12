import {APIResponse, NewTimestampData} from '../@types'
import { Either } from 'fp-ts/lib/Either'
import * as t from 'io-ts';
import { flow } from 'fp-ts/lib/function';
import { PathReporter } from 'io-ts/lib/PathReporter'

// TODO: refine the any to be the apiresponse generic
export function validateResponse<c extends t.Mixed>(event: MessageEvent, dataType: c): Either<t.Errors, any>{

    const log = (...params:any) => {console.log(...params); return params}

    const k = flow(
        JSON.parse,
        APIResponse(dataType).decode
    )(event.data)
    return k
}
