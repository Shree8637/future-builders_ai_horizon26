import { useState, useEffect, useRef } from 'react'
import { NavLink, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import { useTheme } from '../../context/ThemeContext.jsx'
import './Navbar.css'

const NAV_ITEMS = [
  { label: 'Home',      path: '/' },
  { label: 'Features',  path: '/features' },
  { label: 'Dashboard', path: '/dashboard' },
  { label: 'AI Model',  path: '/model' },
  { label: 'About',     path: '/about' },
]

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <button
      className="theme-toggle"
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Light mode' : 'Dark mode'}
    >
      <span className="theme-toggle__track">
        <span className="theme-toggle__thumb">
          {isDark ? (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
            </svg>
          ) : (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <circle cx="12" cy="12" r="4"/>
              <line x1="12" y1="2"  x2="12" y2="5"/>
              <line x1="12" y1="19" x2="12" y2="22"/>
              <line x1="4.22" y1="4.22" x2="6.34" y2="6.34"/>
              <line x1="17.66" y1="17.66" x2="19.78" y2="19.78"/>
              <line x1="2"  y1="12" x2="5"  y2="12"/>
              <line x1="19" y1="12" x2="22" y2="12"/>
              <line x1="4.22" y1="19.78" x2="6.34" y2="17.66"/>
              <line x1="17.66" y1="6.34" x2="19.78" y2="4.22"/>
            </svg>
          )}
        </span>
      </span>
    </button>
  )
}

/* ── Avatar: photo → initials fallback ───────────────────── */
function Avatar({ user, size = 28 }) {
  const [imgError, setImgError] = useState(false)

  const initials = user.displayName
    ? user.displayName.trim().split(/\s+/).map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : user.email
      ? user.email[0].toUpperCase()
      : 'U'

  if (user.photoURL && !imgError) {
    return (
      <img
        src={user.photoURL}
        alt={user.displayName || 'avatar'}
        className="user-menu__avatar-img"
        width={size}
        height={size}
        referrerPolicy="no-referrer"
        onError={() => setImgError(true)}
        style={{ width: size, height: size }}
      />
    )
  }

  return (
    <div className="user-menu__avatar" style={{ width: size, height: size, fontSize: size * 0.4 }}>
      {initials}
    </div>
  )
}

/* ── User dropdown menu ───────────────────────────────────── */
function UserMenu({ user, logout }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const fn = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [])

  const displayFirst = user.displayName
    ? user.displayName.trim().split(/\s+/)[0]
    : 'Account'

  return (
    <div className="user-menu" ref={ref}>
      <button className="user-menu__trigger" onClick={() => setOpen(!open)}>
        <Avatar user={user} size={28} />
        <span className="user-menu__name">{displayFirst}</span>
        <span className={`user-menu__chevron ${open ? 'open' : ''}`}>▾</span>
      </button>

      {open && (
        <div className="user-menu__dropdown">
          <div className="user-menu__dropdown-header">
            <div className="user-menu__dropdown-avatar-row">
              <Avatar user={user} size={40} />
              <div>
                <div className="user-menu__dropdown-name">
                  {user.displayName || 'User'}
                </div>
                <div className="user-menu__dropdown-email">
                  {user.email || user.phoneNumber || ''}
                </div>
              </div>
            </div>
          </div>
          <div className="user-menu__dropdown-divider" />
          <button
            className="user-menu__dropdown-item"
            onClick={() => { logout(); setOpen(false) }}
          >
            <span>🚪</span> Sign Out
          </button>
        </div>
      )}
    </div>
  )
}

/* ── Navbar ───────────────────────────────────────────────── */
export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 32)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])

  return (
    <>
      <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
        <Link to="/" className="navbar__logo">
          <div className="navbar__logo-icon">🏙</div>
          <span className="navbar__logo-text">URBAN<span>AI</span></span>
        </Link>

        <ul className="navbar__links">
          {NAV_ITEMS.map(item => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) => `navbar__link ${isActive ? 'active' : ''}`}
              >
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>

        <div className="navbar__cta">
          {/* <div className="navbar__model-badge">MODEL LIVE</div> */}
          <div className="navbar__model-badge" onClick={() => navigate('/model')} style={{ cursor: 'pointer' }}>MODEL LIVE</div>
          <ThemeToggle />
          {user ? (
            <UserMenu user={user} logout={logout} />
          ) : (
            <button className="btn-primary" onClick={() => navigate('/auth')}>
              Sign In →
            </button>
          )}
        </div>

        <button
          className={`navbar__toggle ${menuOpen ? 'open' : ''}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <span /><span /><span />
        </button>
      </nav>

      {/* Mobile menu */}
      <div className={`navbar__mobile-menu ${menuOpen ? 'open' : ''}`}>
        {NAV_ITEMS.map((item, i) => (
          <NavLink
            key={item.path}
            to={item.path}
            className="navbar__mobile-link"
            onClick={() => setMenuOpen(false)}
            style={{ animationDelay: `${i * 60}ms` }}
          >
            {item.label}
          </NavLink>
        ))}
        <ThemeToggle />
        {user ? (
          <button className="btn-ghost" onClick={() => { logout(); setMenuOpen(false) }}>
            Sign Out
          </button>
        ) : (
          <button className="btn-primary" onClick={() => { navigate('/auth'); setMenuOpen(false) }}>
            Sign In →
          </button>
        )}
      </div>
    </>
  )
}