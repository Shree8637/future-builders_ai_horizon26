import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import { useTheme } from '../../context/ThemeContext.jsx'
import './Auth.css'

/* ── Theme toggle ─────────────────────────────────────────── */
function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'
  return (
    <button
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      style={{
        position: 'fixed', top: 20, right: 24, zIndex: 100,
        background: 'var(--bg-card)', border: '1px solid var(--border-medium)',
        borderRadius: '9999px', padding: '8px 14px',
        display: 'flex', alignItems: 'center', gap: 8,
        cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: 11,
        color: 'var(--text-secondary)', letterSpacing: '0.08em',
        transition: 'all 0.25s ease', boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
      }}
    >
      {isDark ? (
        <>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="var(--accent-cyan)">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
          </svg>
          LIGHT
        </>
      ) : (
        <>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--accent-cyan)" strokeWidth="2.5" strokeLinecap="round">
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
          DARK
        </>
      )}
    </button>
  )
}

export default function Auth() {
  const navigate = useNavigate()
  const { loginGoogle, updateUserProfile, user } = useAuth()

  const [step,      setStep]  = useState('signin')
  const [method,    setMethod] = useState(null)
  const [firstName, setFirst]  = useState('')
  const [lastName,  setLast]   = useState('')
  const [dob,       setDob]    = useState('')
  const [loading,   setLoad]   = useState(false)
  const [error,     setError]  = useState('')

  useEffect(() => {
    if (user && user.displayName) navigate('/', { replace: true })
    if (user && !user.displayName && step === 'signin') setStep('profile')
  }, [user])

  const clrErr = () => setError('')

  // ── Google ────────────────────────────────────────────────
  const onGoogle = async () => {
    clrErr(); setLoad(true)
    try {
      const r = await loginGoogle()
      setMethod('google')
      if (r.user?.displayName) navigate('/', { replace: true })
      else setStep('profile')
    } catch (e) {
      setError(e.code === 'auth/popup-closed-by-user' ? 'Popup closed. Try again.' : 'Google sign-in failed.')
    } finally { setLoad(false) }
  }

  // ── Profile ───────────────────────────────────────────────
  const onProfile = async () => {
    clrErr()
    if (!firstName.trim()) return setError('Enter your first name.')
    if (!lastName.trim())  return setError('Enter your last name.')
    if (!dob)              return setError('Enter your date of birth.')
    const age = new Date().getFullYear() - new Date(dob).getFullYear()
    if (age < 5 || age > 120) return setError('Enter a valid date of birth.')
    setLoad(true)
    try {
      await updateUserProfile(`${firstName.trim()} ${lastName.trim()}`, dob)
      navigate('/', { replace: true })
    } catch (e) { setError('Failed to save profile.') }
    finally { setLoad(false) }
  }

  const steps   = ['signin', 'profile']
  const stepIdx = steps.indexOf(step)

  return (
    <div className="auth-page">
      <ThemeToggle />

      <div className="auth-bg">
        <div className="auth-bg__orb auth-bg__orb--1"/>
        <div className="auth-bg__orb auth-bg__orb--2"/>
        <div className="auth-bg__orb auth-bg__orb--3"/>
        <div className="auth-bg__grid"/>
      </div>

      <div className="auth-container">
        <div className="auth-logo" onClick={() => navigate('/')}>
          <div className="auth-logo__icon">🏙</div>
          <span className="auth-logo__text">URBAN<span>AI</span></span>
        </div>

        <div className="auth-card">
          <div className="auth-card__accent"/>
          <div className="auth-card__header">
            <h1 className="auth-card__title">
              {step === 'signin'  && 'SIGN IN'}
              {step === 'profile' && 'YOUR PROFILE'}
            </h1>
            <p className="auth-card__subtitle">
              {step === 'signin'  && 'Access your personalized Mumbai navigation system'}
              {step === 'profile' && 'A few details to personalize your experience'}
            </p>
          </div>

          {method && (
            <div className="auth-steps">
              {steps.map((s, i) => (
                <div key={s} className={`auth-step-dot${i <= stepIdx ? ' active' : ''}${i < stepIdx ? ' done' : ''}`}/>
              ))}
            </div>
          )}

          {error && (
            <div className="auth-error">
              <span>⚠</span><span>{error}</span>
            </div>
          )}

          <div className="auth-step-content">

            {/* ── SIGN IN ── */}
            {step === 'signin' && (
              <div className="auth-body">
                <p className="auth-body__lead">Sign in to access UrbanAI</p>

                <button className="auth-provider-btn" onClick={onGoogle} disabled={loading}>
                  <svg width="20" height="20" viewBox="0 0 18 18" style={{flexShrink:0}}>
                    <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
                    <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
                    <path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.55 0 9s.348 2.825.957 4.039l3.007-2.332z"/>
                    <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z"/>
                  </svg>
                  Continue with Google
                  <span className="auth-provider-btn__arrow">→</span>
                </button>

                <div className="auth-sms-info" style={{ marginTop: 24 }}>
                  <span className="auth-sms-info__icon">🔒</span>
                  <span>Secure sign-in powered by Google</span>
                </div>
              </div>
            )}

            {/* ── PROFILE ── */}
            {step === 'profile' && (
              <div className="auth-body">
                <div className="auth-profile-icon">👤</div>
                <p className="auth-body__lead">Almost there! Tell us about yourself</p>
                <div className="auth-form">
                  <div className="auth-form__row">
                    <div className="auth-field">
                      <label className="auth-field__label">First Name</label>
                      <input className="auth-field__input" type="text" placeholder="Aryan"
                        value={firstName} onChange={e => setFirst(e.target.value)} autoFocus/>
                    </div>
                    <div className="auth-field">
                      <label className="auth-field__label">Last Name</label>
                      <input className="auth-field__input" type="text" placeholder="Mehta"
                        value={lastName} onChange={e => setLast(e.target.value)}/>
                    </div>
                  </div>
                  <div className="auth-field">
                    <label className="auth-field__label">Date of Birth</label>
                    <input className="auth-field__input auth-field__input--dob" type="date"
                      value={dob} max={new Date().toISOString().split('T')[0]}
                      onChange={e => setDob(e.target.value)}/>
                  </div>
                  <button className="auth-submit" onClick={onProfile} disabled={loading}>
                    {loading ? <span className="auth-spinner"/> : 'Enter UrbanAI →'}
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
        <p className="auth-footer">Secure · Fast · Mumbai-built</p>
      </div>
    </div>
  )
}