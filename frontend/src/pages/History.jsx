import { Link } from 'react-router-dom'
import { t } from '../i18n.js'
import { Chip } from '../components/UI.jsx'
import { store } from '../lib/api.js'

const DOT = { low: '🟢', moderate: '🟡', low_confidence: '🔵', high: '🔴' }

export default function History({ lang }) {
  const h = store.history()
  return (
    <section aria-labelledby="hi-title">
      <h2 id="hi-title">🕘 {t(lang, 'history')}</h2>
      {h.length === 0 && (
        <div className="card center">
          <div className="big-emoji" aria-hidden="true">📭</div>
          <p className="muted">No checks yet. Your scans will appear here as dots over time.</p>
          <Link className="btn btn-primary" to="/scan">{t(lang, 'checkAnemia')}</Link>
        </div>
      )}
      {/* Simple dot trend (not complex charts) for low-literacy users */}
      {h.length > 0 && (
        <div className="card" aria-label="Result trend">
          <div style={{ fontSize: 30, letterSpacing: 6 }} aria-hidden="true">
            {h.slice(0, 12).reverse().map((x) => DOT[x.band] || '⚪').join('')}
          </div>
          <div className="muted">Oldest → newest (last {Math.min(h.length, 12)})</div>
        </div>
      )}
      {h.map((x) => (
        <div className="card row" key={x.id}>
          <div style={{ fontSize: 32 }} aria-hidden="true">{DOT[x.band] || '⚪'}</div>
          <div style={{ flex: 1 }}>
            <strong>{x.label}</strong> ({(x.conf * 100).toFixed(0)}%)
            <div className="muted">{new Date(x.at).toLocaleString()} • {(x.symptoms || []).join(', ') || 'no symptoms'}</div>
          </div>
          <Chip kind={x.band === 'low' ? 'green' : x.band === 'moderate' ? 'yellow' : x.band === 'high' ? 'red' : 'blue'}>{x.band}</Chip>
        </div>
      ))}
    </section>
  )
}
