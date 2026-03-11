import { useCallback, useState } from 'react'
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

  const handleTranslate = useCallback(() => {
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

    setHistory((currentHistory) => {
      const nextHistory = addHistoryItem(currentHistory, nextItem)
      saveHistory(nextHistory)
      return nextHistory
    })
  }, [input, mode])

  const handleClear = useCallback(() => {
    setInput('')
    clearTranslationResult()
  }, [])

  const handleCopy = useCallback(async () => {
    if (output === '') {
      return
    }

    try {
      await navigator.clipboard.writeText(output)
      setCopyMessage('Copied to clipboard.')
    } catch {
      setCopyMessage('Clipboard copy is unavailable in this browser.')
    }
  }, [output])

  const handleModeChange = useCallback((nextMode: TranslationMode) => {
    if (nextMode === mode) {
      return
    }

    setMode(nextMode)
    clearTranslationResult()
  }, [mode])

  const handleHistorySelect = useCallback((item: HistoryItem) => {
    setMode(item.mode)
    setInput(item.input)
    translateInput(item.mode, item.input)
  }, [])

  const handleClearHistory = useCallback(() => {
    clearHistory()
    setHistory([])
  }, [])

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
