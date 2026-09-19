import { useEffect, useState } from 'react'
import { t } from '../i18n.js'
import { Chip } from '../components/UI.jsx'
import { apiAlertStatus, apiAlerts, store } from '../lib/api.js'

// ASHA dashboard: queue + detail + status chips. Desktop/tablet-friendly (wide layout).
const STATUS = ['notified', 'contacted', 'in_progress', 'resolved']
const STATUS_ICON = { notified: '🔔', contacted: '📞', in_progress: '🚶', resolved: '✅' }

export default function Asha({ lang }) {
  const [alerts, setAlerts] = useState([])
  const [err, setErr] = useState('')
  const [sel, setSel] = useState(null)
  const [filter, setFilter] = useState('')

  const load = async () => {
    setErr('')
    // merge server alerts + local high-risk history (offline-first)
    let server = []
    try {
      const d = await apiAlerts()
      server = d.alerts || []
    } catch (e) {
      setErr(`Server alerts unavailable (${e.message}). Showing this device's history.`)
    }
    const local = store.history()
      .filter((h) => h.band === 'high')
      .map((h) => ({ id: h.id, name: 'This device', risk: 'high', label: h.label, confidence: h.conf, symptoms: h.symptoms, status: 'notified', created_at: h.at, local: true }))
    setAlerts([...server, ...local])
  }

  useEffect(() => { load() }, [])
  const shown = filter ? alerts.filter((a) => a.status === filter) : alerts

  const setStatus = async (a, s) => {
    if (a.local) { alert('Local demo entry. Status lives on the server in production.'); return }
    try {
      const updated = await apiAlertStatus(a.id, s)
      setAlerts((prev) => prev.map((x) => (x.id === a.id ? updated : x)))
      setSel(updated)
    } catch (e) { alert(`Update failed: ${e.message}`) }
  }

  return (
    <section aria-labelledby="asha-title" className="stack" style={{ width: '100%' }}>
      <div className="section-head">
      <h2 id="asha-title">👩‍⚕️ {t(lang, 'asha')} Dashboard</h2>
      </div>
      <div className="row" style={{ flexWrap: 'wrap' }}>
        <button className="audio-btn" onClick={load} type="button">↻ Refresh</button>
        {['', ...STATUS].map((s) => (
          <button key={s} className="audio-btn" aria-pressed={filter === s} onClick={() => setFilter(s)} type="button">
            {s === '' ? `All (${alerts.length})` : `${STATUS_ICON[s]} ${s}`}
          </button>
        ))}
      </div>
      {err && <div className="alert alert-warn" role="note">{err}</div>}

      <div className="asha-cols">
        <div className="stack" style={{ gap: 10 }}>
          {shown.length === 0 && <div className="card muted">No high-risk patients yet. High-risk scans appear here automatically.</div>}
          {shown.map((a) => (
            <button
              key={a.id} className="card row" style={{ textAlign: 'left', width: '100%' }}
              onClick={() => setSel(a)} type="button"
              aria-label={`Patient ${a.name}, high risk, ${a.status}`}
            >
              <div style={{ fontSize: 34 }} aria-hidden="true">🧕</div>
              <div style={{ flex: 1 }}>
                <strong>{a.name || 'Unnamed'}</strong>
                <div className="muted">{new Date(a.created_at).toLocaleString()} • {(a.symptoms || []).slice(0, 3).join(', ')}</div>
                <div className="chip-row">
                  <Chip kind="red">🔴 high</Chip>
                  <Chip kind="grey">{STATUS_ICON[a.status] || '•'} {a.status}</Chip>
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="card" aria-live="polite">
          {!sel && <p className="muted">Select a patient → see eyelid image, symptoms, AI confidence, recommended action.</p>}
          {sel && (
            <>
              <h3 style={{ marginTop: 0 }}>{sel.name} - case <code>{sel.id}</code></h3>
              <div className="kv"><span>Risk</span><span>🔴 high ({sel.label}, {(sel.confidence * 100).toFixed(0)}%)</span></div>
              <div className="kv"><span>Symptoms</span><span>{(sel.symptoms || []).join(', ') || 'None'}</span></div>
              <div className="kv"><span>Phone</span><span>{sel.phone ? <a href={`tel:${sel.phone}`}>{sel.phone}</a> : 'Not given'}</span></div>
              <div className="kv"><span>Location</span><span>{sel.lat && sel.lon ? <a href={`https://www.openstreetmap.org/?mlat=${sel.lat}&mlon=${sel.lon}#map=15/${sel.lat}/${sel.lon}`} target="_blank" rel="noreferrer">📍 map ({sel.lat},{sel.lon})</a> : 'Not given'}</span></div>
              <div className="kv"><span>Action</span><span>Urgent Hb test + clinic visit; ASHA field visit</span></div>
              <h4>Status</h4>
              <div className="row" style={{ flexWrap: 'wrap' }}>
                {STATUS.map((s) => (
                  <button
                    key={s} type="button" className="audio-btn"
                    aria-pressed={sel.status === s}
                    style={sel.status === s ? { borderColor: 'var(--brand)', background: 'var(--surface-warm)' } : {}}
                    onClick={() => setStatus(sel, s)}
                  >{STATUS_ICON[s]} {s}</button>
                ))}
              </div>
              {sel.phone && <p><a className="btn btn-primary" href={`tel:${sel.phone}`}>📞 Call patient</a></p>}
            </>
          )}
        </div>
      </div>
    </section>
  )
}
