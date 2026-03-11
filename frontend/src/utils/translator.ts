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
  // Use the singular word when the count is 1.
  if (count === 1) {
    return singular
  }

  return plural
}

// Turn Windows-style line endings into \n so the rest of the code only handles one format.
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

// Warning lists stay short so the UI does not get cluttered.
function getWarningItems(values: string[]) {
  const items: string[] = []

  for (const value of values) {
    // Skip repeats so the warning list stays cleaner.
    if (items.includes(value)) {
      continue
    }

    items.push(value)

    // Stop once the warning list reaches the limit.
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

// This is the message shown when the user submits an empty input box.
function emptyWarning(mode: TranslationMode): TranslationWarning {
  // Decode mode and encode mode use different empty-input messages.
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

  // Add a warning if spacing rules were broken.
  if (invalidSpacingTokens.length > 0) {
    const count = invalidSpacingTokens.length
    const message =
      `Found invalid Morse spacing in ${count} ` +
      `${pluralize(count, 'section', 'sections')}; affected sections decoded as ?.`

    warnings.push(
      createWarning('INVALID_MORSE_SPACING', message, invalidSpacingTokens),
    )
  }

  // Add a warning for tokens with characters other than dots and dashes.
  if (invalidTokens.length > 0) {
    const count = invalidTokens.length
    const message =
      `Found invalid Morse characters in ${count} ` +
      `${pluralize(count, 'token', 'tokens')}; affected tokens decoded as ?.`

    warnings.push(
      createWarning('INVALID_MORSE_CHARACTERS', message, invalidTokens),
    )
  }

  // Add a warning for valid-looking Morse that is not in the map.
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
  // If every character was supported, there is nothing to warn about.
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

// Morse input uses spacing rules:
// 1 space = next letter
// 3 spaces = next word
// anything else is left inside the token so it can be flagged as invalid later
function splitDecodeWords(input: string) {
  const words: string[][] = []
  let currentWord: string[] = []
  let currentToken = ''
  let index = 0

  while (index < input.length) {
    const character = input[index]

    // Dots and dashes stay in the current Morse token.
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

    // One space means the current letter is finished.
    if (spaceCount === 1) {
      if (currentToken !== '') {
        currentWord.push(currentToken)
        currentToken = ''
      }

      continue
    }

    // Three spaces means the current word is finished.
    if (spaceCount === 3) {
      if (currentToken !== '') {
        currentWord.push(currentToken)
        currentToken = ''
      }

      // Only save the word if it actually has letters in it.
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
  // If a token still contains spaces here, the spacing was not valid.
  if (token.includes(' ')) {
    invalidSpacingTokens.push(token)
    return '?'
  }

  // Morse tokens should only contain dots and dashes.
  if (!morseTokenPattern.test(token)) {
    invalidTokens.push(token)
    return '?'
  }

  const decodedCharacter = getDecodedCharacter(token)

  // A well-formed token can still be unknown if it is not in the Morse map.
  if (!decodedCharacter) {
    unknownTokens.push(token)
    return '?'
  }

  return decodedCharacter
}

export function decodeMorse(input: string): TranslationResult {
  // Clean up the input first so leading/trailing spaces do not cause problems.
  const normalizedInput = normalizeNewlines(input).trim()

  // If the user did not enter anything, return the empty-input warning.
  if (normalizedInput === '') {
    return {
      output: '',
      warnings: [emptyWarning('decode')],
    }
  }

  const invalidSpacingTokens: string[] = []
  const invalidTokens: string[] = []
  const unknownTokens: string[] = []
  // New lines count as word breaks, just like three spaces.
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
  // Clean up the input first so extra whitespace does not matter.
  const normalizedInput = normalizeNewlines(input).trim()

  // If the user did not enter anything, return the empty-input warning.
  if (normalizedInput === '') {
    return {
      output: '',
      warnings: [emptyWarning('encode')],
    }
  }

  const unsupportedCharacters: string[] = []
  // Any amount of whitespace between words becomes a normal word break when encoding.
  const words = normalizedInput.split(/\s+/)
  const encodedWords: string[] = []

  for (const word of words) {
    // Ignore empty pieces just in case extra whitespace created them.
    if (word === '') {
      continue
    }

    const upperWord = word.toUpperCase()
    const encodedLetters: string[] = []

    for (const character of upperWord) {
      const encodedCharacter = getMorseCode(character)

      // Unsupported characters are kept as ? so the output still shows where they were.
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
