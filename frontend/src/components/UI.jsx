import { speak, stopSpeak } from '../lib/speech.js'
import { t } from '../i18n.js'

// Reusable accessible components. Every interactive element: >=48px target,
// visible focus (see styles.css), aria-labels for TalkBack order.
export function AudioButton({ text, lang }) {
  return (
    <button
      className="audio-btn"
      aria-label={`${t(lang, 'listen')}: ${text.slice(0, 80)}`}
      onClick={(e) => { e.stopPropagation(); speak(text, lang) }}
      type="button"
    >
      <span aria-hidden="true">🔊</span> {t(lang, 'listen')}
    </button>
  )
}

export function RiskBanner({ band, lang, confidence }) {
  // band: low | moderate | low_confidence | high — icon + pattern + text (never color alone)
  const map = {
    low: { cls: 'risk-low', icon: '✅', title: t(lang, 'riskLow'), desc: 'Self-care + iron-rich food. Recheck in a month.' },
    moderate: { cls: 'risk-moderate', icon: '⚠️', title: t(lang, 'riskModerate'), desc: 'Follow the diet plan + rest. Visit a clinic this week.' },
    low_confidence: { cls: 'risk-lowconf', icon: '🔍', title: t(lang, 'riskLowConf'), desc: 'Photo unclear for AI. Please do an Hb blood test at the nearest hospital.' },
    high: { cls: 'risk-high', icon: '🛑', title: t(lang, 'riskHigh'), desc: 'Nearest ASHA worker has been notified. Go to a hospital soon.' },
  }
  const m = map[band] || map.low
  return (
    <div className={`risk ${m.cls}`} role="alert" aria-live="polite">
      <div className="ri" aria-hidden="true">{m.icon}</div>
      <div>
        <h2>{m.title}</h2>
        <div>{m.desc}</div>
        {typeof confidence === 'number' && (
          <div style={{ marginTop: 10 }}>
            <div className="muted" style={{ fontWeight: 800 }}>Confidence: {(confidence * 100).toFixed(0)}%</div>
            <div className="meter" role="img" aria-label={`AI confidence ${(confidence * 100).toFixed(0)} percent`}>
              <div style={{ width: `${Math.round(confidence * 100)}%` }} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export function Chip({ kind, children }) {
  return <span className={`chip chip-${kind}`}>{children}</span>
}

export const SYMPTOMS = [
  { id: 'fatigue', emoji: '😮‍💨', en: 'Tired / fatigue', hi: 'थकान' },
  { id: 'dizziness', emoji: '😵‍💫', en: 'Dizziness', hi: 'चक्कर' },
  { id: 'pale_skin', emoji: '🫳', en: 'Pale skin', hi: 'पीली त्वचा' },
  { id: 'breathless', emoji: '😤', en: 'Breathless', hi: 'सांस फूलना' },
  { id: 'headache', emoji: '🤕', en: 'Headache', hi: 'सिरदर्द' },
  { id: 'palpitation', emoji: '💓', en: 'Fast heartbeat', hi: 'तेज़ धड़कन' },
  { id: 'cold_hands', emoji: '🧤', en: 'Cold hands/feet', hi: 'ठंडे हाथ-पैर' },
  { id: 'nails', emoji: '💅', en: 'Brittle nails', hi: 'टूटते नाखून' },
  { id: 'craving', emoji: '🧱', en: 'Mud/chalk craving', hi: 'मिट्टी खाने की इच्छा' },
]

export const FOODS = [
  { emoji: '🥬', name: 'Spinach / पालक', iron: 'High iron', tip: 'With lemon (vitamin C) for absorption' },
  { emoji: '🫘', name: 'Lentils / दाल', iron: 'High iron', tip: 'Daily dal + rice/roti' },
  { emoji: '🧆', name: 'Jaggery / गुड़', iron: 'Iron + energy', tip: 'Small piece after meals' },
  { emoji: '🌰', name: 'Dates / खजूर', iron: 'Iron + folate', tip: '2–3 daily' },
  { emoji: '🫀', name: 'Pomegranate / अनार', iron: 'Iron + vit C', tip: 'Fresh, not packed juice' },
  { emoji: '🌾', name: 'Ragi / नाचणी', iron: 'Iron + calcium', tip: 'Ragi porridge / bhakri' },
  { emoji: '🥜', name: 'Groundnut / मूंगफली', iron: 'Iron + protein', tip: 'Roasted handful' },
  { emoji: '🥚', name: 'Egg / अंडा', iron: 'Iron + B12', tip: 'If eaten at home' },
]

export const EDU_TOPICS = [
  { id: 't1', emoji: '🩸', title: 'What is menstruation?', dur: '2 min', body: 'Every month the body prepares for a baby. When there is no pregnancy, blood and tissue leave through the vagina for 3–7 days. This is normal and healthy — not dirty, not shameful.' },
  { id: 't2', emoji: '🧼', title: 'Hygiene basics', dur: '2 min', body: 'Change pads/cloth every 4–6 hours. Wash hands before and after. Wash reusable cloth with soap, dry fully in sunlight. Never use ash, husk or dirty rags.' },
  { id: 't3', emoji: '🚫', title: 'Myths vs facts', dur: '2 min', body: 'Myth: period blood is impure. Fact: it is normal body fluid. Myth: you cannot bathe or cook. Fact: bathing prevents infection; you can do all daily work.' },
  { id: 't4', emoji: '😣', title: 'Pain + self-care', dur: '2 min', body: 'Mild cramps are common. Warm water on the belly, rest and light walking help. Seek care for very heavy bleeding (pad every 1–2 hrs) or fainting.' },
  { id: 't5', emoji: '🥗', title: 'Food during periods', dur: '2 min', body: 'Bleeding lowers iron. Eat green leaves, dal, jaggery, dates and lemon. Avoid only taking tea with meals — it blocks iron.' },
  { id: 't6', emoji: '🩺', title: 'When to seek help', dur: '2 min', body: 'Go to a clinic for: bleeding beyond 8 days, very heavy flow, severe pain, foul smell, fever, or missed periods with pregnancy risk.' },
  { id: 't7', emoji: '🩸', title: 'Periods + anemia link', dur: '2 min', body: 'Heavy periods can cause anemia (low blood). Signs: tiredness, dizziness, pale eyelids and nails. The eyelid photo check in this app screens for it.' },
  { id: 't8', emoji: '🤝', title: 'Talking without shame', dur: '2 min', body: 'Periods deserve dignity. Mothers, sisters and ASHA workers can help. Nothing you share in this app is shown to others without permission.' },
]

export function StopAudioOnNav() {
  stopSpeak()
  return null
}
