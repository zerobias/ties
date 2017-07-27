//@flow

import { isParser } from './base'
import { type Parsimmon } from './fork'

export { isParser } from './base'


/**
 * For ensuring we have the right argument types
 *
 * @param {Parsimmon} p
 */
export function assertParser(p: Parsimmon) {
  if (!isParser(p)) {
    throw new Error(`not a parser: ${String(p)}`)
  }
}

export function assertNumber(x: number) {
  if (typeof x !== 'number') {
    throw new Error(`not a number: ${x}`)
  }
}

export function assertRegexp(x: RegExp) {
  if (!(x instanceof RegExp)) {
    throw new Error(`not a regexp: ${x}`)
  }
  const f = x.flags
  for (let i = 0; i < f.length; i++) {
    const c = f.charAt(i)
    // Only allow regexp flags [imu] for now, since [g] and [y] specifically
    // mess up Parsimmon. If more non-stateful regexp flags are added in the
    // future, this will need to be revisited.
    if (c != 'i' && c != 'm' && c != 'u') {
      throw new Error(`unsupported regexp flag "${  c  }": ${String(x)}`)
    }
  }
}

export function assertFunction(x: Function) {
  if (typeof x !== 'function') {
    throw new Error(`not a function: ${  x}`)
  }
}

export function assertString(x: string) {
  if (typeof x !== 'string') {
    throw new Error(`not a string: ${  x}`)
  }
}

function formatExpected(expected) {
  if (expected.length === 1) {
    return expected[0]
  }
  return `one of ${  expected.join(', ')}`
}

function formatGot(input, error) {
  const index = error.index
  const i = index.offset
  if (i === input.length) {
    return ', got the end of the input'
  }
  const prefix = (i > 0 ? '\'...' : '\'')
  const suffix = (input.length - i > 12 ? '...\'' : '\'')
  return ` at line ${  index.line  } column ${  index.column
  }, got ${  prefix  }${input.slice(i, i + 12)  }${suffix}`
}

export function formatError(input, error) {
  return `expected ${
    formatExpected(error.expected)
  }${formatGot(input, error)}`
}
