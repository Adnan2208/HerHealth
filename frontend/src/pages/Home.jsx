import { Link } from 'react-router-dom'
import { t } from '../i18n.js'
import { AudioButton, Icon } from '../components/UI.jsx'

// Visual-only helper: i18n control labels carry a legacy leading emoji
// (kept in i18n.js as the copy source); the SVG tile is the visual icon.
const plain = (s) => String(s || '').replace(/^[^\p{L}\p{N}]+/u, '').trim() || s

export default function Home({ lang }) {
  const online = navigator.onLine
  return (
    <section aria-labelledby="home-title" className="stack">
      <div className="card card-warm hero">
        <span className="eyebrow"><Icon name="heartHandshake" /> Your health friend</span>
        <h2 id="home-title">{t(lang, 'welcome')}</h2>
        <p className="muted">{t(lang, 'homeSub')}</p>
        <AudioButton text={`${t(lang, 'welcome')}. ${t(lang, 'homeSub')}`} lang={lang} />
      </div>

      <div className="menu">
        <Link className="menu-item primary" to="/scan" aria-label={plain(t(lang, 'checkAnemia'))}>
          <span className="icon-tile" aria-hidden="true"><Icon name="camera" /></span>
          <span className="menu-text">{plain(t(lang, 'checkAnemia'))}
            <span className="menu-sub">Eyelid photo, about 1 minute</span>
          </span>
          <span className="menu-chev" aria-hidden="true"><Icon name="chevronRight" /></span>
        </Link>
      </div>

      <div className="split">
      <div className="menu" aria-label="Learn">
        <Link className="menu-item" to="/learn" aria-label={plain(t(lang, 'learnPeriods'))}>
          <span className="icon-tile" aria-hidden="true"><Icon name="book" /></span>
          <span className="menu-text">{plain(t(lang, 'learnPeriods'))}
            <span className="menu-sub">Pictures + voice, 2 min each</span>
          </span>
          <span className="menu-chev" aria-hidden="true"><Icon name="chevronRight" /></span>
        </Link>
        <Link className="menu-item" to="/diet" aria-label={plain(t(lang, 'dietTips'))}>
          <span className="icon-tile" aria-hidden="true"><Icon name="bowl" /></span>
          <span className="menu-text">{plain(t(lang, 'dietTips'))}
            <span className="menu-sub">Iron-rich foods at home</span>
          </span>
          <span className="menu-chev" aria-hidden="true"><Icon name="chevronRight" /></span>
        </Link>
      </div>

      <div className="menu" aria-label="Nearby help">
        <Link className="menu-item" to="/hospitals" aria-label={plain(t(lang, 'findHospital'))}>
          <span className="icon-tile" aria-hidden="true"><Icon name="pin" /></span>
          <span className="menu-text">{plain(t(lang, 'findHospital'))}
            <span className="menu-sub">Clinics near you</span>
          </span>
          <span className="menu-chev" aria-hidden="true"><Icon name="chevronRight" /></span>
        </Link>
        <Link className="menu-item" to="/history" aria-label={plain(t(lang, 'history'))}>
          <span className="icon-tile" aria-hidden="true"><Icon name="clock" /></span>
          <span className="menu-text">{plain(t(lang, 'history'))}
            <span className="menu-sub">Your past checks</span>
          </span>
          <span className="menu-chev" aria-hidden="true"><Icon name="chevronRight" /></span>
        </Link>
        <Link className="menu-item" to="/asha" aria-label={`${plain(t(lang, 'asha'))} Dashboard`}>
          <span className="icon-tile" aria-hidden="true"><Icon name="users" /></span>
          <span className="menu-text">{plain(t(lang, 'asha'))} Dashboard
            <span className="menu-sub">For health workers</span>
          </span>
          <span className="menu-chev" aria-hidden="true"><Icon name="chevronRight" /></span>
        </Link>
      </div>
      </div>

      <div className="alert alert-info" role="note">
        <Icon name="shield" />
        <span>{plain(t(lang, 'privacyNote'))}</span>
      </div>
      <p className={online ? 'status-line' : 'offline-bar'}>
        <Icon name="signal" />
        <span>{online ? 'Online. Photos are renamed to image.png on the server, then analyzed.' : 'Offline. Results will sync when back online.'}</span>
      </p>
    </section>
  )
}
