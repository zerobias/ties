import {
  oneLineComment,
  ignore,
} from '../src/comment'
import printError from '../src/parser/view'


describe.skip('oneLineComment', () => {

  test('single line', () => {
    const passData = `//  abcdsa\n`
    const result = `  abcdsa`
    const pass = { status: true, value: result }
    const output = oneLineComment.parse(passData)
    if (!output.status)
      console.log(printError(output, passData))
    expect(output).toEqual(pass)
  })

  test('multi line', () => {
    const passData = `//  abcdsa\n//one more line\n`
    const result = `  abcdsa`
    const pass = { status: true, value: result }
    const output = oneLineComment.parse(passData)
    if (!output.status)
      console.log(printError(output, passData))
    expect(output).toEqual(pass)
  })

})

