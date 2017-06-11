//@flow
'use strict'
import { Type, Union } from 'mezzanine'
import { flatten, join, unless, isEmpty, defaultTo, complement, T } from 'ramda'
import { seq, oneOf, alt, digit } from './fork'
import { resultToString, notEmpty } from './util'
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
).map(resultToString)
export const ucIdent = seq(
  ucLetter,
  identChar.many()
).map(resultToString)

// const CombinatorPart = Type`CombinatorPart`({
//   ident: String,
//   code : String,
// })


// const Combinator = Union`Combinator`({
//   Full : { ident: String, code: notEmpty },
//   Short: { ident: String },
// }).contramap(([ident, code]) => ({ ident, code }))

const namespace = seq(lcIdent, dot)

const LcIdentFree = Type`LcIdentFree`({
  group: isEmpty,
  ident: String,
  hash : String,
})


const LcIdentGroup = Type`LcIdentGroup`({
  group: notEmpty,
  ident: String,
  hash : String,
})

const LcIdent = Union`LcIdent`({
  Group: LcIdentGroup,
  Free : LcIdentFree
}, {
  hasHash: (ctx) => notEmpty(ctx.value.hash),
  ident  : ctx => ctx.case({
    Group: ({ ident, group, hash }) => [group.join(''), ident, hash].join(''),
    Free : ({ ident, hash }) => [ident, hash].join('')
  })
}).contramap(([[group, ident], hash]: [[string[], string], string]) => ({ group, ident, hash }))

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
    // .map(flatten)
    // .map(join(''))
  ,
  seq(hash, hexDigit.times(8))
    .atMost(1)
    .map(flatten)
    .map(join(''))
    .map(defaultTo(''))
).map(LcIdent)
//  .map(e => (console.log(e), e))

export const varIdent = alt(lcIdent, ucIdent)

export const varIdentOpt = alt(underscore, varIdent)

export const boxedTypeIdent = ucIdentNs
