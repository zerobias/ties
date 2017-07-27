import {
  underscore,
  colon,
  semicolon,
  natConst,
} from '../src/token'


test('underscore', () => {
  const pass = { status: true, value: '_' }
  const fail = {
    status  : false,
    index   : { offset: 0, line: 1, column: 1 },
    expected: [ '_' ],
  }
  expect(underscore.parse('_')).toEqual(pass)
  expect(underscore.parse('%%')).toEqual(fail)
})

test('colon', () => {
  const pass = { status: true, value: ':' }
  const fail = {
    status  : false,
    index   : { offset: 0, line: 1, column: 1 },
    expected: [ ':' ],
  }
  expect(colon.parse(':')).toEqual(pass)
  expect(colon.parse('%%')).toEqual(fail)
})

test('semicolon', () => {
  const pass = { status: true, value: ';' }
  const fail = {
    status  : false,
    index   : { offset: 0, line: 1, column: 1 },
    expected: [ ';' ],
  }
  expect(semicolon.parse(';')).toEqual(pass)
  expect(semicolon.parse('%%')).toEqual(fail)
})

test('natConst', () => {
  const pass = { status: true, value: ['1', '2', '3'] }
  const fail = {
    status  : false,
    index   : { offset: 0, line: 1, column: 1 },
    expected: [ 'a digit' ],
  }
  expect(natConst.parse('123')).toEqual(pass)
  expect(natConst.parse('%%')).toEqual(fail)
})
