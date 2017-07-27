//@flow

export interface ResultMatcher<Right, Left, -A, -B> {
  Right(res: Right): A,
  Left(res: Left): B,
}

type LeftData<Left> = {
  chiral: 'Left',
  value: Left,
}

type RightData<Right> = {
  chiral: 'Right',
  value: Right,
}

type TypeClassMap = {
  Monoid: boolean,
}

export class Either<Right, Left> {
  typeclass: TypeClassMap
  statics: *
  chiral: 'Left' | 'Right'
  value: Right | Left
  constructor<Data: RightData<Right> | LeftData<Left>>({ chiral, value }: Data) {
    this.chiral = chiral
    this.value = value
    /*::
    this.statics = {
      of,
      Right: of,
      Left: left,
    }
    */
  }
  isRight() {
    return this.chiral === 'Right'
  }
  isLeft() {
    return this.chiral === 'Left'
  }
  map<Right1>(fn: (obj: Right) => Right1): Either<Right1, Left> {
    //$FlowIssue
    const mapped: Either<Right1, Left> = this.match({
      Right: (value: Right) => this.statics.of(fn(value)),
      Left : () => this,
    })
    return mapped
  }
  mapLeft<Left1>(fn: (obj: Left) => Left1): Either<Right, Left1> {
    //$FlowIssue
    const mapped: Either<Right, Left1> = this.match({
      Right: () => this,
      Left : (value: Left) => this.statics.Left(fn(value)),
    })
    return mapped
  }
  chain<Right1, Left1>(fn: (obj: Right) => Either<Right1, Left1>): Either<Right1, Left | Left1> {
    //$FlowIssue
    const chained: Either<Right1, Left | Left1> = this.match({
      Right: (value: Right) => fn(value),
      Left : () => this,
    })
    return chained
  }
  chainLeft<Right1, Left1>(fn: (obj: Left) => Either<Right1, Left1>): Either<Right | Right1, Left1> {
    //$FlowIssue
    const chained: Either<Right | Right1, Left1> = this.match({
      Right: () => this,
      Left : (value: Left) => fn(value),
    })
    return chained
  }
  alt<Right1, Left1>(either: Either<Right1, Left1>): Either<Right | Right1, Left1> {
    //$FlowIssue
    const alted: Either<Right | Right1, Left1> = this.match({
      Right: () => this,
      Left : () => either,
    })
    return alted
  }
  getOr(defaults: Right): Right {
    return this.match({
      Right: (value: Right) => value,
      Left : () => defaults,
    })
  }
  bimap<A, B>(fnRight: (x: Right) => A, fnLeft: (x: Left) => B): A | B {
    return this.isRight()
      //$FlowIssue
      ? fnRight(this.value)
      //$FlowIssue
      : fnLeft(this.value)
  }
  match<A, B>(matcher: ResultMatcher<Right, Left, A, B>): A | B {
    return this.bimap(matcher.Right, matcher.Left)
  }
  cata<A, B>(matcher: ResultMatcher<Right, Left, A, B>): A | B {
    return this.match(matcher)
  }
  fold<C>(fnRight: (x: Right) => C, fnLeft: (x: Left) => C): C {
    return this.bimap(fnRight, fnLeft)
  }
  ana<C>(matcher: ResultMatcher<Right, Left, C, C>): C {
    return this.bimap(matcher.Right, matcher.Left)
  }
  swap(): Either<Left, Right> {
    return this.match({
      Right: (value: Right) => this.statics.Left(value),
      Left : (value: Left) => this.statics.of(value),
    })
  }
}

Object.defineProperties(Either.prototype, {
  typeclass: {
    value: {
      Monoid: false,
    },
    enumerable  : true,
    configurable: true,
  },
  statics: {
    value: {
      of,
      Right,
      Left,
    },
    enumerable  : false,
    configurable: true,
  }
})

export interface Monoid<T> {
  concat(monoid: Monoid<T>): Monoid<T>,
}

export function eitherMonoid<Right>(empty: Monoid<Right>) {
  class EitherMonoid<Left> extends Either<Monoid<Right>, Left> {
    statics: {
      of: typeof ofMonoid,
      Right: typeof ofMonoid,
      Left: typeof leftMonoid,
      empty: typeof emptyMonoid
    }
    constructor(data: RightData<Monoid<Right>> | LeftData<Left>) {
      super(data)
      /*::
      this.statics = {
        of: ofMonoid,
        Right: ofMonoid,
        Left: leftMonoid,
        empty: emptyMonoid
      }
      */
    }
    concat<Left1>(either: EitherMonoid<Left1>): EitherMonoid<Left> {
      const returnSelf = () => this
      return this.match({
        Right: (x: Monoid<Right>) => either.match({
          Right: (y: Monoid<Right>) => ofMonoid(x.concat(y)),
          Left : returnSelf,
        }),
        Left: returnSelf,
      })
    }
  }
  Object.defineProperties(EitherMonoid.prototype, {
    typeclass: {
      value: {
        Monoid: true,
      },
      enumerable  : true,
      configurable: true,
    },
    statics: {
      value: {
        of   : ofMonoid,
        Right: ofMonoid,
        Left : leftMonoid,
        empty: emptyMonoid
      },
      enumerable  : false,
      configurable: true,
    }
  })

  function ofMonoid<-Left>(value: Monoid<Right>): EitherMonoid<Left> {
    return new EitherMonoid({ chiral: 'Right', value })
  }
  function leftMonoid<Left>(value: Left): EitherMonoid<Left> {
    return new EitherMonoid({ chiral: 'Left', value })
  }
  function emptyMonoid<-Left>(): EitherMonoid<Left> {
    return ofMonoid(empty)
  }

  return {
    typeclass: {
      Monoid: true,
    },
    of   : ofMonoid,
    Right: ofMonoid,
    Left : leftMonoid,
    empty: emptyMonoid
  }
}
export function of<Right, -Left: mixed>(obj: Right): Either<Right, Left> {
  const inner: RightData<Right> = {
    chiral: 'Right',
    value : obj,
  }
  return new Either(inner)
}

export function Right<R, -Left: mixed>(obj: R): Either<R, Left> {
  return of(obj)
}

export function Left<-Right: mixed, L>(obj: L): Either<Right, L> {
  const inner: LeftData<L> = {
    chiral: 'Left',
    value : obj,
  }
  return new Either(inner)
}

const left = Left

export function fromNullable<Right>(obj: ?Right): Either<Right, null | void> {
  const inner: RightData<Right> | LeftData<null | void> = obj == null
    ? {
      chiral: 'Left',
      value : obj,
    }
    : {
      chiral: 'Right',
      value : obj,
    }
  return new Either(inner)
}

export function withPred<T>(pred: $Pred<1>, val: T): Either<*, *> {
  if (pred(val)) {
    return Right(val)
  } else {
    return Left(val)
  }
}

export default of
