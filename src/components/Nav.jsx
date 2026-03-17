import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import './Nav.css'

export default function Nav() {
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()

  const closeMenu = () => setMenuOpen(false)

  return (
    <>
      <nav className="nav">
        <Link to="/" className="nav-logo" onClick={closeMenu}>
          <span className="nav-logo-en">Kalaam</span>
          <span className="nav-logo-urdu">کلام</span>
        </Link>
        <div className="nav-desktop">
          <Link to="/library" className={`nav-link ${location.pathname === '/library' ? 'nav-link--active' : ''}`}>Library</Link>
          <Link to="/words" className={`nav-link ${location.pathname === '/words' ? 'nav-link--active' : ''}`}>Word Library</Link>
          <Link to="/library" className="nav-btn nav-btn--primary">Start Reading →</Link>
        </div>
        <button
          type="button"
          className="nav-hamburger"
          onClick={() => setMenuOpen((o) => !o)}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
        >
          <span className="nav-hamburger-bar" />
          <span className="nav-hamburger-bar" />
          <span className="nav-hamburger-bar" />
        </button>
      </nav>

      <div className={`nav-menu ${menuOpen ? 'nav-menu--open' : ''}`} aria-hidden={!menuOpen}>
        <div className="nav-menu-backdrop" onClick={closeMenu} />
        <div className="nav-menu-panel">
          <Link to="/library" className="nav-menu-link" onClick={closeMenu}>Library</Link>
          <Link to="/words" className="nav-menu-link" onClick={closeMenu}>Word Library</Link>
          <Link to="/library" className="nav-menu-btn nav-btn nav-btn--primary" onClick={closeMenu}>Start Reading →</Link>
        </div>
      </div>
    </>
  )
}
