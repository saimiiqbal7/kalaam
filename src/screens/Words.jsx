import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import Nav from '../components/Nav'
import { getLibrary, removeWord } from '../lib/wordLibrary'
import './Words.css'

export default function Words() {
  const [library, setLibrary] = useState(getLibrary)
  const [search, setSearch] = useState('')
  const [expandedId, setExpandedId] = useState(null)

  const filtered = useMemo(() => {
    if (!search.trim()) return library
    const q = search.toLowerCase().trim()
    return library.filter(
      (e) =>
        e.word?.toLowerCase().includes(q) ||
        e.ur_meaning?.toLowerCase().includes(q) ||
        e.en_definition?.toLowerCase().includes(q)
    )
  }, [library, search])

  const handleRemove = (word) => {
    removeWord(word)
    setLibrary(getLibrary())
  }

  return (
    <div className="words-page">
      <Nav />

      <main className="words-main">
        <header className="words-header">
          <h1 className="words-title">Your Word Library</h1>
          <span className="words-badge">{library.length} word{library.length !== 1 ? 's' : ''}</span>
        </header>

        <div className="words-search-wrap">
          <input
            type="search"
            className="words-search"
            placeholder="Search words..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search words"
          />
        </div>

        {filtered.length === 0 ? (
          <div className="words-empty">
            <div className="words-empty-book" aria-hidden>
              <svg viewBox="0 0 80 50" className="words-empty-book-svg">
                <path d="M 8 8 L 38 5 L 38 45 L 8 42 Z" fill="#fffaf6" stroke="#ffccaa" strokeWidth="1" />
                <path d="M 42 5 L 72 8 L 72 42 L 42 45 Z" fill="#fffaf6" stroke="#ffccaa" strokeWidth="1" />
                <path d="M 38 5 L 42 5 L 42 45 L 38 45 Z" fill="#f5ede4" />
                <line x1="40" y1="8" x2="40" y2="42" stroke="#d68a4a" strokeOpacity="0.4" strokeWidth="0.5" />
              </svg>
            </div>
            <p className="words-empty-title">No words yet.</p>
            <p className="words-empty-desc">Double-tap any word while reading to save it here.</p>
          </div>
        ) : (
          <div className="words-grid">
            {filtered.map((entry, i) => {
              const cardId = `${entry.word}-${entry.addedAt}-${i}`
              const hasExamples = entry.example_sentences?.length > 0
              const isExpanded = expandedId === cardId
              return (
                <article
                  key={cardId}
                  className={`words-card ${hasExamples ? 'words-card--expandable' : ''} ${isExpanded ? 'words-card--expanded' : ''}`}
                  onClick={hasExamples ? () => setExpandedId(isExpanded ? null : cardId) : undefined}
                >
                  <button
                    type="button"
                    className="words-card-remove"
                    onClick={(e) => { e.stopPropagation(); handleRemove(entry.word); }}
                    aria-label={`Remove ${entry.word}`}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z" />
                      <line x1="10" y1="11" x2="10" y2="17" />
                      <line x1="14" y1="11" x2="14" y2="17" />
                    </svg>
                  </button>
                  <div className="words-card-head">
                    <h2 className="words-card-word">{entry.word}</h2>
                    {entry.source && <span className="words-card-source">{entry.source}</span>}
                  </div>
                  {entry.ur_meaning && (
                    <p className="words-card-ur">{entry.ur_meaning}</p>
                  )}
                  {entry.en_definition && (
                    <p className="words-card-def">{entry.en_definition}</p>
                  )}
                  {hasExamples && (
                    <>
                      <hr className="words-card-hr" />
                      <div className="words-card-examples">
                        <p className="words-card-examples-toggle">Tap for examples</p>
                        {entry.example_sentences.slice(0, 2).map((ex, j) => (
                          <div key={j} className="words-card-example">
                            <p className="words-card-ex-en">"{ex.en}"</p>
                            {ex.ur && <p className="words-card-ex-ur">"{ex.ur}"</p>}
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </article>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
