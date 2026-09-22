// HerHealth custom illustration set. Flat-vector, warm palette, culturally
// rooted (sari, bindi, dal-leaf motifs). Inline SVG only: no raster, no
// network, tiny on low-end Android. All aria-hidden decorative by default.

const SKIN = '#c98a5f'
const SKIN_D = '#a86c46'
const SARI = '#7c2d2d'
const SARI_L = '#c0563f'
const GOLD = '#d9a441'
const CREAM = '#fdf2e8'
const APRICOT = '#f2b880'
const SAGE = '#2f6b55'
const LEAF = '#4c8a68'
const INK = '#241611'

function Frame({ children, viewBox = '0 0 240 200', title }) {
  return (
    <svg viewBox={viewBox} role={title ? 'img' : undefined} aria-label={title} aria-hidden={title ? undefined : 'true'} focusable="false">
      {children}
    </svg>
  )
}

export function HeroIllustration() {
  return (
    <Frame>
      <ellipse cx="120" cy="170" rx="92" ry="24" fill="#f5e7d9" />
      <ellipse cx="120" cy="150" rx="86" ry="58" fill="#fbe3c8" opacity="0.7" />
      {/* woman */}
      <circle cx="120" cy="72" r="26" fill={SKIN} />
      <circle cx="120" cy="72" r="26" fill="none" stroke={SKIN_D} strokeWidth="2" opacity="0.4" />
      <circle cx="120" cy="58" r="4.5" fill={SARI} />
      <path d="M94 66c2-16 12-26 26-26s24 10 26 26c-4-10-14-14-26-14s-22 4-26 14z" fill="#2b1a12" />
      <path d="M96 92c8-6 16-9 24-9s16 3 24 9l6 62H90z" fill={SARI} />
      <path d="M96 92c8-6 16-9 24-9s16 3 24 9l2 14H94z" fill={SARI_L} opacity="0.55" />
      <path d="M90 150h60" stroke={GOLD} strokeWidth="4" strokeLinecap="round" />
      <circle cx="120" cy="112" r="3" fill={GOLD} />
      {/* phone showing eyelid scan */}
      <rect x="150" y="96" width="44" height="66" rx="10" fill={INK} />
      <rect x="154" y="102" width="36" height="54" rx="7" fill={CREAM} />
      <ellipse cx="172" cy="124" rx="13" ry="9" fill="#fff" stroke={SKIN_D} strokeWidth="2" />
      <ellipse cx="172" cy="124" rx="7" ry="5" fill={SARI_L} />
      <rect x="160" y="142" width="24" height="6" rx="3" fill={SAGE} opacity="0.7" />
      {/* floating motifs */}
      <path d="M52 60s9 10 9 16a9 9 0 0 1-18 0c0-6 9-16 9-16z" fill={SARI_L} opacity="0.85" />
      <ellipse cx="196" cy="52" rx="12" ry="7" fill={LEAF} transform="rotate(-24 196 52)" />
      <ellipse cx="40" cy="128" rx="10" ry="6" fill={APRICOT} transform="rotate(20 40 128)" />
      <path d="M204 120l2.2 5.4 5.4 2.2-5.4 2.2-2.2 5.4-2.2-5.4-5.4-2.2 5.4-2.2z" fill={GOLD} />
      <path d="M60 150l1.8 4.4 4.4 1.8-4.4 1.8-1.8 4.4-1.8-4.4-4.4-1.8 4.4-1.8z" fill={SARI_L} opacity="0.7" />
    </Frame>
  )
}

