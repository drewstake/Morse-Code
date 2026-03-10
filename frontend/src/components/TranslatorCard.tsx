import type { TranslationMode, TranslationWarning } from '../types'

interface TranslatorCardProps {
  mode: TranslationMode
  input: string
  output: string
  warnings: TranslationWarning[]
  copyMessage: string
  onModeChange: (nextMode: TranslationMode) => void
  onInputChange: (nextValue: string) => void
  onTranslate: () => void
  onClear: () => void
  onCopy: () => void | Promise<void>
}

// This keeps all mode-specific copy in one place so the JSX below stays focused on layout.
const modeContent = {
  decode: {
    actionLabel: 'Decode',
    inputLabel: 'Morse Input',
    outputLabel: 'Decoded Output',
    inputPlaceholder: '.... . .-.. .-.. ---   .-- --- .-. .-.. -..',
    outputPlaceholder: 'Decoded text will appear here.',
    hintText:
      'Single spaces separate letters. Triple spaces or line breaks separate words. Other spacing is flagged.',
  },
  encode: {
    actionLabel: 'Encode',
    inputLabel: 'Text Input',
    outputLabel: 'Encoded Output',
    inputPlaceholder: 'HELLO WORLD',
    outputPlaceholder: 'Encoded Morse will appear here.',
    hintText: 'Whitespace becomes word breaks. Unsupported characters are surfaced clearly.',
  },
} satisfies Record<
  TranslationMode,
  {
    actionLabel: string
    inputLabel: string
    outputLabel: string
    inputPlaceholder: string
    outputPlaceholder: string
    hintText: string
  }
>

function TranslatorCard({
  mode,
  input,
  output,
  warnings,
  copyMessage,
  onModeChange,
  onInputChange,
  onTranslate,
  onClear,
  onCopy,
}: TranslatorCardProps) {
  const isDecodeMode = mode === 'decode'
  const content = modeContent[mode]

  return (
    <section className="translator-card">
      <header className="hero">
        <p className="eyebrow">Innovative Owl Take-Home</p>
        <h1>Morse Translator</h1>
        <p className="intro">
          Decode pasted Morse into uppercase text or switch to encode mode for
          the reverse flow. Recent translations stay in your browser so the
          hosted Firebase version works on its own.
        </p>
      </header>

      <div className="mode-switch" role="tablist" aria-label="Translation mode">
        <button
          className={`mode-button ${isDecodeMode ? 'is-active' : ''}`}
          type="button"
          onClick={() => onModeChange('decode')}
        >
          Decode
        </button>
        <button
          className={`mode-button ${!isDecodeMode ? 'is-active' : ''}`}
          type="button"
          onClick={() => onModeChange('encode')}
        >
          Encode
        </button>
      </div>

      <div className="translator-grid">
        <section className="panel">
          <div className="panel-heading">
            <label className="section-label" htmlFor="translation-input">
              {content.inputLabel}
            </label>
            <span className="hint-text">{content.hintText}</span>
          </div>

          <textarea
            id="translation-input"
            className="translator-input"
            placeholder={content.inputPlaceholder}
            value={input}
            onChange={(event) => onInputChange(event.target.value)}
          />

          <div className="button-row">
            <button className="primary-button" type="button" onClick={onTranslate}>
              {content.actionLabel}
            </button>
            <button className="secondary-button" type="button" onClick={onClear}>
              Clear
            </button>
            <button
              className="ghost-button"
              type="button"
              onClick={onCopy}
              disabled={!output}
            >
              Copy Output
            </button>
          </div>
        </section>

        <section className="panel output-panel">
          <div className="panel-heading">
            <h2 className="section-label">{content.outputLabel}</h2>
            {copyMessage ? <span className="copy-message">{copyMessage}</span> : null}
          </div>

          <div className="output-box" aria-live="polite">
            {output || content.outputPlaceholder}
          </div>

          <section
            className={`status-panel ${warnings.length > 0 ? 'has-warning' : 'is-clean'}`}
            aria-live="polite"
          >
            <h3>{warnings.length > 0 ? 'Warnings' : 'Translation Notes'}</h3>
            {warnings.length > 0 ? (
              <ul className="warning-list">
                {warnings.map((warning) => (
                  <li key={warning.code}>
                    <p>{warning.message}</p>
                    {warning.items.length > 0 ? (
                      <div className="token-list">
                        {warning.items.map((item) => (
                          <span key={`${warning.code}-${item}`} className="token-chip">
                            {item}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : output ? (
              <p className="status-ok">Translation completed without warnings.</p>
            ) : (
              <p className="status-ok">
                Helpful validation notes will appear here after you translate.
              </p>
            )}
          </section>
        </section>
      </div>

      <section className="rules-strip">
        <article>
          <h3>Spacing Rules</h3>
          <p>
            <code>.... . .-.. .-.. ---</code> becomes <code>HELLO</code>.
            Triple spaces or line breaks create new words. Other spacing is
            treated as malformed input.
          </p>
        </article>
        <article>
          <h3>Fallback Behavior</h3>
          <p>
            Unknown Morse tokens decode as <code>?</code>. Unsupported text
            characters in encode mode also become <code>?</code>.
          </p>
        </article>
        <article>
          <h3>Local History</h3>
          <p>
            The latest translations are stored in <code>localStorage</code> so
            they survive refreshes without adding a database.
          </p>
        </article>
      </section>
    </section>
  )
}

export default TranslatorCard
