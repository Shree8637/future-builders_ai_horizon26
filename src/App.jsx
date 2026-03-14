// import { useEffect, useRef } from 'react'
// import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
// import { AuthProvider, useAuth } from './context/AuthContext.jsx'
// import Navbar from './components/Navbar/Navbar.jsx'
// import Home from './pages/Home/Home.jsx'
// import Features from './pages/Features/Features.jsx'
// import HowItWorks from './pages/HowItWorks/HowItWorks.jsx'
// import Dashboard from './pages/Dashboard/Dashboard.jsx'
// import ModelService from './pages/ModelService/ModelService.jsx'
// import About from './pages/About/About.jsx'
// import Auth from './pages/Auth/Auth.jsx'
// import ScrollProgress from './components/ScrollProgress/ScrollProgress.jsx'

// function Splash() {
//   return (
//     <div style={{minHeight:'100vh',display:'flex',flexDirection:'column',alignItems:'center',
//       justifyContent:'center',background:'var(--bg-base)',gap:20}}>
//       <style>{`@keyframes _s{to{transform:rotate(360deg)}}`}</style>
//       <div style={{width:48,height:48,borderRadius:'50%',border:'2px solid rgba(0,212,184,0.12)',
//         borderTopColor:'var(--accent-cyan)',animation:'_s 1s linear infinite'}}/>
//       <p style={{fontFamily:'var(--font-mono)',fontSize:11,color:'var(--text-muted)',letterSpacing:'0.2em'}}>
//         LOADING…
//       </p>
//     </div>
//   )
// }

// function Guard({ children }) {
//   const { user, loading } = useAuth()
//   const loc = useLocation()
//   if (loading) return <Splash />
//   if (!user)             return <Navigate to="/auth" state={{ from: loc }} replace />
//   if (!user.displayName) return <Navigate to="/auth" replace />
//   return children
// }

// function Cursor() {
//   const dot = useRef(null), ring = useRef(null)
//   useEffect(() => {
//     let mx=0,my=0,rx=0,ry=0,raf
//     const move = e => {
//       mx=e.clientX; my=e.clientY
//       if(dot.current){dot.current.style.left=mx+'px';dot.current.style.top=my+'px'}
//     }
//     const tick = () => {
//       rx+=(mx-rx)*0.12; ry+=(my-ry)*0.12
//       if(ring.current){ring.current.style.left=rx+'px';ring.current.style.top=ry+'px'}
//       raf=requestAnimationFrame(tick)
//     }
//     const on=()=>ring.current?.classList.add('hovering')
//     const off=()=>ring.current?.classList.remove('hovering')
//     window.addEventListener('mousemove',move)
//     document.querySelectorAll('a,button,[data-hover]').forEach(el=>{
//       el.addEventListener('mouseenter',on); el.addEventListener('mouseleave',off)
//     })
//     raf=requestAnimationFrame(tick)
//     return ()=>{window.removeEventListener('mousemove',move);cancelAnimationFrame(raf)}
//   },[])
//   return <><div className="cursor-dot" ref={dot}/><div className="cursor-ring" ref={ring}/></>
// }

// function Shell() {
//   const loc = useLocation()
//   const isAuth = loc.pathname === '/auth'
//   return (
//     <>
//       <div className="noise-overlay"/>
//       <Cursor/>
//       <ScrollProgress/>
//       {!isAuth && <Navbar/>}
//       <Routes>
//         <Route path="/auth"         element={<Auth/>}/>
//         <Route path="/"             element={<Guard><Home/></Guard>}/>
//         <Route path="/features"     element={<Guard><Features/></Guard>}/>
//         <Route path="/how-it-works" element={<Guard><HowItWorks/></Guard>}/>
//         <Route path="/dashboard"    element={<Guard><Dashboard/></Guard>}/>
//         <Route path="/model"        element={<Guard><ModelService/></Guard>}/>
//         <Route path="/about"        element={<Guard><About/></Guard>}/>
//         <Route path="*"             element={<Navigate to="/" replace/>}/>
//       </Routes>
//     </>
//   )
// }

