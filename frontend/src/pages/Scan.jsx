import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { t } from '../i18n.js'
import { AudioButton } from '../components/UI.jsx'

// Guided capture: overlay guide + good/bad examples + live quality hints
// (brightness/size via canvas: icon/color feedback, no paragraphs).
export default function Scan({ lang }) {
  const [preview, setPreview] = useState(sessionStorage.getItem('herhealth_img') || '')
  const [info, setInfo] = useState(null)
  const fileRef = useRef(null)
  const nav = useNavigate()

  const onFile = (f) => {
    if (!f) return
    if (f.size > 12 * 1024 * 1024) { alert('Image too large (max 12MB)'); return }
    const url = URL.createObjectURL(f)
    // stash as dataURL so Symptoms step survives refresh
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result
      sessionStorage.setItem('herhealth_img', dataUrl)
      sessionStorage.setItem('herhealth_img_name', f.name || 'upload.jpg')
      setPreview(dataUrl)
      // quality probe
      const img = new Image()
      img.onload = () => {
        const c = document.createElement('canvas')
        c.width = 64; c.height = 64
        const ctx = c.getContext('2d')
        ctx.drawImage(img, 0, 0, 64, 64)
        const d = ctx.getImageData(0, 0, 64, 64).data
        let sum = 0
        for (let i = 0; i < d.length; i += 4) sum += (d[i] + d[i + 1] + d[i + 2]) / 3
        const bright = sum / (64 * 64) / 255
        setInfo({
          w: img.width, h: img.height,
          kb: Math.round(f.size / 1024),
          bright,
          okLight: bright > 0.25,
          okSize: img.width >= 400 && img.height >= 400,
        })
      }
      img.src = dataUrl
    }
    reader.readAsDataURL(f)
    void url
  }

  return (
    <section aria-labelledby="scan-title" className="stack">
      <div className="section-head">
        <h2 id="scan-title">📸 {t(lang, 'scan')} - eyelid photo</h2>
      </div>
      <div className="split">
      <div className="card stack">
        <p><strong>{t(lang, 'scanHelp')}</strong></p>
        <AudioButton text={t(lang, 'scanHelp')} lang={lang} />
        <p className="muted">{t(lang, 'goodVsBad')}</p>
        <div className="grid2" aria-label="Good vs bad examples">
          <div className="card card-warm center">✅<br /><span style={{ fontSize: 40 }} aria-hidden="true">👁️</span><br /><small>red clear, bright</small></div>
          <div className="card center">❌<br /><span style={{ fontSize: 40, filter: 'blur(2px) brightness(.6)' }} aria-hidden="true">👁️</span><br /><small>blurry / dark / far</small></div>
        </div>
      </div>

      <div className="stack">
      <input
        ref={fileRef} type="file" accept="image/*" capture="environment"
        className="sr-only" id="file-pick" aria-label={t(lang, 'takePhoto')}
        onChange={(e) => onFile(e.target.files?.[0])}
      />
      {!preview && (
        <button className="btn btn-primary" onClick={() => fileRef.current?.click()} type="button">
          {t(lang, 'takePhoto')}
        </button>
      )}

      {preview && (
        <div className="card stack">
          <div className="guide-box">
            {/* eslint-disable-next-line jsx-a11y/alt-text */}
            <img src={preview} alt="Eyelid photo preview" className="preview" style={{ minHeight: 220, objectFit: 'contain' }} />
            <div className="guide-overlay" aria-hidden="true"><span>keep red part here</span></div>
          </div>
          {info && (
            <div className="chip-row" aria-label={t(lang, 'quality')}>
              <span className={`chip ${info.okLight ? 'chip-green' : 'chip-yellow'}`}>{info.okLight ? '💡 light OK' : '💡 too dark'}</span>
              <span className={`chip ${info.okSize ? 'chip-green' : 'chip-yellow'}`}>{info.okSize ? '🔍 size OK' : '🔍 too small'}</span>
              <span className="chip chip-grey">{info.w}×{info.h} • {info.kb}KB</span>
            </div>
          )}
          <div className="grid2">
            <button className="btn btn-secondary" onClick={() => { sessionStorage.removeItem('herhealth_img'); setPreview(''); setInfo(null) }} type="button">{t(lang, 'retake')}</button>
            <button className="btn btn-primary" onClick={() => nav('/symptoms')} type="button">{t(lang, 'confirmUse')}</button>
          </div>
          <p className="muted">On upload the server saves your file as <code>image.png</code> then runs the AI pipeline.</p>
        </div>
      )}
      </div>
      </div>
    </section>
  )
}

// Convert stored dataURL back to a File for upload
export function storedImageFile() {
  const dataUrl = sessionStorage.getItem('herhealth_img')
  if (!dataUrl) return null
  const [head, b64] = dataUrl.split(',')
  const mime = (head.match(/data:(.*?);/) || [])[1] || 'image/jpeg'
  const bin = atob(b64)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  const name = sessionStorage.getItem('herhealth_img_name') || 'upload.jpg'
  return new File([bytes], name, { type: mime })
}
