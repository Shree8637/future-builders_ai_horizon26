import { useInView } from '../../hooks/useInView.js'
import { TECH_STACK } from '../../data/constants.js'
import './HowItWorks.css'

const STEPS = [
  {
    num: '01',
    title: 'Input Your Journey',
    desc: 'Enter your origin, destination, and preferred arrival time. The system ingests your travel intent and contextualizes it against current city-wide data.',
    side: 'left',
  },
  {
    num: '02',
    title: 'Data Aggregation',
    desc: 'Historical traffic data, real-time sensor feeds, weather conditions, and event schedules are collected and preprocessed for model inference.',
    side: 'right',
  },
  {
    num: '03',
    title: 'LSTM Model Inference',
    desc: 'Our Long Short-Term Memory neural network, trained on 5+ years of Mumbai traffic patterns, generates congestion predictions for your route corridor up to 2 hours ahead.',
    side: 'left',
  },
  {
    num: '04',
    title: 'Optimization Engine',
    desc: 'The departure planner computes optimal leave-time windows by minimizing predicted travel time + parking search time + your personal tolerance thresholds.',
    side: 'right',
  },
  {
    num: '05',
    title: 'Personalized Delivery',
    desc: 'Final recommendations — best route, departure window, and nearest available parking — are delivered to you with confidence intervals and alternative options.',
    side: 'left',
  },
]

const ARCH_LAYERS = [
  {
    icon: '📡',
    title: 'Data Sources',
    items: ['GPS probe data', 'Road sensors', 'Weather API', 'Event feed', 'GTFS transit'],
  },
  {
    icon: '🧠',
    title: 'ML Core',
    items: ['LSTM model', 'Feature engineering', 'Traffic encoder', 'Demand predictor', 'Preference model'],
  },
  {
    icon: '🚀',
    title: 'API Layer',
    items: ['FastAPI backend', 'WebSocket streams', 'Redis cache', 'Model serving', 'Auth & rate limit'],
  },
]

function Step({ step, index }) {
  const [ref, inView] = useInView()
  const isLeft = step.side === 'left'

  return (
    <div className="hiw-step" ref={ref}>
      {isLeft && (
        <div
          className="hiw-step__content"
          style={{
            opacity: inView ? 1 : 0,
            transform: inView ? 'translateX(0)' : 'translateX(-40px)',
            transition: `all 0.8s ease ${index * 100}ms`,
          }}
        >
          <div className="hiw-step__number">{step.num}</div>
          <h3 className="hiw-step__title">{step.title}</h3>
          <p className="hiw-step__desc">{step.desc}</p>
        </div>
      )}
      {!isLeft && <div />}

      <div className="hiw-step__node"
        style={{
          opacity: inView ? 1 : 0,
          transform: inView ? 'scale(1)' : 'scale(0)',
          transition: `all 0.5s cubic-bezier(0.34,1.56,0.64,1) ${index * 100 + 100}ms`,
        }}
      >
        {step.num}
      </div>

      {!isLeft && (
        <div
          className="hiw-step__content"
          style={{
            opacity: inView ? 1 : 0,
            transform: inView ? 'translateX(0)' : 'translateX(40px)',
            transition: `all 0.8s ease ${index * 100}ms`,
          }}
        >
          <div className="hiw-step__number">{step.num}</div>
          <h3 className="hiw-step__title">{step.title}</h3>
          <p className="hiw-step__desc">{step.desc}</p>
        </div>
      )}
      {isLeft && <div />}
    </div>
  )
}

export default function HowItWorks() {
  const [headerRef, headerInView] = useInView()
  const [archRef, archInView] = useInView()
  const [techRef, techInView] = useInView()

  return (
    <main className="hiw-page">
      <div className="hiw-page__header">
        <div
          ref={headerRef}
          style={{
            opacity: headerInView ? 1 : 0,
            transform: headerInView ? 'translateY(0)' : 'translateY(30px)',
            transition: 'all 0.7s ease',
          }}
        >
          <div className="label-tag" style={{ color: 'var(--accent-orange)' }}>System Architecture</div>
          <h1 className="section-title" style={{ marginTop: 20, marginBottom: 16 }}>
            HOW IT<br /><span style={{ color: 'var(--accent-orange)' }}>WORKS</span>
          </h1>
          <p className="section-subtitle" style={{ margin: '0 auto' }}>
            From raw sensor data to actionable navigation intelligence — a step-by-step walk through our pipeline.
          </p>
        </div>
      </div>

      {/* Steps */}
      <div className="hiw-steps">
        <div className="hiw-steps__line" />
        {STEPS.map((step, i) => (
          <Step key={step.num} step={step} index={i} />
        ))}
      </div>

      {/* Architecture */}
      <div className="hiw-arch" ref={archRef}>
        <h2
          className="hiw-arch__title"
          style={{
            opacity: archInView ? 1 : 0,
            transform: archInView ? 'translateY(0)' : 'translateY(20px)',
            transition: 'all 0.7s ease',
          }}
        >
          SYSTEM ARCHITECTURE
        </h2>
        <div className="arch-diagram">
          {ARCH_LAYERS.map((layer, i) => (
            <div
              key={layer.title}
              className="arch-layer"
              style={{
                opacity: archInView ? 1 : 0,
                transform: archInView ? 'translateY(0)' : 'translateY(30px)',
                transition: `all 0.7s ease ${i * 120}ms`,
              }}
            >
              <div className="arch-layer__icon">{layer.icon}</div>
              <div className="arch-layer__title">{layer.title}</div>
              <div className="arch-layer__items">
                {layer.items.map(item => (
                  <div key={item} className="arch-layer__item">{item}</div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tech Stack */}
      <div className="hiw-tech" ref={techRef}>
        <h2
          className="hiw-arch__title"
          style={{
            opacity: techInView ? 1 : 0,
            transform: techInView ? 'translateY(0)' : 'translateY(20px)',
            transition: 'all 0.7s ease',
          }}
        >
          TECHNOLOGY STACK
        </h2>
        <div className="tech-grid">
          {TECH_STACK.map((cat, i) => (
            <div
              key={cat.category}
              className="tech-category"
              style={{
                opacity: techInView ? 1 : 0,
                transform: techInView ? 'translateY(0)' : 'translateY(24px)',
                transition: `all 0.7s ease ${i * 100}ms`,
              }}
            >
              <div className="tech-category__name">{cat.category}</div>
              {cat.items.map(item => (
                <span key={item} className="tech-tag">{item}</span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
