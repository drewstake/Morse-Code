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

function splitDecodeWords(input: string) {
  const words: string[][] = []
  let currentWord: string[] = []
  let currentToken = ''

  const pushToken = () => {
    if (!currentToken) {
      return
    }

    currentWord.push(currentToken)
    currentToken = ''
  }

  const pushWord = () => {
    pushToken()
    if (currentWord.length === 0) {
      return
    }

    words.push(currentWord)
    currentWord = []
  }

  for (let index = 0; index < input.length; ) {
    const character = input[index]
    if (character !== ' ') {
      currentToken += character
      index += 1
      continue
    }

    let runEnd = index
    while (runEnd < input.length && input[runEnd] === ' ') {
      runEnd += 1
    }

    const runLength = runEnd - index
    if (runLength === 1) {
      pushToken()
    } else if (runLength === 3) {
      pushWord()
    } else {
      currentToken += ' '.repeat(runLength)
    }

    index = runEnd
  }

  pushWord()
  return words
}

export function decodeMorse(input: string): TranslationResult {
  const normalizedInput = normalizeNewlines(input).trim()
  if (!normalizedInput) {
    return { output: '', warnings: [emptyWarning('decode')] }
  }

  const invalidSpacingTokens: string[] = []
  const invalidTokens: string[] = []
  const unknownTokens: string[] = []
  const expandedInput = normalizedInput.replace(/ *\n+ */g, '   ')
  const words = splitDecodeWords(expandedInput)

  const output = words
    .map((word) =>
      word
        .map((token) => {
          if (token.includes(' ')) {
            invalidSpacingTokens.push(token)
            return '?'
          }

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

  if (invalidSpacingTokens.length > 0) {
    const count = invalidSpacingTokens.length
    warnings.push({
      code: 'INVALID_MORSE_SPACING',
      message: `Found invalid Morse spacing in ${count} ${pluralize(count, 'section', 'sections')}; affected sections decoded as ?.`,
      items: collectItems(invalidSpacingTokens),
    })
  }

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
