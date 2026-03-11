import morseMap, { reverseMorseMap } from './morseMap'
import type {
  TranslationMode,
  TranslationResult,
  TranslationWarning,
  WarningCode,
} from '../types'

const morseTokenPattern = /^[.-]+$/
const maxWarningItems = 5

function pluralize(count: number, singular: string, plural: string) {
  if (count === 1) {
    return singular
  }

  return plural
}

function normalizeNewlines(value: string) {
  return value.replace(/\r\n?/g, '\n')
}

function getMorseCode(character: string) {
  const map = morseMap as Record<string, string>
  return map[character]
}

function getDecodedCharacter(token: string) {
  const map = reverseMorseMap as Record<string, string>
  return map[token]
}

function getWarningItems(values: string[]) {
  const items: string[] = []

  for (const value of values) {
    if (items.includes(value)) {
      continue
    }

    items.push(value)

    if (items.length >= maxWarningItems) {
      break
    }
  }

  return items
}

function createWarning(
  code: WarningCode,
  message: string,
  items: string[],
): TranslationWarning {
  return {
    code,
    message,
    items: getWarningItems(items),
  }
}

function emptyWarning(mode: TranslationMode): TranslationWarning {
  if (mode === 'decode') {
    return {
      code: 'EMPTY_INPUT',
      message: 'Enter Morse code to decode.',
      items: [],
    }
  }

  return {
    code: 'EMPTY_INPUT',
    message: 'Enter text to encode.',
    items: [],
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
    const message =
      `Found invalid Morse spacing in ${count} ` +
      `${pluralize(count, 'section', 'sections')}; affected sections decoded as ?.`

    warnings.push(
      createWarning('INVALID_MORSE_SPACING', message, invalidSpacingTokens),
    )
  }

  if (invalidTokens.length > 0) {
    const count = invalidTokens.length
    const message =
      `Found invalid Morse characters in ${count} ` +
      `${pluralize(count, 'token', 'tokens')}; affected tokens decoded as ?.`

    warnings.push(
      createWarning('INVALID_MORSE_CHARACTERS', message, invalidTokens),
    )
  }

  if (unknownTokens.length > 0) {
    const count = unknownTokens.length
    const message =
      `Decoded ${count} unknown Morse ` +
      `${pluralize(count, 'token', 'tokens')} as ?.`

    warnings.push(
      createWarning('UNKNOWN_MORSE_TOKENS', message, unknownTokens),
    )
  }

  return warnings
}

function buildEncodeWarnings(unsupportedCharacters: string[]) {
  if (unsupportedCharacters.length === 0) {
    return []
  }

  const count = unsupportedCharacters.length
  const message =
    `Encoded ${count} unsupported ` +
    `${pluralize(count, 'character', 'characters')} as ?.`

  return [
    createWarning('UNSUPPORTED_TEXT_CHARACTERS', message, unsupportedCharacters),
  ]
}

function splitDecodeWords(input: string) {
  const words: string[][] = []
  let currentWord: string[] = []
  let currentToken = ''
  let index = 0

  while (index < input.length) {
    const character = input[index]

    if (character !== ' ') {
      currentToken += character
      index += 1
      continue
    }

    let spaceCount = 0

    while (index < input.length && input[index] === ' ') {
      spaceCount += 1
      index += 1
    }

    if (spaceCount === 1) {
      if (currentToken !== '') {
        currentWord.push(currentToken)
        currentToken = ''
      }

      continue
    }

    if (spaceCount === 3) {
      if (currentToken !== '') {
        currentWord.push(currentToken)
        currentToken = ''
      }

      if (currentWord.length > 0) {
        words.push(currentWord)
        currentWord = []
      }

      continue
    }

    currentToken += ' '.repeat(spaceCount)
  }

  if (currentToken !== '') {
    currentWord.push(currentToken)
  }

  if (currentWord.length > 0) {
    words.push(currentWord)
  }

  return words
}

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

  const decodedCharacter = getDecodedCharacter(token)

  if (!decodedCharacter) {
    unknownTokens.push(token)
    return '?'
  }

  return decodedCharacter
}

export function decodeMorse(input: string): TranslationResult {
  const normalizedInput = normalizeNewlines(input).trim()

  if (normalizedInput === '') {
    return {
      output: '',
      warnings: [emptyWarning('decode')],
    }
  }

  const invalidSpacingTokens: string[] = []
  const invalidTokens: string[] = []
  const unknownTokens: string[] = []
  const inputWithWordBreaks = normalizedInput.replace(/ *\n+ */g, '   ')
  const words = splitDecodeWords(inputWithWordBreaks)
  const decodedWords: string[] = []

  for (const word of words) {
    let decodedWord = ''

    for (const token of word) {
      const decodedCharacter = decodeToken(
        token,
        invalidSpacingTokens,
        invalidTokens,
        unknownTokens,
      )

      decodedWord += decodedCharacter
    }

    decodedWords.push(decodedWord)
  }

  return {
    output: decodedWords.join(' '),
    warnings: buildDecodeWarnings(
      invalidSpacingTokens,
      invalidTokens,
      unknownTokens,
    ),
  }
}

export function encodeText(input: string): TranslationResult {
  const normalizedInput = normalizeNewlines(input).trim()

  if (normalizedInput === '') {
    return {
      output: '',
      warnings: [emptyWarning('encode')],
    }
  }

  const unsupportedCharacters: string[] = []
  const words = normalizedInput.split(/\s+/)
  const encodedWords: string[] = []

  for (const word of words) {
    if (word === '') {
      continue
    }

    const upperWord = word.toUpperCase()
    const encodedLetters: string[] = []

    for (const character of upperWord) {
      const encodedCharacter = getMorseCode(character)

      if (!encodedCharacter) {
        unsupportedCharacters.push(character)
        encodedLetters.push('?')
        continue
      }

      encodedLetters.push(encodedCharacter)
    }

    encodedWords.push(encodedLetters.join(' '))
  }

  return {
    output: encodedWords.join('   '),
    warnings: buildEncodeWarnings(unsupportedCharacters),
  }
}
