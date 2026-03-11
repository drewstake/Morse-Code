import morseMap, { reverseMorseMap } from './morseMap' // normal and reverse lookup maps
import type { TranslationMode, TranslationResult, TranslationWarning } from '../types' // shared types for input and output shapes

const morseTokenPattern = /^[.-]+$/ // valid morse tokens can only contain dots and dashes
const maxWarningItems = 5 // cap the number of sample warning items shown in the ui

function pluralize(count: number, singular: string, plural: string) { // choose the right word form for messages
  return count === 1 ? singular : plural // use singular for 1 and plural for everything else
}

function collectItems(values: string[]) { // keep only a few unique examples for warning chips
  const items: string[] = [] // this will hold the unique items we want to keep

  for (const value of values) { // loop through every collected bad item
    if (items.includes(value)) { // skip duplicates so the ui does not repeat itself
      continue // move on if we already stored this item
    }

    items.push(value) // save the new unique item

    if (items.length === maxWarningItems) { // stop once we hit the display limit
      break // no need to collect more examples
    }
  }

  return items // return the short unique list
}

function emptyWarning(mode: TranslationMode): TranslationWarning { // build the warning for empty input
  return {
    code: 'EMPTY_INPUT', // stable code the ui can recognize
    message: mode === 'decode' ? 'Enter Morse code to decode.' : 'Enter text to encode.', // mode-specific message
    items: [], // there are no example items for empty input
  }
}

function normalizeNewlines(value: string) { // make pasted text behave the same on all systems
  return value.replace(/\r\n?/g, '\n') // turn windows newlines into plain \n
}

function buildWarning( // create one warning object in the shared shape
  code: TranslationWarning['code'], // the warning category
  message: string, // the message shown to the user
  items: string[], // the raw list of related bad items
): TranslationWarning {
  return {
    code, // keep the warning code
    message, // keep the warning message
    items: collectItems(items), // shrink the raw item list into a few examples
  }
}

function buildDecodeWarnings( // gather all warnings that can happen while decoding
  invalidSpacingTokens: string[], // tokens with bad spacing
  invalidTokens: string[], // tokens with invalid characters
  unknownTokens: string[], // tokens not found in the morse map
) {
  const warnings: TranslationWarning[] = [] // start with no warnings

  if (invalidSpacingTokens.length > 0) { // only add this warning if the problem happened
    const count = invalidSpacingTokens.length // store the count for the message
    warnings.push( // add the warning to the result list
      buildWarning( // build one spacing warning object
        'INVALID_MORSE_SPACING', // identify the warning type
        `Found invalid Morse spacing in ${count} ${pluralize(count, 'section', 'sections')}; affected sections decoded as ?.`, // explain the issue
        invalidSpacingTokens, // include sample bad sections
      ),
    )
  }

  if (invalidTokens.length > 0) { // only add this warning if invalid characters were found
    const count = invalidTokens.length // store the count for the message
    warnings.push( // add the warning to the result list
      buildWarning( // build one invalid-character warning object
        'INVALID_MORSE_CHARACTERS', // identify the warning type
        `Found invalid Morse characters in ${count} ${pluralize(count, 'token', 'tokens')}; affected tokens decoded as ?.`, // explain the issue
        invalidTokens, // include sample bad tokens
      ),
    )
  }

  if (unknownTokens.length > 0) { // only add this warning if unknown morse was found
    const count = unknownTokens.length // store the count for the message
    warnings.push( // add the warning to the result list
      buildWarning( // build one unknown-token warning object
        'UNKNOWN_MORSE_TOKENS', // identify the warning type
        `Decoded ${count} unknown Morse ${pluralize(count, 'token', 'tokens')} as ?.`, // explain the issue
        unknownTokens, // include sample unknown tokens
      ),
    )
  }

  return warnings // send the full warning list back to the caller
}

function buildEncodeWarnings(unsupportedCharacters: string[]) { // build warnings for text-to-morse mode
  if (unsupportedCharacters.length === 0) { // if nothing failed, there is nothing to warn about
    return [] // return an empty warning list
  }

  const count = unsupportedCharacters.length // store the count for the message
  return [
    buildWarning( // build the single encode warning
      'UNSUPPORTED_TEXT_CHARACTERS', // identify the warning type
      `Encoded ${count} unsupported ${pluralize(count, 'character', 'characters')} as ?.`, // explain the issue
      unsupportedCharacters, // include sample unsupported characters
    ),
  ]
}

