//@flow
'use strict'

// import { type Parser, of, seq, oneOf, alt, lazy, digit, string as word } from 'parsimmon'
import { flatten, join, pipe } from 'ramda'

import { lcIdentFull } from './ident'
import { args, combinator, program, args2 } from './combinator'
import { term } from './term'

const resultToString = pipe(flatten, join(''))

// declare var flowDebug: $Flow$DebugPrint

// flowDebug($word)


// const result = lcIdentFull.parse('ok.asd#17217381')
// const result = combinator.parse('vector { t : Type } # [ t ] = Vector t;')
// const result = combinator.parse('vector{t:Type}#[t]=Vector t;')
// const result = args.parse('(123+var)')
// const result = args.parse('abs.ok<(123+var)>')
// const result = args.parse('total:int')
// const result = combinator.parse('abs.ok<(123+var)>')
const result = program.parse(`
---types---
vector {t:Type} # [t] = Vector t;
---functions---
tuple {t:Type} {n:#} [t] = Tuple t n;
vectorTotal {t:Type} total_count:int vector:%(t) = VectorTotal t;`)
// const result = program.parse(`
// ---types---
// vector {t:Type} # [t] = Vector t;
// ---functions---
// invokeAfterMsg#cb9f372d {X:Type} msg_id:long query:!X = X;
// invokeAfterMsgs#3dc4b4f0 {X:Type} msg_ids:Vector<long> query:!X = X;
// initConnection#69796de9 {X:Type} api_id:int device_model:string system_version:string app_version:string lang_code:string query:!X = X;
// invokeWithLayer#da9b0d0d {X:Type} layer:int query:!X = X;`)
const list = result.value
  ? resultToString(result.value)
  : result
console.log(list)

// console.log(list)