export function EyeArt({ variant = 'guide' }) {
  if (variant === 'good') {
    return (
      <Frame viewBox="0 0 200 120">
        <ellipse cx="100" cy="60" rx="72" ry="44" fill="#fff" stroke={SAGE} strokeWidth="3" />
        <ellipse cx="100" cy="60" rx="34" ry="24" fill="#c0563f" />
        <ellipse cx="100" cy="60" rx="16" ry="13" fill="#571a1a" />
        <circle cx="92" cy="52" r="5" fill="#fff" opacity="0.9" />
        <path d="M40 100c20 10 40 14 60 14s40-4 60-14" stroke={SAGE} strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.5" />
      </Frame>
    )
  }
  if (variant === 'bad') {
    return (
      <Frame viewBox="0 0 200 120">
        <g filter="url(#blurBad)" opacity="0.85">
          <ellipse cx="100" cy="60" rx="72" ry="44" fill="#d8cfc4" stroke="#9b8a7d" strokeWidth="3" />
          <ellipse cx="100" cy="60" rx="30" ry="20" fill="#8a7a6c" />
        </g>
        <defs>
          <filter id="blurBad"><feGaussianBlur stdDeviation="3" /></filter>
        </defs>
        <path d="M40 100c20 10 40 14 60 14s40-4 60-14" stroke="#9b8a7d" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.6" />
      </Frame>
    )
  }
  return (
    <Frame viewBox="0 0 220 150">
      <ellipse cx="110" cy="72" rx="78" ry="48" fill="#fff" stroke={SKIN_D} strokeWidth="3" />
      <ellipse cx="110" cy="72" rx="36" ry="26" fill="#c0563f" />
      <ellipse cx="110" cy="72" rx="17" ry="14" fill="#571a1a" />
      <circle cx="102" cy="64" r="5" fill="#fff" opacity="0.9" />
      <path d="M52 34c14-12 36-18 58-18s44 6 58 18" stroke={SARI} strokeWidth="4" fill="none" strokeLinecap="round" strokeDasharray="8 7" />
      <rect x="52" y="112" width="116" height="20" rx="10" fill={SARI} opacity="0.9" />
      <text x="110" y="126" textAnchor="middle" fontSize="11" fontWeight="800" fill="#fff" fontFamily="inherit">keep red part here</text>
    </Frame>
  )
}

export function ScanProcessingArt() {
  return (
    <Frame viewBox="0 0 200 150" title={undefined}>
      <ellipse cx="100" cy="110" rx="70" ry="16" fill="#f5e7d9" />
      <ellipse cx="100" cy="70" rx="62" ry="42" fill="#fff" stroke={SARI} strokeWidth="3" />
      <ellipse cx="100" cy="70" rx="30" ry="22" fill="#c0563f" />
      <ellipse cx="100" cy="70" rx="14" ry="12" fill="#571a1a" />
      <rect className="scan-line-rect" x="44" y="66" width="112" height="5" rx="2.5" fill="#e8915a" />
      <circle cx="100" cy="70" r="58" fill="none" stroke={SARI_L} strokeWidth="2" opacity="0.35" />
      <circle cx="100" cy="70" r="72" fill="none" stroke={SARI_L} strokeWidth="1.5" opacity="0.2" />
      <path d="M160 108s7 8 7 12.5a7 7 0 0 1-14 0c0-4.5 7-12.5 7-12.5z" fill={SARI_L} />
    </Frame>
  )
}

