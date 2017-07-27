//@flow
'use strict'
import { flatten, T, complement, isEmpty } from 'ramda'
import { Type, Union } from 'mezzanine'
import { seq, alt, lazy, separatedWord, optWhitespace } from './parser'
import { ignore } from './comment'
import { plus, natConst, hash, langle, rangle, percent, openPar, closePar, comma, exclMark } from './token'
import { boxedTypeIdent, varIdent, lcIdentNs } from './ident'
import { resultToString, monoListToMaybe, notEmpty, noSingleArray } from './util'


export const typeIdent = alt(boxedTypeIdent, lcIdentNs, hash).map(resultToString)

export const TypeTerm = Union`TypeTerm`({
  Plain: {
    term   : T,
    isBound: false,
  },
  Bound: {
    term   : T,
    isBound: true,
  },
})

const RawTerm = TypeTerm.contramap(([bound, ...innerTerm]) => ({
  isBound: notEmpty(bound),
  term   : [bound, ...innerTerm]
}))

export const typeTerm = seq(
    monoListToMaybe(exclMark.atMost(1)),
    lazy(() => term)
  ).map(RawTerm)
export const natTerm = lazy(() => term)
export const subexpr = alt(
  seq(
    natConst
      .skip(optWhitespace),
    plus,
    separatedWord(lazy(() => subexpr)),
  ),
  natConst,
  typeIdent,
  // seq(
  //   // typeIdent,
  //   // lazy(() => subexpr),
  //   plus,
  //   natConst,
  // ),
  varIdent,
  lazy(() => term),
)
export const expr = subexpr.atLeast(1)
export const typeExpr = expr
export const natExpr = expr

const Template = Union`Template`({
  LargeTemplate: {
    ident: String,
    expr : Array
  },
  BaseTemplate: {
    ident: String,
    expr : T
  }
}).contramap(([ident, expr, ...subExpr]) => ({
  ident,
  expr: noSingleArray([expr, ...subExpr])
}))

const template = seq(
  typeIdent
    // .map(resultToString)
    .skip(optWhitespace)
    .skip(langle)
    .skip(optWhitespace),
  expr.map(noSingleArray)
    .skip(optWhitespace),
    // .map(map(getTerm)),
  separatedWord(
    comma
      .skip(optWhitespace)
      .then(expr.map(noSingleArray))
      // .map(map(getTerm))
  ).many()
    .skip(optWhitespace),
  rangle
).map(Template)
//  .map(getTerm)

export const term = alt(
  seq(
    openPar.skip(optWhitespace),
    expr.skip(optWhitespace),
    closePar),
  seq(percent, lazy(() => term)),
  template,
  natConst,
  typeIdent,
  varIdent,
)
