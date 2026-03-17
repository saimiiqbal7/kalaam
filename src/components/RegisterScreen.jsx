import { useState } from 'react'
import { registerUser } from '../lib/userService'
import './RegisterScreen.css'

export default function RegisterScreen({ onComplete }) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [shakeName, setShakeName] = useState(false)
  const [shakePhone, setShakePhone] = useState(false)
  const [toast, setToast] = useState('')

  const validate = () => {
    const cleanPhone = phone.replace(/[\s\-+]/g, '').replace(/^92/, '').replace(/^0+/, '')
    let ok = true
    if (name.trim().length < 2) {
      ok = false
      setShakeName(true)
      setTimeout(() => setShakeName(false), 500)
    }
    if (cleanPhone.length < 10) {
      ok = false
      setShakePhone(true)
      setTimeout(() => setShakePhone(false), 500)
    }
    return ok
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!validate()) return
    setLoading(true)
    try {
      const user = await registerUser(name.trim(), phone.trim())
      setToast(`Shukriya ${user.name}! Chalo parhtay hain.`)
      setTimeout(() => onComplete(), 2500)
    } catch (err) {
      setError('Kuch masla ho gaya, dobara try karein')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="register-screen paper-texture">
      {toast && <div className="register-toast">{toast}</div>}
      <form className="register-card" onSubmit={handleSubmit}>
        <h1 className="register-title"><span>Kalaam</span> <span className="register-title-urdu">کلام</span></h1>
        <p className="register-subtitle">Apka naam aur number</p>
        <p className="register-subtitle register-subtitle--second">Kalaam mein khush aamdeed!</p>
        <input
          className={`register-input ${shakeName ? 'register-input--shake' : ''}`}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Aapka naam"
          autoComplete="name"
        />
        <input
          className={`register-input ${shakePhone ? 'register-input--shake' : ''}`}
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="03xx-xxxxxxx"
          type="tel"
          autoComplete="tel"
        />
        {error && <div className="register-error">{error}</div>}
        <button type="submit" className="register-btn" disabled={loading}>
          {loading ? 'Saving...' : 'Start Reading →'}
        </button>
        <p className="register-note">Sirf naam aur number chahiye.</p>
        <p className="register-note">Koi verification nahi hogi.</p>
      </form>
    </div>
  )
}
