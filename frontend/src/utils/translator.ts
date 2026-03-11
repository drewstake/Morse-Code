import morseMap, { reverseMorseMap } from './morseMap'
import type {
  TranslationMode,
  TranslationResult,
  TranslationWarning,
  WarningCode,
} from '../types'

const morseTokenPattern = /^[.-]+$/
const maxWarningItems = 5

// choose the right singular or plural word for warning text.
function pluralize(count: number, singular: string, plural: string) {
  // warning messages reuse this so they read naturally: "1 token" vs "2 tokens".
  if (count === 1) {
    return singular
  }

  return plural
}

// normalize line endings once so decode/encode logic can treat newlines consistently.
function normalizeNewlines(value: string) {
  return value.replace(/\r\n?/g, '\n')
}

// look up the morse sequence for one plain-text character.
function getMorseCode(character: string) {
  const map = morseMap as Record<string, string>
  return map[character]
}

// look up the plain-text character for one full morse token.
function getDecodedCharacter(token: string) {
  const map = reverseMorseMap as Record<string, string>
  return map[token]
}

// show a few representative warning items without flooding the ui.
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

// create one warning object in the format the ui expects.
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

// return the correct empty-input warning for the current mode.
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

// build the list of decode warnings after all tokens have been processed.
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

// build the warning for unsupported text characters in encode mode.
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

// parse raw morse into word -> token groups.
// 1 space ends a letter, 3 spaces end a word, and any other spacing is preserved
// inside the token so decodeToken can flag it as invalid instead of silently guessing.
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

// decode one morse token and record why it failed if it cannot be decoded.
function decodeToken(
  token: string,
  invalidSpacingTokens: string[],
  invalidTokens: string[],
  unknownTokens: string[],
) {
  // tokens should arrive here as uninterrupted dot/dash sequences.
  // if spaces are still present, splitDecodeWords found malformed spacing.
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

// decode a full morse string into plain text and collect any warnings along the way.
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
  // treat line breaks the same as morse word breaks so pasted multi-line input still works.
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

// encode plain text into morse, using 1 space between letters and 3 between words.
export function encodeText(input: string): TranslationResult {
  const normalizedInput = normalizeNewlines(input).trim()

  if (normalizedInput === '') {
    return {
      output: '',
      warnings: [emptyWarning('encode')],
    }
  }

  const unsupportedCharacters: string[] = []
  // collapse any whitespace run into a normal word boundary before encoding.
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

      // keep the output aligned with the input instead of dropping unsupported characters.
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
