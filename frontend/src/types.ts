// The two translation directions the UI supports.
export type TranslationMode = 'decode' | 'encode'

// Stable warning identifiers used throughout the translator and UI.
export type WarningCode =
  | 'EMPTY_INPUT'
  | 'INVALID_MORSE_SPACING'
  | 'INVALID_MORSE_CHARACTERS'
  | 'UNKNOWN_MORSE_TOKENS'
  | 'UNSUPPORTED_TEXT_CHARACTERS'

// A single warning shown to the user after a translation attempt.
export interface TranslationWarning {
  code: WarningCode
  message: string
  items: string[]
}

// The translator output returned to the UI.
export interface TranslationResult {
  output: string
  warnings: TranslationWarning[]
}

// One saved translation entry stored in local history.
export interface HistoryItem {
  id: string
  mode: TranslationMode
  input: string
  output: string
  timestamp: string
}
