//@flow

import { word, takeWhile, optWhitespace, alt, any } from './fork'

const newLine = word(`\n`)

export const oneLineComment =
  alt(word('//'), newLine)
    // .then(takeWhile(str => str !== `\n`))
    // .map(() => '')
    .chain(() => takeWhile(str => str !== `\n`).skip(newLine))

export const ignore = //oneLineComment
  alt(oneLineComment, optWhitespace, newLine)
    // .many()
    .map(() => ' ')
