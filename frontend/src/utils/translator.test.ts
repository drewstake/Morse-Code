import { decodeMorse, encodeText } from './translator'

describe('decodeMorse', () => {
  it('decodes the provided sample cases', () => {
    expect(decodeMorse('.... . .-.. .-.. ---').output).toBe('HELLO')
    expect(
      decodeMorse('.... . .-.. .-.. ---   .-- --- .-. .-.. -..').output,
    ).toBe('HELLO WORLD')
    expect(decodeMorse('... --- ...').output).toBe('SOS')
    expect(decodeMorse('.... . -.--   .--- ..- -.. .').output).toBe('HEY JUDE')
  })

  it('treats double spaces as letter breaks and newlines as word breaks', () => {
    expect(decodeMorse('....  . -.--\n.--- ..- -.. .').output).toBe('HEY JUDE')
  })

  it('flags unknown and invalid morse tokens separately', () => {
    const result = decodeMorse('.... ..-.- ..x')

    expect(result.output).toBe('H??')
    expect(result.warnings.map((warning) => warning.code)).toEqual([
      'INVALID_MORSE_CHARACTERS',
      'UNKNOWN_MORSE_TOKENS',
    ])
  })
})

describe('encodeText', () => {
  it('encodes words with triple spaces between them', () => {
    expect(encodeText('HELLO WORLD').output).toBe(
      '.... . .-.. .-.. ---   .-- --- .-. .-.. -..',
    )
  })

  it('uses question marks for unsupported characters', () => {
    const result = encodeText('HI 😊')

    expect(result.output).toBe('.... ..   ?')
    expect(result.warnings[0].code).toBe('UNSUPPORTED_TEXT_CHARACTERS')
    expect(result.warnings[0].items).toEqual(['😊'])
  })
})
