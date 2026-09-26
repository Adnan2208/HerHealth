import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { HashRouter, NavLink, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { LANGS, t } from './i18n.js'
import { store } from './lib/api.js'
import { stopSpeak } from './lib/speech.js'
import { Icon, plain } from './components/UI.jsx'
import Onboarding from './pages/Onboarding.jsx'
import Language from './pages/Language.jsx'
import Home from './pages/Home.jsx'
import Scan from './pages/Scan.jsx'
import Symptoms from './pages/Symptoms.jsx'
import Results from './pages/Results.jsx'
import Education, { EduPlayer } from './pages/Education.jsx'
import Asha from './pages/Asha.jsx'
import Hospitals from './pages/Hospitals.jsx'
import Diet from './pages/Diet.jsx'
import History from './pages/History.jsx'
import Settings from './pages/Settings.jsx'

function useProfile() {
  const [prof, setProf] = useState(() => ({ lang: 'en', textSize: 'm', talkback: true, ashaPhone: '', shareForCare: true, ...store.profile() }))
  useEffect(() => {
    document.body.classList.toggle('text-lg', prof.textSize === 'l')
    document.body.classList.toggle('text-xl', prof.textSize === 'xl')
    document.documentElement.lang = prof.lang
  }, [prof])
  const save = (p) => { const next = { ...prof, ...p }; setProf(next); store.saveProfile(next) }
  return [prof, save]
}

const TABS = [
  { to: '/home', key: 'home', icon: 'home' },
  { to: '/learn', key: 'learn', icon: 'book' },
  { to: '/scan', key: 'scan', icon: 'camera', fab: true },
  { to: '/diet', key: 'diet', icon: 'bowl' },
  { to: '/settings', key: 'more', icon: 'settings' },
]

function Tabbar({ lang }) {
  const loc = useLocation()
  const innerRef = useRef(null)
  const [indicator, setIndicator] = useState({ left: 0, width: 0 })

  useLayoutEffect(() => {
    const measure = () => {
      const el = innerRef.current
      if (!el) return
      const active = el.querySelector('a.active')
      if (!active) { setIndicator({ left: 0, width: 0 }); return }
      setIndicator({ left: active.offsetLeft, width: active.offsetWidth })
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [loc.pathname])

  return (
    <nav className="tabbar" aria-label="Main navigation">
      <div className="tabbar-inner" ref={innerRef}>
        {indicator.width > 0 && (
          <span className="tab-indicator" aria-hidden="true" style={{ left: indicator.left, width: indicator.width }} />
        )}
        {TABS.map((tab) => (
          <NavLink
            key={tab.to} to={tab.to}
            className={({ isActive }) => `${isActive ? 'active' : ''}${tab.fab ? ' tab-scan' : ''}`}
            aria-label={plain(t(lang, tab.key))}
          >
            <Icon name={tab.icon} />{plain(t(lang, tab.key))}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}

function Shell() {
  const [prof, save] = useProfile()
  const lang = prof.lang
  const nav = useNavigate()
  const loc = useLocation()

  useEffect(() => {
    // stop narration on every route change (predictable audio behavior)
    stopSpeak()
  }, [loc.pathname])

  const hideNav = loc.pathname === '/' || loc.pathname === '/language'

  return (
    <div className="app">
      <header className="topbar" role="banner">
        <div className="topbar-inner">
        <button className="icon-btn" aria-label="Back" onClick={() => nav(-1)} type="button">
          <Icon name="back" />
        </button>
        <span className="brand-mark" aria-hidden="true"><Icon name="droplet" /></span>
        <div className="topbar-titles">
          <h1>{t(lang, 'appName')}</h1>
          <div className="sub">{t(lang, 'tagline')}</div>
        </div>
        <div style={{ marginLeft: 'auto' }} className="row">
          <span className="badge-note" aria-label="Selected language">
            {(LANGS.find(l => l.code === lang) || LANGS[0]).native}
          </span>
        </div>
        </div>
      </header>

      <div className="app-shell">
      <main className="content" id="main" tabIndex={-1}>
        <Routes>
          <Route path="/" element={<Onboarding lang={lang} />} />
          <Route path="/language" element={<Language lang={lang} save={save} />} />
          <Route path="/home" element={<Home lang={lang} prof={prof} />} />
          <Route path="/scan" element={<Scan lang={lang} prof={prof} />} />
          <Route path="/symptoms" element={<Symptoms lang={lang} prof={prof} />} />
          <Route path="/results" element={<Results lang={lang} prof={prof} />} />
          <Route path="/learn" element={<Education lang={lang} />} />
          <Route path="/learn/:id" element={<EduPlayer lang={lang} />} />
          <Route path="/asha" element={<Asha lang={lang} />} />
          <Route path="/hospitals" element={<Hospitals lang={lang} />} />
          <Route path="/diet" element={<Diet lang={lang} />} />
          <Route path="/history" element={<History lang={lang} />} />
          <Route path="/settings" element={<Settings lang={lang} prof={prof} save={save} />} />
        </Routes>
      </main>
      </div>

      {!hideNav && <Tabbar lang={lang} />}
    </div>
  )
}

export default function App() {
  return (
    <HashRouter>
      <Shell />
    </HashRouter>
  )
}