function splitDecodeWords(input: string) { // split morse into words and tokens using spacing rules
  const words: string[][] = [] // final output: an array of words, each with morse tokens
  let currentWord: string[] = [] // tokens for the word we are currently building
  let currentToken = '' // the token we are currently building character by character
  let index = 0 // manual position so we can count runs of spaces

  while (index < input.length) { // scan through the input one character at a time
    const character = input[index] // read the current character

    if (character !== ' ') { // non-space characters belong to the current token
      currentToken += character // add the character to the token
      index += 1 // move to the next character
      continue // keep scanning
    }

    let spaceCount = 0 // this will count how many spaces we saw in a row

    while (index < input.length && input[index] === ' ') { // keep counting until the run of spaces ends
      spaceCount += 1 // add one more space to the current run
      index += 1 // move forward while we are still on spaces
    }

    if (spaceCount === 1) { // one space means "end of letter"
      if (currentToken) { // only save a token if we actually built one
        currentWord.push(currentToken) // add the finished token to the current word
        currentToken = '' // reset so we can build the next token
      }

      continue // keep scanning after the letter break
    }

    if (spaceCount === 3) { // three spaces means "end of word"
      if (currentToken) { // save any unfinished token first
        currentWord.push(currentToken) // add the token to the current word
        currentToken = '' // reset the token builder
      }

      if (currentWord.length > 0) { // only save the word if it has tokens
        words.push(currentWord) // add the finished word to the result list
        currentWord = [] // reset so we can build the next word
      }

      continue // keep scanning after the word break
    }

    currentToken += ' '.repeat(spaceCount) // keep weird spacing inside the token so we can flag it later
  }

  if (currentToken) { // after the loop, save any unfinished token
    currentWord.push(currentToken) // add the final token to the current word
  }

  if (currentWord.length > 0) { // after the loop, save any unfinished word
    words.push(currentWord) // add the final word to the result list
  }

  return words // return the nested word/token structure
}

function decodeToken( // decode one token and record why it failed if needed
  token: string, // one morse token like "...."
  invalidSpacingTokens: string[], // collect bad spacing examples here
  invalidTokens: string[], // collect invalid-character examples here
  unknownTokens: string[], // collect unknown-token examples here
) {
  if (token.includes(' ')) { // a token with spaces means the spacing was malformed
    invalidSpacingTokens.push(token) // save it for the warning output
    return '?' // use a question mark as the fallback character
  }

  if (!morseTokenPattern.test(token)) { // reject tokens that contain anything besides dots and dashes
    invalidTokens.push(token) // save the token for the warning output
    return '?' // use a question mark as the fallback character
  }

  const decoded = reverseMorseMap[token] // look up the token in the reverse map

  if (!decoded) { // if nothing was found, the token is unknown morse
    unknownTokens.push(token) // save it for the warning output
    return '?' // use a question mark as the fallback character
  }

  return decoded // return the real decoded letter when the lookup works
}

export function decodeMorse(input: string): TranslationResult { // main function for morse -> text
  const normalizedInput = normalizeNewlines(input).trim() // clean up newlines and outer whitespace first

  if (!normalizedInput) { // handle the empty-input case early
    return { output: '', warnings: [emptyWarning('decode')] } // return no output and one warning
  }

  const invalidSpacingTokens: string[] = [] // store tokens with bad spacing here
  const invalidTokens: string[] = [] // store tokens with invalid characters here
  const unknownTokens: string[] = [] // store valid-looking but unknown tokens here
  const expandedInput = normalizedInput.replace(/ *\n+ */g, '   ') // treat line breaks like morse word breaks
  const words = splitDecodeWords(expandedInput) // break the morse input into words and tokens
  const decodedWords: string[] = [] // collect each decoded word here

  for (const word of words) { // loop through each morse word
    let decodedWord = '' // build the decoded version of one word here

    for (const token of word) { // loop through each token in the current word
      decodedWord += decodeToken(token, invalidSpacingTokens, invalidTokens, unknownTokens) // decode the token and append it
    }

    decodedWords.push(decodedWord) // save the completed decoded word
  }

  return {
    output: decodedWords.join(' '), // join decoded words with normal spaces
    warnings: buildDecodeWarnings(invalidSpacingTokens, invalidTokens, unknownTokens), // build the final warning list
  }
}

export function encodeText(input: string): TranslationResult { // main function for text -> morse
  const normalizedInput = normalizeNewlines(input).trim() // clean up newlines and outer whitespace first

  if (!normalizedInput) { // handle the empty-input case early
    return { output: '', warnings: [emptyWarning('encode')] } // return no output and one warning
  }

  const unsupportedCharacters: string[] = [] // store characters that are not in the morse map
  const words = normalizedInput.split(/\s+/).filter(Boolean) // split the text into words using any whitespace
  const encodedWords: string[] = [] // collect each encoded word here

  for (const word of words) { // loop through each input word
    const upperWord = word.toUpperCase() // convert to uppercase because the map uses uppercase keys
    const encodedLetters: string[] = [] // collect the morse letters for this word here

    for (const character of upperWord) { // loop through each character in the word
      const encoded = morseMap[character as keyof typeof morseMap] // look up the morse code for the current character

      if (!encoded) { // if the character is not supported, use the fallback path
        unsupportedCharacters.push(character) // save it for the warning output
        encodedLetters.push('?') // use a question mark in the result
        continue // move on to the next character
      }

      encodedLetters.push(encoded) // save the real morse code for supported characters
    }

    encodedWords.push(encodedLetters.join(' ')) // join morse letters with one space and save the word
  }

  return {
    output: encodedWords.join('   '), // join words with three spaces, which is standard morse word spacing
    warnings: buildEncodeWarnings(unsupportedCharacters), // build the warning list for unsupported characters
  }
}
