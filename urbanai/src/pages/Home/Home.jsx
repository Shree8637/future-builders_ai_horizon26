import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useInView } from '../../hooks/useInView.js'
import { ROUTES } from '../../data/constants.js'
import './Home.css'

const NODES = [
  { size: 8, x: 12, y: 18, color: '#00ffe7', dur: 4.2 },
  { size: 5, x: 82, y: 25, color: '#ff5c2b', dur: 5.8 },
  { size: 10, x: 65, y: 72, color: '#00ffe7', dur: 3.5 },
  { size: 6, x: 25, y: 68, color: '#b57bff', dur: 6.1 },
  { size: 4, x: 90, y: 55, color: '#f5c842', dur: 4.8 },
  { size: 7, x: 45, y: 85, color: '#00ffe7', dur: 5.2 },
  { size: 5, x: 8, y: 50, color: '#ff5c2b', dur: 3.9 },
  { size: 9, x: 76, y: 15, color: '#b57bff', dur: 7.0 },
]

function RouteCard({ route, delay }) {
  const [ref, inView] = useInView()
  const [barWidth, setBarWidth] = useState(0)

  useEffect(() => {
    if (inView) setTimeout(() => setBarWidth(route.traffic), delay * 0.8)
  }, [inView])

  return (
    <div
      ref={ref}
      className="route-card reveal"
      style={{
        '--accent-color': route.color,
        opacity: inView ? 1 : 0,
        transform: inView ? 'translateY(0)' : 'translateY(24px)',
        transition: `all 0.7s cubic-bezier(0.34,1.2,0.64,1) ${delay}ms`,
      }}
    >
      <div className="route-card__header">
        <div className="route-card__name">{route.name}</div>
        <div className="route-card__badge">{route.status}</div>
      </div>
      <div className="route-card__bar-bg">
        <div className="route-card__bar-fill" style={{ width: `${barWidth}%` }} />
      </div>
      <div className="route-card__eta">⏱ ETA {route.eta} · Traffic {route.traffic}%</div>
    </div>
  )
}

export default function Home() {
  const navigate = useNavigate()
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 })
  const heroRef = useRef(null)
  const [cityRef, cityInView] = useInView()

  const handleMouseMove = (e) => {
    const rect = heroRef.current?.getBoundingClientRect()
    if (!rect) return
    setMousePos({ x: (e.clientX - rect.left) / rect.width, y: (e.clientY - rect.top) / rect.height })
  }

  return (
    <main className="home">
      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="hero" ref={heroRef} onMouseMove={handleMouseMove}>
        <div
          className="hero__grid"
          style={{ transform: `translate(${(mousePos.x - 0.5) * -18}px, ${(mousePos.y - 0.5) * -18}px)` }}
        />

        <div className="hero__orb hero__orb--cyan"
          style={{ transform: `translate(calc(-50% + ${(mousePos.x - 0.5) * 40}px), calc(-50% + ${(mousePos.y - 0.5) * 30}px))` }}
        />
        <div className="hero__orb hero__orb--orange" />
        <div className="hero__orb hero__orb--violet" />
        <div className="hero__scanline" />

        <div className="hero__nodes">
          {NODES.map((node, i) => (
            <div key={i} className="hero__node" style={{
              width: node.size, height: node.size,
              left: `${node.x}%`, top: `${node.y}%`,
              background: node.color,
              boxShadow: `0 0 ${node.size * 3}px ${node.color}`,
              '--duration': `${node.dur}s`,
            }} />
          ))}
        </div>

        <div className="hero__content">
          <div className="hero__eyebrow">
            <span className="hero__eyebrow-dot" />
            AI-Powered Urban Mobility · Mumbai
          </div>

          <div className="hero__headline">
            <span className="hero__headline-line">NAVIGATE THE</span>
            <span className="hero__headline-line hero__headline-line--accent">CITY SMARTER</span>
            <span className="hero__headline-line">THAN EVER</span>
          </div>

          <p className="hero__sub">
            An AI-driven predictive navigation system using LSTM neural networks to forecast
            traffic, optimize your departure time, and locate parking — built for Mumbai's 20M+ daily commuters.
          </p>

          <div className="hero__actions">
            <button className="btn-primary" onClick={() => navigate('/model')}>
              Try AI Model →
            </button>
            <button className="btn-ghost" onClick={() => navigate('/dashboard')}>
              Live Dashboard
            </button>
            <button className="btn-ghost" onClick={() => navigate('/how-it-works')}>
              How It Works
            </button>
          </div>
        </div>

        <div className="hero__stats">
          {[['20M+', 'Daily Commuters'], ['92%', 'Accuracy'], ['38%', 'Time Saved'], ['2 hrs', 'Forecast Window']].map(([val, label]) => (
            <div className="hero__stat" key={label}>
              <span className="hero__stat-value">{val}</span>
              <span className="hero__stat-label">{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Live Routes Preview ───────────────────────────── */}
      <section className="hero__city">
        <div
          ref={cityRef}
          className="hero__city-title reveal"
          style={{
            opacity: cityInView ? 1 : 0,
            transform: cityInView ? 'translateY(0)' : 'translateY(30px)',
            transition: 'all 0.7s ease',
          }}
        >
          <h2>LIVE ROUTE INTELLIGENCE</h2>
          <p className="hero__city-title p" style={{ color: 'var(--text-secondary)', fontSize: 14, fontFamily: 'var(--font-mono)' }}>
            Real-time predictions for Mumbai's busiest corridors
          </p>
        </div>

        <div className="hero__routes">
          {ROUTES.map((route, i) => (
            <RouteCard key={route.name} route={route} delay={i * 100} />
          ))}
        </div>
      </section>
    </main>
  )
}
