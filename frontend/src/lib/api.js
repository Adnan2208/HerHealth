// API client: talks to FastAPI backend. VITE_API_URL is set at build time
// on Netlify/Vercel; defaults to same-origin / localhost for dev.
// If the backend is unreachable (static preview), callers fall back to demo mode.

export const API_BASE =
  (import.meta.env.VITE_API_URL || '').replace(/\/$/, '') || 'http://localhost:8000'

export async function apiHealth() {
  const r = await fetch(`${API_BASE}/api/health`, { signal: AbortSignal.timeout(8000) })
  if (!r.ok) throw new Error(`health ${r.status}`)
  return r.json()
}

// image File -> backend renames to image.png internally + runs final_script pipeline
export async function apiPredict({ file, symptoms = [], name = '', phone = '', language = 'en', lat = '', lon = '' }) {
  const fd = new FormData()
  fd.append('image', file, file.name || 'upload.jpg')
  fd.append('symptoms', JSON.stringify(symptoms))
  fd.append('name', name)
  fd.append('phone', phone)
  fd.append('language', language)
  fd.append('lat', String(lat ?? ''))
  fd.append('lon', String(lon ?? ''))

  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), 120000) // TF cold-start can be slow
  try {
    const r = await fetch(`${API_BASE}/api/predict`, { method: 'POST', body: fd, signal: ctrl.signal })
    const data = await r.json().catch(() => ({}))
    if (!r.ok) throw new Error(data.detail || `predict failed (${r.status})`)
    return { ...data, demo: false }
  } finally {
    clearTimeout(timer)
  }
}

export async function apiAlerts() {
  const r = await fetch(`${API_BASE}/api/asha/alerts`)
  if (!r.ok) throw new Error(`alerts ${r.status}`)
  return r.json()
}

export async function apiAlertStatus(id, status) {
  const r = await fetch(`${API_BASE}/api/asha/alerts/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  })
  if (!r.ok) throw new Error(`status ${r.status}`)
  return r.json()
}

export async function apiHospitals(lat, lon) {
  const r = await fetch(`${API_BASE}/api/hospitals?lat=${lat}&lon=${lon}`)
  if (!r.ok) throw new Error(`hospitals ${r.status}`)
  return r.json()
}

// ---- demo fallback: deterministic pseudo-result so the UI works on a
// ---- static host with no backend (clearly labeled DEMO everywhere).
export function demoPredict(symptoms = []) {
  // hash symptoms -> stable band for screenshots/testing
  const n = symptoms.length
  const band = n >= 4 ? 'high' : n >= 2 ? 'moderate' : 'low'
  const conf = band === 'high' ? 0.91 : band === 'moderate' ? 0.78 : 0.88
  const label = band === 'low' ? 'non-anemic' : 'anemic'
  return {
    label,
    prob_anemic: label === 'anemic' ? conf : +(1 - conf).toFixed(2),
    prob_non_anemic: label === 'anemic' ? +(1 - conf).toFixed(2) : conf,
    confidence: conf,
    crop_method: 'demo-centre',
    risk_band: band,
    action: band === 'low' || band === 'moderate' ? 'diet_plan' : 'asha_help',
    symptoms,
    asha_notified: band === 'high',
    alert_id: band === 'high' ? 'demo123' : null,
    mock: true,
    demo: true,
    inference_ms: 12,
  }
}

// ---- local persistence (history, profile, education progress) ----
const K = { hist: 'herhealth_history', prof: 'herhealth_profile', edu: 'herhealth_edu' }
export const store = {
  history() { try { return JSON.parse(localStorage.getItem(K.hist) || '[]') } catch { return [] } },
  pushHistory(entry) {
    const h = store.history()
    h.unshift({ ...entry, at: new Date().toISOString(), id: Math.random().toString(36).slice(2, 9) })
    localStorage.setItem(K.hist, JSON.stringify(h.slice(0, 50)))
  },
  profile() { try { return JSON.parse(localStorage.getItem(K.prof) || '{}') } catch { return {} } },
  saveProfile(p) { localStorage.setItem(K.prof, JSON.stringify({ ...store.profile(), ...p })) },
  edu() { try { return JSON.parse(localStorage.getItem(K.edu) || '{}') } catch { return {} } },
  markEdu(id) { const e = store.edu(); e[id] = true; localStorage.setItem(K.edu, JSON.stringify(e)) },
}
