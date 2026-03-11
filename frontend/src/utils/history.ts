import type { HistoryItem } from '../types'

const storageKey = 'morse-translator-history'
const historyLimit = 12

// Only these two modes are allowed in saved history.
function isValidMode(value: unknown) {
  return value === 'decode' || value === 'encode'
}

// This checks that a saved item has the shape the app expects.
function isHistoryItem(value: unknown) {
  // If it is not a real object, it cannot be a history item.
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const item = value as Record<string, unknown>

  // Every history item needs a string id.
  if (typeof item.id !== 'string') {
    return false
  }

  // The mode must be either decode or encode.
  if (!isValidMode(item.mode)) {
    return false
  }

  // The original user input should be saved as text.
  if (typeof item.input !== 'string') {
    return false
  }

  // The translated result should also be saved as text.
  if (typeof item.output !== 'string') {
    return false
  }

  // The timestamp should be stored as a string.
  if (typeof item.timestamp !== 'string') {
    return false
  }

  return true
}

export function loadHistory(): HistoryItem[] {
  // If the code is not running in the browser, localStorage is not available.
  if (typeof window === 'undefined') {
    return []
  }

  const rawHistory = window.localStorage.getItem(storageKey)

  // If nothing was saved yet, return an empty history list.
  if (!rawHistory) {
    return []
  }

  try {
    const parsedHistory = JSON.parse(rawHistory)

    // History should be saved as an array.
    if (!Array.isArray(parsedHistory)) {
      return []
    }

    const history: HistoryItem[] = []

    for (const value of parsedHistory) {
      // Skip anything that does not match the history item format.
      if (!isHistoryItem(value)) {
        continue
      }

      // Keep only valid items, up to the app's history limit.
      history.push(value as HistoryItem)

      // Stop once we have enough items.
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

  // Save only the newest items we want to keep.
  for (const item of items) {
    historyToSave.push(item)

    // Stop once the saved list reaches the limit.
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
  // Put the newest item first.
  const nextHistory: HistoryItem[] = [nextItem]

  for (const item of history) {
    // Skip duplicates so the same translation does not appear twice in a row.
    const isSameItem =
      item.mode === nextItem.mode &&
      item.input === nextItem.input &&
      item.output === nextItem.output

    if (isSameItem) {
      continue
    }

    nextHistory.push(item)

    // Stop once the history list is full.
    if (nextHistory.length === historyLimit) {
      break
    }
  }

  return nextHistory
}

export function formatHistoryTimestamp(timestamp: string) {
  // Show the date in the user's local format.
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(timestamp))
}
