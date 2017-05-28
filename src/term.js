//@flow
'use strict'
import { seq, alt, lazy, separatedWord, optWhitespace } from './fork'
import { ignore } from './comment'
import { plus, natConst, hash, langle, rangle, percent, openPar, closePar, comma } from './token'
import { boxedTypeIdent, varIdent, lcIdentNs } from './ident'


export const typeIdent = alt(boxedTypeIdent, lcIdentNs, hash)
export const typeTerm = lazy(() => term)
export const natTerm = lazy(() => term)
export const subexpr = alt(
  seq(
    natConst,
    optWhitespace,
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
export const term = alt(
  seq(openPar, optWhitespace, expr, optWhitespace, closePar),
  seq(percent, lazy(() => term)),
  seq(
    typeIdent,
    optWhitespace,
    langle,
    optWhitespace,
    expr,
    optWhitespace,
    separatedWord(seq(
      comma,
      optWhitespace,
      expr,
    )).many(),
    optWhitespace,
    rangle,
  ),
  natConst,
  typeIdent,
  varIdent,
)
