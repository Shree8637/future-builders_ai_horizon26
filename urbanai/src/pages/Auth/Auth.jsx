import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import './Auth.css'

// ── OTP via Fast2SMS (CORS-safe via allorigins proxy) ─────
const FAST2SMS_API_KEY = 'G0U3rJtzc4X8fxdkhSawBOq7FlM6IZ9RTQLAes2DnpECNivPgyQ32xzEtDbkaTcuNM6KFVSy1BgAYU0Z'

async function sendSmsOtp(phoneNumber, otp) {
  const phone10 = phoneNumber.replace(/^\+91/, '').replace(/\D/g, '').slice(-10)
  const msg = `Your UrbanAI OTP is ${otp}. Valid for 10 minutes. Do not share it.`
  const fast2smsUrl = `https://www.fast2sms.com/dev/bulkV2?authorization=${FAST2SMS_API_KEY}&route=q&message=${encodeURIComponent(msg)}&flash=0&numbers=${phone10}`
  // allorigins.win proxies the request server-side, bypassing CORS
  const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(fast2smsUrl)}`
  const res = await fetch(proxyUrl)
  if (!res.ok) throw new Error('Network error reaching SMS proxy')
  const wrapper = await res.json()
  const data = JSON.parse(wrapper.contents)
  if (!data.return) throw new Error(data.message?.[0] || 'SMS send failed')
  return true
}

// ── In-memory OTP store ────────────────────────────────────
// { phone: { otp, expiry } }
const otpStore = {}

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000))
}

const STEPS_GOOGLE = ['signin', 'profile']
const STEPS_PHONE  = ['signin', 'otp', 'profile']

export default function Auth() {
  const navigate = useNavigate()
  const { loginGoogle, updateUserProfile, user, setPhoneUser } = useAuth()

  const [method, setMethod] = useState(null)
  const [step, setStep]     = useState('signin')

  const [phone, setPhone]   = useState('')
  const [otp, setOtp]       = useState(['', '', '', '', '', ''])
  const otpRefs             = useRef([])

  const [firstName, setFirst] = useState('')
  const [lastName,  setLast]  = useState('')
  const [dob,       setDob]   = useState('')

  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const [timer,   setTimer]   = useState(0)
  const timerRef              = useRef(null)

  // If fully signed in with name → home
  useEffect(() => {
    if (user && user.displayName) {
      navigate('/', { replace: true })
    }
    if (user && !user.displayName && step === 'signin') {
      setStep('profile')
    }
  }, [user])

  const startTimer = () => {
    clearInterval(timerRef.current)
    setTimer(60)
    timerRef.current = setInterval(() => {
      setTimer(t => {
        if (t <= 1) { clearInterval(timerRef.current); return 0 }
        return t - 1
      })
    }, 1000)
  }

  const clearErr = () => setError('')

  // ── Google sign-in ────────────────────────────────────────
  const handleGoogle = async () => {
    clearErr()
    setLoading(true)
    try {
      const result = await loginGoogle()
      setMethod('google')
      if (result.user?.displayName) {
        navigate('/', { replace: true })
      } else {
        setStep('profile')
      }
    } catch (e) {
      if (e.code === 'auth/popup-closed-by-user') {
        setError('Sign-in popup was closed. Please try again.')
      } else {
        setError('Google sign-in failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  // ── Send OTP (custom SMS) ─────────────────────────────────
  const handleSendOtp = async () => {
    clearErr()
    const cleaned = phone.replace(/\s|-/g, '')
    // Accept +91XXXXXXXXXX or 10-digit
    const phone10 = cleaned.replace(/^\+91/, '').replace(/\D/g, '')
    if (phone10.length !== 10) {
      return setError('Enter a valid 10-digit Indian mobile number.')
    }
    setLoading(true)
    try {
      const code = generateOtp()
      // Store OTP with 10-min expiry
      otpStore[phone10] = { otp: code, expiry: Date.now() + 10 * 60 * 1000 }

      await sendSmsOtp(phone10, code)

      setMethod('phone')
      setStep('otp')
      startTimer()
    } catch (e) {
      setError('Failed to send OTP: ' + (e.message || 'Please try again.'))
    } finally {
      setLoading(false)
    }
  }

  // ── OTP input helpers ─────────────────────────────────────
  const handleOtpChange = (val, idx) => {
    if (!/^\d?$/.test(val)) return
    const next = [...otp]
    next[idx] = val
    setOtp(next)
    if (val && idx < 5) otpRefs.current[idx + 1]?.focus()
  }

  const handleOtpKey = (e, idx) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0)
      otpRefs.current[idx - 1]?.focus()
  }

  const handleOtpPaste = (e) => {
    e.preventDefault()
    const paste = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (paste.length > 0) {
      const next = ['', '', '', '', '', '']
      paste.split('').forEach((d, i) => { if (i < 6) next[i] = d })
      setOtp(next)
      otpRefs.current[Math.min(paste.length, 5)]?.focus()
    }
  }

  // ── Verify OTP ────────────────────────────────────────────
  const handleVerifyOtp = async () => {
    clearErr()
    const code = otp.join('')
    if (code.length < 6) return setError('Enter all 6 digits of the OTP.')

    const phone10 = phone.replace(/^\+91/, '').replace(/\D/g, '')
    const record  = otpStore[phone10]

    if (!record) return setError('No OTP found. Please resend.')
    if (Date.now() > record.expiry) {
      delete otpStore[phone10]
      return setError('OTP has expired. Please request a new one.')
    }
    if (code !== record.otp) {
      setOtp(['', '', '', '', '', ''])
      setTimeout(() => otpRefs.current[0]?.focus(), 50)
      return setError('Incorrect OTP. Please check and try again.')
    }

    // OTP correct → clean up and go to profile
    delete otpStore[phone10]
    setLoading(true)
    try {
      await setPhoneUser(phone)   // sets a phone session in AuthContext
      setStep('profile')
    } catch (e) {
      setError('Verification failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // ── Save profile ──────────────────────────────────────────
  const handleProfile = async () => {
    clearErr()
    if (!firstName.trim()) return setError('Please enter your first name.')
    if (!lastName.trim())  return setError('Please enter your last name.')
    if (!dob)              return setError('Please enter your date of birth.')
    const age = new Date().getFullYear() - new Date(dob).getFullYear()
    if (age < 5 || age > 120) return setError('Please enter a valid date of birth.')
    setLoading(true)
    try {
      await updateUserProfile(`${firstName.trim()} ${lastName.trim()}`, dob)
      navigate('/', { replace: true })
    } catch (e) {
      setError('Failed to save profile. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const steps   = method === 'phone' ? STEPS_PHONE : STEPS_GOOGLE
  const stepIdx = steps.indexOf(step)

  // ── Render: Sign In ───────────────────────────────────────
  const renderSignIn = () => (
    <div className="auth-body">
      <p className="auth-body__lead">Choose how you want to access UrbanAI</p>

      <button className="auth-provider-btn" onClick={handleGoogle} disabled={loading}>
        <svg width="20" height="20" viewBox="0 0 18 18" style={{flexShrink:0}}>
          <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
          <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
          <path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.55 0 9s.348 2.825.957 4.039l3.007-2.332z"/>
          <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z"/>
        </svg>
        Continue with Google
        <span className="auth-provider-btn__arrow">→</span>
      </button>

      <div className="auth-divider"><span>or use phone number</span></div>

      <div className="auth-phone-row">
        <div className="auth-field">
          <label className="auth-field__label">Phone Number</label>
          <div className="auth-phone-input-wrap">
            <span className="auth-phone-flag">🇮🇳 +91</span>
            <input
              className="auth-field__input auth-field__input--phone"
              type="tel"
              placeholder="98765 43210"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !loading && handleSendOtp()}
              autoComplete="tel"
              maxLength={15}
            />
          </div>
        </div>
        <button
          className="auth-send-otp-btn"
          onClick={handleSendOtp}
          disabled={loading || !phone.trim()}
        >
          {loading ? <span className="auth-spinner" /> : 'Send OTP'}
        </button>
      </div>

      <div className="auth-sms-info">
        <span className="auth-sms-info__icon">💬</span>
        <span>OTP will be sent as SMS to your mobile number</span>
      </div>
    </div>
  )

  // ── Render: OTP ───────────────────────────────────────────
  const renderOtp = () => (
    <div className="auth-body">
      <div className="auth-otp-info">
        <span className="auth-otp-info__icon">📱</span>
        <p>OTP sent to <strong>+91 {phone.replace(/^\+91/, '').replace(/\D/g,'')}</strong></p>
        <p className="auth-otp-info__sub">Enter the 6-digit code sent to your phone</p>
      </div>

      <div className="auth-otp-boxes" onPaste={handleOtpPaste}>
        {otp.map((digit, i) => (
          <input
            key={i}
            ref={el => otpRefs.current[i] = el}
            className={`auth-otp-box ${digit ? 'filled' : ''}`}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={e => handleOtpChange(e.target.value, i)}
            onKeyDown={e => handleOtpKey(e, i)}
          />
        ))}
      </div>

      <button
        className="auth-submit"
        onClick={handleVerifyOtp}
        disabled={loading || otp.join('').length < 6}
      >
        {loading ? <span className="auth-spinner" /> : 'Verify OTP →'}
      </button>

      <div className="auth-resend">
        {timer > 0 ? (
          <span>Resend OTP in <strong>{timer}s</strong></span>
        ) : (
          <button onClick={() => { setOtp(['','','','','','']); clearErr(); handleSendOtp() }}>
            Resend OTP
          </button>
        )}
      </div>

      <button className="auth-back" onClick={() => { setStep('signin'); clearErr(); setOtp(['','','','','','']) }}>
        ← Change number
      </button>
    </div>
  )

  // ── Render: Profile ───────────────────────────────────────
  const renderProfile = () => (
    <div className="auth-body">
      <div className="auth-profile-icon">👤</div>
      <p className="auth-body__lead">Almost there! Tell us about yourself</p>

      <div className="auth-form">
        <div className="auth-form__row">
          <div className="auth-field">
            <label className="auth-field__label">First Name</label>
            <input
              className="auth-field__input"
              type="text"
              placeholder="Aryan"
              value={firstName}
              onChange={e => setFirst(e.target.value)}
              autoFocus
            />
          </div>
          <div className="auth-field">
            <label className="auth-field__label">Last Name</label>
            <input
              className="auth-field__input"
              type="text"
              placeholder="Mehta"
              value={lastName}
              onChange={e => setLast(e.target.value)}
            />
          </div>
        </div>

        <div className="auth-field">
          <label className="auth-field__label">Date of Birth</label>
          <input
            className="auth-field__input auth-field__input--dob"
            type="date"
            value={dob}
            max={new Date().toISOString().split('T')[0]}
            onChange={e => setDob(e.target.value)}
          />
        </div>

        <button className="auth-submit" onClick={handleProfile} disabled={loading}>
          {loading ? <span className="auth-spinner" /> : 'Enter UrbanAI →'}
        </button>
      </div>
    </div>
  )

  return (
    <div className="auth-page">
      <div className="auth-bg">
        <div className="auth-bg__orb auth-bg__orb--1" />
        <div className="auth-bg__orb auth-bg__orb--2" />
        <div className="auth-bg__orb auth-bg__orb--3" />
        <div className="auth-bg__grid" />
      </div>

      <div className="auth-container">
        <div className="auth-logo" onClick={() => navigate('/')}>
          <div className="auth-logo__icon">🏙</div>
          <span className="auth-logo__text">URBAN<span>AI</span></span>
        </div>

        <div className="auth-card">
          <div className="auth-card__accent" />

          <div className="auth-card__header">
            <h1 className="auth-card__title">
              {step === 'signin'  && 'SIGN IN'}
              {step === 'otp'     && 'VERIFY OTP'}
              {step === 'profile' && 'YOUR PROFILE'}
            </h1>
            <p className="auth-card__subtitle">
              {step === 'signin'  && 'Access your personalized Mumbai navigation system'}
              {step === 'otp'     && 'Enter the code sent to your phone'}
              {step === 'profile' && 'Just a few details to personalize your experience'}
            </p>
          </div>

          {method && (
            <div className="auth-steps">
              {steps.map((s, i) => (
                <div
                  key={s}
                  className={`auth-step-dot ${i <= stepIdx ? 'active' : ''} ${i < stepIdx ? 'done' : ''}`}
                />
              ))}
            </div>
          )}

          {error && (
            <div className="auth-error">
              <span>⚠</span>
              <span>{error}</span>
            </div>
          )}

          <div className="auth-step-content">
            {step === 'signin'  && renderSignIn()}
            {step === 'otp'     && renderOtp()}
            {step === 'profile' && renderProfile()}
          </div>
        </div>

        <p className="auth-footer">Secure · Fast · Mumbai-built</p>
      </div>
    </div>
  )
}
