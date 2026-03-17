import { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import booksData from '../data/books.json'
import { vocabulary } from '../data/vocabulary'
import { getWordData, addWord, hasWord, normalizeWord, getLibrary } from '../lib/wordLibrary'
import { useMediaQuery } from '../hooks/useMediaQuery'
import OnboardingOverlay, { isOnboardingDone } from '../components/OnboardingOverlay'
import { trackBookOpened, trackChapterCompleted, trackWordSaved, updateSupportLevel } from '../lib/userService'
import './Reader.css'
import confetti from 'https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.2/dist/confetti.module.mjs'

const SUPPORT_LEVELS = [
  { id: 1, label: 'Full support', desc: 'Roman Urdu visible' },
  { id: 2, label: 'Fading', desc: 'Roman Urdu 50%' },
  { id: 3, label: 'Tap to reveal', desc: 'Urdu hidden' },
  { id: 4, label: 'English only', desc: 'No Urdu' },
]

const PHASE_READING = 'reading'
const PHASE_CHAPTER_COMPLETE = 'chapterComplete'
const PHASE_CHECKPOINT = 'checkpoint'
const PHASE_QUIZ = 'quiz'
const PHASE_QUIZ_RESULT = 'quizResult'
const PHASE_WORD_BANK_REVIEW = 'wordBankReview'

const STORAGE_KEY = (bookId) => `kalaam_support_${bookId}`
const QUIZ_DONE_KEY = (bookId, chapterId) => `kalaam_quiz_${bookId}_${chapterId}`
const CHECKPOINT_DONE_KEY = (bookId, chapterId) => `kalaam_checkpoints_${bookId}_${chapterId}`
const CHECKPOINT_POSITIVE = ['Sahi jawab!', 'Zabardast!', 'Bilkul theek!', 'Excellent!']
const CHECKPOINT_POSITIVE_UR = ['Wah, bohat khoob!', 'Kamaal kar diya!', 'Bilkul sahi!', 'Shahbash!']
const CHECKPOINT_NEGATIVE = 'Not quite — the correct answer is highlighted above'
const CHECKPOINT_NEGATIVE_UR = 'Ghabrao mat — sahi jawab upar highlight hai'

function getSupportLevel(bookId) {
  const stored = localStorage.getItem(STORAGE_KEY(bookId))
  return stored ? Math.min(4, Math.max(1, parseInt(stored, 10))) : 1
}

function setSupportLevel(bookId, level) {
  localStorage.setItem(STORAGE_KEY(bookId), String(level))
}

function getWordLookup(word) {
  const lower = word.toLowerCase()
  const clean = lower.replace(/[^a-z']/g, '')
  return vocabulary[clean] || vocabulary[lower]
}

// Normalize quiz/checkpoint option: string, { en, ur }, or use optionsUr array by index
function getOptionEn(opt) {
  return typeof opt === 'string' ? opt : opt?.en ?? ''
}
function getOptionUr(opt, optionsUr, index) {
  if (optionsUr && index != null && optionsUr[index] != null) return optionsUr[index]
  return typeof opt === 'string' ? null : opt?.ur ?? null
}

export default function Reader() {
  const { bookId } = useParams()
  const navigate = useNavigate()
  const [supportLevel, setSupport] = useState(() => getSupportLevel(bookId))
  const [chapterIndex, setChapterIndex] = useState(0)
  const [lineIndex, setLineIndex] = useState(0)
  const [phase, setPhase] = useState(PHASE_READING)
  const [revealLine, setRevealLine] = useState(null)
  const [tooltip, setTooltip] = useState(null)
  const [quizAnswers, setQuizAnswers] = useState([])
  const [levelUpCelebration, setLevelUpCelebration] = useState(false)
  const [toast, setToast] = useState(null)
  const [tapHintVisible, setTapHintVisible] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(() => !isOnboardingDone())
  const [pendingCheckpoint, setPendingCheckpoint] = useState(null)
  const [checkpointAnswers, setCheckpointAnswers] = useState([])
  const [wordsReviewChapter, setWordsReviewChapter] = useState(null)
  const [checkpointCompleted, setCheckpointCompleted] = useState(false)
  const [checkpointFeedback, setCheckpointFeedback] = useState(null)
  const [checkpointRevealContinue, setCheckpointRevealContinue] = useState(false)
  const [quizFeedback, setQuizFeedback] = useState(null)
  const toastTimeoutRef = useRef(null)
  const tapHintTimeoutRef = useRef(null)
  const checkpointAdvanceTimeoutRef = useRef(null)
  const checkpointContinueTimeoutRef = useRef(null)
  const chapterCompletionTrackedRef = useRef(false)
  const activeLineRef = useRef(null)
  const isMobile = useMediaQuery('(max-width: 767px)')

  useEffect(() => {
    window.resetOnboarding = () => {
      localStorage.removeItem('kalaam_onboarding_done')
      window.location.reload()
    }
    return () => {
      if (window.resetOnboarding) delete window.resetOnboarding
    }
  }, [])

  const book = useMemo(() => booksData.books.find((b) => b.id === bookId), [bookId])
  const chapters = book?.chapters ?? []
  const chapter = chapters[chapterIndex]
  const lines = chapter?.lines ?? []
  const isLastLine = lines.length > 0 && lineIndex >= lines.length - 1
  const isLastChapter = chapterIndex >= chapters.length - 1

  // Scroll active line into center when line index changes (reading phase)
  useEffect(() => {
    if (phase !== PHASE_READING || !activeLineRef.current) return
    activeLineRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [lineIndex, phase])

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current)
      if (tapHintTimeoutRef.current) clearTimeout(tapHintTimeoutRef.current)
      if (checkpointAdvanceTimeoutRef.current) clearTimeout(checkpointAdvanceTimeoutRef.current)
      if (checkpointContinueTimeoutRef.current) clearTimeout(checkpointContinueTimeoutRef.current)
    }
  }, [])

  // Tap-to-continue hint: show after 3s inactivity, hide on tap (handled in handleAdvance)
  useEffect(() => {
    if (phase !== PHASE_READING || !lines.length) return
    if (tapHintTimeoutRef.current) clearTimeout(tapHintTimeoutRef.current)
    tapHintTimeoutRef.current = setTimeout(() => setTapHintVisible(true), 3000)
    return () => {
      if (tapHintTimeoutRef.current) clearTimeout(tapHintTimeoutRef.current)
    }
  }, [phase, lineIndex, lines.length])

  // Level 3 mobile: auto-hide reveal after 3s
  useEffect(() => {
    if (!isMobile || revealLine === null) return
    const t = setTimeout(() => setRevealLine(null), 3000)
    return () => clearTimeout(t)
  }, [isMobile, revealLine])

  useEffect(() => {
    chapterCompletionTrackedRef.current = false
  }, [bookId, chapterIndex])

  useEffect(() => {
    const run = async () => {
      try {
        await trackBookOpened(bookId)
      } catch {
        // silent fail
      }
    }
    run()
  }, [bookId])

  const handleAdvance = useCallback(() => {
    setTapHintVisible(false)
    if (tapHintTimeoutRef.current) {
      clearTimeout(tapHintTimeoutRef.current)
      tapHintTimeoutRef.current = setTimeout(() => setTapHintVisible(true), 3000)
    }
    if (phase !== PHASE_READING) return
    if (lines.length === 0) return
    if (lineIndex >= lines.length) return
    const checkpoint = chapter?.checkpoints?.find((cp) => cp.afterLine === lineIndex)
    const completed = JSON.parse(localStorage.getItem(CHECKPOINT_DONE_KEY(bookId, chapter?.id)) || '[]')
    if (checkpoint) {
      if (completed.includes(checkpoint.id)) {
        setLineIndex((i) => i + 1)
        setRevealLine(null)
        return
      }
      setPendingCheckpoint(checkpoint)
      setCheckpointAnswers([])
      setCheckpointCompleted(false)
      setCheckpointFeedback(null)
      setCheckpointRevealContinue(false)
      setPhase(PHASE_CHECKPOINT)
      setRevealLine(null)
      return
    }
    if (!isLastLine) {
      setLineIndex((i) => i + 1)
      setRevealLine(null)
      return
    }
    if (chapter?.id && !chapterCompletionTrackedRef.current) {
      chapterCompletionTrackedRef.current = true
      ;(async () => {
        try {
          await trackChapterCompleted(bookId, chapter.id)
        } catch {
          // silent fail
        }
      })()
    }
    setLineIndex(lines.length)
    setPhase(PHASE_CHAPTER_COMPLETE)
    setRevealLine(null)
  }, [phase, lines.length, lineIndex, isLastLine, chapter])

  const handleChapterCompleteContinue = useCallback(() => {
    const quizDoneKey = QUIZ_DONE_KEY(bookId, chapter?.id)
    if (chapter?.quiz?.length && !localStorage.getItem(quizDoneKey)) {
      setPhase(PHASE_QUIZ)
      setQuizAnswers([])
    } else {
      if (isLastChapter) {
        setChapterIndex(0)
        setLineIndex(0)
      } else {
        setChapterIndex((c) => c + 1)
        setLineIndex(0)
      }
      setPhase(PHASE_READING)
    }
  }, [bookId, chapter, isLastChapter])

  const handleWordClick = useCallback((e, word) => {
    e.stopPropagation()
    const lookup = getWordLookup(word)
    if (!lookup) return
    const rect = e.target.getBoundingClientRect()
    setTooltip({ ...lookup, x: rect.left + rect.width / 2, y: rect.top })
  }, [])

  const handleCloseTooltip = useCallback(() => setTooltip(null), [])

  const showToast = useCallback((messageOrPayload) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current)
    setToast(messageOrPayload)
    toastTimeoutRef.current = setTimeout(() => {
      setToast(null)
      toastTimeoutRef.current = null
    }, typeof messageOrPayload === 'object' && messageOrPayload.duration ? messageOrPayload.duration : 2500)
  }, [])

  const handleWordDoubleClick = useCallback(
    async (e, word) => {
      e.stopPropagation()
      e.preventDefault()
      const source = book && chapter ? `${book.title}, ${chapter.title}` : ''
      const clean = normalizeWord(word)
      if (!clean) return
      if (hasWord(word)) {
        showToast({ type: 'already', word: word, duration: 2500 })
        return
      }
      const data = await getWordData(word, source, vocabulary)
      if (!data) {
        showToast("Couldn't add this word")
        return
      }
      const added = addWord(data)
      if (added) {
        showToast({ type: 'added', word: data.word, ur_meaning: data.ur_meaning, en_definition: data.en_definition, duration: 2500 })
        try {
          await trackWordSaved()
        } catch {
          // silent fail
        }
      }
    },
    [book, chapter, showToast]
  )

  const renderEnglishLine = (text) => {
    return text.split(/(\s+)/).map((part, i) => {
      if (/^\s+$/.test(part)) return <span key={i}>{part}</span>
      const lookup = getWordLookup(part)
      return (
        <span
          key={i}
          className="reader-word-tappable"
          onClick={(e) => {
            e.stopPropagation()
            if (lookup) handleWordClick(e, part)
          }}
          onDoubleClick={(e) => handleWordDoubleClick(e, part)}
        >
          {part}
        </span>
      )
    })
  }

  const rightPageOpacity = supportLevel === 1 ? 1 : supportLevel === 2 ? 0.5 : 0
  const rightPageReveal = supportLevel === 3 && revealLine === lineIndex

  if (!book) {
    return (
      <div className="reader reader--empty">
        <p>Book not found.</p>
        <button type="button" onClick={() => navigate('/library')}>Back to Library</button>
      </div>
    )
  }

  if (!chapters.length) {
    return (
      <div className="reader reader--empty">
        <p>This book has no chapters yet.</p>
        <button type="button" onClick={() => navigate('/library')}>Back to Library</button>
      </div>
    )
  }

  // Checkpoint (mid-chapter)
  if (phase === PHASE_CHECKPOINT && pendingCheckpoint) {
    const cp = pendingCheckpoint
    const cpQuestions = cp.questions || []
    const cpCurrent = checkpointAnswers.length
    const cpDone = cpCurrent >= cpQuestions.length
    const checkpointKey = CHECKPOINT_DONE_KEY(bookId, chapter?.id)
    const completed = JSON.parse(localStorage.getItem(checkpointKey) || '[]')

    const handleCheckpointAnswer = (optionIndex) => {
      if (cpDone) return
      const currentQuestion = cpQuestions[cpCurrent]
      const isCorrect = currentQuestion?.correct === optionIndex
      const next = [...checkpointAnswers, optionIndex]
      setCheckpointAnswers(next)
      setCheckpointFeedback({
        correct: isCorrect,
        selected: optionIndex,
        correctIndex: currentQuestion?.correct,
      })
      setCheckpointRevealContinue(false)
      if (isCorrect) {
        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.7 },
          colors: ['#ffb08f', '#ff9a6a', '#7d2f2a', '#ffccaa', '#d68a4a'],
          scalar: 0.9,
          gravity: 1.2,
        })
      }
      if (checkpointAdvanceTimeoutRef.current) clearTimeout(checkpointAdvanceTimeoutRef.current)
      checkpointAdvanceTimeoutRef.current = setTimeout(() => {
        setCheckpointFeedback(null)
        setCheckpointAnswers(next)
      }, isCorrect ? 1800 : 2500)
    }

    if (cpDone) {
      const correct = cpQuestions.filter((q, i) => q.correct === checkpointAnswers[i]).length
      const total = cpQuestions.length
      const pct = total ? Math.round((correct / total) * 100) : 0
      const summary = pct === 100
        ? { tone: 'green', en: '✦ Perfect checkpoint!', ur: 'Sab sawaal sahi thay — bohat khoob!', confetti: true }
        : pct >= 50
          ? { tone: 'amber', en: 'Good try — keep reading carefully', ur: 'Koi baat nahi — dhyan se parhte raho', confetti: false }
          : { tone: 'muted', en: 'Review the lines above before continuing', ur: 'Aage barhne se pehle upar wali lines dobara parhein', confetti: false }
      if (!checkpointCompleted) {
        completed.push(cp.id)
        localStorage.setItem(checkpointKey, JSON.stringify(completed))
        setCheckpointCompleted(true)
        setCheckpointFeedback({ summary })
        if (summary.confetti) {
          confetti({
            particleCount: 60,
            spread: 70,
            origin: { y: 0.7 },
            colors: ['#ffb08f', '#ff9a6a', '#7d2f2a', '#ffccaa', '#d68a4a'],
            scalar: 0.9,
            gravity: 1.2,
          })
        }
        if (checkpointContinueTimeoutRef.current) clearTimeout(checkpointContinueTimeoutRef.current)
        checkpointContinueTimeoutRef.current = setTimeout(() => setCheckpointRevealContinue(true), 1000)
      }
      return (
        <div className="reader reader--quiz paper-texture">
          <div className="checkpoint-result">
            <h2 className="checkpoint-title">Checkpoint ✦</h2>
            <p className="checkpoint-score">{correct}/{total} correct</p>
            <div className={`checkpoint-summary checkpoint-summary--${summary.tone}`}>
              <p className="checkpoint-summary-en">{summary.en}</p>
              <p className="checkpoint-summary-ur">{summary.ur}</p>
            </div>
            {checkpointRevealContinue && (
              <button
                type="button"
                className="reader-btn reader-btn--primary"
                onClick={() => {
                  setPendingCheckpoint(null)
                  setCheckpointAnswers([])
                  setCheckpointCompleted(false)
                  setCheckpointFeedback(null)
                  setCheckpointRevealContinue(false)
                  setPhase(PHASE_READING)
                }}
              >
                Continue Reading →
              </button>
            )}
          </div>
        </div>
      )
    }

    const cq = cpQuestions[cpCurrent]
    const cqOptions = cq.options || []
    const cqOptionsUr = cq.optionsUr || []
    const locked = !!checkpointFeedback
    return (
      <div className="reader reader--quiz paper-texture">
        <div className="quiz-box checkpoint-box">
          <h2 className="checkpoint-heading">Checkpoint ✦</h2>
          <p className="checkpoint-sub">Quick check before we continue</p>
          <p className="checkpoint-sub-ur">Aage barhne se pehle ek chhota sa jaiza</p>
          <span className="quiz-meta">{cq.type}</span>
          <h2 className="quiz-question">{cq.question}</h2>
          {cq.questionUr && <p className="quiz-question-ur">{cq.questionUr}</p>}
          <div className={`quiz-options ${locked ? 'quiz-options--locked' : ''}`}>
            {cqOptions.map((opt, i) => (
              <button
                key={i}
                type="button"
                className={`reader-btn quiz-option ${checkpointFeedback?.selected === i ? (checkpointFeedback.correct ? 'quiz-option--correct' : 'quiz-option--wrong') : ''} ${checkpointFeedback?.correctIndex === i && checkpointFeedback.selected !== i ? 'quiz-option--correct' : ''}`}
                onClick={() => {
                  if (locked) return
                  handleCheckpointAnswer(i)
                }}
                style={locked ? { pointerEvents: 'none' } : undefined}
              >
                <span className="quiz-option-en">{getOptionEn(opt)}</span>
                {(getOptionUr(opt, cqOptionsUr, i) || opt?.ur) && (
                  <span className="quiz-option-ur">{getOptionUr(opt, cqOptionsUr, i) || opt?.ur}</span>
                )}
              </button>
            ))}
          </div>
          {checkpointFeedback && !checkpointFeedback.summary && (
            <div className={`checkpoint-feedback ${checkpointFeedback.correct ? 'checkpoint-feedback--correct' : 'checkpoint-feedback--wrong'}`}>
              {checkpointFeedback.correct ? (
                <>
                  <p className="checkpoint-feedback-en">{CHECKPOINT_POSITIVE[Math.floor(Math.random() * CHECKPOINT_POSITIVE.length)]}</p>
                  <p className="checkpoint-feedback-ur">{CHECKPOINT_POSITIVE_UR[Math.floor(Math.random() * CHECKPOINT_POSITIVE_UR.length)]}</p>
                </>
              ) : (
                <>
                  <p className="checkpoint-feedback-en">{CHECKPOINT_NEGATIVE}</p>
                  <p className="checkpoint-feedback-ur">{CHECKPOINT_NEGATIVE_UR}</p>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }

  // Word Bank review (after chapter checkpoint)
  if (phase === PHASE_WORD_BANK_REVIEW && wordsReviewChapter) {
    const { words } = wordsReviewChapter
    return (
      <div className="reader reader--wordbank paper-texture">
        <div className="wordbank-review">
          <h1 className="wordbank-review-title">Words you collected this chapter</h1>
          <p className="wordbank-review-count">{words.length} word{words.length !== 1 ? 's' : ''} saved</p>
          <div className="wordbank-review-list">
            {words.map((w, i) => (
              <div key={i} className="wordbank-review-card">
                <div className="wordbank-review-word">{w.word}</div>
                <div className="wordbank-review-ur">{w.ur_meaning}</div>
                <div className="wordbank-review-def">{w.en_definition}</div>
                {w.example_sentences?.[0] && (
                  <p className="wordbank-review-ex">"{w.example_sentences[0].en}"</p>
                )}
              </div>
            ))}
          </div>
          <button
            type="button"
            className="reader-btn reader-btn--primary wordbank-review-btn"
            onClick={() => {
              setWordsReviewChapter(null)
              setPhase(PHASE_READING)
              setChapterIndex(0)
              setLineIndex(0)
              navigate('/library')
            }}
          >
            Continue to Library →
          </button>
        </div>
      </div>
    )
  }

  // Chapter Complete transition screen
  if (phase === PHASE_CHAPTER_COMPLETE) {
    return (
      <div className="reader reader--chapter-complete paper-texture">
        <div className="chapter-complete-card">
          <div className="chapter-complete-ornament" aria-hidden>✦</div>
          <h1 className="chapter-complete-book">{book.title}</h1>
          <p className="chapter-complete-chapter">{chapter?.title}</p>
          <p className="chapter-complete-label">Chapter Complete</p>
          <button
            type="button"
            className="reader-btn reader-btn--primary chapter-complete-btn"
            onClick={handleChapterCompleteContinue}
          >
            {chapter?.quiz?.length ? 'Continue to checkpoint' : 'Continue reading'}
          </button>
        </div>
      </div>
    )
  }

  // Quiz (and quiz result)
  if ((phase === PHASE_QUIZ || phase === PHASE_QUIZ_RESULT) && chapter?.quiz) {
    const quiz = chapter.quiz
    const currentQ = quizAnswers.length
    const isQuizComplete = currentQ >= quiz.length

    const handleQuizAnswer = (optionIndex) => {
      if (isQuizComplete) return
      const next = [...quizAnswers, optionIndex]
      setQuizAnswers(next)
      if (next.length >= quiz.length) {
        setPhase(PHASE_QUIZ_RESULT)
        const correct = quiz.filter((q, i) => q.correct === next[i]).length
        const pct = (correct / quiz.length) * 100
        if (pct >= 80 && supportLevel < 4) {
          setSupportLevel(bookId, supportLevel + 1)
          setSupport(supportLevel + 1)
          setLevelUpCelebration(true)
          ;(async () => {
            try {
              await updateSupportLevel(supportLevel + 1)
            } catch {
              // silent fail
            }
          })()
        }
        localStorage.setItem(QUIZ_DONE_KEY(bookId, chapter.id), JSON.stringify({ done: true, at: Date.now() }))
      }
    }

    if (phase === PHASE_QUIZ_RESULT) {
      const correct = quiz.filter((q, i) => q.correct === quizAnswers[i]).length
      const pct = Math.round((correct / quiz.length) * 100)
      const chapterSource = `${book.title}, ${chapter.title}`
      const wordsThisChapter = getLibrary().filter((w) => w.source === chapterSource)
      const showWordBankReview = wordsThisChapter.length >= 1

      return (
        <div className={`reader reader--quiz paper-texture ${isMobile ? 'reader--mobile' : ''}`}>
          <div className="quiz-result">
            {levelUpCelebration && <div className="quiz-celebration">Level up!</div>}
            <h2>Chapter complete</h2>
            <p className="quiz-score quiz-score--number">{correct}/{quiz.length} ({pct}%)</p>
            {pct >= 80 && (
              <>
                <p className="quiz-level-up">Support level increased. Keep reading!</p>
                {isMobile && <p className="quiz-level-up-ur">Level barha! Ab parhtay raho.</p>}
              </>
            )}
            <button
              type="button"
              className="reader-btn reader-btn--primary"
              onClick={() => {
                setLevelUpCelebration(false)
                if (showWordBankReview) {
                  setWordsReviewChapter({ source: chapterSource, words: wordsThisChapter })
                  setPhase(PHASE_WORD_BANK_REVIEW)
                } else {
                  setPhase(PHASE_READING)
                  chapterCompletionTrackedRef.current = false
                  if (isLastChapter) {
                    setChapterIndex(0)
                    setLineIndex(0)
                  } else {
                    setChapterIndex((c) => c + 1)
                    setLineIndex(0)
                  }
                }
              }}
            >
              {showWordBankReview ? 'See words collected' : 'Continue reading'}
            </button>
          </div>
        </div>
      )
    }

    const q = quiz[currentQ]
    const options = q.options || []
    const optionsUr = q.optionsUr || []
    return (
      <div className={`reader reader--quiz paper-texture ${isMobile ? 'reader--mobile' : ''}`}>
        <div className="quiz-box">
          <div className="quiz-progress">
            <span className="quiz-progress-text">Checkpoint {currentQ + 1} of {quiz.length}</span>
            <div className="quiz-progress-bar"><div className="quiz-progress-fill" style={{ width: `${((currentQ + 1) / quiz.length) * 100}%` }} /></div>
          </div>
          <span className="quiz-meta">{q.type}</span>
          <h2 className="quiz-question">{q.question}</h2>
          {q.questionUr && (
            <p className="quiz-question-ur">{q.questionUr}</p>
          )}
          <div className="quiz-options">
            {options.map((opt, i) => (
              <button
                key={i}
                type="button"
                className="reader-btn quiz-option"
                onClick={() => handleQuizAnswer(i)}
              >
                <span className="quiz-option-en">{getOptionEn(opt)}</span>
                {(getOptionUr(opt, optionsUr, i) ?? (typeof opt === 'object' && opt?.ur)) && (
                  <span className="quiz-option-ur">{getOptionUr(opt, optionsUr, i) ?? (typeof opt === 'object' ? opt?.ur : '')}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Reading view: full chapter text, one line highlighted
  const titleText = chapter ? `${book.title} · ${chapter.title}` : book.title

  return (
    <div className={`reader paper-texture ${isMobile ? 'reader--mobile' : ''}`} onClick={handleAdvance}>
      <header className="reader-header">
        <button type="button" className="reader-back" onClick={(e) => { e.stopPropagation(); navigate('/library'); }} aria-label="Back to library">
          ←
        </button>
        <h1 className="reader-title" title={titleText}>{titleText}</h1>
        <span className="reader-support-badge" title={SUPPORT_LEVELS[supportLevel - 1]?.desc}>
          {isMobile ? `L${supportLevel}` : `Level ${supportLevel}`}
        </span>
      </header>

      {isMobile ? (
        <div className="reader-book reader-book--stacked">
          <div className="reader-stacked-content">
            {lines.map((line, i) => {
              const isCurrent = i === lineIndex
              const isPast = i < lineIndex
              const state = isCurrent ? 'current' : isPast ? 'past' : 'future'
              const showUr = supportLevel <= 2 || (supportLevel === 3 && revealLine === i)
              return (
                <div
                  key={i}
                  ref={isCurrent ? activeLineRef : null}
                  className={`reader-stacked-line reader-line--${state}`}
                  onClick={supportLevel === 3 && !showUr ? (e) => { e.stopPropagation(); setRevealLine(i); } : undefined}
                >
                  <div className="reader-stacked-en">{renderEnglishLine(line.en)}</div>
                  {supportLevel <= 3 && (
                    <div
                      className="reader-stacked-ur"
                      style={{
                        opacity: showUr ? (supportLevel === 2 ? 0.5 : 1) : 0,
                      }}
                    >
                      {showUr ? line.ur : '···'}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        <div className="reader-book">
          <div className="reader-spine" />
          <div className="reader-page reader-page--left">
            {lines.map((line, i) => {
              const isCurrent = i === lineIndex
              const isPast = i < lineIndex
              const isFuture = i > lineIndex
              const state = isCurrent ? 'current' : isPast ? 'past' : 'future'
              return (
                <div
                  key={i}
                  ref={isCurrent ? activeLineRef : null}
                  className={`reader-line reader-line--${state}`}
                >
                  {renderEnglishLine(line.en)}
                </div>
              )
            })}
          </div>
          <div
            className="reader-page reader-page--right"
            style={{ opacity: rightPageReveal ? 1 : rightPageOpacity }}
            onClick={supportLevel === 3 ? (e) => { e.stopPropagation(); setRevealLine((prev) => (prev === lineIndex ? null : lineIndex)); } : undefined}
          >
            {lines.map((line, i) => {
              const isCurrent = i === lineIndex
              const isPast = i < lineIndex
              const isFuture = i > lineIndex
              const state = isCurrent ? 'current' : isPast ? 'past' : 'future'
              return (
                <div key={i} className={`reader-line reader-line--urdu reader-line--${state}`}>
                  {line.ur}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {isLastLine && (
        <div className="reader-next-hint">
          Tap to finish chapter →
        </div>
      )}

      {tapHintVisible && !isLastLine && (
        <div className="reader-tap-hint">Tap to continue</div>
      )}

      {tooltip && (
        <>
          <div className="reader-tooltip-backdrop" onClick={handleCloseTooltip} aria-hidden />
          <div className={isMobile ? 'reader-bottomsheet' : 'reader-tooltip'} style={isMobile ? {} : { left: tooltip.x, top: tooltip.y }}>
            <p className="reader-tooltip-ur">{tooltip.ur}</p>
            <p className="reader-tooltip-def">{tooltip.def}</p>
          </div>
        </>
      )}

      {toast && (
        <div
          className={`reader-toast ${(isMobile || (typeof toast === 'object' && toast.type)) ? 'reader-toast--top' : ''} ${typeof toast === 'object' && toast.type ? `reader-toast--${toast.type}` : ''}`}
          role="status"
        >
          {typeof toast === 'object' && toast.type === 'added' ? (
            <>
              <span className="reader-toast-icon">✦</span>
              <span className="reader-toast-main">"{toast.word}" added to Word Bank</span>
              <span className="reader-toast-sub">{toast.ur_meaning} — {toast.en_definition}</span>
            </>
          ) : typeof toast === 'object' && toast.type === 'already' ? (
            <>
              <span className="reader-toast-main">"{toast.word}" is already in your Word Bank</span>
            </>
          ) : (
            toast
          )}
        </div>
      )}

      {showOnboarding && phase === PHASE_READING && (
        <OnboardingOverlay
          lines={chapter?.lines}
          onComplete={() => setShowOnboarding(false)}
        />
      )}
    </div>
  )
}
