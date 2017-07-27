//@flow


export default class Parser<T> {
  _: (input: string, i: number) => T
  constructor(action: (input: string, i: number) => T) {
    this._ = action
  }
}

export function isParser(obj: mixed): boolean %checks {
  return obj instanceof Parser
}
