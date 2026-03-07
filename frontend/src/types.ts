export type TranslationMode = 'decode' | 'encode'

export type WarningCode =
  | 'EMPTY_INPUT'
  | 'INVALID_MORSE_CHARACTERS'
  | 'UNKNOWN_MORSE_TOKENS'
  | 'UNSUPPORTED_TEXT_CHARACTERS'

export interface TranslationWarning {
  code: WarningCode
  message: string
  items: string[]
}

export interface TranslationResult {
  output: string
  warnings: TranslationWarning[]
}
