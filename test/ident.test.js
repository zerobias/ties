import { hexDigit, lcIdentNs } from '../src/ident'
import printError from '../src/parser/view'



test('hexDigit', () => {
  const passData = `a`
  const pass = { status: true, value: passData }
  const output = hexDigit.parse(passData)
  if (!output.status)
    console.log(printError(output, passData))
  expect(output).toEqual(pass)
})

test('lcIdentNs', () => {
  const passData = `messages.affected`
  const pass = { status: true, value: passData }
  const output = lcIdentNs.parse(passData)
  if (!output.status)
    console.log(printError(output, passData))
  expect(output).toEqual(pass)
})


