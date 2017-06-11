//@flow

import { flatten, join, pipe, of, reject, filter, isEmpty, complement } from 'ramda'
// import { fromNullable } from 'folktale/data/maybe'
import { Maybe } from 'mezzanine'
import { typeof Parsimmon } from './fork'


export const resultToString = pipe(flatten, join(''))
export const monoListToMaybe =
  (obj: Parsimmon) =>
    obj
      // .map(list => list[0])
      // .map(Maybe)

export const notEmpty = complement(isEmpty)

const isMonoArray = (val: mixed): boolean %checks => Array.isArray(val) && val.length === 1
export const noSingleArray = (val: mixed) =>
  isMonoArray(val)
    ? val[0]
    : val
