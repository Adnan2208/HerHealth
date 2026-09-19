import { useState } from 'react'
import { t } from '../i18n.js'
import { apiHospitals } from '../lib/api.js'

const FALLBACK = [
  { name: 'Primary Health Centre (Govt)', area: 'District HQ', phone: '102', lat: 19.076, lon: 72.8777, distance_km: null },
  { name: 'Civil Hospital (Govt)', area: 'City Centre', phone: '108', lat: 18.5204, lon: 73.8567, distance_km: null },
  { name: 'Rural Health Clinic', area: 'Block Level', phone: '104', lat: 19.9975, lon: 73.7898, distance_km: null },
]

export default function Hospitals({ lang }) {
  const [list, setList] = useState(FALLBACK)
  const [pos, setPos] = useState(null)
  const [note, setNote] = useState('Demo list. Press Locate to sort by your GPS + fetch live list from server.')

  const locate = () => {
    if (!navigator.geolocation) { setNote('GPS not available on this device.'); return }
    navigator.geolocation.getCurrentPosition(async (p) => {
      const { latitude, longitude } = p.coords
      setPos({ latitude, longitude })
      try {
        const d = await apiHospitals(latitude, longitude)
        setList(d.hospitals)
        setNote('Live list from server, sorted by distance.')
      } catch {
        // offline: sort fallback by haversine locally
        const R = 6371
        const km = (a, b, c, d2) => {
          const p1 = (a * Math.PI) / 180, p2 = (c * Math.PI) / 180
          const h = Math.sin(((c - a) * Math.PI) / 360) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(((d2 - b) * Math.PI) / 360) ** 2
          return +(2 * R * Math.asin(Math.sqrt(h))).toFixed(1)
        }
        setList(FALLBACK.map((h) => ({ ...h, distance_km: km(latitude, longitude, h.lat, h.lon) })).sort((a, b) => a.distance_km - b.distance_km))
        setNote('Offline. Demo list sorted by your GPS.')
      }
    }, () => setNote('Location permission denied. Showing demo list.'), { timeout: 6000 })
  }

  return (
    <section aria-labelledby="h-title" className="stack">
      <div className="section-head">
      <h2 id="h-title">🏥 {t(lang, 'findHospital')}</h2>
      <button className="btn btn-primary" onClick={locate} type="button">📍 Locate me + nearest list</button>
      <p className="muted">{note}</p>
      </div>
      {pos && (
        <div className="card">
          <iframe
            title="Nearby hospitals map"
            style={{ width: '100%', height: 240, border: 0, borderRadius: 12 }}
            src={`https://www.openstreetmap.org/export/embed.html?bbox=${pos.longitude - 0.15}%2C${pos.latitude - 0.1}%2C${pos.longitude + 0.15}%2C${pos.latitude + 0.1}&layer=mapnik&marker=${pos.latitude}%2C${pos.longitude}`}
          />
        </div>
      )}
      {list.map((h, i) => (
        <div className="card" key={i}>
          <strong>{h.name}</strong>
          <div className="muted">{h.area} {h.distance_km != null ? `• ${h.distance_km} km` : ''}</div>
          <div className="btn-row">
            <a className="btn btn-secondary" href={`tel:${h.phone}`} aria-label={`Call ${h.name}`}>📞 {h.phone}</a>
            <a
              className="btn btn-secondary"
              href={`https://www.google.com/maps/dir/?api=1&destination=${h.lat},${h.lon}`}
              target="_blank" rel="noreferrer" aria-label={`Directions to ${h.name}`}
            >🧭 Directions</a>
          </div>
        </div>
      ))}
    </section>
  )
}
