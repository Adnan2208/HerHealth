import { Link } from 'react-router-dom'
import { t } from '../i18n.js'
import { AudioButton } from '../components/UI.jsx'

const STEPS = [
  { e: '📚', en: 'Learn about periods — pictures + voice, no reading needed', hi: 'मासिक धर्म सीखें — चित्र + आवाज़' },
  { e: '📸', en: 'Photo of lower eyelid — AI checks anemia risk', hi: 'पलक की फोटो — AI एनीमिया जांच' },
  { e: '🔒', en: 'Private by design — you control what is shared', hi: 'पूरी निजता — आपकी अनुमति से ही साझा' },
]

export default function Onboarding({ lang }) {
  const intro = 'NIADA helps you learn about periods and check anemia with an eyelid photo. Your data stays private.'
  return (
    <section aria-labelledby="ob-title">
      <div className="card card-warm center">
        <div className="big-emoji" aria-hidden="true">🩸🤝</div>
        <h2 id="ob-title" style={{ margin: '8px 0' }}>{t(lang, 'welcome')}</h2>
        <p className="muted">{t(lang, 'homeSub')}</p>
        <AudioButton text={intro} lang={lang} />
      </div>
      {STEPS.map((s, i) => (
        <div className="card row" key={i}>
          <div className="big-emoji" aria-hidden="true">{s.e}</div>
          <div><strong>Step {i + 1}</strong><br />{lang === 'hi' ? s.hi : s.en}</div>
        </div>
      ))}
      <Link className="btn btn-primary" to="/language" aria-label={t(lang, 'start')}>{t(lang, 'start')}</Link>
      <div className="alert alert-info" role="note">{t(lang, 'privacyNote')}</div>
    </section>
  )
}
