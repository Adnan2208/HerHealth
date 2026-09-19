import { Link, useNavigate } from 'react-router-dom'
import { t } from '../i18n.js'
import { AudioButton, Chip, RiskBanner } from '../components/UI.jsx'

// All 4 backend states: low (green) | moderate (yellow) |
// low_confidence (blue, Hb test) | high (red, ASHA notified).
export default function Results({ lang }) {
  const nav = useNavigate()
  let res = null
  try { res = JSON.parse(sessionStorage.getItem('niada_result') || 'null') } catch { res = null }

  if (!res) {
    return (
      <section className="center">
        <div className="big-emoji" aria-hidden="true">📸</div>
        <h2>No result yet</h2>
        <p className="muted">Take an eyelid photo first.</p>
        <button className="btn btn-primary" onClick={() => nav('/scan')} type="button">{t(lang, 'checkAnemia')}</button>
      </section>
    )
  }

  const band = res.risk_band || 'low'
  const readout = `${band === 'low' ? t(lang, 'riskLow') : band === 'moderate' ? t(lang, 'riskModerate') : band === 'high' ? t(lang, 'riskHigh') : t(lang, 'riskLowConf')}. AI says ${res.label} with ${(res.confidence * 100).toFixed(0)} percent confidence.`

  return (
    <section aria-labelledby="res-title">
      <h2 id="res-title" className="sr-only">Result</h2>
      {res.demo && <div className="alert alert-warn" role="note">⚠️ {t(lang, 'demoNote')}</div>}
      {res.mock && !res.demo && <div className="alert alert-info" role="note">ℹ️ Server ran in <code>ANEMIA_MOCK=1</code> mode (no TF). Deploy with the real model for medical use.</div>}

      <RiskBanner band={band} lang={lang} confidence={res.confidence} />
      <AudioButton text={readout} lang={lang} />

      <div className="card">
        <div className="kv"><span>AI label</span><strong>{res.label} ({(res.confidence * 100).toFixed(1)}%)</strong></div>
        <div className="kv"><span>Anemic prob</span><span>{res.prob_anemic}</span></div>
        <div className="kv"><span>Crop</span><span>{res.crop_method}</span></div>
        <div className="kv"><span>Symptoms</span><span>{(res.symptoms || []).join(', ') || '—'}</span></div>
        <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <Chip kind={band === 'low' ? 'green' : band === 'moderate' ? 'yellow' : band === 'high' ? 'red' : 'blue'}>
            {band === 'low' ? '🟢' : band === 'moderate' ? '🟡' : band === 'high' ? '🔴' : '🔵'} {band}
          </Chip>
          {res.symptom_bumped && <Chip kind="grey">symptoms bumped ⬆️</Chip>}
          {res.asha_notified && <Chip kind="red">👩‍⚕️ ASHA notified</Chip>}
        </div>
      </div>

      {/* Single next action per tier */}
      {band === 'low' && (
        <Link className="btn btn-primary" to="/diet">{t(lang, 'viewDiet')}</Link>
      )}
      {band === 'moderate' && (
        <>
          <Link className="btn btn-primary" to="/diet">{t(lang, 'viewDiet')}</Link>
          <Link className="btn btn-secondary" to="/hospitals">🏥 Visit clinic this week</Link>
        </>
      )}
      {band === 'low_confidence' && (
        <div className="card">
          <h3 style={{ marginTop: 0 }}>💉 Hb blood test — what happens?</h3>
          <p className="muted">A tiny finger prick, one drop of blood, result in minutes. It does not hurt much. This confirms what the photo could not.</p>
          <div style={{ fontSize: 40 }} aria-hidden="true">💉➡️🩸➡️📋</div>
          <Link className="btn btn-primary" to="/hospitals">{t(lang, 'findNearest')}</Link>
        </div>
      )}
      {band === 'high' && (
        <div className="card">
          <h3 style={{ marginTop: 0 }}>🤝 {t(lang, 'helpComing')}</h3>
          <p>ASHA worker notified{res.alert_id ? <> (case <code>{res.alert_id}</code>)</> : null}. While waiting:</p>
          <ol>
            <li>Rest, drink water, do not travel alone.</li>
            <li>Emergency: call <a href="tel:108">108</a> / <a href="tel:102">102</a>.</li>
            <li>Carry this result + any past reports.</li>
          </ol>
          <Link className="btn btn-primary" to="/hospitals">{t(lang, 'findNearest')}</Link>
        </div>
      )}

      <div className="grid2">
        <Link className="btn btn-secondary" to="/scan">{t(lang, 'retake')}</Link>
        <Link className="btn btn-secondary" to="/home">{t(lang, 'home')}</Link>
      </div>
    </section>
  )
}
