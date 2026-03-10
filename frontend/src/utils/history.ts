import type { HistoryItem } from '../types'

// this key is the single place we store translation history in the browser.
const storageKey = 'morse-translator-history'
// keeping history capped stops local storage from growing forever.
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
  // this guard keeps the helper safe if it ever runs somewhere without a window object.
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
  // we trim here too so callers do not have to remember the storage limit.
  window.localStorage.setItem(storageKey, JSON.stringify(items.slice(0, historyLimit)))
}

export function clearHistory() {
  window.localStorage.removeItem(storageKey)
}

export function addHistoryItem(history: HistoryItem[], nextItem: HistoryItem) {
  // if the same translation is run again, we move it to the top instead of saving a duplicate copy.
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
  // using the browser locale makes the saved times feel natural on any machine.
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(timestamp))
}
