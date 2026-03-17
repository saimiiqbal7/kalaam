import { useEffect, useMemo, useRef, useState } from 'react'
import './OnboardingOverlay.css'

const ONBOARDING_DONE_KEY = 'kalaam_onboarding_done'

export function isOnboardingDone() {
  return typeof localStorage !== 'undefined' && localStorage.getItem(ONBOARDING_DONE_KEY) === 'true'
}

export function setOnboardingDone() {
  localStorage.setItem(ONBOARDING_DONE_KEY, 'true')
}

function HandIcon() {
  return (
    <svg className="onboarding-hand" width="32" height="40" viewBox="0 0 32 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M16 2 C16 2 16 22 16 26 C16 30 10 32 10 36 L22 36 C22 32 20 28 20 26 L20 2 C20 2 16 2 16 2Z" stroke="#2e1a10" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M20 10 C20 10 24 10 24 14 L24 26" stroke="#2e1a10" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M24 14 C24 14 28 14 28 18 L28 26" stroke="#2e1a10" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M12 10 C12 10 8 10 8 14 L8 26" stroke="#2e1a10" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}

export default function OnboardingOverlay({ lines, onComplete }) {
  const [step, setStep] = useState(1)
  const [currentLineIndex, setCurrentLineIndex] = useState(0)
  const [highlightedWordIndex, setHighlightedWordIndex] = useState(null)
  const [lineTapAnim, setLineTapAnim] = useState(false)
  const [wordTapAnim, setWordTapAnim] = useState(false)
  const [toast, setToast] = useState(null)
  const [doneVisible, setDoneVisible] = useState(false)
  const lastTapTimeRef = useRef(0)
  const doneTimerRef = useRef(null)

  const line0 = lines?.[0]
  const line1 = lines?.[1] || lines?.[0]
  const activeLine = step === 1 ? line0 : line1

  const words = useMemo(() => {
    const text = activeLine?.en || ''
    return text.split(/(\s+)/)
  }, [activeLine])

  const targetWordIndex = useMemo(() => {
    const lower = words.findIndex((part) => /cruel/i.test(part))
    if (lower >= 0) return lower
    return words.findIndex((part) => /\w/.test(part))
  }, [words])

  useEffect(() => {
    return () => {
      if (doneTimerRef.current) clearTimeout(doneTimerRef.current)
    }
  }, [])

  const showSavedToast = () => {
    setToast({ main: '"cruel" added to Word Bank ✓', sub: 'zalim — be-rehm, kisi ka bura chahne wala' })
    if (doneTimerRef.current) clearTimeout(doneTimerRef.current)
    doneTimerRef.current = setTimeout(() => setToast(null), 2500)
  }

  const finishOnboarding = () => {
    setOnboardingDone()
    onComplete()
  }

  if (!line0) return null

  const handleLineTap = () => {
    const now = Date.now()
    if (now - lastTapTimeRef.current < 350 && step === 2 && currentLineIndex === 1) {
      return
    }
    lastTapTimeRef.current = now
    setLineTapAnim(true)
    window.setTimeout(() => setLineTapAnim(false), 300)
    if (step === 1) {
      setCurrentLineIndex(1)
      setStep(2)
    } else if (step === 3) {
      setDoneVisible(true)
      setTimeout(finishOnboarding, 1800)
    }
  }

  const handleWordTap = (index) => {
    const now = Date.now()
    if (now - lastTapTimeRef.current <= 350) {
      setWordTapAnim(true)
      window.setTimeout(() => setWordTapAnim(false), 500)
      setHighlightedWordIndex(index)
      showSavedToast()
      setTimeout(() => setStep(3), 1800)
    }
    lastTapTimeRef.current = now
  }

  return (
    <div className="onboarding-overlay">
      <div className="onboarding-shell">
        <div className="onboarding-book">
          {lines.slice(0, 3).map((line, i) => {
            const state = i < currentLineIndex ? 'past' : i === currentLineIndex ? 'current' : 'future'
            const isWordStep = step === 2 && i === 1
            const showWord = isWordStep && highlightedWordIndex != null
            const rendered = line.en.split(/(\s+)/).map((part, idx) => {
              if (!isWordStep || !/\w/.test(part)) return part
              const isTarget = idx === targetWordIndex
              return (
                <span
                  key={idx}
                  className={isTarget ? 'onboarding-word onboarding-word--target' : 'onboarding-word'}
                  onClick={isTarget ? (e) => { e.stopPropagation(); handleWordTap(idx) } : undefined}
                  onTouchEnd={isTarget ? (e) => { e.stopPropagation(); handleWordTap(idx) } : undefined}
                >
                  {part}
                </span>
              )
            })
            return (
              <button
                key={i}
                type="button"
                className={`onboarding-line onboarding-line--${state} ${i === currentLineIndex && lineTapAnim ? 'onboarding-line--tap' : ''}`}
                onClick={i === currentLineIndex ? handleLineTap : undefined}
                onTouchEnd={i === currentLineIndex ? handleLineTap : undefined}
              >
                <div className="onboarding-demo-en">{rendered}</div>
                <div className="onboarding-demo-ur">{line.ur}</div>
                {i === currentLineIndex && <HandIcon />}
                {showWord && <div className="onboarding-word-highlight" />}
              </button>
            )
          })}
        </div>

        <div className="onboarding-footer">
          <div className="onboarding-step-label">Step {step} of 3</div>
          <div className="onboarding-progress">
            <span className={`onboarding-dot ${step >= 1 ? 'onboarding-dot--active' : ''}`} />
            <span className={`onboarding-dot ${step >= 2 ? 'onboarding-dot--active' : ''}`} />
            <span className={`onboarding-dot ${step >= 3 ? 'onboarding-dot--active' : ''}`} />
          </div>
          <div className="onboarding-instruction">
            <div className="onboarding-instruction-en">
              {step === 1 ? 'Tap this line to move forward' : step === 2 ? 'Double-tap any word to save it' : 'Now tap to keep reading'}
            </div>
            <div className="onboarding-instruction-ur">
              {step === 1 ? 'Aage barhne ke liye yeh line tap karein' : step === 2 ? 'Koi bhi lafz save karne ke liye double-tap karein' : 'Parhai jari rakhne ke liye tap karein'}
            </div>
          </div>
          <button type="button" className="onboarding-skip" onClick={finishOnboarding}>Skip tutorial</button>
        </div>
      </div>

      {toast && (
        <div className="onboarding-toast-demo">
          <div>{toast.main}</div>
          <div>{toast.sub}</div>
        </div>
      )}

      {doneVisible && <div className="onboarding-done-pill">You're ready. Enjoy Azaad Farm.</div>}
    </div>
  )
}
