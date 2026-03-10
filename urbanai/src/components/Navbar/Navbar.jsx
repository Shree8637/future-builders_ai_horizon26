import { useState, useEffect } from 'react'
import { NavLink, Link, useNavigate } from 'react-router-dom'
import './Navbar.css'

const NAV_ITEMS = [
  { label: 'Home', path: '/' },
  { label: 'Features', path: '/features' },
  { label: 'How It Works', path: '/how-it-works' },
  { label: 'Dashboard', path: '/dashboard' },
  { label: 'AI Model', path: '/model' },
  { label: 'About', path: '/about' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
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
          <div className="navbar__model-badge">MODEL LIVE</div>
          <button className="btn-primary" onClick={() => navigate('/model')}>
            Try AI Model →
          </button>
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
        <button className="btn-primary" onClick={() => { navigate('/model'); setMenuOpen(false) }}>
          Try AI Model →
        </button>
      </div>
    </>
  )
}
