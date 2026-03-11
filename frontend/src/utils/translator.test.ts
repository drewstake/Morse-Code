import { decodeMorse, encodeText } from './translator'

describe('decodeMorse', () => {
  // Basic decoding: one space means "next letter".
  it('decodes HELLO when letters are separated by single spaces', () => {
    const result = decodeMorse('.... . .-.. .-.. ---')

    expect(result.output).toBe('HELLO')
  })

  // Word decoding: three spaces means "next word".
  it('decodes HELLO WORLD when words are separated by three spaces', () => {
    const result = decodeMorse(
      '.... . .-.. .-.. ---   .-- --- .-. .-.. -..',
    )

    expect(result.output).toBe('HELLO WORLD')
  })

  // Another simple example for a short word.
  it('decodes SOS', () => {
    const result = decodeMorse('... --- ...')

    expect(result.output).toBe('SOS')
  })

  // Another example with two words.
  it('decodes HEY JUDE', () => {
    const result = decodeMorse('.... . -.--   .--- ..- -.. .')

    expect(result.output).toBe('HEY JUDE')
  })

  // A new line should act like a word break.
  it('treats newlines as word breaks', () => {
    const result = decodeMorse('.... . -.--\n.--- ..- -.. .')

    expect(result.output).toBe('HEY JUDE')
  })

  // Extra spaces at the start or end should not break decoding.
  it('ignores leading and trailing whitespace', () => {
    const result = decodeMorse('  .... . .-.. .-.. ---   ')

    expect(result.output).toBe('HELLO')
  })

  // Two spaces are not valid. Only 1 or 3 spaces should be accepted.
  it('flags invalid Morse spacing instead of accepting double spaces', () => {
    const result = decodeMorse('....  .')
    const firstWarning = result.warnings[0]

    expect(result.output).toBe('?')
    expect(firstWarning.code).toBe('INVALID_MORSE_SPACING')
    expect(firstWarning.items).toEqual(['....  .'])
  })

  // Invalid characters and unknown Morse should be reported separately.
  it('flags unknown and invalid morse tokens separately', () => {
    const result = decodeMorse('.... ..-.- ..x')
    const warningCodes = result.warnings.map((warning) => warning.code)

    expect(result.output).toBe('H??')
    expect(warningCodes).toEqual([
      'INVALID_MORSE_CHARACTERS',
      'UNKNOWN_MORSE_TOKENS',
    ])
  })

  // Repeated bad input should still count each time it appears.
  it('counts repeated invalid tokens by occurrence', () => {
    const result = decodeMorse('..x ..x')
    const firstWarning = result.warnings[0]

    expect(firstWarning.message).toContain('2 tokens')
    expect(firstWarning.items).toEqual(['..x'])
  })
})

describe('encodeText', () => {
  // When encoding text, words should be separated by three spaces.
  it('encodes words with triple spaces between them', () => {
    const result = encodeText('HELLO WORLD')

    expect(result.output).toBe('.... . .-.. .-.. ---   .-- --- .-. .-.. -..')
  })

  // Characters that are not supported should become ? and raise a warning.
  it('uses question marks for unsupported characters', () => {
    const result = encodeText('HI %')
    const firstWarning = result.warnings[0]

    expect(result.output).toBe('.... ..   ?')
    expect(firstWarning.code).toBe('UNSUPPORTED_TEXT_CHARACTERS')
    expect(firstWarning.items).toEqual(['%'])
  })

  // Repeated unsupported characters should be counted correctly.
  it('counts repeated unsupported characters by occurrence', () => {
    const result = encodeText('%%')
    const firstWarning = result.warnings[0]

    expect(firstWarning.message).toContain('2 unsupported characters')
    expect(firstWarning.items).toEqual(['%'])
  })
})
