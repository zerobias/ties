//@flow
'use strict'
import { Just, Nothing, IMaybe } from 'folktale/data/maybe'
import { flatten, T, complement, isEmpty } from 'ramda'
import { Type, Union } from 'mezzanine'
import { seq, alt, lazy, separatedWord, optWhitespace } from './fork'
import { ignore } from './comment'
import { plus, natConst, hash, langle, rangle, percent, openPar, closePar, comma, exclMark } from './token'
import { boxedTypeIdent, varIdent, lcIdentNs } from './ident'
import { resultToString, monoListToMaybe, notEmpty, noSingleArray } from './util'

const Plain = Type`Plain`(Array)
const List = Type`List`(Array)
const Bare = Type`Bare`(Array)
const Void = Type`Void`(T)

/*const { isTerm } = do {
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
        this.vector = head
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
        case 'Plain': return Plain(this.value)
        case 'Bare': return Bare(this.value)
        case 'List': return List(this.value)
        case 'Empty': return Void()
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
    Plain: ([shape, val]: [Shape, string | Term]) => Plain([shape, val]),
    Bare : ([shape, val]: [Shape, string]) => Bare([shape, val]),
    List : ([shape, val]: [Shape, Term[]]) => List([shape, val]),
    Empty: () => Void(),
  }
  const ret = { Term$: term, isTerm: Term.is }
  ret
}*/


// const getTerm = ([shape, obj]) => {
//   if (Array.isArray(obj)) return List([shape, obj])
//   if (!!shape) return obj
//   return Plain([shape, obj])
// }



export const typeIdent = alt(boxedTypeIdent, lcIdentNs, hash).map(resultToString)
export const typeTerm = seq(
    monoListToMaybe(exclMark.atMost(1)),
    lazy(() => term)
  )//.map(getTerm)
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

const BaseTemplate = Type`BaseTemplate`({
  ident: String,
  expr : T
})

const LargeTemplate = Type`LargeTemplate`({
  ident  : String,
  expr   : T,
  subExpr: notEmpty
})

const Template = Union`Template`({
  LargeTemplate,
  BaseTemplate
}, {
  expr: (ctx) => ctx.case({
    LargeTemplate: ({ expr, subExpr }) => [expr, ...subExpr],
    BaseTemplate : ({ expr }) => [expr]
  }),
  ident: (ctx) => ctx.value.ident
}).contramap(([ident, expr, subExpr]) => ({
  ident,
  expr,
  subExpr
}))

const template = seq(
  typeIdent
    // .map(resultToString)
    .skip(optWhitespace),
  langle
    .skip(optWhitespace)
    .then(expr.map(noSingleArray))
    .skip(optWhitespace),
    // .map(map(getTerm)),
  separatedWord(
    comma
      .skip(optWhitespace)
      .then(expr.map(noSingleArray))
      // .map(map(getTerm))
  ).many()
    .skip(optWhitespace)
    .skip(rangle)
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
