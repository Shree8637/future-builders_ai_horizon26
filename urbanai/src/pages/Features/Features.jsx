import { useInView } from '../../hooks/useInView.js'
import { FEATURES } from '../../data/constants.js'
import './Features.css'

const COMPARE_ROWS = [
  { feature: 'Real-time Traffic Updates', google: '✅', waze: '✅', urban: '✅' },
  { feature: 'Predictive Traffic (2hr ahead)', google: '❌', waze: '❌', urban: '✅' },
  { feature: 'Smart Departure Planning', google: '⚠️', waze: '❌', urban: '✅' },
  { feature: 'Parking Availability', google: '⚠️', waze: '❌', urban: '✅' },
  { feature: 'Predictive Parking Demand', google: '❌', waze: '❌', urban: '✅' },
  { feature: 'Personalized Learning', google: '❌', waze: '⚠️', urban: '✅' },
  { feature: 'LSTM-Based Forecasting', google: '❌', waze: '❌', urban: '✅' },
  { feature: 'Mumbai-Specific Optimization', google: '❌', waze: '❌', urban: '✅' },
]

function FeatureCard({ feature, index }) {
  const [ref, inView] = useInView()

  return (
    <div
      ref={ref}
      className="feature-card"
      style={{
        '--card-color': feature.colorRaw,
        opacity: inView ? 1 : 0,
        transform: inView ? 'translateY(0)' : 'translateY(40px)',
        transition: `all 0.8s cubic-bezier(0.34,1.2,0.64,1) ${index * 120}ms`,
      }}
    >
      <div className="feature-card__corner" />
      <div className="feature-card__icon">{feature.icon}</div>
      <div className="feature-card__stat-row">
        <span className="feature-card__stat">{feature.stat}</span>
        <span className="feature-card__stat-label">{feature.statLabel}</span>
      </div>
      <div className="feature-card__tagline">{feature.tagline}</div>
      <h3 className="feature-card__title">{feature.title}</h3>
      <p className="feature-card__desc">{feature.desc}</p>
      <div className="feature-card__bullets">
        {feature.bullets.map(b => (
          <div key={b} className="feature-card__bullet">{b}</div>
        ))}
      </div>
    </div>
  )
}

export default function Features() {
  const [headerRef, headerInView] = useInView()
  const [compareRef, compareInView] = useInView()

  return (
    <main className="features-page">
      <div className="features-page__header">
        <div className="features-page__bg-text">FEATURES</div>
        <div
          ref={headerRef}
          style={{
            opacity: headerInView ? 1 : 0,
            transform: headerInView ? 'translateY(0)' : 'translateY(30px)',
            transition: 'all 0.7s ease',
          }}
        >
          <div className="label-tag" style={{ color: 'var(--accent-cyan)' }}>Core Capabilities</div>
          <h1 className="section-title" style={{ marginTop: 20, marginBottom: 16 }}>
            WHAT THE<br /><span className="gradient-text">SYSTEM DOES</span>
          </h1>
          <p className="section-subtitle" style={{ margin: '0 auto' }}>
            Four intelligent modules working in concert to eliminate uncertainty from your daily commute.
          </p>
        </div>
      </div>

      <div className="features-grid">
        {FEATURES.map((feature, i) => (
          <FeatureCard key={feature.id} feature={feature} index={i} />
        ))}
      </div>

      {/* Comparison Table */}
      <div className="features-compare" ref={compareRef}>
        <h2
          className="features-compare__title"
          style={{
            opacity: compareInView ? 1 : 0,
            transform: compareInView ? 'translateY(0)' : 'translateY(20px)',
            transition: 'all 0.7s ease',
          }}
        >
          HOW WE COMPARE
        </h2>
        <div
          className="compare-table"
          style={{
            opacity: compareInView ? 1 : 0,
            transform: compareInView ? 'translateY(0)' : 'translateY(30px)',
            transition: 'all 0.8s ease 0.2s',
          }}
        >
          <div className="compare-table__header">
            <div className="compare-table__col-label">Feature</div>
            <div className="compare-table__col-label">Google Maps</div>
            <div className="compare-table__col-label">Waze</div>
            <div className="compare-table__col-label highlight">UrbanAI</div>
          </div>
          {COMPARE_ROWS.map((row, i) => (
            <div key={row.feature} className="compare-row" style={{ animationDelay: `${i * 60}ms` }}>
              <div className="compare-row__feature">{row.feature}</div>
              <div className="compare-row__cell">{row.google}</div>
              <div className="compare-row__cell">{row.waze}</div>
              <div className="compare-row__cell">{row.urban}</div>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
