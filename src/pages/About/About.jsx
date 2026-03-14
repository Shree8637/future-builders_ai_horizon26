import { useNavigate } from 'react-router-dom'
import { useInView, useCountUp } from '../../hooks/useInView.js'
import { TEAM } from '../../data/constants.js'
import './About.css'

const STATS = [
  { icon: '🌆', value: '20', suffix: 'M+', label: 'Daily Commuters', color: '#00ffe7' },
  { icon: '⏱', value: '65', suffix: ' min', label: 'Lost/Day to Traffic', color: '#ff5c2b' },
  { icon: '📊', value: '5', suffix: '+ yrs', label: 'Training Data', color: '#b57bff' },
  { icon: '🎯', value: '92', suffix: '%', label: 'Forecast Accuracy', color: '#f5c842' },
  { icon: '⚡', value: '2', suffix: ' sec', label: 'Inference Time', color: '#00ffe7' },
  { icon: '🚗', value: '50', suffix: 'K+', label: 'Routes Analyzed', color: '#ff5c2b' },
]

function StatCard({ stat, index, inView }) {
  const val = useCountUp(stat.value, 1600, inView)
  return (
    <div
      className="about-stat-card"
      style={{
        '--stat-color': stat.color,
        opacity: inView ? 1 : 0,
        transform: inView ? 'translateY(0)' : 'translateY(24px)',
        transition: `all 0.7s cubic-bezier(0.34,1.2,0.64,1) ${index * 100}ms`,
      }}
    >
      <div className="about-stat-card__icon">{stat.icon}</div>
      <span className="about-stat-card__value">{val}{stat.suffix}</span>
      <span className="about-stat-card__label">{stat.label}</span>
    </div>
  )
}

export default function About() {
  const navigate = useNavigate()
  const [headerRef, headerInView] = useInView()
  const [problemRef, problemInView] = useInView()
  const [teamRef, teamInView] = useInView()
  const [ctaRef, ctaInView] = useInView()

  return (
    <main className="about-page">
      {/* Header */}
      <div
        className="about-page__header"
        ref={headerRef}
        style={{
          opacity: headerInView ? 1 : 0,
          transform: headerInView ? 'translateY(0)' : 'translateY(30px)',
          transition: 'all 0.7s ease',
        }}
      >
        <div className="label-tag" style={{ color: 'var(--accent-gold)' }}>The Project</div>
        <h1 className="section-title" style={{ marginTop: 20, marginBottom: 16 }}>
          ABOUT<br /><span style={{ color: 'var(--accent-gold)' }}>URBANAI</span>
        </h1>
        <p className="section-subtitle" style={{ margin: '0 auto' }}>
          An academic research project addressing one of Mumbai's most pressing urban challenges —
          daily mobility chaos affecting millions of lives.
        </p>
      </div>

      {/* Problem + Stats */}
      <div className="about-problem" ref={problemRef}>
        <div
          className="about-problem__text"
          style={{
            opacity: problemInView ? 1 : 0,
            transform: problemInView ? 'translateX(0)' : 'translateX(-30px)',
            transition: 'all 0.8s ease',
          }}
        >
          <h2>
            SOLVING<br />MUMBAI'S<br /><span>MOBILITY CRISIS</span>
          </h2>
          <p>
            Mumbai's 20 million daily commuters lose an average of 65 minutes every day to traffic
            congestion. Existing navigation tools — Google Maps, Waze — only react to current conditions.
            They cannot see what's coming.
          </p>
          <p>
            UrbanAI changes this. Using Long Short-Term Memory (LSTM) neural networks trained on years
            of historical data, our system predicts what traffic will look like — not just now, but
            2 hours ahead — enabling smarter decisions before you even leave your door.
          </p>
          <p>
            The result: up to 38% reduction in travel time, significantly less time hunting for parking,
            and a personalized experience that keeps getting smarter as it learns your patterns.
          </p>
        </div>

        <div
          className="about-problem__stats"
          style={{
            opacity: problemInView ? 1 : 0,
            transform: problemInView ? 'translateX(0)' : 'translateX(30px)',
            transition: 'all 0.8s ease 0.2s',
          }}
        >
          {STATS.map((stat, i) => (
            <StatCard key={stat.label} stat={stat} index={i} inView={problemInView} />
          ))}
        </div>
      </div>

      {/* Team */}
      <div className="about-team" ref={teamRef}>
        <h2
          className="about-team__title"
          style={{
            opacity: teamInView ? 1 : 0,
            transform: teamInView ? 'translateY(0)' : 'translateY(20px)',
            transition: 'all 0.7s ease',
          }}
        >
          THE TEAM
        </h2>
        <div className="team-grid">
          {TEAM.map((member, i) => (
            <div
              key={member.name}
              className="team-card"
              style={{
                opacity: teamInView ? 1 : 0,
                transform: teamInView ? 'translateY(0)' : 'translateY(30px)',
                transition: `all 0.7s cubic-bezier(0.34,1.2,0.64,1) ${i * 120}ms`,
              }}
            >
              <div className="team-card__avatar">{member.emoji}</div>
              <div className="team-card__name">{member.name}</div>
              <div className="team-card__role">{member.role}</div>
              <div className="team-card__focus">{member.focus}</div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="about-cta" ref={ctaRef}>
        <div
          className="about-cta__card"
          style={{
            opacity: ctaInView ? 1 : 0,
            transform: ctaInView ? 'translateY(0)' : 'translateY(30px)',
            transition: 'all 0.8s ease',
          }}
        >
          <div className="about-cta__label">Ready to Experience It?</div>
          <div className="about-cta__title">NAVIGATE<br />SMARTER</div>
          <p className="about-cta__sub">
            Try our live AI model, explore the predictive dashboard, or read through how the system works.
          </p>
          <div className="about-cta__buttons">
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
      </div>
    </main>
  )
}
