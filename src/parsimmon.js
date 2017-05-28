//@flow
'use strict'

// import { type Parser, of, seq, oneOf, alt, lazy, digit, string as word } from 'parsimmon'
import { flatten, join, pipe } from 'ramda'

import { lcIdentFull, boxedTypeIdent } from './ident'
import { args, combinator, program, args2, fullCombinatorId, typeTerm } from './combinator'
import { term } from './term'
import example from './example'
import { ignore } from './comment'

const resultToString = pipe(flatten, join(''))

// declare var flowDebug: $Flow$DebugPrint

// flowDebug($word)


// const result = lcIdentFull.parse('ok.asd#17217381')
// const result = lcIdentFull.parse('vector#cb9f372d')
// const result = combinator.parse('vector#cb9f372d {t:Type} msg_id:long = Vector t;')
// const result = combinator.parse('vector { t : Type } # [ t ] = Vector t;')
// const result = combinator.parse('vector{t:Type}#[t]=Vector t;')
// const result = args.parse('(123+var)')
// const result = args.parse('abs.ok<(123+var)>')
// const result = args.parse('total:int')
// const result = combinator.parse('abs.ok<(123+var)>')
// const result = program.parse(`
// ---types---
// vector {t:Type} # [t] = Vector t;
// ---functions---
// tuple {t:Type} {n:#} [t] = Tuple t n;
// vectorTotal {t:Type} total_count:int vector:%(Vector t) = VectorTotal t;`)
// const result = ignore.parse(`//asdfgasd`)
export const result = program.parse(example)
// const result = typeTerm.parse(`contacts.Link`)
const list = result.value
  ? resultToString(result.value)
  : result
const res = result.value[1][0] //[1][2]
// res
console.log(res)
