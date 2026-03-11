import type { HistoryItem } from '../types'

const storageKey = 'morse-translator-history'
const historyLimit = 12

function isValidMode(value: unknown) {
  return value === 'decode' || value === 'encode'
}

function isHistoryItem(value: unknown) {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const item = value as Record<string, unknown>

  if (typeof item.id !== 'string') {
    return false
  }

  if (!isValidMode(item.mode)) {
    return false
  }

  if (typeof item.input !== 'string') {
    return false
  }

  if (typeof item.output !== 'string') {
    return false
  }

  if (typeof item.timestamp !== 'string') {
    return false
  }

  return true
}

export function loadHistory(): HistoryItem[] {
  if (typeof window === 'undefined') {
    return []
  }

  const rawHistory = window.localStorage.getItem(storageKey)

  if (!rawHistory) {
    return []
  }

  try {
    const parsedHistory = JSON.parse(rawHistory)

    if (!Array.isArray(parsedHistory)) {
      return []
    }

    const history: HistoryItem[] = []

    for (const value of parsedHistory) {
      if (!isHistoryItem(value)) {
        continue
      }

      history.push(value as HistoryItem)

      if (history.length === historyLimit) {
        break
      }
    }

    return history
  } catch {
    return []
  }
}

export function saveHistory(items: HistoryItem[]) {
  const historyToSave: HistoryItem[] = []

  for (const item of items) {
    historyToSave.push(item)

    if (historyToSave.length === historyLimit) {
      break
    }
  }

  window.localStorage.setItem(storageKey, JSON.stringify(historyToSave))
}

export function clearHistory() {
  window.localStorage.removeItem(storageKey)
}

export function addHistoryItem(history: HistoryItem[], nextItem: HistoryItem) {
  const nextHistory: HistoryItem[] = [nextItem]

  for (const item of history) {
    const isSameItem =
      item.mode === nextItem.mode &&
      item.input === nextItem.input &&
      item.output === nextItem.output

    if (isSameItem) {
      continue
    }

    nextHistory.push(item)

    if (nextHistory.length === historyLimit) {
      break
    }
  }

  return nextHistory
}

export function formatHistoryTimestamp(timestamp: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(timestamp))
}