const STORY_SCENES = {
  t1: (<><circle cx="120" cy="80" r="44" fill="#fff" stroke={SARI} strokeWidth="3" /><rect x="104" y="52" width="32" height="40" rx="6" fill={CREAM} stroke={SARI} strokeWidth="2.5" /><path d="M112 52v-8M128 52v-8" stroke={SARI} strokeWidth="4" strokeLinecap="round" /><circle cx="120" cy="76" r="8" fill={SARI_L} /><path d="M82 130c12-8 26-12 38-12s26 4 38 12" stroke={SARI_L} strokeWidth="4" fill="none" strokeLinecap="round" /><path d="M60 40s8 9 8 14a8 8 0 0 1-16 0c0-5 8-14 8-14z" fill={SARI_L} /></>),
  t2: (<><rect x="80" y="70" width="80" height="60" rx="14" fill="#fff" stroke={SAGE} strokeWidth="3" /><path d="M100 100c6-8 14-8 20 0s14 8 20 0" stroke={SAGE} strokeWidth="4" fill="none" strokeLinecap="round" /><circle cx="100" cy="88" r="4" fill={SAGE} /><circle cx="140" cy="88" r="4" fill={SAGE} /><circle cx="66" cy="60" r="10" fill="#fbe3c8" stroke={SAGE} strokeWidth="2.5" /><circle cx="174" cy="60" r="10" fill="#fbe3c8" stroke={SAGE} strokeWidth="2.5" /><path d="M96 150h48" stroke={GOLD} strokeWidth="4" strokeLinecap="round" /></>),
  t3: (<><rect x="46" y="110" width="148" height="10" rx="5" fill={SARI} opacity="0.3" /><rect x="104" y="60" width="32" height="60" rx="6" fill={SARI} /><path d="M60 70l44 14M180 70l-44 14" stroke={INK} strokeWidth="3" strokeLinecap="round" /><circle cx="52" cy="96" r="16" fill="#fff" stroke={SAGE} strokeWidth="3" /><path d="M45 96l5 5 9-10" stroke={SAGE} strokeWidth="3" fill="none" strokeLinecap="round" /><circle cx="188" cy="96" r="16" fill="#fff" stroke="#b3261e" strokeWidth="3" /><path d="M182 90l12 12M194 90l-12 12" stroke="#b3261e" strokeWidth="3" strokeLinecap="round" /></>),
  t4: (<><circle cx="120" cy="90" r="40" fill={SKIN} /><path d="M96 84c4 4 8 4 12 0M132 84c-4 4-8 4-12 0" stroke={INK} strokeWidth="2.5" fill="none" strokeLinecap="round" /><path d="M104 108c10 6 22 6 32 0" stroke={INK} strokeWidth="2.5" fill="none" strokeLinecap="round" /><rect x="88" y="126" width="64" height="22" rx="11" fill={APRICOT} stroke={SARI_L} strokeWidth="2.5" /><path d="M70 50c6-8 14-12 24-12" stroke={SARI_L} strokeWidth="3" fill="none" strokeLinecap="round" /></>),
  t5: (<><ellipse cx="120" cy="120" rx="58" ry="26" fill="#fff" stroke={SAGE} strokeWidth="3" /><ellipse cx="100" cy="106" rx="16" ry="10" fill={LEAF} transform="rotate(-20 100 106)" /><ellipse cx="126" cy="104" rx="14" ry="9" fill={LEAF} transform="rotate(14 126 104)" /><circle cx="146" cy="118" r="12" fill="#e8915a" /><circle cx="92" cy="120" r="9" fill={GOLD} /><path d="M120 60c8 0 14 2 18 6" stroke={GOLD} strokeWidth="3" fill="none" strokeLinecap="round" /></>),
  t6: (<><rect x="78" y="50" width="84" height="96" rx="14" fill="#fff" stroke={SARI} strokeWidth="3" /><path d="M120 50s14 16 14 26a14 14 0 0 1-28 0c0-10 14-26 14-26z" fill={SARI_L} /><rect x="94" y="116" width="52" height="8" rx="4" fill={SAGE} opacity="0.7" /><circle cx="120" cy="150" r="4" fill={SARI} /><path d="M60 90h10M170 90h10" stroke={GOLD} strokeWidth="4" strokeLinecap="round" /></>),
  t7: (<><path d="M120 50s26 30 26 50a26 26 0 0 1-52 0c0-20 26-50 26-50z" fill="#fff" stroke={SARI} strokeWidth="3" /><path d="M120 72s14 16 14 28a14 14 0 0 1-28 0c0-12 14-28 14-28z" fill={SARI_L} /><rect x="70" y="136" width="100" height="10" rx="5" fill="#e7d3b8" /><rect x="70" y="136" width="38" height="10" rx="5" fill="#b3261e" /></>),
  t8: (<><ellipse cx="88" cy="84" rx="34" ry="28" fill="#fff" stroke={SARI} strokeWidth="3" /><ellipse cx="152" cy="84" rx="34" ry="28" fill="#fff" stroke={SAGE} strokeWidth="3" /><circle cx="80" cy="82" r="3" fill={INK} /><circle cx="88" cy="82" r="3" fill={INK} /><circle cx="96" cy="82" r="3" fill={INK} /><path d="M144 78l14 6-14 6z" fill={SAGE} /><path d="M112 108l8 12 8-12" stroke={GOLD} strokeWidth="4" fill="none" strokeLinecap="round" /></>),
}

