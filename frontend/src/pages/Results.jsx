import { Link, useNavigate } from 'react-router-dom'
import { t } from '../i18n.js'
import { AudioButton, Chip, Icon, RiskBanner, plain, stripEmoji } from '../components/UI.jsx'
import { EmptyArt } from '../components/Illustrations.jsx'

// All 4 backend states: low (green) | moderate (yellow) |
// low_confidence (blue, Hb test) | high (red, ASHA notified).
const BAND_DOT = { low: 'circle', moderate: 'triangle', high: 'square', low_confidence: 'diamond' }
const BAND_KIND = { low: 'green', moderate: 'yellow', high: 'red', low_confidence: 'blue' }

export default function Results({ lang }) {
  const nav = useNavigate()
  let res = null
  try { res = JSON.parse(sessionStorage.getItem('herhealth_result') || 'null') } catch { res = null }

  if (!res) {
    return (
      <section className="center stack narrow" style={{ alignItems: 'center' }}>
        <div style={{ width: 'min(100%, 220px)' }} aria-hidden="true">
          <EmptyArt kind="results" />
        </div>
        <h2 className="section-title">No result yet</h2>
        <p className="muted">Take an eyelid photo first.</p>
        <button className="btn btn-primary" onClick={() => nav('/scan')} type="button">
          <Icon name="camera" /> {plain(t(lang, 'checkAnemia'))}
        </button>
      </section>
    )
  }

  const band = res.risk_band || 'low'
  const readout = `${stripEmoji(band === 'low' ? t(lang, 'riskLow') : band === 'moderate' ? t(lang, 'riskModerate') : band === 'high' ? t(lang, 'riskHigh') : t(lang, 'riskLowConf'))}. AI says ${res.label} with ${(res.confidence * 100).toFixed(0)} percent confidence.`

  return (
    <section aria-labelledby="res-title" className="stack">
      <h2 id="res-title" className="sr-only">Result</h2>
      {res.demo && <div className="alert alert-warn" role="note"><Icon name="alertTriangle" /><span>{t(lang, 'demoNote')}</span></div>}
      {res.mock && !res.demo && <div className="alert alert-info" role="note"><Icon name="info" /><span>Server ran in <code>ANEMIA_MOCK=1</code> mode (no TF). Deploy with the real model for medical use.</span></div>}

      <RiskBanner band={band} lang={lang} confidence={res.confidence} />
      <div>
        <AudioButton text={readout} lang={lang} />
      </div>

      <div className="split">
      <div className="card details-card stack">
        <span className="eyebrow"><Icon name="eye" /> AI details</span>
        <div className="kv"><span>AI label</span><strong>{res.label} ({(res.confidence * 100).toFixed(1)}%)</strong></div>
        <div className="kv"><span>Anemic prob</span><span>{res.prob_anemic}</span></div>
        <div className="kv"><span>Crop</span><span>{res.crop_method}</span></div>
        <div className="kv"><span>Symptoms</span><span>{(res.symptoms || []).join(', ') || 'None'}</span></div>
        <div className="chip-row">
          <Chip kind={BAND_KIND[band] || 'grey'} dot={BAND_DOT[band] || 'circle'}>
            {band.replace('_', ' ')}
          </Chip>
          {res.symptom_bumped && <Chip kind="grey" icon="activity">symptoms bumped</Chip>}
          {res.asha_notified && <Chip kind="red" icon="bell">ASHA notified</Chip>}
        </div>
      </div>

      {/* Single next action per tier: primary action is visually dominant */}
      <div className="stack">
      {band === 'low' && (
        <Link className="btn btn-primary" to="/diet"><Icon name="bowl" /> {plain(t(lang, 'viewDiet'))}</Link>
      )}
      {band === 'moderate' && (
        <>
          <Link className="btn btn-primary" to="/diet"><Icon name="bowl" /> {plain(t(lang, 'viewDiet'))}</Link>
          <Link className="btn btn-secondary" to="/hospitals"><Icon name="pin" /> Visit clinic this week</Link>
        </>
      )}
      {band === 'low_confidence' && (
        <div className="card stack">
          <span className="eyebrow"><Icon name="droplet" /> Next step</span>
          <h3>Hb blood test: what happens?</h3>
          <p className="muted">A tiny finger prick, one drop of blood, result in minutes. It does not hurt much. This confirms what the photo could not.</p>
          <Link className="btn btn-primary" to="/hospitals"><Icon name="pin" /> {plain(t(lang, 'findNearest'))}</Link>
        </div>
      )}
      {band === 'high' && (
        <div className="card stack">
          <span className="eyebrow"><Icon name="bell" /> Urgent</span>
          <h3>{plain(t(lang, 'helpComing'))}</h3>
          <p>ASHA worker notified{res.alert_id ? <> (case <code>{res.alert_id}</code>)</> : null}. While waiting:</p>
          <ol className="steps">
            <li>Rest, drink water, do not travel alone.</li>
            <li>Emergency: call <a href="tel:108">108</a> / <a href="tel:102">102</a>.</li>
            <li>Carry this result + any past reports.</li>
          </ol>
          <a className="emergency-call" href="tel:108"><Icon name="phone" /> Emergency: call 108</a>
          <Link className="btn btn-primary" to="/hospitals"><Icon name="pin" /> {plain(t(lang, 'findNearest'))}</Link>
        </div>
      )}
      </div>
      </div>

      <div className="grid2">
        <Link className="btn btn-secondary" to="/scan"><Icon name="refresh" /> {plain(t(lang, 'retake'))}</Link>
        <Link className="btn btn-secondary" to="/home"><Icon name="home" /> {plain(t(lang, 'home'))}</Link>
      </div>
    </section>
  )
}
