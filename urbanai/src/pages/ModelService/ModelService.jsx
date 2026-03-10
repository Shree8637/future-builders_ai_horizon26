import { useState } from 'react'
import { useInView } from '../../hooks/useInView.js'
import './ModelService.css'

const MUMBAI_ORIGINS = [
  'Andheri (W)', 'Bandra (W)', 'Borivali', 'Churchgate', 'Dadar',
  'Goregaon', 'Kurla', 'Lower Parel', 'Marine Drive', 'Mulund',
  'Powai', 'Thane', 'Vikhroli', 'Worli',
]

const MUMBAI_DESTINATIONS = [
  'BKC (Bandra Kurla Complex)', 'Nariman Point', 'Lower Parel', 'Worli',
  'Andheri (E)', 'Powai', 'Thane', 'Navi Mumbai', 'CST / Fort Area', 'Airport',
]

const TRANSPORT_MODES = ['Car / Cab', 'Motorcycle', 'BEST Bus', 'Mumbai Local', 'Metro']

const MODEL_INFO_CARDS = [
  {
    icon: '🧬',
    title: 'LSTM Architecture',
    desc: 'Long Short-Term Memory network with 3 stacked layers, trained on 5+ years of Mumbai traffic time-series data.',
  },
  {
    icon: '📊',
    title: 'Training Dataset',
    desc: 'Over 2.1M data points including GPS traces, road sensor feeds, weather history, and public event schedules.',
  },
  {
    icon: '⚙️',
    title: 'Inference Pipeline',
    desc: 'Real-time feature extraction feeds into the model, delivering predictions in under 2 seconds via REST API.',
  },
]

// ── Mock prediction engine — replace with real API call ──────────────
// To connect your trained model, replace the mock below with:
//
//   const res = await fetch('https://your-api.com/predict', {
//     method: 'POST',
//     headers: { 'Content-Type': 'application/json' },
//     body: JSON.stringify(formData),
//   })
//   const result = await res.json()
//
function mockPredict(formData) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const hour = parseInt(formData.departureTime?.split(':')[0] || 8)
      const isPeak = (hour >= 7 && hour <= 10) || (hour >= 17 && hour <= 20)
      const trafficLevel = isPeak ? 75 + Math.floor(Math.random() * 22) : 25 + Math.floor(Math.random() * 35)
      const confidence = 85 + Math.floor(Math.random() * 10)
      const baseEta = 20 + Math.floor(Math.random() * 30)
      const eta = isPeak ? baseEta + 15 + Math.floor(Math.random() * 20) : baseEta

      resolve({
        confidence,
        trafficLevel,
        eta,
        departureAdvice: isPeak
          ? `High congestion expected. We recommend departing 45 min earlier or waiting until ${hour + 2}:30.`
          : 'Traffic conditions look favorable for your journey. Proceed as planned.',
        optimalDeparture: isPeak ? `${hour - 1}:00` : formData.departureTime,
        parkingEstimate: Math.floor(Math.random() * 60) + 10,
        bestRoute: `${formData.origin} → ${formData.destination} via ${isPeak ? 'Western Express Hwy (avoid Eastern)' : 'Optimal Highway Route'}`,
        congestionLabel: trafficLevel > 80 ? 'HIGH' : trafficLevel > 55 ? 'MODERATE' : 'LOW',
        congestionColor: trafficLevel > 80 ? '#ff5c2b' : trafficLevel > 55 ? '#f5c842' : '#00ffe7',
      })
    }, 2200)
  })
}

