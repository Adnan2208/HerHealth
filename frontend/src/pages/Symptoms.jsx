import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { t } from '../i18n.js'
import { Icon, ProcessingOverlay, SYMPTOMS, plain } from '../components/UI.jsx'
import { apiPredict, demoPredict, store } from '../lib/api.js'
import { voiceInput } from '../lib/speech.js'
import { storedImageFile } from './Scan.jsx'

const COMMON = ['fatigue', 'dizziness', 'pale_skin', 'breathless', 'headache', 'palpitation', 'cold_hands', 'nails', 'craving']

export default function Symptoms({ lang, prof }) {
  const [picked, setPicked] = useState([])
  const [typed, setTyped] = useState('')
  const [name, setName] = useState(prof.name || '')
  const [phone, setPhone] = useState(prof.phone || '')
  const [busy, setBusy] = useState(false)
  const [pct, setPct] = useState(8)
  const [phase, setPhase] = useState(0)
  const [err, setErr] = useState('')
  const [listening, setListening] = useState(false)
  const nav = useNavigate()
  const timers = useRef([])

  useEffect(() => () => { timers.current.forEach(clearInterval) }, [])

  const toggle = (id) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))

  const allSymptoms = () => {
    const extra = typed.split(',').map((s) => s.trim()).filter(Boolean)
    return [...new Set([...picked, ...extra])]
  }

  const startVoice = () => {
    const v = voiceInput()
    if (!v.supported) { alert('Voice input not supported in this browser. Please tap the pictures or type.'); return }
    setListening(true)
    v.start((text) => {
      setListening(false)
      if (text) setTyped((prev) => (prev ? `${prev}, ${text}` : text))
    }, lang)
  }

  const submit = async () => {
    const file = storedImageFile()
    if (!file) { setErr('Please add an eyelid photo first (Back to Scan).'); return }
    const symptoms = allSymptoms()
    setBusy(true); setErr(''); setPct(8); setPhase(0)
    // Animated progress while the (possibly slow, cold-start) model runs
    const tick = setInterval(() => {
      setPct((p) => {
        const next = p + (p < 40 ? 7 : p < 75 ? 4 : 1.5)
        return Math.min(next, 96)
      })
      setPhase((s) => Math.min(s + 0.12, 3))
    }, 500)
    timers.current.push(tick)
    let coords = { lat: '', lon: '' }
    try {
      const pos = await new Promise((res) => {
        if (!navigator.geolocation) return res(null)
        navigator.geolocation.getCurrentPosition(res, () => res(null), { timeout: 4000 })
      })
      if (pos) { coords = { lat: pos.coords.latitude.toFixed(5), lon: pos.coords.longitude.toFixed(5) } }
    } catch { /* location optional */ }
    try {
      let res
      try {
        // shareForCare OFF omits name/phone from the predict call (payload unchanged when ON)
        const share = prof.shareForCare !== false
        res = await apiPredict({ file, symptoms, name: share ? name : '', phone: share ? phone : '', language: lang, ...coords })
      } catch (netErr) {
        // Offline / no backend (static Netlify preview): clearly-labeled demo so UI is testable
        console.warn('backend unreachable, demo fallback', netErr)
        res = { ...demoPredict(symptoms), demoReason: String(netErr.message || netErr) }
      }
      setPct(100); setPhase(3)
      sessionStorage.setItem('herhealth_result', JSON.stringify(res))
      store.pushHistory({ band: res.risk_band, label: res.label, conf: res.confidence, symptoms, demo: !!res.demo })
      setTimeout(() => nav('/results'), 450)
    } catch (e) {
      setErr(e.message)
      setBusy(false)
    } finally {
      clearInterval(tick)
    }
  }

  return (
    <section aria-labelledby="sym-title" className="stack">
      <div className="section-head">
      <span className="eyebrow"><Icon name="clipboard" /> Step 2 of 3</span>
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <h2 id="sym-title" className="section-title">{t(lang, 'symptomsTitle')}</h2>
      </div>
      <p className="muted section-sub">{t(lang, 'symptomsSub')}</p>
      <div className="step-dots" aria-label="Step 2 of 3: symptoms">
        <i className="done" /><i className="done" /><i />
      </div>
      </div>

      <div className="sym-count-row">
        <span className="sym-count" aria-live="polite">
          <Icon name="check" />{picked.length === 0 ? 'Tap what you feel' : `${picked.length} selected`}
        </span>
      </div>

      <div className="sym-grid" role="group" aria-label="Symptom pictures">
        {SYMPTOMS.map((s) => {
          const active = picked.includes(s.id)
          return (
            <button
              key={s.id} type="button" className="sym"
              aria-pressed={active}
              aria-label={`${s.en}. ${s.hi}`}
              onClick={() => toggle(s.id)}
            >
              <span className="sym-check" aria-hidden="true"><Icon name="check" /></span>
              <Icon name={s.icon} />
              <span>{lang === 'hi' ? s.hi : s.en}</span>
            </button>
          )
        })}
      </div>

      <div className="split">
      <div className="card stack">
        <label className="lbl" htmlFor="typed"><Icon name="pencil" /> Type symptoms (comma separated)</label>
        <input
          id="typed" type="text" list="sym-list" value={typed}
          onChange={(e) => setTyped(e.target.value)}
          placeholder="fatigue, dizziness..." autoComplete="off"
        />
        <datalist id="sym-list">{COMMON.map((c) => <option key={c} value={c} />)}</datalist>
        <button className="btn btn-secondary" onClick={startVoice} type="button" aria-label="Voice symptom input">
          <Icon name="mic" /> {listening ? 'Listening... speak now' : 'Speak symptoms'} ({lang})
        </button>
      </div>

      <div className="card stack">
        <label className="lbl" htmlFor="nm"><Icon name="user" /> Name (optional, for ASHA follow-up)</label>
        <input id="nm" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Meena" />
        <label className="lbl" htmlFor="ph"><Icon name="phone" /> Phone (optional)</label>
        <input id="ph" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="98..." />
      </div>
      </div>

      {err && <div className="alert alert-err" role="alert"><Icon name="octagon" /><span>{err}</span></div>}
      <button className="btn btn-primary" onClick={submit} disabled={busy} type="button">
        {busy ? (<><span className="spinner" aria-hidden="true" /> {t(lang, 'analyzing')}</>) : (<><Icon name="search" /> {plain(t(lang, 'analyze'))}</>)}
      </button>
      {busy && <ProcessingOverlay pct={pct} step={Math.floor(phase)} />}
    </section>
  )
}
