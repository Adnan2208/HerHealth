import { Link, useNavigate, useParams } from 'react-router-dom'
import { t } from '../i18n.js'
import { AudioButton, EDU_TOPICS, Icon, plain } from '../components/UI.jsx'
import { StoryArt } from '../components/Illustrations.jsx'
import { store } from '../lib/api.js'
import { speak } from '../lib/speech.js'

export default function Education({ lang }) {
  const done = store.edu()
  const n = EDU_TOPICS.filter((x) => done[x.id]).length
  const firstOpen = EDU_TOPICS.find((x) => !done[x.id]) || EDU_TOPICS[0]
  return (
    <section aria-labelledby="edu-title" className="stack">
      <div className="section-head">
        <span className="eyebrow"><Icon name="book" /> Stories with voice</span>
        <h2 id="edu-title" className="section-title">{plain(t(lang, 'learnPeriods'))}</h2>
      </div>
      <div className="card card-warm row" style={{ justifyContent: 'space-between' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="story-progress" aria-label={`${n} of ${EDU_TOPICS.length} completed`}>
            {EDU_TOPICS.map((x) => <i key={x.id} className={done[x.id] ? 'done' : ''} />)}
          </div>
          <div style={{ height: 8 }} />
          <strong>{n} / {EDU_TOPICS.length} stories</strong>
          <div className="muted">Tap a story. Listen, no reading needed.</div>
        </div>
        <span className="icon-tile" aria-hidden="true"><Icon name="play" /></span>
      </div>

      <div className="story-rail" role="list" aria-label="Period learning stories">
        {EDU_TOPICS.map((x) => (
          <Link
            key={x.id} to={`/learn/${x.id}`} className="story-card" role="listitem"
            aria-label={`${x.title}, ${x.dur}${done[x.id] ? ', completed' : ''}`}
          >
            <div className="story-art">
              <StoryArt id={x.art} />
              <span className="story-dur"><Icon name="clock" />{x.dur}</span>
              {done[x.id] && <span className="story-done-badge" aria-hidden="true"><Icon name="check" /></span>}
            </div>
            <div className="story-body">
              <strong>{x.title}</strong>
              <span className="muted"><Icon name="volume" /> audio {done[x.id] ? '• done' : ''}</span>
            </div>
          </Link>
        ))}
      </div>

      <Link className="btn btn-primary" to={`/learn/${firstOpen.id}`}>
        <Icon name="play" /> {n === 0 ? 'Start first story' : 'Continue learning'} <Icon name="arrowRight" />
      </Link>

      <div className="menu" aria-label="All stories list">
        {EDU_TOPICS.map((x) => (
          <Link key={x.id} to={`/learn/${x.id}`} className="menu-item" aria-label={`${x.title}, ${x.dur}${done[x.id] ? ', completed' : ''}`}>
            <span className="icon-tile" aria-hidden="true"><Icon name="book" /></span>
            <span className="menu-text">{x.title}
              <span className="menu-sub">{x.dur} • audio{done[x.id] ? ' • done' : ''}</span>
            </span>
            <span className="menu-chev" aria-hidden="true"><Icon name="chevronRight" /></span>
          </Link>
        ))}
      </div>
    </section>
  )
}

export function EduPlayer({ lang }) {
  const { id } = useParams()
  const nav = useNavigate()
  const idx = Math.max(0, EDU_TOPICS.findIndex((x) => x.id === id))
  const topic = EDU_TOPICS[idx] || EDU_TOPICS[0]
  const done = !!store.edu()[topic.id]
  const prev = EDU_TOPICS[idx - 1]
  const next = EDU_TOPICS[idx + 1]
  return (
    <section aria-labelledby="ep-title" className="stack narrow">
      <div className="story-player-art">
        <StoryArt id={topic.art} />
      </div>
      <div className="card center stack" style={{ alignItems: 'center' }}>
        <span className="eyebrow"><Icon name="book" /> Story {idx + 1} of {EDU_TOPICS.length} • {topic.dur}</span>
        <h2 id="ep-title" className="section-title">{topic.title}</h2>
        <div className="row" style={{ justifyContent: 'center', flexWrap: 'wrap' }}>
          <AudioButton text={`${topic.title}. ${topic.body}`} lang={lang} />
          <button className="audio-btn" type="button" onClick={() => speak(topic.body, lang)} aria-label="Replay narration">
            <Icon name="refresh" /> Replay
          </button>
        </div>
      </div>
      <div className="card" style={{ fontSize: 18 }}>{topic.body}</div>
      <div className="seq-dots" aria-label={`Story ${idx + 1} of ${EDU_TOPICS.length}`}>
        {EDU_TOPICS.map((x) => <i key={x.id} className={x.id === topic.id ? 'done' : ''} />)}
      </div>
      <div className="btn-row">
        {prev
          ? <Link className="btn btn-secondary" to={`/learn/${prev.id}`} aria-label={`Previous story: ${prev.title}`}><Icon name="chevronLeft" /> Back</Link>
          : <Link className="btn btn-secondary" to="/learn"><Icon name="chevronLeft" /> {plain(t(lang, 'back'))}</Link>}
        {next && <Link className="btn btn-secondary" to={`/learn/${next.id}`} aria-label={`Next story: ${next.title}`}>Next <Icon name="chevronRight" /></Link>}
      </div>
      {!done && (
        <button className="btn btn-primary" type="button" onClick={() => { store.markEdu(topic.id); nav(next ? `/learn/${next.id}` : '/learn') }}>
          <Icon name="check" /> Mark done + next
        </button>
      )}
      <Link className="btn btn-secondary" to="/learn">{plain(t(lang, 'back'))}</Link>
    </section>
  )
}
