//@flow
'use strict'

// import { type Parser, of, seq, oneOf, alt, lazy, digit, string as word } from 'parsimmon'
import { flatten, join, pipe, is, concat, tap } from 'ramda'
import { taggedSum } from 'daggy'
import Type from 'mezzanine'
import * as L from 'partial.lenses'
import { lcIdentFull, boxedTypeIdent } from './ident'
import { args, combinator, program, args2, fullCombinatorId } from './combinator'
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

const lens = L.compose(
  ['value'],
  L.find(is(Array)),
  [0]
)

const overview = L.compose(
  ['value'],
  L.find(is(Array)),
)

lens

const flat =  x => (console.log(x), flatten(x))

const CombinatorPart = Type({
  Ident: { '@@value': String },
  Code : { '@@value': String }
})


const Combinator = Type({
  Short: { name: CombinatorPart },
  Full : { name: CombinatorPart, code: CombinatorPart },
})

const val = Combinator.match({ name: CombinatorPart.Ident('ok') })
val

const toObj =  ([value, id]) =>
  id == null || id === ''
    ? Combinator.Short(CombinatorPart.Ident(flatten(value).join('')))
    : Combinator.Full(
      CombinatorPart.Ident(value),
      CombinatorPart.Code(id))

const createCombinatorId = L.compose(
  // join(''),
  // L.rewrite(join('')),
  L.joinAs(join(''), '', flatten),
  // tap(e => console.log(e)),
)

// const inChain = L.chain(() => L.compose(L.modifyOp(createCombinatorId)))

// const res = L.transform([lens, L.elems, 0], result)//[1]//[0]//[2]
// const res2 = L.transform([lens, L.elems, L.chain((e) => L.compose(flatten, toObj, 0)(e))], res)
//[2]
// res
console.log(L.get(overview, result)[0])
