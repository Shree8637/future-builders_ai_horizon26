import { createContext, useContext, useEffect, useState } from 'react'
import {
  onAuthStateChanged,
  signOut,
  signInWithPopup,
  updateProfile,
} from 'firebase/auth'
import { auth, googleProvider } from '../firebase/config.js'

const AuthContext = createContext(null)

// ── Phone session stored in localStorage ──────────────────
// Shape: { phone, displayName, dob, createdAt }
const PHONE_SESSION_KEY = 'urbanai_phone_session'

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

export function AuthProvider({ children }) {
  const [user, setUser]         = useState(null)
  const [loading, setLoading]   = useState(true)
  // 'google' | 'phone' | null
  const [authMethod, setAuthMethod] = useState(null)

  useEffect(() => {
    // Check for stored phone session first
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

    // Also watch Firebase auth (Google)
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser)
        setAuthMethod('google')
        // If firebase user signs in, clear any phone session
        clearPhoneSession()
      } else if (!loadPhoneSession()) {
        // No firebase user AND no phone session
        setUser(null)
        setAuthMethod(null)
      }
      setLoading(false)
    })
    return unsub
  }, [])

  // ── Google sign-in ────────────────────────────────────────
  const loginGoogle = () => signInWithPopup(auth, googleProvider)

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
      // Firebase (Google) user
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
    try { await signOut(auth) } catch(e) {}
  }

  return (
    <AuthContext.Provider value={{
      user, loading, authMethod,
      loginGoogle,
      setPhoneUser,
      updateUserProfile,
      logout,
    }}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
