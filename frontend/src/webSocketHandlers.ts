import {IsOddData, isOddString, APIResponse} from './@types'
import { flow } from 'fp-ts/lib/function';
import { fold } from 'fp-ts/lib/Either'

function formatIsOdd(e: IsOddData): isOddString{
    return `${e.number} | ${e.is_odd}`
}

export function handleIsOddWebSocketResponse(event: MessageEvent): isOddString{
    /**
     * is the only difference between fold and any other function
     * (in that every other function takes input, validates it and does something),
     * that fold guarantees that:
     * 1. all scenarios (left, right) are accounted for
     * 2. the return type is guaranteed
     * ??
     * functionally, what's the difference? the only thing i might have missed is 
     * that fold extracts the "inner value" of the either type for both cases
     */
    // this is a bit contrived but still sick
    return flow(
        JSON.parse,
        APIResponse.decode,
        fold(
            e => '? | ? (Server error: API shape error)',
            flow(
                e => e.data,
                IsOddData.decode,
                fold(
                    e => '? | ? (Server error: IsOddData shape error)',
                    formatIsOdd,
                )
            )
        )
    )(event.data)
}