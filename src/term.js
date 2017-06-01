//@flow
'use strict'
import { Just, Nothing, IMaybe } from 'folktale/data/maybe'
import { flatten, map } from 'ramda'
import { seq, alt, lazy, separatedWord, optWhitespace } from './fork'
import { ignore } from './comment'
import { plus, natConst, hash, langle, rangle, percent, openPar, closePar, comma, exclMark } from './token'
import { boxedTypeIdent, varIdent, lcIdentNs } from './ident'
import { resultToString, monoListToMaybe } from './util'

const { Term$, isTerm } = do {
  type Term$Subtype = 'Plain' | 'Bare' | 'List' | 'Empty'
  interface Term$Case<-S, -B, -L, -E> {
    Plain(obj: $Shape<Term>): S,
    Bare(obj: $Shape<Term>): B,
    List(obj: $Shape<Term>): L,
    Empty(obj: $Shape<Term>): E,
  }
  type Shape = IMaybe<string | Term>
  class Term {
    _: string = 'Term'
    subtype: Term$Subtype
    value: string | string[] | Term | Term[]
    vector: IMaybe<Term>
    shape: Shape
    constructor(val: string | Term[], shape: Shape, subtype: Term$Subtype) {
      this.subtype = subtype
      this.shape = shape
      if (subtype === 'List' && Array.isArray(val)) {
        const [head, ...tail] = val
        this.vector = Just(head)
        if (tail.length === 1)
          this.value = tail[0]
        else
          this.value = tail
      } else {
        this.vector = Nothing()
        this.value = val
      }
    }
    case<S, B, L>(val: Term$Case<S, B, L>): S | B | L {
      switch (this.subtype) {
        case 'Plain': return val.Plain(this)
        case 'Bare': return val.Bare(this)
        case 'List': return val.List(this)
        case 'Empty': return val.Empty(this)
      }
    }
    static is(obj: *) {
      return obj instanceof Term
    }
    toString() {
      return this.case({
        Plain: () => `Term[Plain] ${this.value}`,
        Bare : () => `Term[Bare] ${this.value}`,
        List : () => `Term[List] ${this.vector.getOrElse({}).value}<${this.value.value || this.value}>`,
        Empty: () => `Term[Empty]`,
      })
    }
    [Symbol.toPrimitive]() {
      return this.toString()
    }
    get [Symbol.toStringTag]() {
      return `Term ${this.subtype}`
    }
  }
  const term = {
    Plain: ([shape, val]: [Shape, string | Term]) => new Term(val, shape, 'Plain'),
    Bare : ([shape, val]: [Shape, string]) => new Term(val, shape, 'Bare'),
    List : ([shape, val]: [Shape, Term[]]) => new Term(val, shape, 'List'),
    Empty: () => new Term('', Nothing(), 'Empty'),
  }
  const ret = { Term$: term, isTerm: Term.is }
  ret
}

export { Term$ }

const getTerm = ([shape, obj]) => {
  if (Array.isArray(obj)) return Term$.List([shape, obj])
  if (isTerm(obj)) return obj
  return Term$.Plain([shape, obj])
}

export const typeIdent = alt(boxedTypeIdent, lcIdentNs, hash)
export const typeTerm = seq(
    monoListToMaybe(exclMark.atMost(1)),
    lazy(() => term)
  ).map(getTerm)
export const natTerm = lazy(() => term)
export const subexpr = alt(
  seq(
    natConst
      .skip(optWhitespace),
    plus,
    separatedWord(lazy(() => subexpr)),
  ),
  natConst,
  typeIdent.map(resultToString),
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


const template = seq(
  typeIdent
    .map(resultToString)
    .skip(optWhitespace),
  langle
    .then(optWhitespace)
    .then(expr),
    // .map(map(getTerm)),
  optWhitespace
    .then(
      separatedWord(
        comma
          .skip(optWhitespace)
          .then(expr)
          // .map(map(getTerm))
      ).many()
    )
    .skip(optWhitespace)
    .skip(rangle)
).map(flatten)
//  .map(getTerm)

export const term = alt(
  seq(
    openPar.skip(optWhitespace),
    expr.skip(optWhitespace),
    closePar),
  seq(percent, lazy(() => term)),
  template,
  natConst,
  typeIdent.map(resultToString),
  varIdent,
)
