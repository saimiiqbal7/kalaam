import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import Nav from '../components/Nav'
import booksData from '../data/books.json'
import './Homepage.css'

const books = booksData.books
const previewBook = books.find((b) => b.id === 'azaad-farm') || books[0]
const previewLines = previewBook.previewLines || previewBook.chapters?.[0]?.lines?.slice(0, 5) || []
const previewLinesDesktop = previewLines.slice(0, 5)
const previewLinesMobile = previewLines.slice(0, 3)
const activePreviewIndex = 1

export default function Homepage() {
  const heroRef = useRef(null)
  const stepsRef = useRef(null)
  const readerRef = useRef(null)
  const [heroVisible, setHeroVisible] = useState(false)
  const [stepsVisible, setStepsVisible] = useState(false)
  const [readerVisible, setReaderVisible] = useState(false)

  useEffect(() => {
    setHeroVisible(true)
  }, [])

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([e]) => setStepsVisible(e.isIntersecting),
      { threshold: 0.2, rootMargin: '0px 0px -80px 0px' }
    )
    if (stepsRef.current) observer.observe(stepsRef.current)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([e]) => setReaderVisible(e.isIntersecting),
      { threshold: 0.15, rootMargin: '0px 0px -80px 0px' }
    )
    if (readerRef.current) observer.observe(readerRef.current)
    return () => observer.disconnect()
  }, [])

  return (
    <div className="homepage">
      <Nav />

      {/* Hero */}
      <section className={`hp-hero ${heroVisible ? 'hp-hero--visible' : ''}`} ref={heroRef}>
        <div className="hp-hero-watermark" aria-hidden>کلام</div>
        <div className="hp-hero-book" aria-hidden>
          <svg viewBox="0 0 200 120" className="hp-hero-book-svg">
            <defs>
              <linearGradient id="pageLeft" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#fffaf6" />
                <stop offset="100%" stopColor="#f5ede4" />
              </linearGradient>
              <linearGradient id="pageRight" x1="100%" y1="0%" x2="0%" y2="0%">
                <stop offset="0%" stopColor="#fffaf6" />
                <stop offset="100%" stopColor="#f5ede4" />
              </linearGradient>
              <filter id="bookShadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="8" stdDeviation="12" floodColor="rgba(45,26,16,0.12)" />
              </filter>
            </defs>
            <g filter="url(#bookShadow)">
              <path d="M 20 20 L 90 15 L 90 105 L 20 100 Z" fill="url(#pageLeft)" stroke="#e8dcd2" strokeWidth="0.5" />
              <path d="M 110 15 L 180 20 L 180 100 L 110 105 Z" fill="url(#pageRight)" stroke="#e8dcd2" strokeWidth="0.5" />
              <path d="M 90 15 L 110 15 L 110 105 L 90 105 Z" fill="#e8dcd2" />
              <line x1="98" y1="18" x2="98" y2="102" stroke="#d68a4a" strokeOpacity="0.4" strokeWidth="0.5" />
            </g>
            <g fill="#7d4f3a" fontFamily="Georgia, serif" fontSize="4">
              <text x="35" y="45">Read.</text>
              <text x="35" y="58">Understand.</text>
            </g>
          </svg>
        </div>
        <div className="hp-hero-content">
          <p className="hp-hero-strike">A for Apple</p>
          <h1 className="hp-hero-headline">
            <span className="hp-hero-line">Learn English through Stories</span>
          </h1>
          <p className="hp-hero-tagline">Built for Pakistanis who want to read the world.</p>
          <div className="hp-hero-ctas">
            <Link to="/library" className="hp-btn hp-btn--primary hp-btn--lg">Start Reading →</Link>
            <a href="#how-it-works" className="hp-btn hp-btn--ghost hp-btn--lg">See how it works</a>
          </div>
        </div>
      </section>

      {/* 3. How it works */}
      <section id="how-it-works" className={`hp-section hp-steps ${stepsVisible ? 'hp-steps--visible' : ''}`} ref={stepsRef}>
        <h2 className="hp-section-title">How it works</h2>
        <div className="hp-steps-grid">
          <div className="hp-step-card">
            <span className="hp-step-icon">📖</span>
            <h3 className="hp-step-title">Pick a novel</h3>
            <p className="hp-step-desc">Choose from our library of classic novels curated for Pakistani students</p>
          </div>
          <div className="hp-step-card">
            <span className="hp-step-icon">🌗</span>
            <h3 className="hp-step-title">Read side by side</h3>
            <p className="hp-step-desc">English on the left, Roman Urdu on the right. Tap each line to advance</p>
          </div>
          <div className="hp-step-card">
            <span className="hp-step-icon">📈</span>
            <h3 className="hp-step-title">Grow and fade</h3>
            <p className="hp-step-desc">As your quiz scores improve, Urdu support fades until you're reading pure English</p>
          </div>
          <div className="hp-step-card">
            <span className="hp-step-icon">✋</span>
            <h3 className="hp-step-title">Build your word bank</h3>
            <p className="hp-step-desc">Double-tap any word to save it. Get definitions, Roman Urdu meanings, and example sentences, all in one place.</p>
          </div>
        </div>
      </section>

      {/* 4. Reader preview */}
      <section className={`hp-section hp-reader-preview ${readerVisible ? 'hp-reader-preview--visible' : ''}`} ref={readerRef}>
        <h2 className="hp-section-title">This is what reading feels like in Kalaam.</h2>
        <div className="hp-reader-mock">
          <div className="hp-reader-chrome">
            <span className="hp-reader-dot" /><span className="hp-reader-dot" /><span className="hp-reader-dot" />
          </div>
          {/* Desktop: side-by-side pages */}
          <div className="hp-reader-inner hp-reader-inner--desktop">
            <div className="hp-reader-spine" />
            <div className="hp-reader-page hp-reader-page--left">
              {previewLinesDesktop.map((line, i) => (
                <div
                  key={i}
                  className={`hp-reader-line ${i === activePreviewIndex ? 'hp-reader-line--current' : i < activePreviewIndex ? 'hp-reader-line--past' : 'hp-reader-line--future'}`}
                >
                  {line.en}
                </div>
              ))}
            </div>
            <div className="hp-reader-page hp-reader-page--right">
              {previewLinesDesktop.map((line, i) => (
                <div
                  key={i}
                  className={`hp-reader-line hp-reader-line--urdu ${i === activePreviewIndex ? 'hp-reader-line--current' : i < activePreviewIndex ? 'hp-reader-line--past' : 'hp-reader-line--future'}`}
                >
                  {line.ur}
                </div>
              ))}
            </div>
          </div>
          {/* Mobile: stacked EN + UR per line, 3 lines */}
          <div className="hp-reader-inner hp-reader-inner--mobile">
            {previewLinesMobile.map((line, i) => (
              <div
                key={i}
                className={`hp-reader-stacked-line ${i === activePreviewIndex ? 'hp-reader-line--current' : i < activePreviewIndex ? 'hp-reader-line--past' : 'hp-reader-line--future'}`}
              >
                <div className="hp-reader-stacked-en">{line.en}</div>
                <div className="hp-reader-stacked-ur">{line.ur}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Support levels */}
      <section className="hp-section hp-levels">
        <h2 className="hp-section-title">Training wheels that disappear.</h2>
        <div className="hp-levels-row">
          <div className="hp-level-card hp-level-card--1">
            <span className="hp-level-num">1</span>
            <span className="hp-level-label">Full Urdu</span>
            <div className="hp-level-visual">
              <span className="hp-level-page hp-level-page--full">ا</span>
              <span className="hp-level-page hp-level-page--full">ا</span>
            </div>
          </div>
          <span className="hp-level-arrow">→</span>
          <div className="hp-level-card hp-level-card--2">
            <span className="hp-level-num">2</span>
            <span className="hp-level-label">50% opacity</span>
            <div className="hp-level-visual">
              <span className="hp-level-page hp-level-page--full">ا</span>
              <span className="hp-level-page hp-level-page--fade">ا</span>
            </div>
          </div>
          <span className="hp-level-arrow">→</span>
          <div className="hp-level-card hp-level-card--3">
            <span className="hp-level-num">3</span>
            <span className="hp-level-label">Tap to reveal</span>
            <div className="hp-level-visual">
              <span className="hp-level-page hp-level-page--full">ا</span>
              <span className="hp-level-page hp-level-page--ghost">···</span>
            </div>
          </div>
          <span className="hp-level-arrow">→</span>
          <div className="hp-level-card hp-level-card--4">
            <span className="hp-level-num">4</span>
            <span className="hp-level-label">Pure English</span>
            <div className="hp-level-visual">
              <span className="hp-level-page hp-level-page--full">ا</span>
              <span className="hp-level-page hp-level-page--empty" />
            </div>
          </div>
        </div>
      </section>

      {/* 6. Book library preview */}
      <section className="hp-section hp-books">
        <h2 className="hp-section-title">Start with a classic.</h2>
        <div className="hp-books-grid">
          {books.map((book) => (
            <Link
              key={book.id}
              to={`/read/${book.id}`}
              className="hp-book-card"
              data-difficulty={book.difficulty?.toLowerCase()}
              data-cover-color={book.coverColor || ''}
            >
              <div className="hp-book-cover">
                <img src={book.coverImage} alt={book.title} />
              </div>
              <div className="hp-book-info">
                {book.badge && <span className="hp-book-original-badge">{book.badge}</span>}
                <h3 className="hp-book-title">{book.title}</h3>
                <p className="hp-book-author">{book.author}</p>
                {book.description && <p className="hp-book-desc">{book.description}</p>}
                <span className="hp-book-badge">{book.difficulty}</span>
              </div>
            </Link>
          ))}
        </div>
        <Link to="/library" className="hp-btn hp-btn--ghost hp-book-cta">Browse the full library →</Link>
      </section>

      {/* 7. Footer */}
      <footer className="hp-footer">
        <Link to="/" className="hp-footer-logo">
          <span className="hp-nav-logo-en">Kalaam</span>
          <span className="hp-nav-logo-urdu">کلام</span>
        </Link>
        <nav className="hp-footer-nav">
          <Link to="/library">Library</Link>
          <span className="hp-footer-sep">·</span>
          <Link to="/words">Word Library</Link>
          <span className="hp-footer-sep">·</span>
          <a href="#how-it-works">How it works</a>
          <span className="hp-footer-sep">·</span>
          <a href="#how-it-works">About</a>
        </nav>
        <p className="hp-footer-built">Built in Pakistan 🇵🇰</p>
      </footer>
    </div>
  )
}
