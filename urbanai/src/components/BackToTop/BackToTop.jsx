import { useState, useEffect } from 'react'
import './BackToTop.css'

export default function BackToTop() {
    const [visible, setVisible] = useState(false)

    useEffect(() => {
        const fn = () => setVisible(window.scrollY > 400)
        window.addEventListener('scroll', fn, { passive: true })
        return () => window.removeEventListener('scroll', fn)
    }, [])

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    return (
        <button
            className={`back-to-top ${visible ? 'visible' : ''}`}
            onClick={scrollToTop}
            aria-label="Back to top"
            data-hover
        >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="18 15 12 9 6 15" />
            </svg>
        </button>
    )
}
