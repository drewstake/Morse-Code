import type { HistoryItem } from '../types'
import { formatHistoryTimestamp } from '../utils/history'

interface HistorySidebarProps {
  history: HistoryItem[]
  onSelect: (item: HistoryItem) => void
  onClearHistory: () => void
}

// this component is just the history view; the parent owns the actual data and handlers.
function HistorySidebar({ history, onSelect, onClearHistory }: HistorySidebarProps) {
  return (
    <aside className="history-card">
      <div className="history-header">
        <div>
          <p className="eyebrow">Recent</p>
          <h2>Translation History</h2>
        </div>
        <button
          className="text-button"
          type="button"
          onClick={onClearHistory}
          disabled={history.length === 0}
        >
          Clear History
        </button>
      </div>

      {history.length > 0 ? (
        <ul className="history-list">
          {history.map((item) => (
            <li key={item.id}>
              {/* clicking a saved row reloads that translation back into the main card. */}
              <button className="history-item" type="button" onClick={() => onSelect(item)}>
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
        <>
          {/* this empty state makes it obvious the feature is available, just not used yet. */}
          <div className="history-empty">
            <p>No saved translations yet.</p>
            <span>Run a decode or encode action and it will show up here.</span>
          </div>
        </>
      )}
    </aside>
  )
}

export default HistorySidebar
