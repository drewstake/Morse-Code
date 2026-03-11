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

function runTranslation(mode: TranslationMode, input: string) {
  if (mode === 'decode') {
    return decodeMorse(input)
  }

  return encodeText(input)
}

function createHistoryId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function getInitialHistory() {
  return loadHistory()
}

function App() {
  const [mode, setMode] = useState<TranslationMode>('decode')
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [warnings, setWarnings] = useState<TranslationWarning[]>([])
  const [copyMessage, setCopyMessage] = useState('')
  const [history, setHistory] = useState<HistoryItem[]>(getInitialHistory)

  function clearTranslationResult() {
    setOutput('')
    setWarnings([])
    setCopyMessage('')
  }

  function translateInput(currentMode: TranslationMode, currentInput: string) {
    const result = runTranslation(currentMode, currentInput)

    setOutput(result.output)
    setWarnings(result.warnings)
    setCopyMessage('')

    return result
  }

  function handleTranslate() {
    const result = translateInput(mode, input)

    if (input.trim() === '') {
      return
    }

    const nextItem: HistoryItem = {
      id: createHistoryId(),
      mode: mode,
      input: input,
      output: result.output,
      timestamp: new Date().toISOString(),
    }

    const nextHistory = addHistoryItem(history, nextItem)

    setHistory(nextHistory)
    saveHistory(nextHistory)
  }

  function handleClear() {
    setInput('')
    clearTranslationResult()
  }

  async function handleCopy() {
    if (output === '') {
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
    clearTranslationResult()
  }

  function handleHistorySelect(item: HistoryItem) {
    setMode(item.mode)
    setInput(item.input)
    translateInput(item.mode, item.input)
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
