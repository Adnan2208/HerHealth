import { t } from '../i18n.js'
import { AudioButton, FOODS, Icon, plain } from '../components/UI.jsx'
import { FoodArt } from '../components/Illustrations.jsx'

export default function Diet({ lang }) {
  const intro = 'Iron-rich foods every day: green leaves, dal, jaggery, dates. Add lemon for absorption. Avoid tea with meals.'
  return (
    <section aria-labelledby="d-title" className="stack">
      <div className="section-head">
        <span className="eyebrow"><Icon name="bowl" /> Iron-rich foods</span>
        <h2 id="d-title" className="section-title">{plain(t(lang, 'dietTips'))}</h2>
        <div style={{ marginTop: 8 }}>
          <AudioButton text={intro} lang={lang} />
        </div>
      </div>
      <div className="food-grid">
        {FOODS.map((f) => (
          <div className="food-card" key={f.name}>
            <div className="food-art" aria-hidden="true">
              <FoodArt id={f.id} />
            </div>
            <div className="food-body">
              <strong>{f.name}</strong>
              <span className="iron-badge"><Icon name="sparkles" />{f.iron}</span>
              <div className="food-tip">{f.tip}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="card do-dont">
        <h3 className="ok"><Icon name="checkCircle" /> Do's</h3>
        <ul><li>Dal + rice/roti daily, green leaves 4x/week</li><li>Lemon/amla with meals (vitamin C doubles iron uptake)</li><li>Iron tablets with water, not milk/tea (if prescribed)</li></ul>
        <div className="divider" />
        <h3 className="no"><Icon name="octagon" /> Don'ts</h3>
        <ul><li>No tea/coffee 1 hr before and after meals</li><li>Don't skip meals during periods</li><li>Avoid self-dosing: ask ASHA/doctor</li></ul>
      </div>
    </section>
  )
}