// export default function App() {
//   return (
//     <AuthProvider>
//       <Router><Shell/></Router>
//     </AuthProvider>
//   )
// }


















import { useEffect, useRef } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext.jsx'
import { ThemeProvider } from './context/ThemeContext.jsx'
import Navbar from './components/Navbar/Navbar.jsx'
import Home from './pages/Home/Home.jsx'
import Features from './pages/Features/Features.jsx'
import Dashboard from './pages/Dashboard/Dashboard.jsx'
import ModelService from './pages/ModelService/ModelService.jsx'
import About from './pages/About/About.jsx'
import Auth from './pages/Auth/Auth.jsx'
import ScrollProgress from './components/ScrollProgress/ScrollProgress.jsx'

/* ── Loading splash ──────────────────────────────────────── */
function Splash() {
  return (
    <div style={{
      minHeight:'100vh', display:'flex', flexDirection:'column',
      alignItems:'center', justifyContent:'center',
      background:'var(--bg-base)', gap:20,
    }}>
      <style>{`
        @keyframes _spin { to { transform: rotate(360deg); } }
      `}</style>
      <div style={{
        width:48, height:48, borderRadius:'50%',
        border:'2px solid rgba(0,212,184,0.12)',
        borderTopColor:'var(--accent-cyan)',
        animation:'_spin 1s linear infinite',
      }}/>
      <p style={{
        fontFamily:'var(--font-mono)', fontSize:11,
        color:'var(--text-muted)', letterSpacing:'0.2em',
      }}>LOADING…</p>
    </div>
  )
}

/* ── Protected route ─────────────────────────────────────── */
function Guard({ children }) {
  const { user, loading } = useAuth()
  const loc = useLocation()
  if (loading) return <Splash />
  if (!user)             return <Navigate to="/auth" state={{ from: loc }} replace />
  if (!user.displayName) return <Navigate to="/auth" replace />
  return children
}

/* ── Custom cursor ───────────────────────────────────────── */
function Cursor() {
  const dot  = useRef(null)
  const ring = useRef(null)

  useEffect(() => {
    let mx=0, my=0, rx=0, ry=0, raf
    const move = e => {
      mx=e.clientX; my=e.clientY
      if (dot.current) { dot.current.style.left=mx+'px'; dot.current.style.top=my+'px' }
    }
    const tick = () => {
      rx += (mx-rx)*0.12; ry += (my-ry)*0.12
      if (ring.current) { ring.current.style.left=rx+'px'; ring.current.style.top=ry+'px' }
      raf = requestAnimationFrame(tick)
    }
    const on  = () => ring.current?.classList.add('hovering')
    const off = () => ring.current?.classList.remove('hovering')
    window.addEventListener('mousemove', move)
    document.querySelectorAll('a,button,[data-hover]').forEach(el => {
      el.addEventListener('mouseenter', on); el.addEventListener('mouseleave', off)
    })
    raf = requestAnimationFrame(tick)
    return () => { window.removeEventListener('mousemove', move); cancelAnimationFrame(raf) }
  }, [])

  return (
    <>
      <div className="cursor-dot"  ref={dot}  />
      <div className="cursor-ring" ref={ring} />
    </>
  )
}

/* ── Shell (router-aware) ────────────────────────────────── */
function Shell() {
  const loc    = useLocation()
  const isAuth = loc.pathname === '/auth'

  return (
    <>
      <div className="noise-overlay" />
      <Cursor />
      <ScrollProgress />
      {!isAuth && <Navbar />}

      <Routes>
        {/* Public */}
        <Route path="/auth" element={<Auth />} />

        {/* Protected */}
        <Route path="/"         element={<Guard><Home /></Guard>} />
        <Route path="/features" element={<Guard><Features /></Guard>} />
        <Route path="/dashboard" element={<Guard><Dashboard /></Guard>} />
        <Route path="/model"    element={<Guard><ModelService /></Guard>} />
        <Route path="/about"    element={<Guard><About /></Guard>} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Shell />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  )
}