export function StoryArt({ id }) {
  return (
    <Frame viewBox="0 0 240 180">
      <ellipse cx="120" cy="152" rx="88" ry="20" fill="#f5e7d9" />
      {STORY_SCENES[id] || STORY_SCENES.t1}
    </Frame>
  )
}

const FOOD_SCENES = {
  spinach: (<><ellipse cx="60" cy="60" rx="34" ry="26" fill={CREAM} stroke={SAGE} strokeWidth="3" /><ellipse cx="60" cy="52" rx="14" ry="18" fill={LEAF} /><ellipse cx="60" cy="52" rx="14" ry="18" fill="none" stroke={SAGE} strokeWidth="2" /><path d="M60 38v30" stroke={SAGE} strokeWidth="2.5" /></>),
  dal: (<><ellipse cx="60" cy="66" rx="36" ry="14" fill={SARI} /><ellipse cx="60" cy="60" rx="36" ry="14" fill="#fff" stroke={SARI} strokeWidth="3" /><ellipse cx="60" cy="60" rx="26" ry="9" fill="#e8915a" /><circle cx="52" cy="58" r="2.5" fill="#7a3a12" /><circle cx="64" cy="61" r="2.5" fill="#7a3a12" /><circle cx="70" cy="57" r="2" fill="#7a3a12" /><path d="M44 34c2-6 6-8 8-14M60 32c0-5 2-8 2-12" stroke={APRICOT} strokeWidth="3" fill="none" strokeLinecap="round" /></>),
  jaggery: (<><rect x="36" y="44" width="48" height="40" rx="10" fill="#c98a3f" stroke="#7a3a12" strokeWidth="3" /><rect x="44" y="52" width="32" height="8" rx="4" fill="#e8bd7a" /><rect x="44" y="64" width="22" height="6" rx="3" fill="#e8bd7a" /></>),
  dates: (<><ellipse cx="48" cy="62" rx="12" ry="20" fill="#5c2b1a" transform="rotate(-14 48 62)" /><ellipse cx="72" cy="62" rx="12" ry="20" fill="#7a3a22" transform="rotate(14 72 62)" /><path d="M48 46c2-4 6-6 10-6M72 46c-2-4-6-6-10-6" stroke={LEAF} strokeWidth="3" fill="none" strokeLinecap="round" /></>),
  pomegranate: (<><circle cx="60" cy="60" r="26" fill="#a4262e" stroke="#571a1a" strokeWidth="3" /><path d="M60 34l4 8h-8z" fill={LEAF} /><circle cx="52" cy="56" r="4" fill="#e0606a" /><circle cx="66" cy="62" r="4" fill="#e0606a" /><circle cx="58" cy="68" r="3" fill="#e0606a" /></>),
  ragi: (<><ellipse cx="60" cy="70" rx="30" ry="10" fill={SARI} /><path d="M36 70c0-14 10-24 24-24s24 10 24 24" fill="#8a5a3b" stroke="#571a1a" strokeWidth="3" /><circle cx="52" cy="56" r="2.5" fill="#e8bd7a" /><circle cx="64" cy="52" r="2.5" fill="#e8bd7a" /><circle cx="70" cy="60" r="2" fill="#e8bd7a" /></>),
  groundnut: (<><ellipse cx="48" cy="60" rx="13" ry="20" fill="#d9a86c" stroke="#7a3a12" strokeWidth="3" transform="rotate(-16 48 60)" /><ellipse cx="72" cy="60" rx="13" ry="20" fill="#d9a86c" stroke="#7a3a12" strokeWidth="3" transform="rotate(16 72 60)" /><path d="M44 50l8 20M76 50l-8 20" stroke="#7a3a12" strokeWidth="2" /></>),
  egg: (<><ellipse cx="60" cy="60" rx="30" ry="24" fill="#fff" stroke={SKIN_D} strokeWidth="3" /><circle cx="60" cy="62" r="11" fill="#e8915a" stroke="#c0563f" strokeWidth="2.5" /></>),
}

