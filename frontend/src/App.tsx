import { useState } from 'react'
import { decodeMorse } from './utils/translator'
import type { TranslationWarning } from './types'

function App() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [warnings, setWarnings] = useState<TranslationWarning[]>([])
  const [copyMessage, setCopyMessage] = useState('')

  function handleDecode() {
    const result = decodeMorse(input)
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

  return (
    <main className="page">
      <section className="translator-card">
        <header className="hero">
          <p className="eyebrow">Innovative Owl Take-Home</p>
          <h1>Morse Decoder</h1>
          <p className="intro">
            Paste Morse code, keep the spacing natural, and translate it into
            uppercase text.
          </p>
        </header>

        <div className="translator-grid">
          <section className="panel">
            <div className="panel-heading">
              <label className="section-label" htmlFor="morse-input">
                Morse Input
              </label>
              <span className="hint-text">
                One or two spaces separate letters. Three spaces or newlines
                separate words.
              </span>
            </div>

            <textarea
              id="morse-input"
              className="translator-input"
              placeholder=".... . .-.. .-.. ---   .-- --- .-. .-.. -.."
              value={input}
              onChange={(event) => setInput(event.target.value)}
            />

            <div className="button-row">
              <button className="primary-button" type="button" onClick={handleDecode}>
                Decode
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
              <h2 className="section-label">Decoded Output</h2>
              {copyMessage ? <span className="copy-message">{copyMessage}</span> : null}
            </div>

            <div className="output-box" aria-live="polite">
              {output || 'Decoded text will appear here.'}
            </div>

            <section className="status-panel" aria-live="polite">
              <h3>Validation Notes</h3>
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
              ) : (
                <p className="status-ok">
                  Helpful warnings will appear here if input needs attention.
                </p>
              )}
            </section>
          </section>
        </div>

        <section className="rules-strip">
          <article>
            <h3>Decode Samples</h3>
            <p>`.... . .-.. .-.. ---` becomes `HELLO`.</p>
          </article>
          <article>
            <h3>Unknown Tokens</h3>
            <p>Any Morse token outside the mapping decodes as `?`.</p>
          </article>
          <article>
            <h3>Invalid Characters</h3>
            <p>Tokens containing characters other than `.`, `-`, spaces, or newlines also decode as `?`.</p>
          </article>
        </section>
      </section>
    </main>
  )
}

export default App
