//@flow
import { T, flatten, join, pipe, of, reject, filter, isEmpty, unnest, complement, isNil } from 'ramda'
// import Type from 'mezzanine'
// import { hasInstance, fromNullable, Just, Nothing, IMaybe } from 'folktale/data/maybe'
import { Type, Union } from 'mezzanine'
import { seq, separatedWord, alt, lazy, optWhitespace, noWhitespace, word } from './parser'
import { ignore } from './comment'
import { comma, langle, rangle, natConst, dot, question, exclMark, underscore,
  openBrace, closeBrace, colon, openPar, closePar, asterisk,
  openBracket, closeBracket, equals, semicolon, tripleMinus } from './token'
import { boxedTypeIdent, varIdent, varIdentOpt, lcIdentFull, lcIdentNs, UcIdent } from './ident'
import { subexpr, natTerm, typeTerm /*as origTypeTerm*/, TypeTerm } from './term'
import { resultToString, monoListToMaybe, notEmpty } from './util'

const Result = Union`Result`({
  Seq: {
    param: T,
    head : Array
  },
  Generic: {
    param: T,
    head : T,
    tail : Array
  },

}).contramap(([param, head, tail]) =>
  tail
    ? {
      param,
      head,
      tail,
    }
    : {
      param,
      head,
    })

export const resultType = alt(
  seq(
    boxedTypeIdent
      .skip(noWhitespace)
      .skip(langle)
      .skip(noWhitespace),
    subexpr,
    separatedWord(
      comma
        .skip(noWhitespace)
        .then(subexpr)
    ).many()
      .skip(noWhitespace)
      .skip(rangle),
  ),
  seq(
    boxedTypeIdent,
    separatedWord(subexpr).many(),
  ),
).map(Result)

const Cond = Type`Cond`({
  ident: String,
  index: Number,
})

const CondRaw = Cond.contramap(([ident, [index]]) => ({
  ident,
  index,
}))

export const condition = seq(
  varIdent, //.map(resultToString),
  monoListToMaybe(
    dot.then(
      natConst
        .map(join(''))
        .map(parseInt)
    ).atMost(1))
    .skip(question)
).map(CondRaw)

const multiplicity = seq(natTerm, optWhitespace, asterisk)

export const fullCombinatorId = alt(lcIdentFull, underscore)

export const optArgs = seq(
  openBrace,
  separatedWord(varIdent)
    .atLeast(1)
    .skip(noWhitespace),
  colon
    .skip(noWhitespace),
  typeTerm
    .skip(noWhitespace)
    .skip(closeBrace),
).map(Type`OptArgs`(T))

const TypedArg = Union`TypedArg`({
  Cond: {
    ident: String,
    cond : Cond,
    term : T,
  },
  Plain: {
    ident: String,
    term : T,
  }
}).contramap(([ident, cond, term]) =>
  isEmpty(cond)
    ? {
      ident,
      term,
    }
    : {
      ident,
      cond: cond[0],
      term
    })

const args1 = typeTerm
export const args2 = seq(
  varIdentOpt
    .map(resultToString)
    .skip(noWhitespace),
  colon
    .skip(noWhitespace)
    .then(
      monoListToMaybe(
        condition.atMost(1)))
    .skip(noWhitespace),
  typeTerm,
).map(TypedArg)

export const args3 = seq(
  openPar,
  separatedWord(varIdentOpt)
    .atLeast(1)
    .skip(noWhitespace),
  colon
    .skip(noWhitespace),
  typeTerm
    .skip(noWhitespace),
  closePar
    .skip(noWhitespace),
)

const args4 = seq(
  seq(
    separatedWord(varIdentOpt)
      .atLeast(1)
      .skip(noWhitespace),
    colon,
  ).atMost(1)
    .skip(noWhitespace),
  multiplicity
    .atMost(1)
    .skip(noWhitespace),
  openBracket,
  separatedWord(lazy(() => args))
    .many()
    .skip(noWhitespace),
  closeBracket,
)

export const args = alt(
  args2,
  args3,
  args4,
  args1,
)

const Expression = Type`Expression`({
  declaration: T,
  optArgs    : T,
  args       : T,
  result     : T
}).contramap(([declaration, optArgs, args, result]) => ({ declaration, optArgs, args, result }))

export const combinator = seq(
  fullCombinatorId,
  separatedWord(optArgs).many(),
  separatedWord(args)
    .many()
    .skip(optWhitespace)
    .skip(equals)
    .skip(optWhitespace),
  resultType
    .skip(optWhitespace)
    .skip(semicolon)
    .skip(optWhitespace),
).map(Expression)


export const declaration = alt(
  ignore,
  combinator,
)

export const funDeclaration = seq(
  tripleMinus
    .skip(noWhitespace),
  word('functions')
    .skip(noWhitespace),
  tripleMinus,
  separatedWord(combinator)
    .atLeast(1)
    .skip(noWhitespace),
)

export const typeDeclaration = seq(
  optWhitespace,
  tripleMinus
    .skip(noWhitespace),
  word('types')
    .skip(noWhitespace),
  tripleMinus,
  seq(ignore, combinator)
    .atLeast(1)
    .skip(noWhitespace),
)

export const program = seq(
  optWhitespace,
  separatedWord(combinator).atLeast(1),
  optWhitespace,
  alt(
    funDeclaration,
    typeDeclaration,
  ).many(),
)
