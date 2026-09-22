import { Link } from 'react-router-dom'
import { t } from '../i18n.js'
import { Chip, Icon, plain } from '../components/UI.jsx'
import { EmptyArt } from '../components/Illustrations.jsx'
import { store } from '../lib/api.js'

const DOT = { low: 'circle', moderate: 'triangle', low_confidence: 'diamond', high: 'square' }
const KIND = { low: 'green', moderate: 'yellow', low_confidence: 'blue', high: 'red' }

export default function History({ lang }) {
  const h = store.history()
  return (
    <section aria-labelledby="hi-title" className="stack">
      <div className="section-head">
        <span className="eyebrow"><Icon name="clock" /> Your journey</span>
        <h2 id="hi-title" className="section-title">{plain(t(lang, 'history'))}</h2>
      </div>
      {h.length === 0 && (
        <div className="card center stack" style={{ alignItems: 'center' }}>
          <div style={{ width: 'min(100%, 220px)' }} aria-hidden="true">
            <EmptyArt kind="history" />
          </div>
          <p className="muted">No checks yet. Your scans will appear here as dots over time.</p>
          <Link className="btn btn-primary" to="/scan"><Icon name="camera" /> {plain(t(lang, 'checkAnemia'))}</Link>
        </div>
      )}
      {/* Simple shape-coded dot trend (never color alone) for low-literacy users */}
      {h.length > 0 && (
        <div className="card stack">
          <div className="chip-row" aria-hidden="true">
            {h.slice(0, 12).reverse().map((x) => (
              <span key={x.id} className={`chip chip-${KIND[x.band] || 'grey'}`} style={{ padding: 6 }}>
                <span className={`chip-dot dot-${DOT[x.band] || 'circle'}`} />
              </span>
            ))}
          </div>
          <div className="muted">Oldest to newest (last {Math.min(h.length, 12)})</div>
        </div>
      )}
      {h.map((x) => (
        <div className="card row" key={x.id}>
          <span className={`chip chip-${KIND[x.band] || 'grey'}`} style={{ padding: 8 }} aria-hidden="true">
            <span className={`chip-dot dot-${DOT[x.band] || 'circle'}`} />
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <strong>{x.label}</strong> ({(x.conf * 100).toFixed(0)}%)
            <div className="muted">{new Date(x.at).toLocaleString()} • {(x.symptoms || []).join(', ') || 'no symptoms'}</div>
          </div>
          <Chip kind={KIND[x.band] || 'grey'} dot={DOT[x.band] || 'circle'}>{x.band}</Chip>
        </div>
      ))}
    </section>
  )
}
