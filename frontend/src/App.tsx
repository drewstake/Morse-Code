import { useState } from 'react'
import type { TranslationMode, TranslationWarning } from './types'
import { encodeText, decodeMorse } from './utils/translator'

function App() {
  const [mode, setMode] = useState<TranslationMode>('decode')
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [warnings, setWarnings] = useState<TranslationWarning[]>([])
  const [copyMessage, setCopyMessage] = useState('')

  const isDecodeMode = mode === 'decode'
  const actionLabel = isDecodeMode ? 'Decode' : 'Encode'
  const inputLabel = isDecodeMode ? 'Morse Input' : 'Text Input'
  const outputLabel = isDecodeMode ? 'Decoded Output' : 'Encoded Output'
  const inputPlaceholder = isDecodeMode
    ? '.... . .-.. .-.. ---   .-- --- .-. .-.. -..'
    : 'HELLO WORLD'
  const outputPlaceholder = isDecodeMode
    ? 'Decoded text will appear here.'
    : 'Encoded Morse will appear here.'

  function runTranslation(currentMode: TranslationMode, currentInput: string) {
    return currentMode === 'decode' ? decodeMorse(currentInput) : encodeText(currentInput)
  }

  function handleTranslate() {
    const result = runTranslation(mode, input)
    setOutput(result.output)
    setWarnings(result.warnings)
    setCopyMessage('')
  }

  function handleClear() {
    setInput('')
    setOutput('')
    setWarnings([])
    setCopyMessage('')
  }

  async function handleCopy() {
    if (!output) {
      return
    }

    try {
      await navigator.clipboard.writeText(output)
      setCopyMessage('Copied to clipboard.')
    } catch {
      setCopyMessage('Clipboard copy is unavailable in this browser.')
    }
  }

  function handleModeChange(nextMode: TranslationMode) {
    if (nextMode === mode) {
      return
    }

    setMode(nextMode)
    setOutput('')
    setWarnings([])
    setCopyMessage('')
  }

  return (
    <main className="page">
      <section className="translator-card">
        <header className="hero">
          <p className="eyebrow">Innovative Owl Take-Home</p>
          <h1>Morse Translator</h1>
          <p className="intro">
            Decode pasted Morse into uppercase text or switch to encode mode
            for the reverse flow.
          </p>
        </header>

        <div className="mode-switch" role="tablist" aria-label="Translation mode">
          <button
            className={`mode-button ${isDecodeMode ? 'is-active' : ''}`}
            type="button"
            onClick={() => handleModeChange('decode')}
          >
            Decode
          </button>
          <button
            className={`mode-button ${!isDecodeMode ? 'is-active' : ''}`}
            type="button"
            onClick={() => handleModeChange('encode')}
          >
            Encode
          </button>
        </div>

        <div className="translator-grid">
          <section className="panel">
            <div className="panel-heading">
              <label className="section-label" htmlFor="translation-input">
                {inputLabel}
              </label>
              <span className="hint-text">
                {isDecodeMode
                  ? 'One or two spaces separate letters. Three spaces or newlines separate words.'
                  : 'Whitespace becomes word breaks. Unsupported characters are surfaced clearly.'}
              </span>
            </div>

            <textarea
              id="translation-input"
              className="translator-input"
              placeholder={inputPlaceholder}
              value={input}
              onChange={(event) => setInput(event.target.value)}
            />

            <div className="button-row">
              <button className="primary-button" type="button" onClick={handleTranslate}>
                {actionLabel}
              </button>
              <button className="secondary-button" type="button" onClick={handleClear}>
                Clear
              </button>
              <button
                className="ghost-button"
                type="button"
                onClick={handleCopy}
                disabled={!output}
              >
                Copy Output
              </button>
            </div>
          </section>

          <section className="panel output-panel">
            <div className="panel-heading">
              <h2 className="section-label">{outputLabel}</h2>
              {copyMessage ? <span className="copy-message">{copyMessage}</span> : null}
            </div>

            <div className="output-box" aria-live="polite">
              {output || outputPlaceholder}
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
              Three spaces or line breaks create new words.
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
            <h3>Encode Mode</h3>
            <p>
              Text input is uppercased before lookup and Morse words are joined
              with three spaces.
            </p>
          </article>
        </section>
      </section>
    </main>
  )
}

export default App
