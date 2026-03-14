export const TRAFFIC_DATA = [
  { time: '6AM', level: 18 }, { time: '7AM', level: 52 },
  { time: '8AM', level: 91 }, { time: '9AM', level: 78 },
  { time: '10AM', level: 44 }, { time: '11AM', level: 31 },
  { time: '12PM', level: 55 }, { time: '1PM', level: 62 },
  { time: '2PM', level: 38 }, { time: '3PM', level: 34 },
  { time: '4PM', level: 68 }, { time: '5PM', level: 97 },
  { time: '6PM', level: 88 }, { time: '7PM', level: 58 },
  { time: '8PM', level: 32 },
]

export const ROUTES = [
  { name: 'Marine Drive → BKC', status: 'Optimal', eta: '22 min', traffic: 28, color: 'var(--accent-cyan)' },
  { name: 'Andheri → Churchgate', status: 'Congested', eta: '51 min', traffic: 87, color: 'var(--accent-orange)' },
  { name: 'Thane → Powai', status: 'Moderate', eta: '34 min', traffic: 54, color: 'var(--accent-gold)' },
  { name: 'Dadar → Bandra', status: 'Optimal', eta: '18 min', traffic: 31, color: 'var(--accent-cyan)' },
  { name: 'Borivali → Nariman Point', status: 'Peak', eta: '68 min', traffic: 95, color: 'var(--accent-orange)' },
]

export const PARKING_ZONES = [
  { name: 'BKC P1', available: 45, total: 120, dist: '0.2 km', predicted: 'Filling fast' },
  { name: 'MMRDA Ground', available: 8, total: 200, dist: '0.5 km', predicted: 'Near full' },
  { name: 'BKC P3 (Recommended)', available: 67, total: 80, dist: '0.8 km', predicted: 'Available' },
  { name: 'G Block Lot', available: 0, total: 50, dist: '1.1 km', predicted: 'Full' },
]

export const FEATURES = [
  {
    id: 'traffic',
    icon: '🧠',
    color: 'var(--accent-cyan)',
    colorRaw: '#00ffe7',
    title: 'Predictive Traffic Forecasting',
    tagline: 'See congestion before it happens',
    stat: '92%',
    statLabel: 'Forecast Accuracy',
    desc: 'Our LSTM neural network processes 5+ years of Mumbai traffic patterns, weather data, and event schedules to predict congestion with high accuracy up to 2 hours ahead.',
    bullets: ['LSTM deep learning architecture', 'Trained on 5+ years historical data', 'Weather & event-aware', '2-hour prediction window'],
  },
  {
    id: 'departure',
    icon: '⚡',
    color: 'var(--accent-orange)',
    colorRaw: '#ff5c2b',
    title: 'Smart Departure Planning',
    tagline: 'Leave at exactly the right moment',
    stat: '38%',
    statLabel: 'Avg. Time Saved',
    desc: 'The system computes optimal departure windows by combining predicted traffic with your schedule, preferred arrival buffer, and real-time road events — so you never have to guess.',
    bullets: ['Personalized departure windows', 'Schedule-aware optimization', 'Multi-mode transport support', 'Push notification reminders'],
  },
  {
    id: 'parking',
    icon: '🅿️',
    color: 'var(--accent-violet)',
    colorRaw: '#b57bff',
    title: 'Parking Intelligence',
    tagline: 'Never circle the block again',
    stat: '5 min',
    statLabel: 'Avg. Parking Time',
    desc: 'Real-time parking availability combined with ML-predicted demand forecasts help you secure a spot before you even arrive at your destination.',
    bullets: ['Real-time slot availability', 'Predictive demand forecasting', 'Pre-booking recommendations', 'Walking distance optimization'],
  },
  {
    id: 'personalized',
    icon: '🎯',
    color: 'var(--accent-gold)',
    colorRaw: '#f5c842',
    title: 'Personalized Learning',
    tagline: 'Gets smarter the more you use it',
    stat: '3×',
    statLabel: 'Better Over Time',
    desc: 'A continuously learning preference model adapts to your unique travel behavior — favorite routes, time tolerances, parking preferences — delivering hyper-personalized results.',
    bullets: ['Behavioral pattern recognition', 'Preference-based routing', 'Adaptive feedback loop', 'Privacy-first on-device learning'],
  },
]

export const TECH_STACK = [
  { category: 'ML / AI', items: ['LSTM (TensorFlow)', 'Scikit-learn', 'NumPy / Pandas', 'Jupyter Notebooks'] },
  { category: 'Backend', items: ['Python (FastAPI)', 'Node.js', 'MongoDB', 'Redis Cache'] },
  { category: 'Frontend', items: ['React + Vite', 'Recharts', 'React Router', 'CSS Modules'] },
  { category: 'Data', items: ['Google Maps API', 'OpenWeather API', 'GTFS Transit', 'WebSocket Streams'] },
]

export const TEAM = [
  { name: 'Harsh Chauhan', role: 'ML Engineer', emoji: '👨‍💻', focus: 'LSTM Architecture & Training' },
  { name: 'Soham Pawaskar', role: 'Backend Dev', emoji: '👩‍💻', focus: 'API & Real-time Systems' },
  { name: 'Shreeraj Jagtap', role: 'Data Scientist', emoji: '👨‍🔬', focus: 'Data Pipeline & Analysis' },
  { name: 'Manas Londhe', role: 'UI/UX Designer', emoji: '👩‍🎨', focus: 'Design System & Frontend' },
]
