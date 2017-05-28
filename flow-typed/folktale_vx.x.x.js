declare module 'folktale/data/maybe' {
  declare interface MaybeMatcher<T, +A, +B> {
    Just(res: { value: T }): A,
    Nothing(): B,
  }
  declare export interface IMaybe<T> {
    getOrElse(onElse: T): T,
    orElse(onElse: T): T,
    map<S>(fn: (obj: T) => S): IMaybe<S>,
    chain<S>(fn: (obj: T) => IMaybe<S>): IMaybe<S>,
    matchWith<+A, +B>(matcher: MaybeMatcher<T, A, B>): A | B
  }
  declare export interface IJust<T> extends IMaybe<T> {
    map<S>(fn: (obj: T) => S): IJust<S>,
    chain<S>(fn: (obj: T) => IMaybe<S>): IMaybe<S>,
    matchWith<+A, +B>(matcher: MaybeMatcher<T, A, B>): A,
  }
  declare export interface INothing<T> extends IMaybe<T> {
    map<S>(fn: (obj: T) => S): INothing<S>,
    chain<S>(fn: (obj: T) => IMaybe<S>): INothing<S>,
    matchWith<+A, +B>(matcher: MaybeMatcher<T, A, B>): B,
  }
  declare export function Just<T>(obj: T): IJust<T>
  declare export function Nothing<T>(): INothing<T>
  declare export function of<T>(obj: T): IJust<T>
  declare export function fromNullable<T>(obj: ?T): IMaybe<T>
  declare function HasInstance(obj: $Diff<mixed, IMaybe<*>>): false
  declare function HasInstance(obj: IMaybe<*>): true
  declare export var hasInstance: typeof HasInstance
}

declare module 'folktale/data/result' {
  declare interface ResultMatcher<T, Err, +A, +B> {
    Ok(res: { value: T }): A,
    Error(res: { value: Err }): B,
  }
  declare export interface IResult<+T, +Err> {
    map<S>(fn: (obj: T) => S): IResult<S, Err>,
    mapError<NewErr>(fn: (obj: Err) => NewErr): IResult<T, NewErr>,
    merge(): T | Err,
    chain<S, +NewErr>(fn: (obj: T) => IResult<S, NewErr>): IResult<S, Err | NewErr>,
    getOrElse(defaults: T): T,
    orElse<+S, +NewErr>(fn: (obj: Err) => IResult<S, NewErr>): IResult<T | S, NewErr>,
    matchWith<+A, +B>(matcher: ResultMatcher<T, Err, A, B>): A | B,
  }
  declare export interface IOk<T, Err> extends IResult<T, Err> {
    map<S>(fn: (obj: T) => S): IOk<S, Err>,
    merge(): T,
    chain<S, NewErr>(fn: (obj: T) => IResult<S, NewErr>): IResult<S, NewErr>,
    orElse<+S, +NewErr>(fn: (obj: Err) => IResult<S, NewErr>): IResult<T, NewErr>,
    matchWith<+A, +B>(matcher: ResultMatcher<T, Err, A, B>): A,
  }
  declare export interface IError<T, Err> extends IResult<T, Err> {
    map<S>(fn: (obj: T) => S): IError<S, Err>,
    merge(): Err,
    chain<S, NewErr>(fn: (obj: T) => IResult<S, NewErr>): IResult<S, Err>,
    orElse<+S, +NewErr>(fn: (obj: Err) => IResult<S, NewErr>): IResult<S, NewErr>,
    matchWith<+A, +B>(matcher: ResultMatcher<T, Err, A, B>): B,
  }

  declare export function fromNullable<T>(obj: ?T): IResult<T, null | void>
  declare function HasInstance(obj: $Diff<mixed, IResult<*, *>>): false
  declare function HasInstance(obj: IResult<*, *>): true
  declare export var hasInstance: typeof HasInstance

  declare export function of<T, Err: *>(obj: T): IOk<T, Err>
  declare export function Ok<T, Err: *>(obj: T): IOk<T, Err>
  declare export function Error<T: *, Err>(obj: Err): IError<T, Err>
}

declare module 'folktale/data/validation' {
  declare interface Semigroup<+A> {
    concat(x: Semigroup<A>): Semigroup<A>
  }
  declare export interface IValidation<+T, +Err: Semigroup<*>> {
    concat<+S>(x: $Subtype<IValidation<S, Err>>): $Subtype<IValidation<S, Err>>,
    map<S>(fn: (obj: T) => S): IValidation<S, Err>,
    orElse<+S>(fn: (obj: Err) => IValidation<S, Err>): IValidation<S, Err>,
  }
  declare export interface ISuccess<+T, +Err: Semigroup<*>> extends IValidation<T, Err> {
    concat<+S>(x: ISuccess<S, Err>): ISuccess<S, Err>,
    map<S>(fn: (obj: T) => S): ISuccess<S, Err>,
  }
  declare export interface IFailure<+T, +Err: Semigroup<*>> extends IValidation<T, Err> {
    concat<+S>(x: IFailure<S, Err>): IFailure<S, Err>,
    map<S>(fn: (obj: T) => S): IFailure<S, Err>,
  }
  declare export function Success<T, Err: *>(obj: T): ISuccess<T, Err>
  declare export function Failure<T: *, Err>(obj: Err): IFailure<T, Err>
  declare export function collect<+T, +Err>(list: IValidation<T, Err>[]): IFailure<T, Err>
}

declare module 'folktale/data/conversions' {
  import type { IMaybe, IJust, INothing } from 'folktale/data/maybe'
  import type { IResult, IOk, IError } from 'folktale/data/result'

  declare function MaybeToResult<T, Err>(aMaybe: IMaybe<T>, IFailureValue: Err): IResult<T, Err>
  declare function MaybeToResult<T, Err>(aMaybe: IJust<T>, IFailureValue: Err): IOk<T, Err>
  declare function MaybeToResult<T, Err>(aMaybe: INothing<T>, IFailureValue: Err): IError<T, Err>
  declare export var maybeToResult: typeof MaybeToResult

  declare function ResultToMaybe<T>(aResult: IResult<T, *>): IMaybe<T>
  declare function ResultToMaybe<T>(aResult: IOk<T, *>): IJust<T>
  declare function ResultToMaybe<T>(aResult: IError<T, *>): INothing<T>
  declare export var resultToMaybe: typeof ResultToMaybe

  declare export function nullableToMaybe<T>(obj: ?T): IMaybe<T>
  declare export function nullableToResult<T>(obj: ?T): IResult<T, null | void>
}

declare module 'folktale/core/lambda' {
  declare export function compose<A,B,C>(
    bc: (b: B) => C,
    ab: (a: A) => B,
  ): (a: A) => C
  declare export function constant<T>(obj: T): (lost: any) => T
  declare export function identity<T>(obj: T): T
}