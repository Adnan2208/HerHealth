import { Link } from 'react-router-dom'
import { t } from '../i18n.js'
import { AudioButton, Icon, plain, stripEmoji } from '../components/UI.jsx'
import { EyeArt, FoodArt, HeroIllustration, StoryArt } from '../components/Illustrations.jsx'

export default function Home({ lang }) {
  const online = navigator.onLine
  return (
    <section aria-labelledby="home-title" className="stack">
      {/* Marquee hero: the pitch, the product, the single action */}
      <div className="hero-premium">
        <div className="hero-premium-grid">
          <div className="hero-copy">
            <span className="eyebrow"><Icon name="heartHandshake" /> Namaste, your health friend</span>
            <h1 id="home-title">Welcome to <em>HerHealth</em> Ecosystem</h1>
            <p className="lede">Here you can learn about periods, and take a non-invasive Hb test in about 1 minute. Pictures and voice guide you. No reading needed.</p>
            <div className="hero-cta-row">
              <Link className="btn btn-light" to="/scan" aria-label={plain(t(lang, 'checkAnemia'))}>
                <Icon name="camera" /> {plain(t(lang, 'checkAnemia'))}
              </Link>
              <AudioButton
                text={`Welcome to HerHealth Ecosystem. Here you can learn about periods, and take a non-invasive Hb test in about 1 minute. ${stripEmoji(t(lang, 'homeSub'))}`}
                lang={lang}
              />
            </div>
          </div>
          <div className="hero-visual" aria-hidden="true">
            <HeroIllustration />
            <span className="float-chip float-chip-a"><Icon name="bolt" /> AI Hb check</span>
            <span className="float-chip float-chip-b"><Icon name="shield" /> 100% private</span>
          </div>
        </div>
        <div className="hero-stats">
          <div><strong>1-min</strong><span>Non-invasive Hb test</span></div>
          <div><strong>8</strong><span>Voice stories on periods</span></div>
          <div><strong>100%</strong><span>Private, you decide</span></div>
        </div>
      </div>

      {/* The one action: scan promo with art + 3 tiny steps */}
      <div className="card scan-promo stack">
        <div className="split" style={{ alignItems: 'center' }}>
          <div className="promo-art" aria-hidden="true">
            <EyeArt variant="guide" />
          </div>
          <div className="stack">
            <span className="eyebrow"><Icon name="camera" /> Start here</span>
            <h3>Check your Hb in 3 tiny steps</h3>
            <div className="promo-steps">
              <div className="promo-step">
                <span className="icon-tile" aria-hidden="true"><Icon name="camera" /></span>
                <div><strong>1. Photo</strong><span className="muted">Eyelid down, one clear shot</span></div>
              </div>
              <div className="promo-step">
                <span className="icon-tile" aria-hidden="true"><Icon name="clipboard" /></span>
                <div><strong>2. Symptoms</strong><span className="muted">Tap pictures, no typing</span></div>
              </div>
              <div className="promo-step">
                <span className="icon-tile" aria-hidden="true"><Icon name="sparkles" /></span>
                <div><strong>3. Result</strong><span className="muted">Risk level + next step</span></div>
              </div>
            </div>
            <Link className="btn btn-primary" to="/scan" aria-label={plain(t(lang, 'checkAnemia'))}>
              <Icon name="camera" /> {plain(t(lang, 'checkAnemia'))} <Icon name="arrowRight" />
            </Link>
            <span className="muted">About 1 minute. Eyelid photo only, no blood.</span>
          </div>
        </div>
      </div>

      {/* Explore: visual cards, not a list */}
      <div className="section-head">
        <span className="eyebrow"><Icon name="sparkles" /> Keep exploring</span>
        <h2 className="section-title">Learn, eat, find care</h2>
      </div>
      <div className="explore-rail">
        <Link className="explore-card" to="/learn" aria-label={plain(t(lang, 'learnPeriods'))}>
          <div className="explore-art" aria-hidden="true"><StoryArt id="t1" /></div>
          <div className="explore-body">
            <strong>{plain(t(lang, 'learnPeriods'))}</strong>
            <span className="muted">Pictures + voice, 2 min each</span>
            <span className="explore-go">Start <Icon name="arrowRight" /></span>
          </div>
        </Link>
        <Link className="explore-card" to="/diet" aria-label={plain(t(lang, 'dietTips'))}>
          <div className="explore-art" aria-hidden="true"><FoodArt id="dal" /></div>
          <div className="explore-body">
            <strong>{plain(t(lang, 'dietTips'))}</strong>
            <span className="muted">Iron-rich foods at home</span>
            <span className="explore-go">View <Icon name="arrowRight" /></span>
          </div>
        </Link>
        <Link className="explore-card" to="/hospitals" aria-label={plain(t(lang, 'findHospital'))}>
          <div className="explore-art" aria-hidden="true"><Icon name="pin" /></div>
          <div className="explore-body">
            <strong>{plain(t(lang, 'findHospital'))}</strong>
            <span className="muted">Clinics near you</span>
            <span className="explore-go">Locate <Icon name="arrowRight" /></span>
          </div>
        </Link>
      </div>

      <div className="slim-links">
        <Link className="slim-link" to="/history" aria-label={plain(t(lang, 'history'))}>
          <Icon name="clock" /> {plain(t(lang, 'history'))}
          <span className="menu-chev" aria-hidden="true"><Icon name="chevronRight" /></span>
        </Link>
        <Link className="slim-link" to="/asha" aria-label={`${plain(t(lang, 'asha'))} Dashboard`}>
          <Icon name="users" /> {plain(t(lang, 'asha'))} Dashboard
          <span className="menu-chev" aria-hidden="true"><Icon name="chevronRight" /></span>
        </Link>
      </div>

      {/* Trust: why this feels safe enough to pay for */}
      <div className="card trust-band stack">
        <span className="eyebrow sage"><Icon name="shield" /> Why mothers trust us</span>
        <h3>Private by design</h3>
        <div className="feature-list">
          <div className="feature">
            <span className="icon-tile" aria-hidden="true"><Icon name="lock" /></span>
            <div><strong>Your photos stay yours</strong><span>{plain(t(lang, 'privacyNote'))}</span></div>
          </div>
          <div className="feature">
            <span className="icon-tile" aria-hidden="true"><Icon name="volume" /></span>
            <div><strong>Voice first</strong><span>Every screen listens. Zero reading needed.</span></div>
          </div>
          <div className="feature">
            <span className="icon-tile" aria-hidden="true"><Icon name="users" /></span>
            <div><strong>ASHA linked</strong><span>High risk reaches your health worker automatically.</span></div>
          </div>
        </div>
      </div>

      <p className={online ? 'status-line' : 'offline-bar'}>
        <Icon name="signal" />
        <span>{online ? 'Online. Photos are renamed to image.png on the server, then analyzed.' : 'Offline. Results will sync when back online.'}</span>
      </p>
    </section>
  )
}
