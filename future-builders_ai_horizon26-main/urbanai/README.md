# UrbanAI — Predictive Urban Navigation System

AI-driven urban navigation using LSTM neural networks, built with **Vite + React**.

## Project Structure

```
src/
├── App.jsx                        # Router, custom cursor, layout
├── main.jsx                       # Entry point
├── styles/
│   └── global.css                 # Design tokens, resets, animations
├── hooks/
│   └── useInView.js               # Scroll reveal + count-up hooks
├── data/
│   └── constants.js               # Shared data (routes, features, team)
├── components/
│   ├── Navbar/
│   │   ├── Navbar.jsx
│   │   └── Navbar.css
│   └── ScrollProgress/
│       ├── ScrollProgress.jsx
│       └── ScrollProgress.css
└── pages/
    ├── Home/
    │   ├── Home.jsx               # Hero, live route cards
    │   └── Home.css
    ├── Features/
    │   ├── Features.jsx           # Feature cards, comparison table
    │   └── Features.css
    ├── HowItWorks/
    │   ├── HowItWorks.jsx         # Step-by-step, arch diagram, tech stack
    │   └── HowItWorks.css
    ├── Dashboard/
    │   ├── Dashboard.jsx          # Live traffic chart, routes, parking, planner
    │   └── Dashboard.css
    ├── ModelService/
    │   ├── ModelService.jsx       # AI model input form + results panel
    │   └── ModelService.css
    └── About/
        ├── About.jsx              # Problem statement, stats, team, CTA
        └── About.css
```

## Setup

```bash
npm install
npm run dev
```

## Connecting Your Trained Model

Open `src/pages/ModelService/ModelService.jsx` and find the `handleSubmit` function.

Replace the `mockPredict(formData)` call with your real API:

```js
const res = await fetch('https://your-model-api.com/predict', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    origin: formData.origin,
    destination: formData.destination,
    departure_time: formData.departureTime,
    mode: formData.mode,
    arrival_buffer_min: parseInt(formData.arrivalBuffer),
  }),
})
const result = await res.json()
// result should contain: confidence, eta, trafficLevel, congestionLabel,
// congestionColor, optimalDeparture, parkingEstimate, bestRoute, departureAdvice
```

## Design Tokens

All design tokens are in `src/styles/global.css` under `:root {}`.
Customize colors, fonts, spacing from one place.

## Tech Stack

- **React 18** + **Vite 5**
- **React Router v6**
- **Recharts** (charts)
- **JetBrains Mono** + **Bebas Neue** + **Syne** (fonts)
- **CSS Custom Properties** (design tokens)
- **IntersectionObserver** (scroll animations)
