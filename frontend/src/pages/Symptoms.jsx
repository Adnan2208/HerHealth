import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { t } from '../i18n.js'
import { SYMPTOMS } from '../components/UI.jsx'
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
  const [err, setErr] = useState('')
  const [listening, setListening] = useState(false)
  const nav = useNavigate()

  const toggle = (id) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))

  const allSymptoms = () => {
    const extra = typed.split(',').map((s) => s.trim()).filter(Boolean)
    return [...new Set([...picked, ...extra])]
  }

  const startVoice = () => {
    const v = voiceInput()
    if (!v.supported) { alert('Voice input not supported in this browser — please tap the pictures or type.'); return }
    setListening(true)
    v.start((text) => {
      setListening(false)
      if (text) setTyped((prev) => (prev ? `${prev}, ${text}` : text))
    }, lang)
  }

  const submit = async () => {
    const file = storedImageFile()
    if (!file) { setErr('Please add an eyelid photo first (← Back to Scan).'); return }
    const symptoms = allSymptoms()
    setBusy(true); setErr('')
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
        res = await apiPredict({ file, symptoms, name, phone, language: lang, ...coords })
      } catch (netErr) {
        // Offline / no backend (static Netlify preview): clearly-labeled demo so UI is testable
        console.warn('backend unreachable, demo fallback', netErr)
        res = { ...demoPredict(symptoms), demoReason: String(netErr.message || netErr) }
      }
      sessionStorage.setItem('herhealth_result', JSON.stringify(res))
      store.pushHistory({ band: res.risk_band, label: res.label, conf: res.confidence, symptoms, demo: !!res.demo })
      nav('/results')
    } catch (e) {
      setErr(e.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <section aria-labelledby="sym-title">
      <h2 id="sym-title">🩺 {t(lang, 'symptomsTitle')}</h2>
      <p className="muted">{t(lang, 'symptomsSub')}</p>

      <div className="sym-grid" role="group" aria-label="Symptom pictures">
        {SYMPTOMS.map((s) => (
          <button
            key={s.id} type="button" className="sym"
            aria-pressed={picked.includes(s.id)}
            aria-label={`${s.en}. ${s.hi}`}
            onClick={() => toggle(s.id)}
          >
            <span className="e" aria-hidden="true">{s.emoji}</span>
            <span>{lang === 'hi' ? s.hi : s.en}</span>
          </button>
        ))}
      </div>

      <div className="card">
        <label className="lbl" htmlFor="typed">✍️ Type symptoms (comma separated)</label>
        <input
          id="typed" type="text" list="sym-list" value={typed}
          onChange={(e) => setTyped(e.target.value)}
          placeholder="fatigue, dizziness…" autoComplete="off"
        />
        <datalist id="sym-list">{COMMON.map((c) => <option key={c} value={c} />)}</datalist>
        <div style={{ height: 8 }} />
        <button className="btn btn-secondary" onClick={startVoice} type="button" aria-label="Voice symptom input">
          🎤 {listening ? 'Listening… speak now' : 'Speak symptoms'} ({lang})
        </button>
      </div>

      <div className="card">
        <label className="lbl" htmlFor="nm">👩 Name (optional, for ASHA follow-up)</label>
        <input id="nm" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Meena" />
        <div style={{ height: 8 }} />
        <label className="lbl" htmlFor="ph">📞 Phone (optional)</label>
        <input id="ph" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="98…" />
      </div>

      {err && <div className="alert alert-err" role="alert">{err}</div>}
      <button className="btn btn-primary" onClick={submit} disabled={busy} type="button">
        {busy ? t(lang, 'analyzing') : t(lang, 'analyze')}
      </button>
    </section>
  )
}
