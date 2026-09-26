import { useEffect, useState } from 'react'
import { speak, stopSpeak } from '../lib/speech.js'
import { t } from '../i18n.js'
import { ScanProcessingArt } from './Illustrations.jsx'

// Reusable accessible components. Every interactive element: >=48px target,
// visible focus (see styles.css), aria-labels for TalkBack order.
//
// Icon system: single inline-SVG set (stroke = currentColor, 24px grid).
// Zero dependencies, zero network fetches, crisp at any density.
// Emoji are never icons and never spoken: controls and status indicators
// always use Icon; render helpers strip pictographs from i18n labels.

const PATHS = {
  home: (<><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V21h5v-6h4v6h5V9.5" /></>),
  camera: (<><rect x="3" y="7" width="18" height="13" rx="3" /><circle cx="12" cy="13" r="3.5" /><path d="M8.5 7 10 4.5h4L15.5 7" /></>),
  book: (<><path d="M12 6C10 4.5 7 4 4 4v14c3 0 6 .5 8 2 2-1.5 5-2 8-2V4c-3 0-6 .5-8 2z" /><path d="M12 6v14" /></>),
  bowl: (<><path d="M4 12h16c0 4.2-3.6 7-8 7s-8-2.8-8-7z" /><path d="M9.5 8.5c0-1.6 1.2-1.8 1.2-3.5M14 8.5c0-1.6 1.2-1.8 1.2-3.5" /></>),
  settings: (<><path d="M4 8h10M18 8h2M4 16h4M12 16h8" /><circle cx="16" cy="8" r="2.2" /><circle cx="10" cy="16" r="2.2" /></>),
  back: (<><path d="M19 12H5" /><path d="m11 18-6-6 6-6" /></>),
  volume: (<><path d="M11 5 6.5 9H3v6h3.5L11 19z" /><path d="M15.5 8.5a5 5 0 0 1 0 7" /><path d="M18.5 5.5a9.5 9.5 0 0 1 0 13" /></>),
  mic: (<><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0" /><path d="M12 18v3" /></>),
  check: (<path d="m4.5 12.5 5 5 10-11" />),
  checkCircle: (<><circle cx="12" cy="12" r="9" /><path d="m8 12.5 3 3 5-6.5" /></>),
  alertTriangle: (<><path d="M12 3.5 22 20H2z" /><path d="M12 9.5V14" /><path d="M12 17.2h.01" /></>),
  octagon: (<><path d="M8 3h8l5 5v8l-5 5H8l-5-5V8z" /><path d="M12 8v5" /><path d="M12 16.5h.01" /></>),
  search: (<><circle cx="11" cy="11" r="7" /><path d="m20 20-3.8-3.8" /></>),
  info: (<><circle cx="12" cy="12" r="9" /><path d="M12 11v5" /><path d="M12 7.5h.01" /></>),
  phone: (<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" />),
  pin: (<><path d="M12 21s-7-5.5-7-11a7 7 0 0 1 14 0c0 5.5-7 11-7 11z" /><circle cx="12" cy="10" r="2.5" /></>),
  navigation: (<><path d="m3 11 19-8-8 19-2.5-8.5z" /><path d="M11.5 14.5 20 5" /></>),
  refresh: (<><path d="M20 12a8 8 0 1 1-2.3-5.6" /><path d="M20 3v4h-4" /></>),
  chevronRight: (<path d="m9 5 7 7-7 7" />),
  chevronLeft: (<path d="m15 5-7 7 7 7" />),
  arrowRight: (<><path d="M4 12h16" /><path d="m13 5 7 7-7 7" /></>),
  activity: (<path d="M3 12h4l2.5-6 4 12L16 12h5" />),
  shield: (<><path d="M12 3 5 6v5c0 5 3.5 8.5 7 10 3.5-1.5 7-5 7-10V6z" /><path d="m9 12 2 2 4-4.5" /></>),
  lock: (<><rect x="5" y="11" width="14" height="9" rx="2.5" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></>),
  eye: (<><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" /><circle cx="12" cy="12" r="3" /></>),
  droplet: (<path d="M12 3s6.5 7 6.5 11.5a6.5 6.5 0 0 1-13 0C5.5 10 12 3 12 3z" />),
  user: (<><circle cx="12" cy="8" r="4" /><path d="M4 21c1.5-4 5-5.5 8-5.5s6.5 1.5 8 5.5" /></>),
  users: (<><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c1-3.5 3.7-5 6.5-5s5.5 1.5 6.5 5" /><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8" /><path d="M17.5 15.3c2 .8 3.5 2.2 4 4.7" /></>),
  bell: (<><path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6" /><path d="M10 20a2.2 2.2 0 0 0 4 0" /></>),
  clipboard: (<><rect x="5" y="5" width="14" height="16" rx="2.5" /><rect x="9" y="3" width="6" height="4" rx="1.5" /><path d="M9 12h6M9 16h4" /></>),
  clock: (<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3.5 2" /></>),
  moon: (<path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z" />),
  dizzy: (<><circle cx="12" cy="12" r="9" /><path d="M9 9.5h.01M15 9.5h.01" /><path d="M8.5 16c1-1.2 2.2-1.2 3.5 0s2.5 1.2 3.5 0" /></>),
  face: (<><circle cx="12" cy="12" r="9" /><path d="M9 10h.01M15 10h.01" /><path d="M8.5 15.5c2.5-1.5 4.5-1.5 7 0" /></>),
  wind: (<><path d="M3 8h9a3 3 0 1 0-3-3" /><path d="M3 12h13a3 3 0 1 1-3 3" /><path d="M3 16h6" /></>),
  bolt: (<><circle cx="12" cy="12" r="9" /><path d="M12.8 7.5 9.8 13H12l-1 4.5 4.2-6.5H13z" /></>),
  snow: (<><path d="M12 3v18M4.2 7.5l15.6 9M19.8 7.5l-15.6 9" /></>),
  hand: (<path d="M8 12V5.5a1.5 1.5 0 0 1 3 0V11m0-5.5v-1a1.5 1.5 0 0 1 3 0V11m0-4.5a1.5 1.5 0 0 1 3 0V12m0-2.5a1.5 1.5 0 0 1 3 0V15a6 6 0 0 1-6 6h-1.8a6 6 0 0 1-4.7-2.3L4 14.5a1.6 1.6 0 0 1 2.5-2L8 14" />),
  cookie: (<><circle cx="12" cy="12" r="9" /><path d="M9.5 9.5h.01M14.5 10.5h.01M10 14.5h.01M14 15h.01" /></>),
  signal: (<><path d="M2 9a15 15 0 0 1 20 0" /><path d="M5.5 12.5a10 10 0 0 1 13 0" /><path d="M9 16a5 5 0 0 1 6 0" /><path d="M12 19.5h.01" /></>),
  globe: (<><circle cx="12" cy="12" r="9" /><path d="M3 12h18" /><path d="M12 3c2.5 2.5 3.5 5.5 3.5 9s-1 6.5-3.5 9c-2.5-2.5-3.5-5.5-3.5-9s1-6.5 3.5-9z" /></>),
  pencil: (<><path d="M4 20l1-4L16.5 4.5a2.1 2.1 0 0 1 3 3L8 19z" /><path d="m14.5 6.5 3 3" /></>),
  x: (<path d="M6 6l12 12M18 6 6 18" />),
  trash: (<><path d="M4 7h16" /><path d="M9 7V5a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 5v2" /><path d="M6.5 7l1 13h9l1-13" /></>),
  heart: (<path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.5-7 10-7 10z" />),
  heartHandshake: (<><path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.5-7 10-7 10z" /><path d="M3 12h4l2.5-6 4 12L16 12h5" /></>),
  calendar: (<><rect x="3" y="5" width="18" height="16" rx="3" /><path d="M8 3v4M16 3v4M3 10h18" /></>),
  play: (<><circle cx="12" cy="12" r="9" /><path d="M10 8.5v7l6-3.5z" /></>),
  sparkles: (<><path d="M12 4l1.8 4.7L18.5 10l-4.7 1.8L12 16.5l-1.8-4.7L5.5 10l4.7-1.3z" /><path d="M19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9z" /></>),
  leaf: (<><path d="M5 19C5 9 12 4 20 4c0 9-5 15-15 15z" /><path d="M5 19c3-5 7-9 11-11" /></>),
  textSize: (<><path d="M4 18V8h5" /><path d="M6.5 8v10" /><path d="M13 18v-6h4" /><path d="M15 12v6" /></>),
}

export function Icon({ name, label }) {
  const paths = PATHS[name] || PATHS.info
  return (
    <span className="icon" aria-hidden={label ? undefined : 'true'} aria-label={label} role={label ? 'img' : undefined}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" focusable="false">
        {paths}
      </svg>
    </span>
  )
}

// Strip pictographs: leading-only for control labels (plainLabel),
// all-emoji for speech input (stripEmoji). i18n.js stays the copy source.
export function plain(s) {
  return String(s || '').replace(/^[^\p{L}\p{N}]+/u, '').trim() || s
}
export function plainLabel(s) {
  return plain(s)
}
export function stripEmoji(s) {
  return String(s || '').replace(/\p{Extended_Pictographic}/gu, '').replace(/\s{2,}/g, ' ').trim()
}

export function AudioButton({ text, lang }) {
  return (
    <button
      className="audio-btn"
      aria-label={`${plain(t(lang, 'listen'))}: ${stripEmoji(text).slice(0, 80)}`}
      onClick={(e) => { e.stopPropagation(); speak(stripEmoji(text), lang) }}
      type="button"
    >
      <Icon name="volume" /> {plain(t(lang, 'listen'))}
    </button>
  )
}

const RISK_META = {
  low: { cls: 'risk-low', shape: 'risk-shape-circle', icon: 'checkCircle' },
  moderate: { cls: 'risk-moderate', shape: 'risk-shape-triangle', icon: 'alertTriangle' },
  low_confidence: { cls: 'risk-lowconf', shape: 'risk-shape-diamond', icon: 'search' },
  high: { cls: 'risk-high', shape: 'risk-shape-octagon', icon: 'octagon' },
}

export function ConfidenceRing({ value = 0.8, band = 'low' }) {
  const pct = Math.round(value * 100)
  const [shown, setShown] = useState(0)
  useEffect(() => {
    const raf = requestAnimationFrame(() => setShown(pct))
    return () => cancelAnimationFrame(raf)
  }, [pct])
  const R = 30
  const C = 2 * Math.PI * R
  const off = C * (1 - shown / 100)
  return (
    <span className="conf-ring" role="img" aria-label={`AI confidence ${pct} percent`}>
      <svg width="76" height="76" viewBox="0 0 76 76" aria-hidden="true">
        <circle cx="38" cy="38" r={R} fill="none" stroke="rgba(0,0,0,0.12)" strokeWidth="8" />
        <circle
          cx="38" cy="38" r={R} fill="none" stroke="currentColor" strokeWidth="8" strokeLinecap="round"
          strokeDasharray={C} strokeDashoffset={off}
          transform="rotate(-90 38 38)"
          style={{ transition: 'stroke-dashoffset 900ms cubic-bezier(0.2, 0.8, 0.2, 1)' }}
        />
        <text x="38" y="44" textAnchor="middle" fontSize="17" fontWeight="800" fill="currentColor" fontFamily="inherit">{pct}%</text>
      </svg>
    </span>
  )
}

export function RiskBanner({ band, lang, confidence }) {
  // band: low | moderate | low_confidence | high. Shape + icon + label + pattern, never color alone.
  const copy = {
    low: { title: t(lang, 'riskLow'), desc: 'Self-care + iron-rich food. Recheck in a month.' },
    moderate: { title: t(lang, 'riskModerate'), desc: 'Follow the diet plan + rest. Visit a clinic this week.' },
    low_confidence: { title: t(lang, 'riskLowConf'), desc: 'Photo unclear for AI. Please do an Hb blood test at the nearest hospital.' },
    high: { title: t(lang, 'riskHigh'), desc: 'Nearest ASHA worker has been notified. Go to a hospital soon.' },
  }
  const m = RISK_META[band] || RISK_META.low
  const c = copy[band] || copy.low
  return (
    <div className={`risk ${m.cls}`} role="alert" aria-live="polite">
      <div className={`risk-medallion ${m.shape}`}>
        <Icon name={m.icon} label={`${stripEmoji(c.title)} icon`} />
      </div>
      <div className="risk-body">
        <h2>{c.title}</h2>
        <div className="risk-desc">{c.desc}</div>
        {typeof confidence === 'number' && (
          <div className="risk-meter-row">
            <ConfidenceRing value={confidence} band={band} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="meter-label">Confidence: {(confidence * 100).toFixed(0)}%</div>
              <div style={{ height: 6 }} />
              <div className="meter" role="img" aria-label={`AI confidence ${(confidence * 100).toFixed(0)} percent`}>
                <div style={{ width: `${Math.round(confidence * 100)}%` }} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export function Chip({ kind, icon, dot, children }) {
  // dot: circle | triangle | square | diamond (shape coding for colorblind safety)
  return (
    <span className={`chip chip-${kind}`}>
      {icon && <Icon name={icon} />}
      {dot && <span className={`chip-dot dot-${dot}`} aria-hidden="true" />}
      {children}
    </span>
  )
}

export function Skeleton({ w = '100%', h = 20, r = 12 }) {
  return <span className="skeleton" style={{ display: 'block', width: w, height: h, borderRadius: r }} aria-hidden="true" />
}

const PHASES = ['Uploading photo', 'AI is reading your eyelid', 'Checking your symptoms', 'Getting your result']

export function ProcessingOverlay({ pct = 10, step = 0 }) {
  return (
    <div className="processing-backdrop">
      <div className="processing-card" role="status" aria-modal="true" aria-label="Checking your result">
        <ScanProcessingArt />
        <h2 className="section-title">Checking your result</h2>
        <p className="muted" style={{ margin: 0 }}>AI is reading your eyelid photo. This takes about a minute.</p>
        <div className="processing-bar" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin="0" aria-valuemax="100" aria-label="Analysis progress">
          <div style={{ width: `${Math.round(pct)}%` }} />
        </div>
        <div className="meter-label" aria-live="polite">{Math.round(pct)}%</div>
        <ul className="phase-list">
          {PHASES.map((p, i) => (
            <li key={p} className={i < step ? 'done' : i === step ? 'doing' : ''} aria-current={i === step ? 'step' : undefined}>
              <span className="phase-dot" aria-hidden="true">{i < step ? <Icon name="check" /> : null}</span>
              {p}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export const SYMPTOMS = [
  { id: 'fatigue', icon: 'moon', emoji: '😮‍💨', en: 'Tired / fatigue', hi: 'थकान' },
  { id: 'dizziness', icon: 'dizzy', emoji: '😵‍💫', en: 'Dizziness', hi: 'चक्कर' },
  { id: 'pale_skin', icon: 'face', emoji: '🫳', en: 'Pale skin', hi: 'पीली त्वचा' },
  { id: 'breathless', icon: 'wind', emoji: '😤', en: 'Breathless', hi: 'सांस फूलना' },
  { id: 'headache', icon: 'bolt', emoji: '🤕', en: 'Headache', hi: 'सिरदर्द' },
  { id: 'palpitation', icon: 'activity', emoji: '💓', en: 'Fast heartbeat', hi: 'तेज़ धड़कन' },
  { id: 'cold_hands', icon: 'snow', emoji: '🧤', en: 'Cold hands/feet', hi: 'ठंडे हाथ-पैर' },
  { id: 'nails', icon: 'hand', emoji: '💅', en: 'Brittle nails', hi: 'टूटते नाखून' },
  { id: 'craving', icon: 'cookie', emoji: '🧱', en: 'Mud/chalk craving', hi: 'मिट्टी खाने की इच्छा' },
]

export const FOODS = [
  { id: 'spinach', emoji: '🥬', name: 'Spinach / पालक', iron: 'High iron', tip: 'With lemon (vitamin C) for absorption' },
  { id: 'dal', emoji: '🫘', name: 'Lentils / दाल', iron: 'High iron', tip: 'Daily dal + rice/roti' },
  { id: 'jaggery', emoji: '🧆', name: 'Jaggery / गुड़', iron: 'Iron + energy', tip: 'Small piece after meals' },
  { id: 'dates', emoji: '🌰', name: 'Dates / खजूर', iron: 'Iron + folate', tip: '2-3 daily' },
  { id: 'pomegranate', emoji: '🫀', name: 'Pomegranate / अनार', iron: 'Iron + vit C', tip: 'Fresh, not packed juice' },
  { id: 'ragi', emoji: '🌾', name: 'Ragi / नाचणी', iron: 'Iron + calcium', tip: 'Ragi porridge / bhakri' },
  { id: 'groundnut', emoji: '🥜', name: 'Groundnut / मूंगफली', iron: 'Iron + protein', tip: 'Roasted handful' },
  { id: 'egg', emoji: '🥚', name: 'Egg / अंडा', iron: 'Iron + B12', tip: 'If eaten at home' },
]

export const EDU_TOPICS = [
  { id: 't1', emoji: '🩸', art: 't1', title: 'What is menstruation?', dur: '2 min', body: 'Every month the body prepares for a baby. When there is no pregnancy, blood and tissue leave through the vagina for 3-7 days. This is normal and healthy, not dirty, not shameful.' },
  { id: 't2', emoji: '🧼', art: 't2', title: 'Hygiene basics', dur: '2 min', body: 'Change pads/cloth every 4-6 hours. Wash hands before and after. Wash reusable cloth with soap, dry fully in sunlight. Never use ash, husk or dirty rags.' },
  { id: 't3', emoji: '🚫', art: 't3', title: 'Myths vs facts', dur: '2 min', body: 'Myth: period blood is impure. Fact: it is normal body fluid. Myth: you cannot bathe or cook. Fact: bathing prevents infection; you can do all daily work.' },
  { id: 't4', emoji: '😣', art: 't4', title: 'Pain + self-care', dur: '2 min', body: 'Mild cramps are common. Warm water on the belly, rest and light walking help. Seek care for very heavy bleeding (pad every 1-2 hrs) or fainting.' },
  { id: 't5', emoji: '🥗', art: 't5', title: 'Food during periods', dur: '2 min', body: 'Bleeding lowers iron. Eat green leaves, dal, jaggery, dates and lemon. Avoid only taking tea with meals, it blocks iron.' },
  { id: 't6', emoji: '🩺', art: 't6', title: 'When to seek help', dur: '2 min', body: 'Go to a clinic for: bleeding beyond 8 days, very heavy flow, severe pain, foul smell, fever, or missed periods with pregnancy risk.' },
  { id: 't7', emoji: '🩸', art: 't7', title: 'Periods + anemia link', dur: '2 min', body: 'Heavy periods can cause anemia (low blood). Signs: tiredness, dizziness, pale eyelids and nails. The eyelid photo check in this app screens for it.' },
  { id: 't8', emoji: '🤝', art: 't8', title: 'Talking without shame', dur: '2 min', body: 'Periods deserve dignity. Mothers, sisters and ASHA workers can help. Nothing you share in this app is shown to others without permission.' },
]

export function StopAudioOnNav() {
  stopSpeak()
  return null
}
