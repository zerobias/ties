//@flow
'use strict'

// The Parser object is a wrapper for a parser function.
// Externally, you use one to parse a string by calling
//   var result = SomeParser.parse('Me Me Me! Parse Me!');
// You should never call the constructor, rather you should
// construct your Parser from the base parsers and the
// parser combinator methods.

interface Parser {

}

type Index = {
  offset: number,
  line: number,
  column: number,
}
type Success<Value = string> = {
  status: true,
  value: mixed,
}
type Fail = {
  status: false,
  index: Index,
  expected: string,
}

type Result<Value = string> = Success<Value> | Fail

type Predicate = (str: string) => bool

interface ParseError {
  type: 'ParsimmonError',
  result: Fail,
}

class ParsimmonError extends Error implements ParseError {
  type = 'ParsimmonError'
  result: *
  constructor(msg: string, result: *) {
    super(msg)
    this.result = result
  }
}

export class Parsimmon {
  _: <T>(input: string, i: number) => T
  constructor(action: <T>(input: string, i: number) => T) {
    this._ = action
  }
  parse(input: string) {
    if (typeof input !== 'string') {
      throw new Error('.parse must be called with a string as its argument')
    }
    const result = this.skip(eof)._(input, 0)

    return result.status ? {
      status: true,
      value : result.value
    } : {
      status  : false,
      index   : makeLineColumnIndex(input, result.furthest),
      expected: result.expected
    }
  }
  tryParse(str: string) {
    const result = this.parse(str)
    if (result.status) {
      return result.value
    } else {
      const msg = formatError(str, result)
      const err = new ParsimmonError(msg, result)
      throw err
    }
  }
  or(alternative: Parsimmon): Parsimmon {
    return alt(this, alternative)
  }
  then(next: Parsimmon): Parsimmon {
    if (typeof next === 'function') {
      throw new Error('chaining features of .then are no longer supported, use .chain instead')
    }
    assertParser(next)
    return seq(this, next).map((results) => results[1])
  }
  many(): Parsimmon {
    return new Parsimmon((input: string, i: number) => {
      const accum = []
      let result: InnerResult

      for (;;) {
        result = mergeReplies(this._(input, i), result)
        if (result.status) {
          i = result.index
          accum.push(result.value)
        } else {
          return mergeReplies(makeSuccess(i, accum), result)
        }
      }
    })
  }
  times(min: number, max: number = min): Parsimmon {
    assertNumber(min)
    assertNumber(max)
    return new Parsimmon((input: string, i: number) => {
      const accum = []
      let result: InnerResult
      let prevResult: InnerResult
      let times = 0
      for (; times < min; times += 1) {
        result = this._(input, i)
        prevResult = mergeReplies(result, prevResult)
        if (result.status) {
          i = result.index
          accum.push(result.value)
        } else {
          return prevResult
        }
      }
      for (; times < max; times += 1) {
        result = this._(input, i)
        prevResult = mergeReplies(result, prevResult)
        if (result.status) {
          i = result.index
          accum.push(result.value)
        } else {
          break
        }
      }
      return mergeReplies(makeSuccess(i, accum), prevResult)
    })
  }
  result(res: string): Parsimmon {
    return this.map(() => res)
  }

  atMost(n: number): Parsimmon {
    return this.times(0, n)
  }

  atLeast(n: number): Parsimmon {
    return seqMap(this.times(n), this.many(), (init, rest) =>  init.concat(rest))
  }

  map(fn: (str: string[] | string) => string[] | string): Parsimmon {
    assertFunction(fn)
    return new Parsimmon((input: string, i: number) => {
      const result = this._(input, i)
      if (!result.status) {
        return result
      }
      return mergeReplies(makeSuccess(result.index, fn(result.value)), result)
    })
  }

  skip(next: Parsimmon): Parsimmon {
    return seq(this, next).map((results: string[]) => results[0])
  }

  mark() {
    return seqMap(
      index,
      this,
      index,
      (start: number, value: *, end: number) => ({
        start,
        value,
        end
      })
    )
  }

  lookahead(x: Parsimmon | RegExp | string): Parsimmon {
    return this.skip(lookahead(x))
  }

  notFollowedBy(x: Parsimmon): Parsimmon {
    return this.skip(notFollowedBy(x))
  }

