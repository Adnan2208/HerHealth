import { useNavigate } from 'react-router-dom'
import { LANGS, t } from '../i18n.js'

export default function Language({ lang, save }) {
  const nav = useNavigate()
  return (
    <section aria-labelledby="lang-title" className="stack narrow">
      <div className="section-head">
      <h2 id="lang-title">🌐 {t(lang, 'language')}</h2>
      <p className="muted">Choose / चुनें / निवडा / தேர்வு / ఎంచుకోండి / বেছে নিন</p>
      </div>
      <div className="lang-grid" role="group" aria-label="Language options">
        {LANGS.map((l) => (
          <button
            key={l.code}
            className="lang-card"
            aria-pressed={lang === l.code}
            aria-label={`${l.label} ${l.native}`}
            onClick={() => save({ lang: l.code })}
            type="button"
          >
            <div style={{ fontSize: 26 }} aria-hidden="true">{l.icon}</div>
            <div>{l.native}</div>
            <div className="muted">{l.label}</div>
          </button>
        ))}
      </div>
      <button className="btn btn-primary" onClick={() => nav('/home')} type="button">{t(lang, 'continue')}</button>
    </section>
  )
}
