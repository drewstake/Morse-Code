import { decodeMorse, encodeText } from './translator'

describe('decodeMorse', () => {
  // these are the core examples someone would probably try first in an interview or demo.
  it('decodes the provided sample cases', () => {
    expect(decodeMorse('.... . .-.. .-.. ---').output).toBe('HELLO')
    expect(
      decodeMorse('.... . .-.. .-.. ---   .-- --- .-. .-.. -..').output,
    ).toBe('HELLO WORLD')
    expect(decodeMorse('... --- ...').output).toBe('SOS')
    expect(decodeMorse('.... . -.--   .--- ..- -.. .').output).toBe('HEY JUDE')
  })

  it('treats newlines as word breaks', () => {
    expect(decodeMorse('.... . -.--\n.--- ..- -.. .').output).toBe('HEY JUDE')
  })

  // double spaces are intentionally invalid because the decoder uses one or three spaces as the grammar.
  it('flags invalid Morse spacing instead of accepting double spaces', () => {
    const result = decodeMorse('....  .')

    expect(result.output).toBe('?')
    expect(result.warnings).toEqual([
      expect.objectContaining({
        code: 'INVALID_MORSE_SPACING',
        items: ['....  .'],
      }),
    ])
  })

  // these two bad inputs fail for different reasons, so the warnings should stay split.
  it('flags unknown and invalid morse tokens separately', () => {
    const result = decodeMorse('.... ..-.- ..x')

    expect(result.output).toBe('H??')
    expect(result.warnings.map((warning) => warning.code)).toEqual([
      'INVALID_MORSE_CHARACTERS',
      'UNKNOWN_MORSE_TOKENS',
    ])
  })

  // warning messages count repeats, but the items list only shows unique examples.
  it('counts repeated invalid tokens by occurrence', () => {
    const result = decodeMorse('..x ..x')

    expect(result.warnings[0].message).toContain('2 tokens')
    expect(result.warnings[0].items).toEqual(['..x'])
  })
})

describe('encodeText', () => {
  // this mirrors morse convention: letters get one space, words get three.
  it('encodes words with triple spaces between them', () => {
    expect(encodeText('HELLO WORLD').output).toBe(
      '.... . .-.. .-.. ---   .-- --- .-. .-.. -..',
    )
  })

  // unsupported characters still preserve the shape of the output by turning into question marks.
  it('uses question marks for unsupported characters', () => {
    const result = encodeText('HI %')

    expect(result.output).toBe('.... ..   ?')
    expect(result.warnings[0].code).toBe('UNSUPPORTED_TEXT_CHARACTERS')
    expect(result.warnings[0].items).toEqual(['%'])
  })

  // same idea as decode: repeated failures count toward the message total.
  it('counts repeated unsupported characters by occurrence', () => {
    const result = encodeText('%%')

    expect(result.warnings[0].message).toContain('2 unsupported characters')
    expect(result.warnings[0].items).toEqual(['%'])
  })
})
