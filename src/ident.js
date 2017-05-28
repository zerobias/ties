//@flow
'use strict'
import { seq, oneOf, alt, digit } from './fork'

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

const namespace = seq(lcIdent, dot)

export const lcIdentNs = seq(
  namespace.atMost(1),
  lcIdent
)
export const ucIdentNs = seq(
  namespace.atMost(1),
  ucIdent
)

export const lcIdentFull = seq(
  lcIdentNs,
  seq(hash, digit.times(8).desc('ident 8 digits')).atMost(1)
)

export const varIdent = alt(lcIdent, ucIdent)

export const varIdentOpt = alt(underscore, varIdent)

export const boxedTypeIdent = ucIdentNs
