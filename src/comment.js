//@flow

import { word, takeWhile, optWhitespace, alt, lookahead } from './parser'

const newLine = word(`\n`)

export const oneLineComment =
  alt(word('//'), newLine)
    .chain(() =>
      takeWhile((str: string): boolean %checks => str !== `\n`).skip(newLine))
    // .atLeast(1)

export const ignore =
  alt(oneLineComment, optWhitespace, newLine)
    .map(() => ' ')
