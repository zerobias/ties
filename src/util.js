//@flow

import { flatten, join, pipe, of, reject, filter, isEmpty, complement } from 'ramda'
import { type Parsimmon } from './parser'


export const resultToString = pipe(flatten, join(''))
export const monoListToMaybe =
  (obj: Parsimmon) => obj

export const notEmpty = complement(isEmpty)

const isMonoArray = (val: mixed): boolean %checks => Array.isArray(val) && val.length === 1
export const noSingleArray = (val: mixed) =>
  isMonoArray(val)
    ? val[0]
    : val
