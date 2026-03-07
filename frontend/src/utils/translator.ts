import morseMap from '../../../shared/morse-map.json'
import type { TranslationMode, TranslationResult, TranslationWarning } from '../types'

const reverseMorseMap = Object.fromEntries(
  Object.entries(morseMap).map(([character, morse]) => [morse, character]),
)

const morseTokenPattern = /^[.-]+$/
const maxWarningItems = 5

function pluralize(count: number, singular: string, plural: string) {
  return count === 1 ? singular : plural
}

function collectItems(values: string[]) {
  return [...new Set(values)].slice(0, maxWarningItems)
}

function emptyWarning(mode: TranslationMode): TranslationWarning {
  return {
    code: 'EMPTY_INPUT',
    message:
      mode === 'decode' ? 'Enter Morse code to decode.' : 'Enter text to encode.',
    items: [],
  }
}

function normalizeNewlines(value: string) {
  return value.replace(/\r\n?/g, '\n')
}

export function decodeMorse(input: string): TranslationResult {
  const normalizedInput = normalizeNewlines(input).trim()
  if (!normalizedInput) {
    return { output: '', warnings: [emptyWarning('decode')] }
  }

  const invalidTokens: string[] = []
  const unknownTokens: string[] = []
  const expandedInput = normalizedInput.replace(/ *\n+ */g, '   ')
  const words = expandedInput.split(/ {3,}/).filter(Boolean)

  const output = words
    .map((word) =>
      word
        .split(/ {1,2}/)
        .filter(Boolean)
        .map((token) => {
          if (!morseTokenPattern.test(token)) {
            invalidTokens.push(token)
            return '?'
          }

          const decoded = reverseMorseMap[token]
          if (!decoded) {
            unknownTokens.push(token)
            return '?'
          }

          return decoded
        })
        .join(''),
    )
    .join(' ')

  const warnings: TranslationWarning[] = []

  if (invalidTokens.length > 0) {
    const count = new Set(invalidTokens).size
    warnings.push({
      code: 'INVALID_MORSE_CHARACTERS',
      message: `Found invalid Morse characters in ${count} ${pluralize(count, 'token', 'tokens')}; affected tokens decoded as ?.`,
      items: collectItems(invalidTokens),
    })
  }

  if (unknownTokens.length > 0) {
    const count = new Set(unknownTokens).size
    warnings.push({
      code: 'UNKNOWN_MORSE_TOKENS',
      message: `Decoded ${count} unknown Morse ${pluralize(count, 'token', 'tokens')} as ?.`,
      items: collectItems(unknownTokens),
    })
  }

  return { output, warnings }
}

export function encodeText(input: string): TranslationResult {
  const normalizedInput = normalizeNewlines(input).trim()
  if (!normalizedInput) {
    return { output: '', warnings: [emptyWarning('encode')] }
  }

  const unsupportedCharacters: string[] = []
  const output = normalizedInput
    .split(/\s+/)
    .filter(Boolean)
    .map((word) =>
      [...word.toUpperCase()]
        .map((character) => {
          const encoded = morseMap[character as keyof typeof morseMap]
          if (!encoded) {
            unsupportedCharacters.push(character)
            return '?'
          }

          return encoded
        })
        .join(' '),
    )
    .join('   ')

  const warnings: TranslationWarning[] = []

  if (unsupportedCharacters.length > 0) {
    const count = new Set(unsupportedCharacters).size
    warnings.push({
      code: 'UNSUPPORTED_TEXT_CHARACTERS',
      message: `Encoded ${count} unsupported ${pluralize(count, 'character', 'characters')} as ?.`,
      items: collectItems(unsupportedCharacters),
    })
  }

  return { output, warnings }
}
