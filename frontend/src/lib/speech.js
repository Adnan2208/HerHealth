// Speech helpers: audio readout (SpeechSynthesis) + voice symptom input
// (SpeechRecognition where supported). No server needed, fully offline-capable.

const LANG_VOICE = { en: 'en-IN', hi: 'hi-IN', mr: 'mr-IN', ta: 'ta-IN', te: 'te-IN', bn: 'bn-IN' }

export function speak(text, lang = 'en') {
  try {
    const synth = window.speechSynthesis
    if (!synth) return false
    synth.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.lang = LANG_VOICE[lang] || 'en-IN'
    u.rate = 0.92
    synth.speak(u)
    return true
  } catch { return false }
}

export function stopSpeak() {
  try { window.speechSynthesis?.cancel() } catch { /* noop */ }
}

// Returns {supported, start(onText, lang)} for voice symptom entry
export function voiceInput() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition
  if (!SR) return { supported: false }
  return {
    supported: true,
    start(onText, lang = 'en') {
      const rec = new SR()
      rec.lang = LANG_VOICE[lang] || 'en-IN'
      rec.interimResults = false
      rec.maxAlternatives = 1
      rec.onresult = (e) => onText(e.results?.[0]?.[0]?.transcript || '')
      rec.onerror = () => onText('')
      rec.start()
      return () => { try { rec.stop() } catch { /* noop */ } }
    },
  }
}
