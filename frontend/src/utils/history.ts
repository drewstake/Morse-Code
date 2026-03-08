import type { HistoryItem } from '../types'

const storageKey = 'morse-translator-history'
const historyLimit = 12

function isHistoryItem(value: unknown): value is HistoryItem {
  if (!value || typeof value !== 'object') {
    return false
  }

  const candidate = value as Partial<HistoryItem>
  return (
    typeof candidate.id === 'string' &&
    (candidate.mode === 'decode' || candidate.mode === 'encode') &&
    typeof candidate.input === 'string' &&
    typeof candidate.output === 'string' &&
    typeof candidate.timestamp === 'string'
  )
}

export function loadHistory(): HistoryItem[] {
  if (typeof window === 'undefined') {
    return []
  }

  try {
    const parsed = JSON.parse(window.localStorage.getItem(storageKey) ?? '[]')
    if (!Array.isArray(parsed)) {
      return []
    }

    return parsed.filter(isHistoryItem).slice(0, historyLimit)
  } catch {
    return []
  }
}

export function saveHistory(items: HistoryItem[]) {
  window.localStorage.setItem(storageKey, JSON.stringify(items.slice(0, historyLimit)))
}

export function clearHistory() {
  window.localStorage.removeItem(storageKey)
}

export function addHistoryItem(history: HistoryItem[], nextItem: HistoryItem) {
  return [
    nextItem,
    ...history.filter(
      (item) =>
        !(
          item.mode === nextItem.mode &&
          item.input === nextItem.input &&
          item.output === nextItem.output
        ),
    ),
  ].slice(0, historyLimit)
}

export function formatHistoryTimestamp(timestamp: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(timestamp))
}
