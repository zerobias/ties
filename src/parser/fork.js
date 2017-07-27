//@flow
'use strict'

import Parser from './base'
import {
  formatError,
  assertParser,
  assertNumber,
  assertFunction,
  assertString,
  assertRegexp,
} from './assert'
import {
  makeSuccess,
  makeFailure,
  mergeReplies,
  makeLineColumnIndex,
  type InnerResult,
  type EitherResult,
} from './inner'

// interface Parser {

// }

type Index = {
  offset: number,
  line: number,
  column: number,
}
// type Success<Value = string> = {
//   status: true,
//   value: mixed,
// }
type Fail = {
  status: false,
  index: Index,
  expected: string,
}

// type Result<Value = string> = Success<Value> | Fail

// type Predicate = (str: string) => bool

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

/**
 * The Parser object is a wrapper for a parser function.
 * Externally, you use one to parse a string by calling
 *   var result = SomeParser.parse('Me Me Me! Parse Me!');
 * You should never call the constructor, rather you should
 * construct your Parser from the base parsers and the
 * parser combinator methods.
 *
 * @export
 * @class Parsimmon
 */
export class Parsimmon extends Parser<EitherResult> {
  _: (input: string, i: number) => EitherResult
  constructor(action: (input: string, i: number) => EitherResult) {
    super(action)
  }
  parse(input: string) {
    if (typeof input !== 'string') {
      throw new Error('.parse must be called with a string as its argument')
    }
    const result: EitherResult = this.skip(eof)._(input, 0)
    return result.bimap(
      ({ value }: typeof result.value) => ({ status: true, value }),
      (data: typeof result.value) => ({
        status  : false,
        index   : makeLineColumnIndex(input, data.furthest),
        expected: data.expected,
      }))
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
    //$FlowIssue
    return seq(this, next).map((results) => results[1])
  }
  many(): Parsimmon {
    return new Parsimmon((input: string, i: number): EitherResult => {
      const accum = []
      let result: EitherResult

      for (;;) {
        result = mergeReplies(this._(input, i), result)
        if (result.isRight()) {
          i = result.value.index
          accum.push(result.value.value)
        } else {
          return mergeReplies(makeSuccess(i, accum), result)
        }
      }
      /*::
      declare var cast: EitherResult
      return cast
      */
    })
  }
  times(min: number, max: number = min): Parsimmon {
    assertNumber(min)
    assertNumber(max)
    return new Parsimmon((input: string, i: number) => {
      const accum = []
      let result: EitherResult
      let prevResult: EitherResult
      let times = 0
      for (; times < min; times += 1) {
        result = this._(input, i)
        prevResult = mergeReplies(result, prevResult)
        if (result.value.status) {
          i = result.value.index
          accum.push(result.value.value)
        } else {
          return prevResult
        }
      }
      for (; times < max; times += 1) {
        result = this._(input, i)
        prevResult = mergeReplies(result, prevResult)
        if (result.isRight()) {
          i = result.value.index
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
    return seqMap((init, rest) =>  init.concat(rest), this.times(n), this.many())
  }

  map<I, O>(fn: (str: I) => O): Parsimmon {
    assertFunction(fn)
    return new Parsimmon((input: string, i: number) => {
      const result: EitherResult = this._(input, i)
      if (result.isLeft()) {
        return result
      }
      return mergeReplies(makeSuccess(result.value.index, fn(result.value.value)), result)
    })
  }

  skip(next: Parsimmon): Parsimmon {
    return seq(this, next).map((results: string[]) => results[0])
  }

  mark() {
    return seqMap(
      (start, value, end) => ({
        start,
        value,
        end
      }),
      index,
      this,
      index
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
      return reply.mapLeft((data) => ({ ...data, expected: [expected] }))
    })
  }

  fallback(result: string[] | string): Parsimmon {
    return this.or(succeed(result))
  }

  // ap(other: Parsimmon) {
  //   return seqMap((f, x) => f(x), other, this)
  // }
  chain<T>(f: (str: T) => Parsimmon): Parsimmon {
    return new Parsimmon((input: string, i: number) => {
      const result = this._(input, i)
      if (result.isLeft()) {
        return result
      }
      const nextParser = f(result.value.value)
      return mergeReplies(nextParser._(input, result.value.index), result)
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
  log(tag: string = '') {
    return this.map(e => (
      console.log(tag),
      console.dir(e, { colors: true }),
      e
    ))
  }
}


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
      if (result.isLeft()) {
        return result
      }
      accum[j] = result.value.value
      i = result.value.index
    }
    return mergeReplies(makeSuccess(i, accum), result)
  })
}

interface Args {
  (fn: (a: string[], b: string[], c: string[]) => string[], a: Parsimmon, b: Parsimmon, c: Parsimmon): Parsimmon,
  (fn: (a: string[], b: string[]) => string[], a: Parsimmon, b: Parsimmon): Parsimmon,
  (fn: (a: string[]) => string[], a: Parsimmon): Parsimmon,
}

export const seqMap: Args = (mapper, ...args): Parsimmon => {
  if (args.length === 0) {
    throw new Error('seqMap needs at least one argument')
  }
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
    let result: EitherResult
    /*::
    declare var ei: EitherResult
    result = ei
    */
    for (let j = 0; j < parsers.length; j += 1) {
      result = mergeReplies(parsers[j]._(input, i), result)
      if (result.isRight()) return result
    }
    return result
  })
}

export function sepBy(parser: Parsimmon, separator: Parsimmon) {
  // Argument asserted by sepBy1
  return sepBy1(parser, separator).or(succeed([]))
}

export function sepBy1(parser: Parsimmon, separator: Parsimmon) {
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

export function isParser(obj: mixed): boolean %checks {
  return obj instanceof Parsimmon
}

export function lookahead(x: Parsimmon | RegExp | string): Parsimmon {
  if (isParser(x)) {
    const pars: Parsimmon = x
    return new Parsimmon((input: string, i: number) => {
      const result = pars._(input, i)
      result.value.index = i
      result.value.value = ''
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
  return new Parsimmon((input: string, i: number): EitherResult => {
    const result = parser._(input, i)
    const text = input.slice(i, result.value.index)

    return result.bimap(
      makeFailure(i, `not "${text}"`),
      makeSuccess(i, null))
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
      return makeFailure(i, `a character matching ${  String(predicate)}`)
    }
  })
}

export function oneOf(str: string) {
  return test((ch) => str.indexOf(ch) >= 0)
}

export function noneOf(str: string) {
  return test((ch) => str.indexOf(ch) < 0)
}

export function takeWhile(predicate: $Pred<1>) {
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
export const optWhitespace: Parsimmon = regexp(/\s*/).map(() => '')
export function separatedWord(p: Parsimmon) {
  return optWhitespace.then(p)
}

export const noWhitespace = optWhitespace.map(() => '')
export const whitespace: Parsimmon = regexp(/\s+/).desc('whitespace')
export { succeed as of }



export default Parsimmon