export default function ModelService() {
  const [formData, setFormData] = useState({
    origin: '',
    destination: '',
    departureTime: '08:00',
    mode: 'Car / Cab',
    arrivalBuffer: '10',
  })
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [confidenceAnim, setConfidenceAnim] = useState(0)

  const [headerRef, headerInView] = useInView()
  const [infoRef, infoInView] = useInView()

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setResult(null)
    setError(null)
  }

  const handleSubmit = async () => {
    if (!formData.origin || !formData.destination) {
      setError('Please select both origin and destination.')
      return
    }
    if (formData.origin === formData.destination) {
      setError('Origin and destination must be different.')
      return
    }

    setLoading(true)
    setResult(null)
    setError(null)

    try {
      // ── Replace mockPredict with your real model API call here ──
      const data = await mockPredict(formData)
      setResult(data)
      setTimeout(() => setConfidenceAnim(data.confidence), 300)
    } catch (err) {
      setError('Model service unavailable. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="model-page">
      <div
        className="model-page__header"
        ref={headerRef}
        style={{
          opacity: headerInView ? 1 : 0,
          transform: headerInView ? 'translateY(0)' : 'translateY(30px)',
          transition: 'all 0.7s ease',
        }}
      >
        <div className="label-tag" style={{ color: 'var(--accent-violet)' }}>Live AI Prediction</div>
        <h1 className="section-title" style={{ marginTop: 20, marginBottom: 16 }}>
          PREDICT YOUR<br /><span style={{ color: 'var(--accent-violet)' }}>JOURNEY</span>
        </h1>
        <p className="section-subtitle" style={{ margin: '0 auto' }}>
          Enter your trip details below. Our LSTM model will forecast traffic conditions,
          suggest optimal departure time, and estimate parking availability at your destination.
        </p>
      </div>

      <div className="model-panel">
        {/* Input Card */}
        <div className="model-input-card">
          <div className="model-status">
            <span className="model-status__dot" />
            LSTM Model Online · v2.1.4 · Mumbai Dataset
          </div>

          <div className="model-input-card__title">
            <span>🗺</span> Journey Details
          </div>

          <div className="model-form">
            <div className="form-group">
              <label className="form-label">Origin</label>
              <select
                className="form-select"
                name="origin"
                value={formData.origin}
                onChange={handleChange}
              >
                <option value="">Select starting point...</option>
                {MUMBAI_ORIGINS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Destination</label>
              <select
                className="form-select"
                name="destination"
                value={formData.destination}
                onChange={handleChange}
              >
                <option value="">Select destination...</option>
                {MUMBAI_DESTINATIONS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Departure Time</label>
                <input
                  type="time"
                  className="form-input"
                  name="departureTime"
                  value={formData.departureTime}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Arrival Buffer (min)</label>
                <input
                  type="number"
                  className="form-input"
                  name="arrivalBuffer"
                  value={formData.arrivalBuffer}
                  onChange={handleChange}
                  min="0"
                  max="60"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Transport Mode</label>
              <select
                className="form-select"
                name="mode"
                value={formData.mode}
                onChange={handleChange}
              >
                {TRANSPORT_MODES.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>

            {error && (
              <div style={{
                padding: '12px 16px', borderRadius: 'var(--radius-md)',
                background: 'rgba(255,92,43,0.08)', border: '1px solid rgba(255,92,43,0.25)',
                color: 'var(--accent-orange)', fontFamily: 'var(--font-mono)', fontSize: 12,
              }}>
                ⚠ {error}
              </div>
            )}

            <div className="form-submit">
              <button
                className="btn-primary"
                onClick={handleSubmit}
                disabled={loading}
                style={{
                  width: '100%', justifyContent: 'center',
                  background: loading
                    ? 'rgba(181,123,255,0.3)'
                    : 'linear-gradient(135deg, var(--accent-violet), #8b5cf6)',
                  boxShadow: loading ? 'none' : '0 8px 32px rgba(181,123,255,0.3)',
                  cursor: loading ? 'not-allowed' : 'none',
                }}
              >
                {loading ? '⟳ Running LSTM Inference...' : '🚀 Predict My Journey'}
              </button>
            </div>
          </div>
        </div>

        {/* Results Card */}
        <div className="model-results-card">
          <div className="model-input-card__title">
            <span>📊</span> Prediction Results
          </div>

          {!loading && !result && (
            <div className="results-empty">
              <div className="results-empty__icon">🧠</div>
              <div className="results-empty__text">
                LSTM model ready<br />
                Fill in journey details<br />
                and run prediction
              </div>
            </div>
          )}

          {loading && (
            <div className="model-loading">
              <div className="model-loading__ring" />
              <div className="model-loading__text">RUNNING INFERENCE</div>
              <div className="model-loading__sub">
                Processing historical patterns →<br />
                Computing congestion forecast →<br />
                Optimizing departure window...
              </div>
            </div>
          )}

          {result && !loading && (
            <div>
              {/* Confidence */}
              <div className="result-section">
                <div className="result-section__title">Model Confidence</div>
                <div className="confidence-gauge">
                  <div className="confidence-gauge__bar">
                    <div
                      className="confidence-gauge__fill"
                      style={{ width: `${confidenceAnim}%` }}
                    />
                  </div>
                  <div className="confidence-gauge__value">{result.confidence}%</div>
                </div>
              </div>

              {/* Metrics */}
              <div className="result-section">
                <div className="result-section__title">Journey Forecast</div>
                <div className="result-metrics">
                  <div className="result-metric">
                    <div className="result-metric__label">Predicted ETA</div>
                    <div className="result-metric__value" style={{ color: 'var(--accent-cyan)' }}>{result.eta} min</div>
                  </div>
                  <div className="result-metric">
                    <div className="result-metric__label">Traffic Level</div>
                    <div className="result-metric__value" style={{ color: result.congestionColor }}>{result.congestionLabel}</div>
                  </div>
                  <div className="result-metric">
                    <div className="result-metric__label">Optimal Departure</div>
                    <div className="result-metric__value" style={{ color: 'var(--accent-gold)' }}>{result.optimalDeparture}</div>
                  </div>
                  <div className="result-metric">
                    <div className="result-metric__label">Parking (min)</div>
                    <div className="result-metric__value" style={{ color: 'var(--accent-violet)' }}>{result.parkingEstimate}</div>
                  </div>
                </div>
              </div>

              {/* Best Route */}
              <div className="result-section">
                <div className="result-section__title">Recommended Route</div>
                <div className="route-recommendation">
                  <div className="route-recommendation__badge">✓ AI RECOMMENDED</div>
                  <div className="route-recommendation__route">{result.bestRoute}</div>
                  <div className="route-recommendation__detail">{result.departureAdvice}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Model Info */}
      <div className="model-info" ref={infoRef}>
        {MODEL_INFO_CARDS.map((card, i) => (
          <div
            key={card.title}
            className="model-info-card"
            style={{
              opacity: infoInView ? 1 : 0,
              transform: infoInView ? 'translateY(0)' : 'translateY(30px)',
              transition: `all 0.7s ease ${i * 120}ms`,
            }}
          >
            <div className="model-info-card__icon">{card.icon}</div>
            <div className="model-info-card__title">{card.title}</div>
            <div className="model-info-card__desc">{card.desc}</div>
          </div>
        ))}
      </div>
    </main>
  )
}
