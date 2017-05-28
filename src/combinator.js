//@flow
import { seq, separatedWord, alt, lazy, optWhitespace, digit, word } from './fork'

import { comma, langle, rangle, natConst, dot, question, exclMark, underscore,
  openBrace, closeBrace, colon, openPar, closePar, asterisk,
  openBracket, closeBracket, equals, semicolon, tripleMinus } from './token'
import { boxedTypeIdent, varIdent, varIdentOpt, lcIdentFull, lcIdentNs } from './ident'
import { subexpr, natTerm, typeTerm as origTypeTerm } from './term'

export const resultType = alt(
  seq(
    boxedTypeIdent,
    optWhitespace,
    langle,
    optWhitespace,
    subexpr,
    separatedWord(seq(
      comma,
      optWhitespace,
      subexpr,
    )).many(),
    optWhitespace,
    rangle,
  ),
  seq(
    boxedTypeIdent,
    separatedWord(subexpr).many(),
  ),
)

export const condition = seq(
  varIdent,
  seq(
    dot,
    natConst
  ).atMost(1),
  question
)

const multiplicity = seq(natTerm, optWhitespace, asterisk)

export const fullCombinatorId = alt(lcIdentFull, underscore)
export const combinatorId = alt(lcIdentNs, underscore)
const typeTerm = seq(exclMark.atMost(1), origTypeTerm)
export const optArgs = seq(
  openBrace,
  separatedWord(varIdent).atLeast(1),
  optWhitespace,
  colon,
  optWhitespace,
  typeTerm,
  optWhitespace,
  closeBrace,
  // optWhitespace,
)


const args1 = typeTerm
export const args2 = seq(
  varIdentOpt,
  optWhitespace,
  colon,
  optWhitespace,
  condition.atMost(1),
  optWhitespace,
  typeTerm,
)

export const args3 = seq(
  openPar,
  separatedWord(varIdentOpt).atLeast(1),
  optWhitespace,
  colon,
  optWhitespace,
  typeTerm,
  optWhitespace,
  closePar,
  optWhitespace,
)

const args4 = seq(
  seq(
    separatedWord(varIdentOpt).atLeast(1),
    optWhitespace,
    colon,
  ).atMost(1),
  optWhitespace,
  multiplicity.atMost(1),
  optWhitespace,
  openBracket,
  separatedWord(lazy(() => args)).many(),
  optWhitespace,
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
  fullCombinatorId,
  separatedWord(optArgs).many(),
  separatedWord(args).many(),
  optWhitespace,
  equals,
  optWhitespace,
  resultType,
  optWhitespace,
  semicolon,
  optWhitespace,
)


export const declaration = alt(
  combinator,
)

export const funDeclaration = seq(
  tripleMinus,
  optWhitespace,
  word('functions'),
  optWhitespace,
  tripleMinus,
  separatedWord(combinator).atLeast(1),
  optWhitespace,
)

export const typeDeclaration = seq(
  optWhitespace,
  tripleMinus,
  optWhitespace,
  word('types'),
  optWhitespace,
  tripleMinus,
  separatedWord(combinator).atLeast(1),
  optWhitespace,
)

export const program = seq(
  typeDeclaration,
  alt(
    funDeclaration,
    typeDeclaration,
  ).many(),
)
