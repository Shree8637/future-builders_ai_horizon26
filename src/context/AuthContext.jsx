import { createContext, useContext, useEffect, useState } from 'react'
import {
  onAuthStateChanged,
  signOut,
  signInWithPopup,
  updateProfile,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
} from 'firebase/auth'
import { auth, googleProvider } from '../firebase/config.js'

const AuthContext = createContext(null)

const PHONE_SESSION_KEY = 'urbanai_phone_session'
const EMAIL_KEY = 'urbanai_email_for_signin'

function loadPhoneSession() {
  try {
    const raw = localStorage.getItem(PHONE_SESSION_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}
function savePhoneSession(data) {
  localStorage.setItem(PHONE_SESSION_KEY, JSON.stringify(data))
}
function clearPhoneSession() {
  localStorage.removeItem(PHONE_SESSION_KEY)
}

// ── Action code settings for email link ──────────────────────
const actionCodeSettings = {
  // Must match your app's URL exactly (localhost for dev, live URL for production)
  url: window.location.origin + '/auth',
  handleCodeInApp: true,
}

export function AuthProvider({ children }) {
  const [user, setUser]             = useState(null)
  const [loading, setLoading]       = useState(true)
  const [authMethod, setAuthMethod] = useState(null)

  useEffect(() => {
    // Check phone session
    const phoneSession = loadPhoneSession()
    if (phoneSession) {
      setUser({
        uid: 'phone_' + phoneSession.phone,
        displayName: phoneSession.displayName || null,
        phoneNumber: phoneSession.phone,
        email: null,
        photoURL: null,
        isPhoneUser: true,
        dob: phoneSession.dob,
      })
      setAuthMethod('phone')
      setLoading(false)
    }

    // Handle email link sign-in (when user clicks link in email and returns)
    if (isSignInWithEmailLink(auth, window.location.href)) {
      let email = localStorage.getItem(EMAIL_KEY)
      if (!email) {
        email = window.prompt('Please enter your email to confirm sign in:')
      }
      if (email) {
        signInWithEmailLink(auth, email, window.location.href)
          .then(() => {
            localStorage.removeItem(EMAIL_KEY)
            // Clean up URL
            window.history.replaceState({}, document.title, '/auth')
          })
          .catch((err) => console.error('Email link sign-in error:', err))
      }
    }

    // Firebase auth state listener
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser)
        setAuthMethod('google')
        clearPhoneSession()
      } else if (!loadPhoneSession()) {
        setUser(null)
        setAuthMethod(null)
      }
      setLoading(false)
    })
    return unsub
  }, [])

  // ── Google sign-in ────────────────────────────────────────
  const loginGoogle = () => signInWithPopup(auth, googleProvider)

  // ── Email OTP: send sign-in link ─────────────────────────
  const sendEmailOtp = async (email) => {
    await sendSignInLinkToEmail(auth, email, actionCodeSettings)
    localStorage.setItem(EMAIL_KEY, email)
  }

  // ── Phone: set user after OTP verified ───────────────────
  const setPhoneUser = async (phone) => {
    const phone10 = phone.replace(/^\+91/, '').replace(/\D/g, '')
    const session = {
      phone: phone10,
      displayName: null,
      dob: null,
      createdAt: Date.now(),
    }
    savePhoneSession(session)
    setUser({
      uid: 'phone_' + phone10,
      displayName: null,
      phoneNumber: phone10,
      email: null,
      photoURL: null,
      isPhoneUser: true,
    })
    setAuthMethod('phone')
  }

  // ── Update display name ───────────────────────────────────
  const updateUserProfile = async (displayName, dob) => {
    if (authMethod === 'phone') {
      const existing = loadPhoneSession() || {}
      const updated  = { ...existing, displayName, dob: dob || existing.dob }
      savePhoneSession(updated)
      setUser(prev => ({ ...prev, displayName, dob }))
    } else {
      if (!auth.currentUser) throw new Error('No user')
      await updateProfile(auth.currentUser, { displayName })
      setUser(prev => ({ ...prev, displayName }))
    }
  }

  // ── Logout ────────────────────────────────────────────────
  const logout = async () => {
    clearPhoneSession()
    setUser(null)
    setAuthMethod(null)
    try { await signOut(auth) } catch (e) {}
  }

  return (
    <AuthContext.Provider value={{
      user, loading, authMethod,
      loginGoogle,
      sendEmailOtp,
      setPhoneUser,
      updateUserProfile,
      logout,
    }}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)