  desc(expected: string): Parsimmon {
    return new Parsimmon((input: string, i: number) => {
      const reply = this._(input, i)
      if (!reply.status) {
        reply.expected = [expected]
      }
      return reply
    })
  }

  fallback(result: string[] | string): Parsimmon {
    return this.or(succeed(result))
  }

  ap(other: Parsimmon) {
    return seqMap(other, this, (f, x) => f(x))
  }
  chain<T>(f: (str: T) => Parsimmon): Parsimmon {
    return new Parsimmon((input: string, i: number) => {
      const result = this._(input, i)
      if (!result.status) {
        return result
      }
      const nextParser = f(result.value)
      return mergeReplies(nextParser._(input, result.index), result)
    })
  }
  empty(): Parsimmon {
    return fail('fantasy-land/empty')
  }
  concat(alternative: Parsimmon): Parsimmon {
    return alt(this, alternative)
  }
  of(value: string[] | string): Parsimmon {
    return succeed(value)
  }
}

export function isParser(obj: Parsimmon) {
  return obj instanceof Parsimmon
}

const _ = Parsimmon.prototype

type InnerFail = {
  status: false,
  index: -1,
  value: null,
  furthest: number,
  expected: [string],
}

type InnerSuccess = {
  status: true,
  index: number,
  value: mixed,
  furthest: -1,
  expected: [],
}

type InnerResult = InnerSuccess | InnerFail

export function makeSuccess(index: number, value: *): InnerSuccess {
  return {
    status  : true,
    index,
    value,
    furthest: -1,
    expected: []
  }
}

export function makeFailure(index: number, expected: string): InnerFail {
  return {
    status  : false,
    index   : -1,
    value   : null,
    furthest: index,
    expected: [expected]
  }
}

function mergeReplies(result: InnerResult, last: ?InnerResult): InnerResult {
  if (last == null) {
    return result
  }
  if (result.furthest > last.furthest) {
    return result
  }
  const expected = (result.furthest === last.furthest)
    ? unsafeUnion(result.expected, last.expected)
    : last.expected
  return {
    status  : result.status,
    index   : result.index,
    value   : result.value,
    furthest: last.furthest,
    expected
  }
}

// Returns the sorted set union of two arrays of strings. Note that if both
// arrays are empty, it simply returns the first array, and if exactly one
// array is empty, it returns the other one unsorted. This is safe because
// expectation arrays always start as [] or [x], so as long as we merge with
// this function, we know they stay in sorted order.
function unsafeUnion(xs, ys) {
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

// For ensuring we have the right argument types
function assertParser(p: Parsimmon) {
  if (!isParser(p)) {
    throw new Error(`not a parser: ${p}`)
  }
}

function assertNumber(x: number) {
  if (typeof x !== 'number') {
    throw new Error(`not a number: ${  x}`)
  }
}

function assertRegexp(x: RegExp) {
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
      throw new Error(`unsupported regexp flag "${  c  }": ${  x}`)
    }
  }
}

function assertFunction(x: Function) {
  if (typeof x !== 'function') {
    throw new Error(`not a function: ${  x}`)
  }
}

