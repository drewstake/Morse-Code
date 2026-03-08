import { useState } from 'react'
import type { HistoryItem, TranslationMode, TranslationWarning } from './types'
import {
  addHistoryItem,
  clearHistory,
  formatHistoryTimestamp,
  loadHistory,
  saveHistory,
} from './utils/history'
import { encodeText, decodeMorse } from './utils/translator'

function App() {
  const [mode, setMode] = useState<TranslationMode>('decode')
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [warnings, setWarnings] = useState<TranslationWarning[]>([])
  const [copyMessage, setCopyMessage] = useState('')
  const [history, setHistory] = useState<HistoryItem[]>(() => loadHistory())

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

  function createHistoryId() {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
      return crypto.randomUUID()
    }

    return `${Date.now()}-${Math.random().toString(16).slice(2)}`
  }

  function handleTranslate() {
    const result = runTranslation(mode, input)
    setOutput(result.output)
    setWarnings(result.warnings)
    setCopyMessage('')

    if (!input.trim()) {
      return
    }

    const nextHistory = addHistoryItem(history, {
      id: createHistoryId(),
      mode,
      input,
      output: result.output,
      timestamp: new Date().toISOString(),
    })

    setHistory(nextHistory)
    saveHistory(nextHistory)
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

  function handleHistorySelect(item: HistoryItem) {
    const result = runTranslation(item.mode, item.input)
    setMode(item.mode)
    setInput(item.input)
    setOutput(result.output)
    setWarnings(result.warnings)
    setCopyMessage('')
  }

  function handleClearHistory() {
    clearHistory()
    setHistory([])
  }

  return (
    <main className="page">
      <div className="workspace-grid">
        <section className="translator-card">
          <header className="hero">
            <p className="eyebrow">Innovative Owl Take-Home</p>
            <h1>Morse Translator</h1>
            <p className="intro">
              Decode pasted Morse into uppercase text or switch to encode mode
              for the reverse flow. Recent translations stay in your browser so
              the hosted Firebase version works on its own.
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
                    ? 'Single spaces separate letters. Triple spaces or line breaks separate words. Other spacing is flagged.'
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
                The latest translations are stored in <code>localStorage</code>{' '}
                so they survive refreshes without adding a database.
              </p>
            </article>
          </section>
        </section>

        <aside className="history-card">
          <div className="history-header">
            <div>
              <p className="eyebrow">Recent</p>
              <h2>Translation History</h2>
            </div>
            <button
              className="text-button"
              type="button"
              onClick={handleClearHistory}
              disabled={history.length === 0}
            >
              Clear History
            </button>
          </div>

          {history.length > 0 ? (
            <ul className="history-list">
              {history.map((item) => (
                <li key={item.id}>
                  <button
                    className="history-item"
                    type="button"
                    onClick={() => handleHistorySelect(item)}
                  >
                    <div className="history-meta">
                      <span className={`mode-pill ${item.mode}`}>{item.mode}</span>
                      <span>{formatHistoryTimestamp(item.timestamp)}</span>
                    </div>
                    <p className="history-label">Input</p>
                    <p className="history-preview">{item.input}</p>
                    <p className="history-label">Output</p>
                    <p className="history-preview output-preview">{item.output || 'No output'}</p>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="history-empty">
              <p>No saved translations yet.</p>
              <span>Run a decode or encode action and it will show up here.</span>
            </div>
          )}
        </aside>
      </div>
    </main>
  )
}

export default App
