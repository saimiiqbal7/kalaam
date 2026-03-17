import { useState, useEffect, useRef } from 'react'
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
    <svg className="onboarding-hand" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#2e1a10" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 11V8a2 2 0 0 0-2-2 2 2 0 0 0-2 2v6" />
      <path d="M14 10V6a2 2 0 0 0-2-2 2 2 0 0 0-2 2v8" />
      <path d="M10 10.5V5a2 2 0 0 0-4 0v9.5" />
      <path d="M6 14.5v-2a1.5 1.5 0 0 0-3 0V17a2 2 0 0 0 4 0v-5" />
      <path d="M18 8a2 2 0 1 1 4 0v6a4 4 0 0 1-4 4h-2" />
    </svg>
  )
}

export default function OnboardingOverlay({ lines, onComplete }) {
  const [moment, setMoment] = useState(1)
  const [tapAnim, setTapAnim] = useState(false)
  const [highlightSecond, setHighlightSecond] = useState(false)
  const [showMoment1Label, setShowMoment1Label] = useState(false)
  const [showMoment2Toast, setShowMoment2Toast] = useState(false)
  const [showReady, setShowReady] = useState(false)

  const line0 = lines?.[0]
  const line1 = lines?.[1]
  const lineWithEqual = lines?.find((l) => l.en?.toLowerCase().includes('equal'))
  const demoLine = lineWithEqual || line1 || line0

  useEffect(() => {
    if (moment === 1) {
      setTapAnim(true)
      const t1 = setTimeout(() => setTapAnim(false), 120)
      const t2 = setTimeout(() => setHighlightSecond(true), 400)
      const t3 = setTimeout(() => setShowMoment1Label(true), 900)
      const t4 = setTimeout(() => setMoment(2), 2400)
      return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4) }
    }
    if (moment === 2) {
      const t1 = setTimeout(() => setShowMoment2Toast(true), 500)
      const t2 = setTimeout(() => setShowReady(true), 2800)
      return () => { clearTimeout(t1); clearTimeout(t2) }
    }
  }, [moment])

  const handleReady = () => {
    setOnboardingDone()
    onComplete()
  }

  if (!line0) return null

  return (
    <div className="onboarding-overlay">
      <div className="onboarding-content">
        {moment === 1 && (
          <div className="onboarding-demo">
            <div className={`onboarding-demo-line ${highlightSecond ? 'onboarding-demo-line--past' : 'onboarding-demo-line--current'} ${tapAnim ? 'onboarding-demo-line--tap' : ''}`}>
              <div className="onboarding-demo-en">{line0.en}</div>
              <div className="onboarding-demo-ur">{line0.ur}</div>
            </div>
            <div className={`onboarding-demo-line ${highlightSecond ? 'onboarding-demo-line--current' : 'onboarding-demo-line--past'}`}>
              <div className="onboarding-demo-en">{line1?.en}</div>
              <div className="onboarding-demo-ur">{line1?.ur}</div>
            </div>
            {!highlightSecond && (
              <div className="onboarding-hand-wrap onboarding-hand-wrap--line1">
                <HandIcon />
              </div>
            )}
            {showMoment1Label && <span className="onboarding-label">Tap any line to move forward</span>}
          </div>
        )}

        {moment === 2 && !showReady && (
          <div className="onboarding-demo">
            <div className="onboarding-demo-line onboarding-demo-line--past">
              <div className="onboarding-demo-en">{line0.en}</div>
              <div className="onboarding-demo-ur">{line0.ur}</div>
            </div>
            <div className="onboarding-demo-line onboarding-demo-line--current onboarding-demo-line--word-demo">
              <div className="onboarding-demo-en">
                {demoLine?.en?.split(/\b(equal)\b/i).map((part, i) =>
                  part.toLowerCase() === 'equal' ? (
                    <span key={i} className="onboarding-demo-word-equal">
                      <span className="onboarding-hand-wrap onboarding-hand-wrap--word">
                        <HandIcon />
                      </span>
                      {part}
                    </span>
                  ) : (
                    part
                  )
                )}
              </div>
              <div className="onboarding-demo-ur">{demoLine?.ur}</div>
            </div>
            <span className="onboarding-label">Double-tap any word to save it</span>
            {showMoment2Toast && (
              <div className="onboarding-toast-demo">"equal" added to your Word Bank ✓</div>
            )}
          </div>
        )}

        {showReady && (
          <div className="onboarding-actions">
            <button type="button" className="onboarding-btn" onClick={handleReady}>
              I'm ready — let's read →
            </button>
            <button type="button" className="onboarding-skip" onClick={handleReady}>
              Skip intro
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
