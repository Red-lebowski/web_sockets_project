import * as t from 'io-ts'
import {DateFromISOString} from 'io-ts-types/lib/DateFromISOString'

export const IsOddData = t.type({
  number: t.number,
  // io-ts docs say this is better than t.union([t.literal('yep'), t.literal('nope')])
  is_odd: t.keyof({
    'yep': null,
    'nope': null, 
  }),
  response_time: DateFromISOString,
  number_metadata: t.type({
    number_pronunciation_string: t.string,
    // this could possibly be a dynamic type using the value above. probably overkill
    number_pronunciation_length: t.number,
    number_pronunciation_parts: t.array(t.string),
  })
})

export type IsOddData = t.TypeOf<typeof IsOddData>


// export const NewTimestampData = t.type({
//   // should be a datetime or something
//   formatted_timestamp: DateFromISOString
// })

export const NewTimestampData = t.string

export type NewTimestampData = t.TypeOf<typeof NewTimestampData>


export const APIResponse = <C extends t.Mixed>(codec: C) => t.type({
  response_code: t.number,
  // t.any can be refined to match the python types in both instances
  data: t.union([t.undefined, codec]),
  errors: t.union([t.any, t.undefined]),
})

export const ApiResponses = t.union([
  APIResponse(IsOddData), 
  APIResponse(NewTimestampData),
])
export type ApiResponses = t.TypeOf<typeof ApiResponses>