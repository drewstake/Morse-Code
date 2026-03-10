// the app only supports translating in these two directions.
export type TranslationMode = 'decode' | 'encode'

// these codes give the translator and the ui a stable way to talk about warning types.
export type WarningCode =
  | 'EMPTY_INPUT'
  | 'INVALID_MORSE_SPACING'
  | 'INVALID_MORSE_CHARACTERS'
  | 'UNKNOWN_MORSE_TOKENS'
  | 'UNSUPPORTED_TEXT_CHARACTERS'

// each warning carries a message plus a few example items to show in the interface.
export interface TranslationWarning {
  code: WarningCode
  message: string
  items: string[]
}

// translator helpers always return output and warnings together.
export interface TranslationResult {
  output: string
  warnings: TranslationWarning[]
}

// this is the shape of one saved history row in local storage.
export interface HistoryItem {
  id: string
  mode: TranslationMode
  input: string
  output: string
  timestamp: string
}
