import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import './Auth.css'

const otpStore = {}
const genOtp = () => String(Math.floor(100000 + Math.random() * 900000))

async function sendSmsOtp(phone10, otp) {
  const msg = `Your UrbanAI OTP is ${otp}. Valid 10 minutes. Do not share.`
  const smsUrl = `https://www.fast2sms.com/dev/bulkV2?authorization=G0U3rJtzc4X8fxdkhSawBOq7FlM6IZ9RTQLAes2DnpECNivPgyQ32xzEtDbkaTcuNM6KFVSy1BgAYU0Z&route=q&message=${encodeURIComponent(msg)}&flash=0&numbers=${phone10}`
  const res = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(smsUrl)}`)
  if (!res.ok) throw new Error('Network error')
  const data = JSON.parse((await res.json()).contents)
  if (!data.return) throw new Error(data.message?.[0] || 'SMS failed')
}

export default function Auth() {
  const navigate = useNavigate()
  const { loginGoogle, updateUserProfile, user, setPhoneUser } = useAuth()

  const [step,   setStep]   = useState('signin')
  const [method, setMethod] = useState(null)
  const [phone,  setPhone]  = useState('')
  const [otp,    setOtp]    = useState(['','','','','',''])
  const otpRefs             = useRef([])
  const [firstName, setFirst] = useState('')
  const [lastName,  setLast]  = useState('')
  const [dob,       setDob]   = useState('')
  const [loading,   setLoad]  = useState(false)
  const [error,     setError] = useState('')
  const [timer,     setTimer] = useState(0)
  const timerRef = useRef(null)

  useEffect(() => {
    if (user && user.displayName) navigate('/', { replace: true })
    if (user && !user.displayName && step === 'signin') setStep('profile')
  }, [user])

  const tick = () => {
    clearInterval(timerRef.current); setTimer(60)
    timerRef.current = setInterval(() =>
      setTimer(t => { if (t<=1){ clearInterval(timerRef.current); return 0 } return t-1 }), 1000)
  }

  const clrErr = () => setError('')

  // Google
  const onGoogle = async () => {
    clrErr(); setLoad(true)
    try {
      const r = await loginGoogle()
      setMethod('google')
      if (r.user?.displayName) navigate('/', { replace: true })
      else setStep('profile')
    } catch(e) {
      setError(e.code==='auth/popup-closed-by-user' ? 'Popup closed. Try again.' : 'Google sign-in failed.')
    } finally { setLoad(false) }
  }

  // Send OTP
  const onSendOtp = async () => {
    clrErr()
    const p10 = phone.replace(/\D/g,'').slice(-10)
    if (p10.length!==10) return setError('Enter a valid 10-digit mobile number.')
    setLoad(true)
    try {
      const code = genOtp()
      otpStore[p10] = { otp: code, expiry: Date.now() + 600000 }
      await sendSmsOtp(p10, code)
      setMethod('phone'); setStep('otp'); tick()
      setTimeout(() => otpRefs.current[0]?.focus(), 150)
    } catch(e) { setError('Failed to send OTP: ' + (e.message||'Try again.')) }
    finally { setLoad(false) }
  }

  // OTP input
  const onOtpChange = (val, i) => {
    if (!/^\d?$/.test(val)) return
    const n=[...otp]; n[i]=val; setOtp(n)
    if (val && i<5) otpRefs.current[i+1]?.focus()
  }
  const onOtpKey = (e, i) => {
    if (e.key==='Backspace' && !otp[i] && i>0) otpRefs.current[i-1]?.focus()
  }
  const onPaste = e => {
    e.preventDefault()
    const p = e.clipboardData.getData('text').replace(/\D/g,'').slice(0,6)
    if (!p.length) return
    const n=['','','','','','']
    p.split('').forEach((d,i)=>{ if(i<6) n[i]=d })
    setOtp(n); otpRefs.current[Math.min(p.length,5)]?.focus()
  }

  // Verify OTP
  const onVerify = async () => {
    clrErr()
    const code = otp.join('')
    if (code.length<6) return setError('Enter all 6 digits.')
    const p10 = phone.replace(/\D/g,'').slice(-10)
    const rec  = otpStore[p10]
    if (!rec) return setError('No OTP found. Please resend.')
    if (Date.now()>rec.expiry) { delete otpStore[p10]; return setError('OTP expired. Resend.') }
    if (code!==rec.otp) {
      setOtp(['','','','','',''])
      setTimeout(()=>otpRefs.current[0]?.focus(),50)
      return setError('Incorrect OTP. Try again.')
    }
    delete otpStore[p10]; setLoad(true)
    try { setPhoneUser(phone); setStep('profile') }
    catch(e) { setError('Verification failed.') }
    finally { setLoad(false) }
  }

  // Profile
  const onProfile = async () => {
    clrErr()
    if (!firstName.trim()) return setError('Enter your first name.')
    if (!lastName.trim())  return setError('Enter your last name.')
    if (!dob)              return setError('Enter your date of birth.')
    const age = new Date().getFullYear() - new Date(dob).getFullYear()
    if (age<5||age>120) return setError('Enter a valid date of birth.')
    setLoad(true)
    try { await updateUserProfile(`${firstName.trim()} ${lastName.trim()}`, dob); navigate('/',{replace:true}) }
    catch(e) { setError('Failed to save profile.') }
    finally { setLoad(false) }
  }

  const steps   = method==='phone' ? ['signin','otp','profile'] : ['signin','profile']
  const stepIdx = steps.indexOf(step)

  return (
    <div className="auth-page">
      <div className="auth-bg">
        <div className="auth-bg__orb auth-bg__orb--1"/><div className="auth-bg__orb auth-bg__orb--2"/>
        <div className="auth-bg__orb auth-bg__orb--3"/><div className="auth-bg__grid"/>
      </div>
      <div className="auth-container">
        <div className="auth-logo" onClick={()=>navigate('/')}>
          <div className="auth-logo__icon">🏙</div>
          <span className="auth-logo__text">URBAN<span>AI</span></span>
        </div>
        <div className="auth-card">
          <div className="auth-card__accent"/>
          <div className="auth-card__header">
            <h1 className="auth-card__title">
              {step==='signin'&&'SIGN IN'}{step==='otp'&&'VERIFY OTP'}{step==='profile'&&'YOUR PROFILE'}
            </h1>
            <p className="auth-card__subtitle">
              {step==='signin' &&'Access your personalized Mumbai navigation system'}
              {step==='otp'    &&'Enter the 6-digit code sent to your phone'}
              {step==='profile'&&'A few details to personalize your experience'}
            </p>
          </div>

          {method && (
            <div className="auth-steps">
              {steps.map((s,i)=>(
                <div key={s} className={`auth-step-dot${i<=stepIdx?' active':''}${i<stepIdx?' done':''}`}/>
              ))}
            </div>
          )}

          {error && <div className="auth-error"><span>⚠</span><span>{error}</span></div>}

          <div className="auth-step-content">

            {/* ── SIGN IN ── */}
            {step==='signin' && (
              <div className="auth-body">
                <p className="auth-body__lead">Choose how you want to access UrbanAI</p>
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
                <div className="auth-divider"><span>or use phone number</span></div>
                <div className="auth-phone-row">
                  <div className="auth-field">
                    <label className="auth-field__label">Phone Number</label>
                    <div className="auth-phone-input-wrap">
                      <span className="auth-phone-flag">🇮🇳 +91</span>
                      <input className="auth-field__input auth-field__input--phone" type="tel"
                        placeholder="98765 43210" value={phone}
                        onChange={e=>setPhone(e.target.value)}
                        onKeyDown={e=>e.key==='Enter'&&!loading&&onSendOtp()}
                        autoComplete="tel" maxLength={15}/>
                    </div>
                  </div>
                  <button className="auth-send-otp-btn" onClick={onSendOtp} disabled={loading||!phone.trim()}>
                    {loading ? <span className="auth-spinner"/> : 'Send OTP'}
                  </button>
                </div>
                <div className="auth-sms-info">
                  <span className="auth-sms-info__icon">💬</span>
                  <span>OTP will be delivered as SMS to your number</span>
                </div>
              </div>
            )}

            {/* ── OTP ── */}
            {step==='otp' && (
              <div className="auth-body">
                <div className="auth-otp-info">
                  <span className="auth-otp-info__icon">📱</span>
                  <p>OTP sent to <strong>+91 {phone.replace(/^\+91/,'').replace(/\D/g,'')}</strong></p>
                  <p className="auth-otp-info__sub">Enter the 6-digit code below</p>
                </div>
                <div className="auth-otp-boxes" onPaste={onPaste}>
                  {otp.map((d,i)=>(
                    <input key={i} ref={el=>otpRefs.current[i]=el}
                      className={`auth-otp-box${d?' filled':''}`}
                      type="text" inputMode="numeric" maxLength={1} value={d}
                      onChange={e=>onOtpChange(e.target.value,i)}
                      onKeyDown={e=>onOtpKey(e,i)}/>
                  ))}
                </div>
                <button className="auth-submit" onClick={onVerify} disabled={loading||otp.join('').length<6}>
                  {loading?<span className="auth-spinner"/>:'Verify OTP →'}
                </button>
                <div className="auth-resend">
                  {timer>0 ? <span>Resend in <strong>{timer}s</strong></span>
                    : <button onClick={()=>{setOtp(['','','','','','']);clrErr();onSendOtp()}}>Resend OTP</button>}
                </div>
                <button className="auth-back" onClick={()=>{setStep('signin');clrErr();setOtp(['','','','','',''])}}>
                  ← Change number
                </button>
              </div>
            )}

            {/* ── PROFILE ── */}
            {step==='profile' && (
              <div className="auth-body">
                <div className="auth-profile-icon">👤</div>
                <p className="auth-body__lead">Almost there! Tell us about yourself</p>
                <div className="auth-form">
                  <div className="auth-form__row">
                    <div className="auth-field">
                      <label className="auth-field__label">First Name</label>
                      <input className="auth-field__input" type="text" placeholder="Aryan"
                        value={firstName} onChange={e=>setFirst(e.target.value)} autoFocus/>
                    </div>
                    <div className="auth-field">
                      <label className="auth-field__label">Last Name</label>
                      <input className="auth-field__input" type="text" placeholder="Mehta"
                        value={lastName} onChange={e=>setLast(e.target.value)}/>
                    </div>
                  </div>
                  <div className="auth-field">
                    <label className="auth-field__label">Date of Birth</label>
                    <input className="auth-field__input auth-field__input--dob" type="date"
                      value={dob} max={new Date().toISOString().split('T')[0]}
                      onChange={e=>setDob(e.target.value)}/>
                  </div>
                  <button className="auth-submit" onClick={onProfile} disabled={loading}>
                    {loading?<span className="auth-spinner"/>:'Enter UrbanAI →'}
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