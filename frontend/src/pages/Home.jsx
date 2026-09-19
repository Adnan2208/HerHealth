import { Link } from 'react-router-dom'
import { t } from '../i18n.js'
import { AudioButton } from '../components/UI.jsx'

export default function Home({ lang }) {
  return (
    <section aria-labelledby="home-title">
      <div className="card card-warm">
        <h2 id="home-title" style={{ marginTop: 0 }}>{t(lang, 'welcome')}</h2>
        <p className="muted">{t(lang, 'homeSub')}</p>
        <AudioButton text={`${t(lang, 'welcome')}. ${t(lang, 'homeSub')}`} lang={lang} />
      </div>

      <Link className="btn btn-primary" to="/scan" aria-label={t(lang, 'checkAnemia')}>{t(lang, 'checkAnemia')}</Link>
      <div className="grid2">
        <Link className="btn btn-secondary" to="/learn" aria-label={t(lang, 'learnPeriods')}>{t(lang, 'learnPeriods')}</Link>
        <Link className="btn btn-secondary" to="/diet" aria-label={t(lang, 'dietTips')}>{t(lang, 'dietTips')}</Link>
      </div>
      <div className="grid2">
        <Link className="btn btn-secondary" to="/hospitals" aria-label={t(lang, 'findHospital')}>{t(lang, 'findHospital')}</Link>
        <Link className="btn btn-secondary" to="/history" aria-label={t(lang, 'history')}>🕘 {t(lang, 'history')}</Link>
      </div>
      <Link className="btn btn-secondary" to="/asha" aria-label={t(lang, 'asha')}>👩‍⚕️ {t(lang, 'asha')} Dashboard</Link>

      <div className="alert alert-info" role="note">{t(lang, 'privacyNote')}</div>
      <p className="muted center">🔌 {!navigator.onLine ? 'Offline — results will sync when back online.' : 'Online. Photos are renamed to image.png on the server, then analyzed.'}</p>
    </section>
  )
}
