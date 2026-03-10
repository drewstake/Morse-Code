import morseMap, { reverseMorseMap } from './morseMap'
import type { TranslationMode, TranslationResult, TranslationWarning } from '../types'

const morseTokenPattern = /^[.-]+$/
const maxWarningItems = 5

// Small helpers keep the decode and encode functions focused on the main flow.
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

// Morse spacing is part of the grammar:
// one space separates letters, three spaces separate words.
// Any other spacing is preserved inside a token so decodeMorse can flag it later.
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

function buildWarning(
  code: TranslationWarning['code'],
  message: string,
  items: string[],
): TranslationWarning {
  return {
    code,
    message,
    items: collectItems(items),
  }
}

function buildDecodeWarnings(
  invalidSpacingTokens: string[],
  invalidTokens: string[],
  unknownTokens: string[],
) {
  const warnings: TranslationWarning[] = []

  if (invalidSpacingTokens.length > 0) {
    const count = invalidSpacingTokens.length
    warnings.push(
      buildWarning(
        'INVALID_MORSE_SPACING',
        `Found invalid Morse spacing in ${count} ${pluralize(count, 'section', 'sections')}; affected sections decoded as ?.`,
        invalidSpacingTokens,
      ),
    )
  }

  if (invalidTokens.length > 0) {
    const count = invalidTokens.length
    warnings.push(
      buildWarning(
        'INVALID_MORSE_CHARACTERS',
        `Found invalid Morse characters in ${count} ${pluralize(count, 'token', 'tokens')}; affected tokens decoded as ?.`,
        invalidTokens,
      ),
    )
  }

  if (unknownTokens.length > 0) {
    const count = unknownTokens.length
    warnings.push(
      buildWarning(
        'UNKNOWN_MORSE_TOKENS',
        `Decoded ${count} unknown Morse ${pluralize(count, 'token', 'tokens')} as ?.`,
        unknownTokens,
      ),
    )
  }

  return warnings
}

function buildEncodeWarnings(unsupportedCharacters: string[]) {
  if (unsupportedCharacters.length === 0) {
    return []
  }

  const count = unsupportedCharacters.length
  return [
    buildWarning(
      'UNSUPPORTED_TEXT_CHARACTERS',
      `Encoded ${count} unsupported ${pluralize(count, 'character', 'characters')} as ?.`,
      unsupportedCharacters,
    ),
  ]
}

// Each decode token either becomes a valid character or a '?' with a matching warning bucket.
function decodeToken(
  token: string,
  invalidSpacingTokens: string[],
  invalidTokens: string[],
  unknownTokens: string[],
) {
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
        .map((token) => decodeToken(token, invalidSpacingTokens, invalidTokens, unknownTokens))
        .join(''),
    )
    .join(' ')

  return { output, warnings: buildDecodeWarnings(invalidSpacingTokens, invalidTokens, unknownTokens) }
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

  return { output, warnings: buildEncodeWarnings(unsupportedCharacters) }
}
