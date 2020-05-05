import * as t from 'io-ts'

export const IsOddData = t.type({
  number: t.number,
  // io-ts docs say this is better than t.union([t.literal('yep'), t.literal('nope')])
  is_odd: t.keyof({
    'yep': null,
    'nope': null, 
  }),
  // TODO: i want to figure out how to actually determine if this is a ISO8601 string (refinement of some sort)
  response_time: t.string,
  number_metadata: t.type({
    number_pronunciation_string: t.string,
    // this could possibly be a dynamic type using the value above. probably overkill
    number_pronunciation_length: t.number,
    number_pronunciation_parts: t.array(t.string),
  })
})

export type IsOddData = t.TypeOf<typeof IsOddData>

// possible room for refinement(brand) that checks if the | character is in the string
export type isOddString = string

export const APIResponse = t.type({
  response_code: t.number,
  // t.any can be refined to match the python types in both instances
  data: t.union([t.any, t.undefined]),
  errors: t.union([t.any, t.undefined]),
})