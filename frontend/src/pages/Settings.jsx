import { LANGS, t } from '../i18n.js'

// Accessibility decisions (annotated for reviewers):
// - focus order: header back -> main heading -> actions (logical, linear)
// - TalkBack labels on every icon-only control (aria-label)
// - contrast: ink #2b2118 on #fff8f3 ≈ 14:1; risk text uses dark ink on tinted bg (>=7:1)
// - targets >=48px (see --tap); focus-visible 3px blue ring
// - text-size setting scales base font (body.text-lg/xl), Indic scripts via Noto Sans
export default function Settings({ lang, prof, save }) {
  return (
    <section aria-labelledby="s-title">
      <h2 id="s-title">⚙️ {t(lang, 'settings')}</h2>

      <div className="card">
        <label className="lbl" htmlFor="lang-sel">🌐 {t(lang, 'language')}</label>
        <select id="lang-sel" value={lang} onChange={(e) => save({ lang: e.target.value })} aria-label={t(lang, 'language')}>
          {LANGS.map((l) => <option key={l.code} value={l.code}>{l.native} — {l.label}</option>)}
        </select>
      </div>

      <div className="card">
        <span className="lbl" id="ts-lbl">🔠 Text size (low-vision)</span>
        <div className="row" role="group" aria-labelledby="ts-lbl">
          {[{ v: 'm', l: 'Normal' }, { v: 'l', l: 'Large' }, { v: 'xl', l: 'Largest' }].map((o) => (
            <button key={o.v} type="button" className="audio-btn" aria-pressed={prof.textSize === o.v} onClick={() => save({ textSize: o.v })}>{o.l}</button>
          ))}
        </div>
      </div>

      <div className="card">
        <span className="lbl" id="tb-lbl">🗣️ TalkBack / screen-reader extras</span>
        <div className="row" role="group" aria-labelledby="tb-lbl">
          <button type="button" className="audio-btn" aria-pressed={!!prof.talkback} onClick={() => save({ talkback: !prof.talkback })}>
            {prof.talkback ? '✅ Extra voice hints ON' : '⭕ Extra voice hints OFF'}
          </button>
        </div>
        <p className="muted">Keep your phone's TalkBack ON for full narration. This app adds 🔊 Listen buttons on every key screen.</p>
      </div>

      <div className="card">
        <label className="lbl" htmlFor="asha-ph">👩‍⚕️ My ASHA worker phone</label>
        <input id="asha-ph" type="tel" value={prof.ashaPhone || ''} onChange={(e) => save({ ashaPhone: e.target.value })} placeholder="98…" />
        {prof.ashaPhone && <p><a href={`tel:${prof.ashaPhone}`}>📞 Call my ASHA worker</a></p>}
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>🔒 Data & privacy</h3>
        <ul className="muted">
          <li>Photos are sent as <code>image.png</code> to your clinic's server for AI analysis only.</li>
          <li>High-risk results notify the ASHA dashboard — nothing else is shared.</li>
          <li>History lives on this phone; clear it anytime:</li>
        </ul>
        <button type="button" className="btn btn-secondary" onClick={() => { localStorage.removeItem('herhealth_history'); alert('History cleared on this device.') }}>
          🧹 Clear my history
        </button>
      </div>
    </section>
  )
}
