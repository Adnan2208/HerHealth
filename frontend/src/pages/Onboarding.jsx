import { Link } from 'react-router-dom'
import { t } from '../i18n.js'
import { AudioButton, Icon, plain, stripEmoji } from '../components/UI.jsx'
import { HeroIllustration, TrustArt } from '../components/Illustrations.jsx'

const STEPS = [
  { icon: 'book', en: 'Learn about periods: pictures + voice, no reading needed', hi: 'मासिक धर्म सीखें: चित्र + आवाज़' },
  { icon: 'camera', en: 'Photo of lower eyelid: AI checks anemia risk', hi: 'पलक की फोटो: AI एनीमिया जांच' },
  { icon: 'shield', en: 'Private by design: you control what is shared', hi: 'पूरी निजता: आपकी अनुमति से ही साझा' },
]

export default function Onboarding({ lang }) {
  const intro = 'HerHealth Ecosystem helps you learn about periods and check anemia with an eyelid photo. Your data stays private.'
  return (
    <section aria-labelledby="ob-title" className="stack narrow">
      <div className="card card-warm hero center">
        <div className="hero-art" aria-hidden="true" style={{ width: 'min(100%, 280px)' }}>
          <HeroIllustration />
        </div>
        <h2 id="ob-title" className="display-title">{stripEmoji(t(lang, 'welcome'))}</h2>
        <p className="muted">{t(lang, 'homeSub')}</p>
        <div className="hero-actions">
          <AudioButton text={intro} lang={lang} />
        </div>
      </div>
      <div className="ob-steps">
      {STEPS.map((s, i) => (
        <div className="card row" key={i} style={{ alignItems: 'flex-start' }}>
          <span className="step-num" aria-hidden="true">{i + 1}</span>
          <span className="icon-tile" aria-hidden="true"><Icon name={s.icon} /></span>
          <div><strong>Step {i + 1}</strong><br />{lang === 'hi' ? s.hi : s.en}</div>
        </div>
      ))}
      </div>
      <Link className="btn btn-primary" to="/language" aria-label={stripEmoji(t(lang, 'start'))}>
        {plain(t(lang, 'start'))} <Icon name="arrowRight" />
      </Link>
      <div className="trust" role="note">
        <TrustArt mini />
        <span>{plain(t(lang, 'privacyNote'))}</span>
      </div>
    </section>
  )
}
