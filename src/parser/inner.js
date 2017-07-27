//@flow

import { Right, Left, Either } from '../either'

export type InnerFail = {
  status: boolean, //false
  index: number, //-1
  value: mixed, //null
  furthest: number,
  expected: string[], //[string]
}

export type InnerSuccess = {
  status: boolean, //true
  index: number,
  value: mixed,
  furthest: number, //-1
  expected: string[], //[]
}

export type InnerResult = InnerSuccess | InnerFail

export type EitherResult = Either<InnerSuccess, InnerFail>



export function makeSuccess(index: number, value: mixed): EitherResult {
  return Right({
    status  : true,
    index,
    value,
    furthest: -1,
    expected: []
  })
}

export function makeFailure(index: number, expected: string): EitherResult {
  return Left({
    status  : false,
    index   : -1,
    value   : null,
    furthest: index,
    expected: [expected]
  })
}

export function mergeReplies(result: EitherResult, last: ?EitherResult): EitherResult {
  if (last == null) {
    return result
  }
  if (result.value.furthest > last.value.furthest) {
    return result
  }
  const expected = (result.value.furthest === last.value.furthest)
    ? unsafeUnion(result.value.expected, last.value.expected)
    : last.value.expected
  const fabric = result.value.status
    ? Right
    : Left
  return fabric({
    status  : result.value.status,
    index   : result.value.index,
    value   : result.value.value,
    furthest: last.value.furthest,
    expected
  })
}


/**
 * Returns the sorted set union of two arrays of strings. Note that if both
 * arrays are empty, it simply returns the first array, and if exactly one
 * array is empty, it returns the other one unsorted. This is safe because
 * expectation arrays always start as [] or [x], so as long as we merge with
 * this function, we know they stay in sorted order.
 *
 * @param {string[]} xs
 * @param {string[]} ys
 * @returns {string[]}
 */
function unsafeUnion(xs: string[], ys: string[]): string[] {
  // Exit early if either array is empty (common case)
  const xn = xs.length
  const yn = ys.length
  if (xn === 0) {
    return ys
  } else if (yn === 0) {
    return xs
  }
  // Two non-empty arrays: do the full algorithm
  const obj = {}
  for (let i = 0; i < xn; i++) {
    obj[xs[i]] = true
  }
  for (let j = 0; j < yn; j++) {
    obj[ys[j]] = true
  }
  const keys = []
  for (const k in obj) {
    if (obj.hasOwnProperty(k)) {
      keys.push(k)
    }
  }
  keys.sort()
  return keys
}


export function makeLineColumnIndex(input: string, i: number) {
  const lines = input.slice(0, i).split('\n')
  // Note that unlike the character offset, the line and column offsets are
  // 1-based.
  const lineWeAreUpTo = lines.length
  const columnWeAreUpTo = lines[lines.length - 1].length + 1
  return {
    offset: i,
    line  : lineWeAreUpTo,
    column: columnWeAreUpTo
  }
}