export function FoodArt({ id }) {
  return (
    <svg viewBox="0 0 120 110" aria-hidden="true" focusable="false">
      <circle cx="60" cy="58" r="52" fill="#fdf2e8" />
      <circle cx="60" cy="58" r="52" fill="none" stroke="#efe0cf" strokeWidth="2" />
      {FOOD_SCENES[id] || FOOD_SCENES.dal}
    </svg>
  )
}

export function EmptyArt({ kind = 'results' }) {
  if (kind === 'history') {
    return (
      <Frame viewBox="0 0 220 150">
        <rect x="40" y="30" width="140" height="90" rx="16" fill="#fff" stroke="#dfc5a6" strokeWidth="3" />
        <path d="M70 50h80M70 66h80M70 82h50" stroke="#e7d3b8" strokeWidth="8" strokeLinecap="round" />
        <circle cx="150" cy="96" r="18" fill="#fbe3c8" stroke={SARI_L} strokeWidth="3" />
        <path d="M150 96m-6 0a6 6 0 1 0 12 0a6 6 0 1 0-12 0" fill="none" stroke={SARI_L} strokeWidth="3" />
        <path d="M163 109l10 10" stroke={SARI_L} strokeWidth="4" strokeLinecap="round" />
      </Frame>
    )
  }
  if (kind === 'alerts') {
    return (
      <Frame viewBox="0 0 220 150">
        <rect x="70" y="40" width="80" height="62" rx="12" fill="#fff" stroke="#dfc5a6" strokeWidth="3" />
        <path d="M70 56l40 24 40-24" fill="none" stroke={SARI_L} strokeWidth="3" strokeLinecap="round" />
        <circle cx="160" cy="52" r="14" fill={SAGE} />
        <path d="M154 52l4 4 8-8" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" />
        <ellipse cx="110" cy="122" rx="52" ry="10" fill="#f5e7d9" />
      </Frame>
    )
  }
  return (
    <Frame viewBox="0 0 220 150">
      <ellipse cx="110" cy="122" rx="56" ry="12" fill="#f5e7d9" />
      <rect x="78" y="44" width="64" height="52" rx="12" fill={SARI} />
      <circle cx="110" cy="70" r="12" fill="none" stroke="#fff" strokeWidth="4" />
      <circle cx="110" cy="70" r="4" fill="#fff" />
      <path d="M160 50l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" fill={GOLD} />
      <path d="M58 96l1.6 4 4 1.6-4 1.6-1.6 4-1.6-4-4-1.6 4-1.6z" fill={SARI_L} />
    </Frame>
  )
}

export function TrustArt({ mini = false }) {
  return (
    <svg viewBox="0 0 96 96" className={mini ? 'trust-mini' : 'illus'} aria-hidden="true" focusable="false" style={mini ? undefined : { width: 96, height: 96 }}>
      <circle cx="48" cy="48" r="44" fill="#e4f1e9" />
      <path d="M48 14 28 23v18c0 17 8.5 29 20 35 11.5-6 20-18 20-35V23z" fill="#fff" stroke={SAGE} strokeWidth="4" strokeLinejoin="round" />
      <rect x="41" y="44" width="14" height="12" rx="2.5" fill={SAGE} />
      <path d="M43 44v-4a5 5 0 0 1 10 0v4" fill="none" stroke={SAGE} strokeWidth="3.5" />
      <path d="M68 30l1.6 4 4 1.6-4 1.6-1.6 4-1.6-4-4-1.6 4-1.6z" fill={GOLD} />
      <ellipse cx="30" cy="66" rx="9" ry="5" fill={LEAF} opacity="0.6" transform="rotate(-20 30 66)" />
    </svg>
  )
}
