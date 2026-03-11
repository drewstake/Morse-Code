import { decodeMorse, encodeText } from './translator'

describe('decodeMorse', () => {
  it('decodes the provided sample cases', () => {
    const helloResult = decodeMorse('.... . .-.. .-.. ---')
    const helloWorldResult = decodeMorse(
      '.... . .-.. .-.. ---   .-- --- .-. .-.. -..',
    )
    const sosResult = decodeMorse('... --- ...')
    const heyJudeResult = decodeMorse('.... . -.--   .--- ..- -.. .')

    expect(helloResult.output).toBe('HELLO')
    expect(helloWorldResult.output).toBe('HELLO WORLD')
    expect(sosResult.output).toBe('SOS')
    expect(heyJudeResult.output).toBe('HEY JUDE')
  })

  it('treats newlines as word breaks', () => {
    const result = decodeMorse('.... . -.--\n.--- ..- -.. .')

    expect(result.output).toBe('HEY JUDE')
  })

  it('flags invalid Morse spacing instead of accepting double spaces', () => {
    const result = decodeMorse('....  .')
    const firstWarning = result.warnings[0]

    expect(result.output).toBe('?')
    expect(firstWarning.code).toBe('INVALID_MORSE_SPACING')
    expect(firstWarning.items).toEqual(['....  .'])
  })

  it('flags unknown and invalid morse tokens separately', () => {
    const result = decodeMorse('.... ..-.- ..x')
    const warningCodes = result.warnings.map((warning) => warning.code)

    expect(result.output).toBe('H??')
    expect(warningCodes).toEqual([
      'INVALID_MORSE_CHARACTERS',
      'UNKNOWN_MORSE_TOKENS',
    ])
  })

  it('counts repeated invalid tokens by occurrence', () => {
    const result = decodeMorse('..x ..x')
    const firstWarning = result.warnings[0]

    expect(firstWarning.message).toContain('2 tokens')
    expect(firstWarning.items).toEqual(['..x'])
  })
})

describe('encodeText', () => {
  it('encodes words with triple spaces between them', () => {
    const result = encodeText('HELLO WORLD')

    expect(result.output).toBe('.... . .-.. .-.. ---   .-- --- .-. .-.. -..')
  })

  it('uses question marks for unsupported characters', () => {
    const result = encodeText('HI %')
    const firstWarning = result.warnings[0]

    expect(result.output).toBe('.... ..   ?')
    expect(firstWarning.code).toBe('UNSUPPORTED_TEXT_CHARACTERS')
    expect(firstWarning.items).toEqual(['%'])
  })

  it('counts repeated unsupported characters by occurrence', () => {
    const result = encodeText('%%')
    const firstWarning = result.warnings[0]

    expect(firstWarning.message).toContain('2 unsupported characters')
    expect(firstWarning.items).toEqual(['%'])
  })
})
