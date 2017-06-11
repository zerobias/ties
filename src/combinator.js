//@flow
import { T, flatten, join, pipe, of, reject, filter, isEmpty, unnest, complement } from 'ramda'
// import Type from 'mezzanine'
// import { hasInstance, fromNullable, Just, Nothing, IMaybe } from 'folktale/data/maybe'
import { Type, Union } from 'mezzanine'
import { seq, separatedWord, alt, lazy, optWhitespace, noWhitespace, word } from './fork'
import { ignore } from './comment'
import { comma, langle, rangle, natConst, dot, question, exclMark, underscore,
  openBrace, closeBrace, colon, openPar, closePar, asterisk,
  openBracket, closeBracket, equals, semicolon, tripleMinus } from './token'
import { boxedTypeIdent, varIdent, varIdentOpt, lcIdentFull, lcIdentNs } from './ident'
import { subexpr, natTerm, typeTerm /*as origTypeTerm*/ } from './term'
import { resultToString, monoListToMaybe, notEmpty } from './util'

export const resultType = alt(
  seq(
    boxedTypeIdent
      .skip(noWhitespace),
    langle
      .skip(noWhitespace),
    subexpr,
    separatedWord(
      comma
        .skip(noWhitespace)
        .then(subexpr)
    ).many()
      .skip(noWhitespace),
    rangle,
  ),
  seq(
    boxedTypeIdent,
    separatedWord(subexpr).many(),
  ),
)

// const Argument = Type`Argument`({
//   name  : String,
//   cond  : T,
//   tlType: T
// }).contramap(([name, cond, tlType]) => ({
//   name,
//   cond,
//   tlType,
// }))

// const Plain = Type`Plain`({
//   mainPart: String
// })
//   // .contramap(({ mainPart }) => mainPart)
// const Dependent = Type`Dependent`({
//   mainPart: String,
//   subpart : notEmpty
// })

// const Bac = Type`Bac`(T)

// const flatString = pipe(flatten, join(''))

// const Result = Union`Result`({
//   Plain,
//   Dependent,
//   Bac
// }, {
//   typed: ctx => ctx.type
// }).contramap(([p1, p2]) => ({
//   mainPart: flatString(p1),
//   subpart : flatString(p2)
// }))/*.contramap(
//   e => (
//     console.log(e),
//     e
//   )
// )*/

export const condition = seq(
  varIdent, //.map(resultToString),
  monoListToMaybe(
    dot.then(
      natConst
        .map(join(''))
        .map(parseInt)
    ).atMost(1)),
  question
)

const multiplicity = seq(natTerm, optWhitespace, asterisk)

export const fullCombinatorId = alt(lcIdentFull, underscore)
// export const combinatorId = alt(lcIdentNs, underscore)
// export const typeTerm = seq(
//   exclMark.atMost(1),
//   origTypeTerm)
export const optArgs = seq(
  openBrace,
  separatedWord(varIdent)
    .atLeast(1)
    .skip(noWhitespace),
  colon
    .skip(noWhitespace),
  typeTerm
    .skip(noWhitespace),
  closeBrace,
  // optWhitespace,
)



// console.log(VarIdent)
const args1 = typeTerm
export const args2 = seq(
  varIdentOpt
    .map(resultToString)
    .skip(noWhitespace),
    // .map(Arg.NameOf),

  colon
    .skip(noWhitespace)
    .then(
      monoListToMaybe(
        condition
        .atMost(1)),
    )
    .skip(noWhitespace),
  typeTerm,
)//.map(Argument)

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
  // optWhitespace,
)

export const args = alt(
  args2,
  args3,
  args4,
  args1,
)

export const combinator = seq(
  fullCombinatorId, //.map(resultToString),
  separatedWord(optArgs).many(),
  separatedWord(args)
    .many()
    .skip(optWhitespace)
    // .map(unnest),
    // .map(reject(isEmpty)),
    .skip(equals)
    .skip(optWhitespace),
  resultType
    // .map(Result)
    .skip(optWhitespace)
    .skip(semicolon)
    .skip(optWhitespace),
)


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
