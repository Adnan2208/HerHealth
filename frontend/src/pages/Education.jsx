import { Link, useParams } from 'react-router-dom'
import { t } from '../i18n.js'
import { AudioButton, EDU_TOPICS } from '../components/UI.jsx'
import { store } from '../lib/api.js'
import { speak } from '../lib/speech.js'

export default function Education({ lang }) {
  const done = store.edu()
  const n = EDU_TOPICS.filter((x) => done[x.id]).length
  return (
    <section aria-labelledby="edu-title" className="stack">
      <div className="section-head">
      <h2 id="edu-title">📚 {t(lang, 'learnPeriods')}</h2>
      </div>
      <div className="card card-warm row">
        <div className="progress-dots" aria-label={`${n} of ${EDU_TOPICS.length} completed`}>
          {EDU_TOPICS.map((x) => <i key={x.id} className={done[x.id] ? 'done' : ''} />)}
        </div>
        <strong>{n} / {EDU_TOPICS.length} 🏅</strong>
      </div>
      {EDU_TOPICS.map((x) => (
        <Link key={x.id} to={`/learn/${x.id}`} className="card row" style={{ textDecoration: 'none', color: 'inherit' }} aria-label={`${x.title}, ${x.dur}${done[x.id] ? ', completed' : ''}`}>
          <div className="big-emoji" aria-hidden="true">{x.emoji}</div>
          <div style={{ flex: 1 }}>
            <strong>{x.title}</strong>
            <div className="muted">{x.dur} • 🔊 audio {done[x.id] ? '• ✅ done' : ''}</div>
          </div>
          <div aria-hidden="true">›</div>
        </Link>
      ))}
    </section>
  )
}

export function EduPlayer({ lang }) {
  const { id } = useParams()
  const topic = EDU_TOPICS.find((x) => x.id === id) || EDU_TOPICS[0]
  const done = !!store.edu()[topic.id]
  return (
    <section aria-labelledby="ep-title" className="stack narrow">
      <div className="card center">
        <div style={{ fontSize: 72 }} aria-hidden="true">{topic.emoji}</div>
        <h2 id="ep-title">{topic.title}</h2>
        <p className="muted">{topic.dur} • comic-style story • voice included</p>
        <div className="row" style={{ justifyContent: 'center' }}>
          <AudioButton text={`${topic.title}. ${topic.body}`} lang={lang} />
          <button className="audio-btn" type="button" onClick={() => speak(topic.body, lang)} aria-label="Replay narration">↻</button>
        </div>
      </div>
      <div className="card" style={{ fontSize: 18 }}>{topic.body}</div>
      {!done && (
        <button className="btn btn-primary" type="button" onClick={() => { store.markEdu(topic.id); history.back() }}>
          ✅ Mark done + next 🏅
        </button>
      )}
      <Link className="btn btn-secondary" to="/learn">{t(lang, 'back')}</Link>
    </section>
  )
}
