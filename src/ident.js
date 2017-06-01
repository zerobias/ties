//@flow
'use strict'
import Type from 'mezzanine'
import { flatten, join, unless, isEmpty } from 'ramda'
import { seq, oneOf, alt, digit } from './fork'
import { resultToString } from './util'
import { dot, underscore, hash } from './token'

export const lcLetter = oneOf('abcdefghijklmnopqrstuvwxyz')
export const ucLetter = oneOf('ABCDEFGHIJKLMNOPQRSTUVWXYZ')
export const hexDigit = oneOf('0123456789abcdef')
export const letter = alt(lcLetter, ucLetter).desc('any letter')
export const identChar = alt(
  letter,
  digit,
  underscore
)
export const lcIdent = seq(
  lcLetter,
  identChar.many()
)
export const ucIdent = seq(
  ucLetter,
  identChar.many()
)

const CombinatorPart = Type({
  Ident: { '@@value': String },
  Code : { '@@value': String }
})


const Combinator = Type({
  Short: { name: CombinatorPart },
  Full : { name: CombinatorPart, code: CombinatorPart },
})

const createCombinator =
  ([ident, code]) => isEmpty(code)
    ? Combinator.Short(ident)
    : Combinator.Full(ident, code)

const namespace = seq(lcIdent, dot)

export const lcIdentNs = seq(
  namespace.atMost(1),
  lcIdent
)
export const ucIdentNs = seq(
  namespace.atMost(1),
  ucIdent
) //.map(resultToString)

export const lcIdentFull = seq(
  lcIdentNs
    .map(flatten)
    .map(join(''))
    .map(CombinatorPart.Ident),
  seq(hash, hexDigit.times(8))
    .atMost(1)
    .map(flatten)
    .map(join(''))
    .map(unless(isEmpty, CombinatorPart.Code))
).map(createCombinator)
 .map(e => (console.log(e), e))

export const varIdent = alt(lcIdent, ucIdent)

export const varIdentOpt = alt(underscore, varIdent)

export const boxedTypeIdent = ucIdentNs
