import { useState, useEffect } from 'react'
import { TRAFFIC_DATA, ROUTES, PARKING_ZONES } from '../../data/constants.js'
import { useInView } from '../../hooks/useInView.js'
import './Dashboard.css'

function getTrafficColor(level) {
  if (level > 80) return '#ff5c2b'
  if (level > 55) return '#f5c842'
  return '#00ffe7'
}

function getRouteColor(status) {
  if (status === 'Peak' || status === 'Congested') return '#ff5c2b'
  if (status === 'Moderate') return '#f5c842'
  return '#00ffe7'
}

function getParkingColor(pct) {
  if (pct === 0) return '#ff5c2b'
  if (pct < 20) return '#f5c842'
  return '#00ffe7'
}

function LiveClock() {
  const [time, setTime] = useState(new Date())
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  return (
    <div>
      <div className="dashboard-time">
        {time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
      </div>
      <div className="dashboard-date">
        {time.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [barsAnimated, setBarsAnimated] = useState(false)
  const [selectedRoute, setSelectedRoute] = useState(0)
  const [selectedWindow, setSelectedWindow] = useState(0)
  const [chartRef, chartInView] = useInView()
  const [parkRef, parkInView] = useInView()

  useEffect(() => {
    if (chartInView) setTimeout(() => setBarsAnimated(true), 200)
  }, [chartInView])

  const currentHour = new Date().getHours()
  const currentIdx = Math.max(0, Math.min(TRAFFIC_DATA.length - 1, currentHour - 6))

  const KPIS = [
    { label: 'Avg. Travel Time', value: '34 min', delta: '▼ 12% vs yesterday', color: 'var(--accent-cyan)' },
    { label: 'Peak Congestion', value: '97%', delta: '▲ 5-6 PM today', color: 'var(--accent-orange)' },
    { label: 'Parking Available', value: '112', delta: '↗ BKC zone', color: 'var(--accent-violet)' },
    { label: 'Optimal Window', value: '6:45 AM', delta: '✓ Best departure', color: 'var(--accent-gold)' },
  ]

  const DEPARTURE_WINDOWS = [
    { time: '6:45 AM', label: 'Early Window', score: 'Optimal', color: '#00ffe7' },
    { time: '10:30 AM', label: 'Mid Morning', score: 'Good', color: '#b57bff' },
    { time: '2:00 PM', label: 'Afternoon', score: 'Best ETA', color: '#00ffe7' },
  ]

  return (
    <main className="dashboard-page">
      <div className="dashboard-page__header">
        <div className="dashboard-page__title-block">
          <div className="dashboard-page__status">
            <span className="live-dot" />
            <span>Live Intelligence Feed</span>
          </div>
          <h1 className="dashboard-page__h1">PREDICTIVE DASHBOARD</h1>
        </div>
        <LiveClock />
      </div>

      {/* KPI Strip */}
      <div className="kpi-strip">
        {KPIS.map((kpi) => (
          <div key={kpi.label} className="kpi-card">
            <div className="kpi-card__label">{kpi.label}</div>
            <div className="kpi-card__value" style={{ color: kpi.color }}>{kpi.value}</div>
            <div className="kpi-card__delta" style={{ color: 'var(--text-muted)' }}>{kpi.delta}</div>
          </div>
        ))}
      </div>

      {/* Main Grid */}
      <div className="dashboard-grid">

        {/* Traffic Chart */}
        <div className="dash-card traffic-chart" ref={chartRef}>
          <div className="dash-card__label">Traffic Forecast</div>
          <div className="dash-card__title">Mumbai Hourly Congestion Prediction</div>
          <div className="traffic-chart__bars">
            {TRAFFIC_DATA.map((item, i) => {
              const color = getTrafficColor(item.level)
              const isCurrent = i === currentIdx
              return (
                <div key={item.time} className={`traffic-bar ${isCurrent ? 'current' : ''}`}>
                  <div
                    className="traffic-bar__fill"
                    data-val={`${item.level}%`}
                    style={{
                      height: barsAnimated ? `${item.level}%` : '2px',
                      background: isCurrent
                        ? `linear-gradient(to top, ${color}, ${color}cc)`
                        : `linear-gradient(to top, ${color}66, ${color}33)`,
                      color,
                      transition: `height 0.8s cubic-bezier(0.34,1.2,0.64,1) ${i * 40}ms`,
                      border: isCurrent ? `1px solid ${color}` : 'none',
                    }}
                  />
                  <div className="traffic-bar__label">{item.time}</div>
                </div>
              )
            })}
          </div>
          <div className="chart-legend">
            {[['#00ffe7', 'Low (0–50%)'], ['#f5c842', 'Moderate (50–80%)'], ['#ff5c2b', 'High / Peak (80%+)']].map(([color, label]) => (
              <div key={label} className="chart-legend__item">
                <div className="chart-legend__dot" style={{ background: color }} />
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* Routes */}
        <div className="dash-card routes-card">
          <div className="dash-card__label">Active Routes</div>
          <div className="dash-card__title">Mumbai Corridors</div>
          {ROUTES.map((route, i) => {
            const color = getRouteColor(route.status)
            return (
              <div
                key={route.name}
                className={`route-item ${selectedRoute === i ? 'active' : ''}`}
                onClick={() => setSelectedRoute(i)}
              >
                <div className="route-item__top">
                  <div className="route-item__name">{route.name}</div>
                  <div className="route-item__badge" style={{ color, background: color + '15', borderColor: color + '30' }}>
                    {route.status}
                  </div>
                </div>
                <div className="route-item__bar-bg">
                  <div className="route-item__bar-fill" style={{ width: `${route.traffic}%`, background: color }} />
                </div>
                <div className="route-item__eta">⏱ ETA {route.eta} · {route.traffic}% congestion</div>
              </div>
            )
          })}
        </div>

        {/* Parking */}
        <div className="dash-card" ref={parkRef}>
          <div className="dash-card__label">Parking Intelligence</div>
          <div className="dash-card__title">BKC Zone Availability</div>
          {PARKING_ZONES.map((zone, i) => {
            const pct = zone.total > 0 ? Math.round((zone.available / zone.total) * 100) : 0
            const color = getParkingColor(pct)
            return (
              <div key={zone.name} className="parking-item">
                <div className="parking-item__header">
                  <div className="parking-item__name">{zone.name}</div>
                  <div className="parking-item__info" style={{ color }}>
                    {zone.available === 0 ? 'FULL' : `${zone.available}/${zone.total}`} · {zone.dist}
                  </div>
                </div>
                <div className="parking-item__bar-bg">
                  <div
                    className="parking-item__bar-fill"
                    style={{
                      width: parkInView ? `${pct}%` : '0%',
                      background: color,
                      transition: `width 1s ease ${i * 150}ms`,
                    }}
                  />
                </div>
                <div className="parking-item__predicted">{zone.predicted}</div>
              </div>
            )
          })}
        </div>

        {/* Departure Planner */}
        <div className="dash-card departure-card">
          <div className="dash-card__label">Smart Departure Planner</div>
          <div className="departure-card__inner">
            <div>
              <div className="dash-card__title" style={{ marginBottom: 8 }}>Best Times to Leave Today</div>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', fontFamily: 'var(--font-ui)', lineHeight: 1.6 }}>
                Computed from predicted traffic + parking demand for your usual BKC destination.
              </p>
            </div>
            <div className="departure-card__windows">
              {DEPARTURE_WINDOWS.map((w, i) => (
                <div
                  key={w.time}
                  className={`departure-window ${selectedWindow === i ? 'selected' : ''}`}
                  onClick={() => setSelectedWindow(i)}
                  style={{
                    '--window-color': w.color,
                    borderColor: w.color + '30',
                    background: selectedWindow === i ? w.color + '08' : 'transparent',
                  }}
                >
                  <span className="departure-window__time">{w.time}</span>
                  <span className="departure-window__label">{w.label}</span>
                  <span className="departure-window__score">{w.score}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
