import { t } from '../i18n.js'
import { AudioButton, FOODS } from '../components/UI.jsx'

export default function Diet({ lang }) {
  const intro = 'Iron-rich foods every day: green leaves, dal, jaggery, dates. Add lemon for absorption. Avoid tea with meals.'
  return (
    <section aria-labelledby="d-title">
      <h2 id="d-title">🥗 {t(lang, 'dietTips')}</h2>
      <AudioButton text={intro} lang={lang} />
      <div className="food-grid">
        {FOODS.map((f) => (
          <div className="food" key={f.name}>
            <div className="e" aria-hidden="true">{f.emoji}</div>
            <strong>{f.name}</strong>
            <div className="muted">{f.iron}</div>
            <div style={{ fontSize: 13 }}>{f.tip}</div>
          </div>
        ))}
      </div>
      <div className="card">
        <h3 style={{ marginTop: 0 }}>✅ Do's</h3>
        <ul><li>Dal + rice/roti daily, green leaves 4×/week</li><li>Lemon/amla with meals (vitamin C doubles iron uptake)</li><li>Iron tablets with water, not milk/tea (if prescribed)</li></ul>
        <h3>🚫 Don'ts</h3>
        <ul><li>No tea/coffee 1 hr before & after meals</li><li>Don't skip meals during periods</li><li>Avoid self-dosing: ask ASHA/doctor</li></ul>
      </div>
    </section>
  )
}
