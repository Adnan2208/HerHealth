import { useNavigate } from 'react-router-dom'
import { LANGS, t } from '../i18n.js'
import { Icon, plain } from '../components/UI.jsx'

export default function Language({ lang, save }) {
  const nav = useNavigate()
  return (
    <section aria-labelledby="lang-title" className="stack narrow">
      <div className="section-head">
        <span className="eyebrow"><Icon name="globe" /> Language</span>
        <h2 id="lang-title" className="display-title">{plain(t(lang, 'language'))}</h2>
        <p className="muted section-sub">Choose / चुनें / निवडा / தேர்வு / ఎంచుకోండి / বেছে নিন</p>
      </div>
      <div className="lang-grid" role="group" aria-label="Language options">
        {LANGS.map((l) => {
          const active = lang === l.code
          return (
            <button
              key={l.code}
              className="lang-card"
              aria-pressed={active}
              aria-label={`${l.label} ${l.native}`}
              onClick={() => save({ lang: l.code })}
              type="button"
            >
              {active && <span className="lang-check" aria-hidden="true"><Icon name="check" /></span>}
              <div className="lang-native">{l.native}</div>
              <div className="muted">{l.label}</div>
            </button>
          )
        })}
      </div>
      <button className="btn btn-primary" onClick={() => nav('/home')} type="button">
        {plain(t(lang, 'continue'))} <Icon name="arrowRight" />
      </button>
    </section>
  )
}
