import { Link } from 'react-router-dom'
import './Footer.css'

const FOOTER_NAV = [
    { label: 'Home', path: '/' },
    { label: 'Features', path: '/features' },
    { label: 'How It Works', path: '/how-it-works' },
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'AI Model', path: '/model' },
    { label: 'About', path: '/about' },
]

export default function Footer() {
    return (
        <footer className="site-footer">
            <div className="site-footer__glow" />
            <div className="site-footer__inner">
                <div className="site-footer__brand">
                    <div className="site-footer__logo">
                        <div className="site-footer__logo-icon">🏙</div>
                        <span className="site-footer__logo-text">URBAN<span>AI</span></span>
                    </div>
                    <p className="site-footer__tagline">
                        AI-powered predictive navigation for Mumbai's 20M+ daily commuters.
                        Built with LSTM neural networks and real-time city data.
                    </p>
                    <div className="site-footer__status">
                        <span className="site-footer__status-dot" />
                        LSTM MODEL v2.1.4 · ONLINE
                    </div>
                </div>

                <div className="site-footer__nav">
                    <div className="site-footer__nav-title">Navigation</div>
                    <ul className="site-footer__nav-list">
                        {FOOTER_NAV.map(item => (
                            <li key={item.path}>
                                <Link to={item.path} className="site-footer__nav-link">
                                    {item.label}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="site-footer__tech">
                    <div className="site-footer__nav-title">Built With</div>
                    <div className="site-footer__tech-tags">
                        {['React + Vite', 'TensorFlow LSTM', 'FastAPI', 'MongoDB', 'WebSocket'].map(t => (
                            <span key={t} className="site-footer__tech-tag">{t}</span>
                        ))}
                    </div>
                </div>
            </div>

            <div className="site-footer__bottom">
                <div className="site-footer__bottom-inner">
                    <span>© {new Date().getFullYear()} UrbanAI · Academic Research Project</span>
                    <span className="site-footer__bottom-credits">
                        Predictive Urban Mobility · Mumbai, India
                    </span>
                </div>
            </div>
        </footer>
    )
}
