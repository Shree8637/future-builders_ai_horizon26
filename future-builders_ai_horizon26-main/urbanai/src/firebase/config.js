import { initializeApp } from "firebase/app"
import { getAuth, GoogleAuthProvider } from "firebase/auth"

const firebaseConfig = {
  apiKey: "AIzaSyBGVMbJprEipDju43JIBO5gNRtHzfe_1J8",
  authDomain: "hackathon-vcet-a7228.firebaseapp.com",
  projectId: "hackathon-vcet-a7228",
  storageBucket: "hackathon-vcet-a7228.firebasestorage.app",
  messagingSenderId: "610266870546",
  appId: "1:610266870546:web:8d50e4a37a3f3157a739cb"
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const googleProvider = new GoogleAuthProvider()
googleProvider.setCustomParameters({ prompt: 'select_account' })