//@flow

import { flatten, join, pipe, of, reject, filter, isEmpty, unnest } from 'ramda'
import { fromNullable } from 'folktale/data/maybe'
import { typeof Parsimmon } from './fork'


export const resultToString = pipe(flatten, join(''))
export const monoListToMaybe =
  (obj: Parsimmon) =>
    obj
      .map(list => list[0])
      .map(fromNullable)
