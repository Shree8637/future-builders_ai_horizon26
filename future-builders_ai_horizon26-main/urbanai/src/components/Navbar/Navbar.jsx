import { useState, useEffect, useRef } from 'react'
import { NavLink, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import './Navbar.css'

const NAV_ITEMS = [
  { label: 'Home',         path: '/' },
  { label: 'Features',     path: '/features' },
  { label: 'How It Works', path: '/how-it-works' },
  { label: 'Dashboard',    path: '/dashboard' },
  { label: 'AI Model',     path: '/model' },
  { label: 'About',        path: '/about' },
]

function UserMenu({ user, logout }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const fn = e => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [])

  const initials = user.displayName
    ? user.displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : (user.email ? user.email[0].toUpperCase() : 'U')

  return (
    <div className="user-menu" ref={ref}>
      <button className="user-menu__trigger" onClick={() => setOpen(!open)}>
        {user.photoURL
          ? <img src={user.photoURL} alt="avatar" className="user-menu__avatar-img" />
          : <div className="user-menu__avatar">{initials}</div>
        }
        <span className="user-menu__name">
          {user.displayName ? user.displayName.split(' ')[0] : 'Account'}
        </span>
        <span className={`user-menu__chevron ${open ? 'open' : ''}`}>▾</span>
      </button>

      {open && (
        <div className="user-menu__dropdown">
          <div className="user-menu__dropdown-header">
            <div className="user-menu__dropdown-name">{user.displayName || 'User'}</div>
            <div className="user-menu__dropdown-email">{user.email || user.phoneNumber}</div>
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

export default function Navbar() {
  const [scrolled,  setScrolled]  = useState(false)
  const [menuOpen,  setMenuOpen]  = useState(false)
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

        {/* Logo */}
        <Link to="/" className="navbar__logo">
          <div className="navbar__logo-icon">🏙</div>
          <span className="navbar__logo-text">URBAN<span>AI</span></span>
        </Link>

        {/* Desktop Links */}
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

        {/* CTA */}
        <div className="navbar__cta">
          <div className="navbar__model-badge">MODEL LIVE</div>
          {user
            ? <UserMenu user={user} logout={logout} />
            : <button className="btn-primary" onClick={() => navigate('/auth')}>Sign In →</button>
          }
        </div>

        {/* Hamburger */}
        <button
          className={`navbar__toggle ${menuOpen ? 'open' : ''}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <span /><span /><span />
        </button>
      </nav>

      {/* Mobile Menu */}
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
        {user
          ? <button className="btn-ghost" onClick={() => { logout(); setMenuOpen(false) }}>
              Sign Out
            </button>
          : <button className="btn-primary" onClick={() => { navigate('/auth'); setMenuOpen(false) }}>
              Sign In →
            </button>
        }
      </div>
    </>
  )
}