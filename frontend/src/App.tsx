import { useState } from 'react'
import type { HistoryItem, TranslationMode, TranslationWarning } from './types'
import HistorySidebar from './components/HistorySidebar'
import TranslatorCard from './components/TranslatorCard'
import {
  addHistoryItem,
  clearHistory,
  loadHistory,
  saveHistory,
} from './utils/history'
import { encodeText, decodeMorse } from './utils/translator'

// this keeps the mode check in one place so every translation path behaves the same way.
function runTranslation(currentMode: TranslationMode, currentInput: string) {
  return currentMode === 'decode' ? decodeMorse(currentInput) : encodeText(currentInput)
}

// history rows still need unique ids even though everything lives only in the browser.
function createHistoryId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function App() {
  // this is the main app state for the current translation session.
  const [mode, setMode] = useState<TranslationMode>('decode')
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [warnings, setWarnings] = useState<TranslationWarning[]>([])
  const [copyMessage, setCopyMessage] = useState('')
  const [history, setHistory] = useState<HistoryItem[]>(() => loadHistory())

  function resetTranslationFeedback() {
    setOutput('')
    setWarnings([])
    setCopyMessage('')
  }

  // this helper keeps the visible result and any warning state in sync after each run.
  function applyTranslation(currentMode: TranslationMode, currentInput: string) {
    const result = runTranslation(currentMode, currentInput)
    setOutput(result.output)
    setWarnings(result.warnings)
    setCopyMessage('')
    return result
  }

  function handleTranslate() {
    const result = applyTranslation(mode, input)

    // empty input can still show a warning, but it should not create a history entry.
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
    resetTranslationFeedback()
  }

  async function handleCopy() {
    if (!output) {
      return
    }

    try {
      // clipboard writes can fail in some browsers or permissions states, so both outcomes are handled.
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

    // switching modes clears old results so decode feedback does not bleed into encode mode, or vice versa.
    setMode(nextMode)
    resetTranslationFeedback()
  }

  // rerunning from the saved input is safer than trusting old saved output forever.
  function handleHistorySelect(item: HistoryItem) {
    setMode(item.mode)
    setInput(item.input)
    applyTranslation(item.mode, item.input)
  }

  function handleClearHistory() {
    clearHistory()
    setHistory([])
  }

  return (
    <main className="page">
      <div className="workspace-grid">
        <TranslatorCard
          mode={mode}
          input={input}
          output={output}
          warnings={warnings}
          copyMessage={copyMessage}
          onModeChange={handleModeChange}
          onInputChange={setInput}
          onTranslate={handleTranslate}
          onClear={handleClear}
          onCopy={handleCopy}
        />
        <HistorySidebar
          history={history}
          onSelect={handleHistorySelect}
          onClearHistory={handleClearHistory}
        />
      </div>
    </main>
  )
}

export default App
