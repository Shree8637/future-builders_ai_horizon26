import { initializeApp } from "firebase/app"
import { getAuth, GoogleAuthProvider } from "firebase/auth"
import { getAnalytics } from "firebase/analytics"

const firebaseConfig = {
  apiKey: "AIzaSyBGVMbJprEipDju43JIBO5gNRtHzfe_1J8",
  authDomain: "hackathon-vcet-a7228.firebaseapp.com",
  projectId: "hackathon-vcet-a7228",
  storageBucket: "hackathon-vcet-a7228.firebasestorage.app",
  messagingSenderId: "610266870546",
  appId: "1:610266870546:web:8d50e4a37a3f3157a739cb",
  measurementId: "G-57PJ51V8BD"
}

const app = initializeApp(firebaseConfig)
export const analytics = getAnalytics(app)
export const auth = getAuth(app)
export const googleProvider = new GoogleAuthProvider()
googleProvider.setCustomParameters({ prompt: 'select_account' })