function assertString(x: string) {
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

function formatError(input, error) {
  return `expected ${
    formatExpected(error.expected)
    }${formatGot(input, error)}`
}

// [Parsimmon a] -> Parsimmon [a]
export function seq(...parsers: Parsimmon[]) {
  const numParsers = parsers.length
  for (let j = 0; j < numParsers; j += 1) {
    assertParser(parsers[j])
  }
  return new Parsimmon((input: string, i: number) => {
    let result
    const accum = new Array(numParsers)
    for (let j = 0; j < numParsers; j += 1) {
      result = mergeReplies(parsers[j]._(input, i), result)
      if (!result.status) {
        return result
      }
      accum[j] = result.value
      i = result.index
    }
    return mergeReplies(makeSuccess(i, accum), result)
  })
}

interface Args {
  (a: Parsimmon, fn: (a: string[]) => string[]): Parsimmon,
  (a: Parsimmon, b: Parsimmon, fn: (a: string[], b: string[]) => string[]): Parsimmon,
  (a: Parsimmon, b: Parsimmon, c: Parsimmon, fn: (a: string[], b: string[], c: string[]) => string[]): Parsimmon,
}

export const seqMap: Args = (...args: *): Parsimmon => {
  if (args.length === 0) {
    throw new Error('seqMap needs at least one argument')
  }
  const mapper = args.pop()
  assertFunction(mapper)
  return seq(...args).map((results) => mapper(...results))
}

/**
 * Allows to add custom primitive parsers
 */
export function custom(parsingFunction: *) {
  return new Parsimmon(parsingFunction(makeSuccess, makeFailure))
}

export function alt(...parsers: Parsimmon[]) {
  const numParsers = parsers.length
  if (numParsers === 0) {
    return fail('zero alternates')
  }
  for (let j = 0; j < numParsers; j += 1) {
    assertParser(parsers[j])
  }
  return new Parsimmon((input, i: number) => {
    let result
    for (let j = 0; j < parsers.length; j += 1) {
      result = mergeReplies(parsers[j]._(input, i), result)
      if (result.status) return result
    }
    return result
  })
}

export function sepBy(parser, separator) {
  // Argument asserted by sepBy1
  return sepBy1(parser, separator).or(succeed([]))
}

export function sepBy1(parser, separator) {
  assertParser(parser)
  assertParser(separator)
  const pairs = separator.then(parser).many()
  return parser.chain((r) => pairs.map((rs) => [r].concat(rs)))
}

// -*- primitive combinators -*- //

// -*- higher-level combinators -*- //

// -*- primitive parsers -*- //
export function word(str: string) {
  assertString(str)
  const expected = str
  return new Parsimmon((input: string, i: number) => {
    const j = i + str.length
    const head = input.slice(i, j)
    if (head === str) {
      return makeSuccess(j, head)
    } else {
      return makeFailure(i, expected)
    }
  })
}

function anchoredRegexp(re: RegExp) {
  //$FlowIssue
  return RegExp(`^(?:${  re.source  })`, re.flags)
}

export function regexp(re: RegExp, group: number = 0) {
  assertRegexp(re)
  assertNumber(group)
  const anchored = anchoredRegexp(re)
  const expected = re.toString()
  return new Parsimmon((input: string, i: number) => {
    const match = anchored.exec(input.slice(i))
    if (match) {
      const fullMatch = match[0]
      const groupMatch = match[group]
      if (groupMatch != null) {
        return makeSuccess(i + fullMatch.length, groupMatch)
      }
    }
    return makeFailure(i, expected)
  })
}

export function succeed(value: string[] | string) {
  return new Parsimmon((input: string, i: number) => makeSuccess(i, value))
}

export function fail(expected: string[] | string) {
  return new Parsimmon((input: string, i: number) => makeFailure(i, expected))
}

export function lookahead(x: Parsimmon | RegExp | string) {
  if (isParser(x)) {
    return new Parsimmon((input: string, i: number) => {
      const result = x._(input, i)
      result.index = i
      result.value = ''
      return result
    })
  } else if (typeof x === 'string') {
    return lookahead(word(x))
  } else if (x instanceof RegExp) {
    return lookahead(regexp(x))
  }
  throw new Error(`not a string, regexp, or parser: ${  x}`)
}

export function notFollowedBy(parser: Parsimmon) {
  assertParser(parser)
  return new Parsimmon((input: string, i: number) => {
    const result = parser._(input, i)
    const text = input.slice(i, result.index)
    return result.status
      ? makeFailure(i, `not "${text}"`)
      : makeSuccess(i, null)
  })
}

export const any = new Parsimmon((input: string, i: number) => {
  if (i >= input.length) {
    return makeFailure(i, 'any character')
  }
  return makeSuccess(i+1, input.charAt(i))
})

export const all = new Parsimmon((input: string, i: number) => makeSuccess(input.length, input.slice(i)))

export const eof = new Parsimmon((input: string, i: number) => {
  if (i < input.length) {
    return makeFailure(i, 'EOF')
  }
  return makeSuccess(i, null)
})

export function test(predicate: (char: string) => boolean) {
  assertFunction(predicate)
  return new Parsimmon((input: string, i: number) => {
    const char = input.charAt(i)
    if (i < input.length && predicate(char)) {
      return makeSuccess(i + 1, char)
    } else {
      return makeFailure(i, `a character matching ${  predicate}`)
    }
  })
}

export function oneOf(str: string) {
  return test((ch) => str.indexOf(ch) >= 0)
}

export function noneOf(str: string) {
  return test((ch) => str.indexOf(ch) < 0)
}

export function takeWhile(predicate) {
  assertFunction(predicate)

  return new Parsimmon((input: string, i: number) => {
    let j = i
    while (j < input.length && predicate(input.charAt(j))) {
      j++
    }
    return makeSuccess(j, input.slice(i, j))
  })
}

interface Lazy {
  (f: () => Parsimmon): Parsimmon,
  (desc: string, f: () => Parsimmon): Parsimmon,
}

export const lazy: Lazy = (...args: *) => {
  let desc: string,
      f: () => Parsimmon,
      hasDesc = false

  if (args.length === 1) {
    f = args[0]
  } else if (args.length === 2) {
    hasDesc = true
    desc = args[0]
    f = args[1]
  } else throw new Error('lazy require 2 arguments maximum')

  const parser = new Parsimmon((input: string, i: number) => {
    parser._ = f()._
    return parser._(input, i)
  })

  if (hasDesc) {
    return parser.desc(desc)
  } else {
    return parser
  }
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

export const index: Parsimmon = new Parsimmon(
  (input: string, i: number) =>
    makeSuccess(i, makeLineColumnIndex(input, i)))

export function empty(): Parsimmon {
  return fail('fantasy-land/empty')
}

// export { or as concat }
// _['fantasy-land/map'] = _.map
// Fantasy Land Semigroup support
// _.concat = _.or
// _['fantasy-land/concat'] = _.concat

// Fantasy Land Semigroup and Monoid support
// _.empty = empty
// _['fantasy-land/empty'] = _.empty

// Fantasy Land Applicative support
// _.of = succeed
// _['fantasy-land/of'] = _.of

// Fantasy Land Applicative support

// _['fantasy-land/ap'] = _.ap

// _['fantasy-land/chain'] = _.chain

export const digit: Parsimmon = regexp(/[0-9]/).desc('a digit')
export const digits: Parsimmon = regexp(/[0-9]*/).desc('optional digits')
export const letter: Parsimmon = regexp(/[a-z]/i).desc('a letter')
export const letters: Parsimmon = regexp(/[a-z]*/i).desc('optional letters')
export const optWhitespace: Parsimmon = regexp(/\s*/).desc('optional whitespace')
export function separatedWord(p: Parsimmon) {
  return seq(optWhitespace, p)
}

export const whitespace: Parsimmon = regexp(/\s+/).desc('whitespace')
export { succeed as of }
/*Parsimmon.all = all
Parsimmon.alt = alt
Parsimmon.any = any
Parsimmon.custom = custom
Parsimmon.digit = digit
Parsimmon.digits = digits
Parsimmon.eof = eof
Parsimmon.fail = fail
Parsimmon.formatError = formatError
Parsimmon.index = index
Parsimmon.isParser = isParser
Parsimmon.lazy = lazy
Parsimmon.letter = letter
Parsimmon.letters = letters
Parsimmon.lookahead = lookahead
Parsimmon.notFollowedBy = notFollowedBy
Parsimmon.makeFailure = makeFailure
Parsimmon.makeSuccess = makeSuccess
Parsimmon.noneOf = noneOf
Parsimmon.oneOf = oneOf
Parsimmon.optWhitespace = optWhitespace
Parsimmon.Parser = Parsimmon
Parsimmon.regex = regexp
Parsimmon.regexp = regexp
Parsimmon.sepBy = sepBy
Parsimmon.sepBy1 = sepBy1
Parsimmon.seq = seq
Parsimmon.seqMap = seqMap
Parsimmon.word = word
Parsimmon.succeed = succeed
Parsimmon.takeWhile = takeWhile
Parsimmon.test = test
Parsimmon.whitespace = whitespace

// Fantasy Land Semigroup support
Parsimmon.empty = empty
Parsimmon['fantasy-land/empty'] = empty

// Fantasy Land Applicative support
Parsimmon.of = succeed
Parsimmon['fantasy-land/of'] = succeed*/

export default Parsimmon
