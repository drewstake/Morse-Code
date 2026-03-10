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

// This keeps the translation decision in one place so every caller uses the same flow.
function runTranslation(currentMode: TranslationMode, currentInput: string) {
  return currentMode === 'decode' ? decodeMorse(currentInput) : encodeText(currentInput)
}

// History items need a stable key even though we are not using a backend or database.
function createHistoryId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function App() {
  // These state values drive the live translation experience on the page.
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

  // Every translation path uses this helper so output, warnings, and copy state stay in sync.
  function applyTranslation(currentMode: TranslationMode, currentInput: string) {
    const result = runTranslation(currentMode, currentInput)
    setOutput(result.output)
    setWarnings(result.warnings)
    setCopyMessage('')
    return result
  }

  function handleTranslate() {
    const result = applyTranslation(mode, input)

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
    resetTranslationFeedback()
  }

  // We rerun translation from the saved input so history always reflects current translator rules.
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
