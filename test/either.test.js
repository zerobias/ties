
import * as E from '../src/either'


test('basic either', () => {
  expect(E.Right().isRight()).toBeTruthy()
  expect(E.Left().isLeft()).toBeTruthy()
})


test('maps', () => {
  const source = E.Right(0)
  const r = source.map(val => val + 1)
  expect(r.value).toBe(1)
  const spyL = jest.fn()
  const rl = r.mapLeft(spyL)
  expect(spyL).not.toHaveBeenCalled()
  expect(rl.value).toBe(1)
})

test('chains', () => {
  const source = E.Right(0)
  const r = source.chain(val => E.Right(val + 1))
  expect(r.value).toBe(1)
  expect(r.isRight()).toBeTruthy()
  const spyRl = jest.fn()
  const rl = r.chainLeft(spyRl)
  expect(spyRl).not.toHaveBeenCalled()
  expect(rl.value).toBe(1)
  const l = rl.chain(val => E.Left(val + 1))
  expect(l.value).toBe(2)
  expect(l.isLeft()).toBeTruthy()
  const lr = l.chainLeft(val => E.Right(val + 1))
  expect(lr.value).toBe(3)
  expect(lr.isRight()).toBeTruthy()
})


describe('Monoid', () => {

  test('as array', () => {
    const statics = E.eitherMonoid([])
    const empty = statics.empty()
    expect(empty.value).toEqual([])
    expect(empty.isRight()).toBeTruthy()
    const source = statics.of([1, 2, 3])
    const joined = empty
      .concat(source)
      .concat(statics.of([4]))
    expect(joined.value).toEqual([1, 2, 3, 4])
    const left = statics.Left({})
    expect(left.value).toEqual({})
    expect(joined.concat(left).value).toEqual([1, 2, 3, 4])
    const mapped = joined.map(val => val.map(e => e + 1))
    expect(mapped.value).toEqual([2, 3, 4, 5])
  })
  test('as Monoid object', () => {
    class Monoid {
      type = 'Monoid'
      concat(next) {
        return Monoid.of({ ...this.value, ...next.value })
      }
      constructor(value) {
        this.value = value
      }
      static of(value) {
        return new Monoid(value)
      }
    }
    const statics = E.eitherMonoid(Monoid.of({}))
    const empty = statics.empty()
    expect(empty.value).toMatchObject({
      type : 'Monoid',
      value: {},
    })
    expect(empty.isRight()).toBeTruthy()
    const mapped = empty.map(Monoid.of)
    expect(mapped.value).toMatchObject({
      type : 'Monoid',
      value: {
        type : 'Monoid',
        value: {},
      },
    })
    const chained = mapped.chain(({ type }) => statics.Left(type))
    expect(chained.value).toBe('Monoid')
    expect(chained.isLeft()).toBeTruthy()
    const spyChain = jest.fn()
    const lr = chained.chain(spyChain)
    expect(spyChain).not.toHaveBeenCalled()
    expect(lr.isLeft()).toBeTruthy()
  })
})

