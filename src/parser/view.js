//@flow

type Cursor = {
  column: number,
  line: number,
  offset: number,
}

type ParserError = {
  status: false,
  index: Cursor,
  expected: string[],
}


const cutLine = (text: string, line: number): string => text.split(`\n`)[line-1]

const FRAGMENT = 80

function cutFragment(line: string, column: number) {
  console.log(line, column)
  const ln = line.length
  if (ln >= FRAGMENT) return {
    line  : line.slice(column - FRAGMENT/2, column + FRAGMENT/2),
    column: FRAGMENT/2,
  }
  return { line, column }
}

const textCursor = (offset: number) =>
  [ ...Array(Math.max(offset - 1, 0)).fill(' '), '^'].join('')

const cursorStats = ({ column, line, offset }: Cursor) => [
  `column ${column}`,
  `line ${line}`,
  `offset ${offset}`,
].join(`, `)


export default function printError({ index, expected }: ParserError, text: string) {
  const { line, column } =
    cutFragment(
      cutLine(text, index.line),
      index.column)
  return [
    cursorStats(index),
    'Expected: ' + expected.join(', '),
    line,
    textCursor(column)
  ].join(`\n`)
}
