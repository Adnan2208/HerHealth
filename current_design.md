# Current Design — HerHealth Ecosystem (Anemia-Test)

> Purpose: single context file for future visual/text changes. If you change colours, structure, icons or copy, update this file first, then edit `frontend/src/styles.css`, `frontend/src/i18n.js`, `frontend/src/App.jsx`, `frontend/src/components/UI.jsx`, `frontend/src/pages/*.jsx`.
> Last audited: 2026-09-19 from live codebase (Vite + React SPA, HashRouter, static frontend + FastAPI backend).
> Redesign v2 (Phase 1, 2026-09-19): new token system + inline SVG icon set + Home/Results/Symptoms screens. All other pages inherit the new tokens (cards, buttons, alerts, focus) but keep legacy emoji tiles until Phase 2.

## 1. High-level concept

- **Name:** HerHealth Ecosystem + droplet SVG brand-mark in header (was 🩸 emoji).
- **Tagline:** "Health & Anemia Screening" (translated per language).
- **Audience:** low-literacy users + ASHA workers, mobile-first, low-bandwidth (no stock photos, no image assets, no CDNs. Only inline SVG + CSS).
- **Tone:** warm, trustworthy, non-clinical. Simple sentences. Pictures + voice over paragraphs.
- **Design language "warm clinic":** deep maroon trust gradient + terracotta energy on warm paper; layered soft shadows; 4/8/12/16/24/32 spacing scale; 12.5–30px type scale; 160ms ease motion (disabled under `prefers-reduced-motion`).
- **Shell:** centered app column, max 520px (`1060px` when `.wide` on ASHA desktop view ≥900px). Warm paper page bg, white cards, maroon gradient header.
- **Flow:** `/` Onboarding → `/language` → `/home` → `/scan` → `/symptoms` → `/results` (+ `/learn`, `/diet`, `/hospitals`, `/history`, `/asha`, `/settings` via Home + bottom tabbar).
- **Punctuation rule:** no emdashes (U+2014) anywhere in UI copy. Use periods, commas, colons, or hyphens. Verified with a repo-wide search over `frontend/src`.

## 2. Colour system (source of truth: `frontend/src/styles.css:7-60`)

| Token | Hex | Usage |
|---|---|---|
| `--bg` | `#faf1e8` | Page background (warm paper) with soft radial highlight |
| `--bg-deep` | `#f3e3d0` | Gradient depth |
| `--surface` | `#ffffff` | Cards, secondary buttons, inputs |
| `--surface-warm` | `#fdf0e1` | Hero, selected states, menu hover |
| `--surface-tint` | `#f7e7d3` | Alt tint |
| `--ink` | `#26180f` | Primary text (15.4:1 on bg, 17.2:1 on white) |
| `--ink-soft` | `#6f5c4b` | Muted text (5.7:1 on bg, 6.4:1 on white) |
| `--ink-faint` | `#97867a` | Chevrons, decorative only (never body text) |
| `--line` | `#ead5be` | Card/input borders |
| `--line-strong` | `#d9bd99` | Secondary buttons, chips, selected borders |
| `--brand` | `#7c2d2d` | Deep warm maroon (kept from v1 for trust/continuity). White on brand: 9.3:1 |
| `--brand-deep` | `#5c1e1e` | Topbar/button gradient end. White on it: 12.7:1 |
| `--brand-2` | `#c0563f` | Terracotta: gradients, focus glow, active accents |
| `--accent` | `#e8915a` | Meter gradient start |
| `--focus` | `#1a73e8` | 3px `:focus-visible` outline + glow ring |
| `--shadow-sm/md/lg` | layered | Cards `md`; hover `lg`; press collapses to `press`. Buttons carry inner top highlight |

### Risk system — NEVER color alone (color + shape + SVG icon + label + pattern stripe)

| Band | BG / Ink / Line (all ≥6.7:1) | Icon (medallion shape) | Pattern |
|---|---|---|---|
| `low` (`risk-low`) | bg `#e2f4e7`, ink `#0f4d26` (8.7:1), line `#178a4c` | `checkCircle` in **circle** medallion | 45° sparse stripe |
| `moderate` (`risk-moderate`) | bg `#fff1bd`, ink `#5c4300` (8.2:1), line `#8f6a00` | `alertTriangle` in **rounded-triangle** medallion | -45° dense stripe + dashed side rail |
| `high` (`risk-high`) | bg `#fde4e1`, ink `#7a1a14` (8.7:1), line `#b3261e` | `octagon` in **squared** medallion, larger title, `shadow-lg` | 90° stripe + solid side rail |
| `low_confidence` (`risk-lowconf`) | bg `#e7effe`, ink `#174ea6` (6.8:1), line = ink | `search` in **diamond** medallion (rotated 45°) | flat + dotted side rail |

Chips (`.chip-*`) reuse same 4 palettes + grey, and now take `icon` (SVG) or `dot` (`circle|triangle|square|diamond`) props so the shape coding survives at chip size. Alerts reuse the same palettes with a leading SVG icon.

Other:
- Meter track: `#eee0cb` with inset shadow, fill `linear-gradient(90deg, accent, brand-2, brand)`, 20px pill, animates width 600ms.
- Step dots (Symptoms): 26×7px bars, done = maroon gradient.
- Progress dots (Learn, legacy): 14px circles, done = maroon gradient.
- Offline bar: bg `#3a2f26`, text `#ffe9c9`; online status is a `.status-line` card pill. Both carry a `signal` SVG icon.
- `theme-color` meta + topbar base: `#7c2d2d` (unchanged).

## 3. Typography, spacing, motion

- **Font:** `"Noto Sans", "Noto Sans Devanagari", system-ui` (`--font`), unchanged. Google Fonts in `index.html`.
- **Type scale:** `--text-xs 12.5` (eyebrows, badges) / `--text-sm 14` (muted, subs) / `--text-base 17` (body, buttons) / `--text-lg 19` (primary buttons, topbar title) / `--text-xl 22` (risk titles) / `--text-2xl 26` (section titles, high-risk title) / `--text-display 30` (reserved). Headings `800`, tight leading `1.25`, `-0.2px` tracking; body `1.6`.
- **Eyebrow pattern:** `12.5px, 800, uppercase, 1.2px tracking` + 15px SVG icon, maroon. Used to anchor dense screens (`Step 2 of 3`, `AI details`, `Urgent`, `Next step`).
- **Spacing scale:** `--s1 4 / --s2 8 / --s3 12 / --s4 16 / --s5 24 / --s6 32 / --s7 48`. Content: `16px 16px 112px`, `gap 16px`.
- **Radius:** `xs 10 / sm 12 / base 18 / lg 22 / xl 26 / pill 999`. Cards `lg`, buttons `16`, icon tiles `15`, inputs `14`.
- **Motion:** `--dur 160ms`, `--ease cubic-bezier(0.22,0.9,0.3,1)`. Buttons/menus/symptoms lift on hover (`translateY(-1px)` + deeper shadow), `scale(0.98)` on press. Disabled/loading uses a CSS-only `.spinner`. All motion off under `prefers-reduced-motion`.
- **Touch:** `--tap 48px` minimum everywhere; primary buttons `56px` min-height.
- **Tabbar:** frosted white (`blur 8px`), top border `line-strong`, soft top shadow; active tab gets warm pill bg + 3.5px gradient top indicator. Icons 24px SVG.
- **Topbar:** maroon gradient (`brand-deep → brand`), `←` SVG ghost icon-btn, droplet brand-mark medallion, title + sub, native-language pill (translucent white).

## 4. Global structure (`frontend/src/App.jsx`, `frontend/src/main.jsx`, `frontend/index.html`)

```
<topbar> [← Back] [droplet mark] HerHealth Ecosystem + tagline | [native lang pill]
<main .content> route page
<nav .tabbar> Home | Scan | Learn | Diet | More (SVG + label, active pill)
```

- Router: `HashRouter` (no server rewrites needed).
- Audio: `stopSpeak()` on every route change; `Listen` buttons use SpeechSynthesis per lang.
- `documentElement.lang` set from profile; body classes `text-lg/text-xl` for text size.
- Title: `HerHealth Ecosystem — Health & Anemia Screening`. (Document title only; no emdash in app UI copy.)
- `TABS` config in `App.jsx` maps routes to `Icon` names (`home, camera, book, bowl, settings`).

## 5. Reusable components (`frontend/src/components/UI.jsx` + `styles.css`)

- **`Icon(name, label?)`:** ~35 inline SVGs, 24px grid, `stroke=currentColor`, `fill=none`, round caps. Names include: `home camera book bowl settings back volume mic check checkCircle alertTriangle octagon search info phone pin refresh chevronRight activity shield eye droplet user users bell clipboard clock moon dizzy face wind bolt snow hand cookie signal pencil x heartHandshake`. Zero deps, zero fetches.
- **`AudioButton`:** `.audio-btn` pill with `volume` SVG icon. Leading pictographs are stripped from the i18n `listen` string at render (`plainLabel`), so `i18n.js` stays the copy source while the SVG is the single visual.
- **`RiskBanner(band, confidence)`:** `.risk + risk-*` with `.risk-medallion` (shape-coded per band) + `.risk-body` (`h2` title + `.risk-desc` + labeled meter). Copy unchanged except emdash cleanup (`riskHigh` now uses a colon).
- **`Chip(kind, icon?, dot?)`:** pill with optional SVG icon or shape-coded `.chip-dot`.
- **`SYMPTOMS` (9):** each entry now has `icon` (SVG name) alongside legacy `emoji` fallback: fatigue `moon`, dizziness `dizzy`, pale_skin `face`, breathless `wind`, headache `bolt`, palpitation `activity`, cold_hands `snow`, nails `hand`, craving `cookie`. Bilingual `en`/`hi` labels unchanged.
- **`FOODS` (8):** unchanged content (emoji tiles stay until Phase 2); en-dash/en-dash-like ranges normalized to hyphens.
- **`EDU_TOPICS` (8, `t1-t8`):** titles/bodies unchanged except emdash cleanup (ranges now `3-7`, `4-6`).

## 6. Page-by-page visuals & copy

### `/` Onboarding (`pages/Onboarding.jsx`) — Phase 2 pending
- Structure unchanged (warm hero card, 3 step cards, Start, privacy alert). Step copy uses colons now (`Learn about periods: pictures + voice...`). Inherits new card/button/alert/focus styling automatically.

### `/language` (`pages/Language.jsx`) — Phase 2 pending
- Structure unchanged. Inherits new `lang-card` hover/selected states (warm gradient + ring).

### `/home` (`pages/Home.jsx`) — REDESIGNED (Phase 1)
- Hero: `.card-warm.hero` with `heartHandshake` eyebrow (`Your health friend`), `welcome` heading (keeps 🙏 greeting, the one allowed emoji-in-copy case), `homeSub`, `Listen`.
- Actions are a `.menu` list, not equal flat buttons: one dominant `.menu-item.primary` (camera tile, `Check Anemia`, sub `Eyelid photo, about 1 minute`), then `Learn` group (book `Learn about Periods`, bowl `Diet Tips`) and `Nearby help` group (pin `Find Hospital`, clock `My past checks`, users `ASHA Worker Dashboard`), each row = 46px icon tile + bold label + muted sub + chevron. Legacy leading emoji stripped at render via `plain()`.
- Privacy: `alert-info` with `shield` icon (🔒 stripped at render).
- Status: `.status-line` (online) / `.offline-bar` (offline) pill with `signal` icon. Copy: `Online. Photos are renamed to image.png on the server, then analyzed.` / `Offline. Results will sync when back online.`
- New microcopy (menu subs, eyebrow) is structural English only and still needs translation keys in a later pass.

### `/scan` (`pages/Scan.jsx`) — Phase 2 pending
- Structure unchanged. Heading uses hyphen (`Scan - eyelid photo`). Inherits new inputs/buttons/chips/cards.

### `/symptoms` (`pages/Symptoms.jsx`) — REDESIGNED (Phase 1)
- Header: `clipboard` eyebrow `Step 2 of 3` + `section-title` + sub + 3-bar `step-dots` (2 done).
- Live `sym-count` pill (`Tap what you feel` / `N selected`) above the grid.
- 9-cell `.sym-grid` renders SVG `Icon` (not emoji) + bilingual label + `.sym-check` badge on selection; selected = maroon border + warm gradient + ring. `aria-pressed` unchanged.
- Typed-symptoms card: `pencil` label, `mic` voice button (`Listening... speak now` state), datalist unchanged.
- Name/phone card: `user` / `phone` labels, placeholders unchanged.
- Error: `alert-err` with `octagon` icon. Missing-photo message uses parentheses, no emdash.
- Submit: `btn-primary` with `search` icon; busy state shows CSS `.spinner` + `analyzing` text, disabled.

### `/results` (`pages/Results.jsx`) — REDESIGNED (Phase 1)
- Empty: 72px camera icon-tile + `No result yet` + primary with camera icon.
- Demo/mock alerts carry `alertTriangle` / `info` icons; copy unchanged except emdash cleanup.
- `RiskBanner` is the dominant element (larger high-risk title, medallion, meter).
- Details card: `eye` eyebrow `AI details`, same 4 `.kv` rows (missing symptoms now `None`), shape-coded band chip (`circle/triangle/square/diamond` dots, no 🟢🟡🔴🔵), `symptoms bumped` grey chip with `activity` icon, `ASHA notified` red chip with `bell` icon.
- Per-band CTA hierarchy: primary is always the single large action. low_confidence card has `droplet` eyebrow `Next step` + `Hb blood test: what happens?` (colon, no emoji); high card has `bell` eyebrow `Urgent` + `Help is on the way` title, numbered `.steps` list, red `.emergency-call` (`call 108`) button above the hospital CTA.
- Footer: Retake (`refresh` icon) + Home (`home` icon) secondary buttons.

### `/learn` + `/learn/:id` (`pages/Education.jsx`) — Phase 2 pending
- Structure unchanged; inherits new cards/dots/buttons. Still uses emoji tiles + `›` chevron (migrate to `Icon` + `.menu-item` in Phase 2).

### `/diet` (`pages/Diet.jsx`) — Phase 2 pending
- Structure unchanged; `Avoid self-dosing: ask ASHA/doctor` (colon). Migrate food tiles to SVG/icon-tile style in Phase 2.

### `/hospitals` (`pages/Hospitals.jsx`) — Phase 2 pending
- Structure unchanged; notes use periods (`Demo list. Press Locate...`, `Offline. Demo list...`, `Location permission denied. Showing demo list.`). Migrate `📍/📞/🧭` buttons to `Icon` in Phase 2.

### `/history` (`pages/History.jsx`) — Phase 2 pending
- Structure unchanged; empty copy uses a period. Migrate `🟢🟡🔵🔴` trend dots to shape-coded SVG dots in Phase 2.

### `/asha` (`pages/Asha.jsx`) — Phase 2 pending
- Structure unchanged; `Local demo entry. Status lives on the server...` (period), detail header uses hyphen (`Name - case id`), missing fields use `None` / `Not given`. Migrate status icons + patient tiles to `Icon` + chips in Phase 2.

### `/settings` (`pages/Settings.jsx`) — Phase 2 pending
- Structure unchanged; language options use hyphens (`Hindi - हिन्दी` style), privacy bullet uses a period. Comment block at top still documents the old token hexes; refresh it in Phase 2.

## 7. Buttons / inputs / feedback language

- **Primary (`.btn-primary`):** maroon gradient, white text, full width, 56px min, inner highlight + `md` shadow; hover lifts, press scales. Used for the single dominant action per screen. Busy/disabled shows spinner.
- **Menu primary (`.menu-item.primary`):** same gradient treatment as a tappable row with icon tile + sub + chevron (Home scan entry).
- **Secondary (`.btn-secondary`):** white, `line-strong` border, ink text, inner highlight; hover shifts border to terracotta + lifts.
- **Menu rows (`.menu-item`):** white cards with 46px warm icon tile (maroon icon), bold label + muted sub + faint chevron.
- **Ghost/icon:** topbar back `Icon back` (translucent white); audio pills white with maroon icon; `aria-pressed` selected = warm bg + maroon border + ring.
- **Inputs:** white, `2px line`, 14px radius, inset shadow; focus = terracotta border + warm glow ring (in addition to global `:focus-visible` blue ring for keyboard users).
- **Icons as affordances:** every CTA/menu/indicator uses the SVG `Icon` set; decorative emoji are `aria-hidden`, functional controls keep `aria-label`s. Emoji remains ONLY inside genuine copy/voice strings (greetings like `Namaste 🙏`, food/education content tiles until Phase 2, language picker flags).
- **No emdashes** in any user-facing string (verified by search).

## 8. Copy — exact English strings (`frontend/src/i18n.js:14-52`)

`appName HerHealth Ecosystem`, `tagline Health & Anemia Screening`, `start Start ▶`, nav `Home Scan Learn Diet More`, `welcome Namaste 🙏, your health friend`, `homeSub Learn about periods. Check anemia with an eyelid photo.`, `checkAnemia 📸 Check Anemia`, `learnPeriods 📚 Learn about Periods`, `findHospital 🏥 Find Hospital`, `dietTips 🥗 Diet Tips`, `privacyNote 🔒 Your photos stay private. Nothing is shared without your permission.`, `language Language / भाषा`, `continue Continue`, `back ← Back`, `retake 🔄 Retake`, `confirmUse ✅ Use this photo`, `takePhoto 📷 Take / Add eyelid photo`, `scanHelp Pull the lower eyelid down gently. Keep the red inner part inside the dotted line.`, `goodVsBad ✅ Good: red part clear, bright light • ❌ Bad: blurry, dark, too far`, `quality Photo check`, `symptomsTitle How do you feel?`, `symptomsSub Tap the pictures, no need to type. Or speak / write below.`, `analyze 🔍 Check result`, `analyzing Checking… please wait`, `riskLow Low Risk`, `riskModerate Moderate Risk`, `riskHigh High Risk: help is on the way`, `riskLowConf Need a clearer check`, `viewDiet View Diet Plan 🥗`, `findNearest Find Nearest Hospital 🏥`, `helpComing Help is on the way 🤝`, `asha ASHA Worker`, `history My past checks`, `settings Settings`, `listen 🔊 Listen`, `stop ⏹ Stop`, `demoNote Backend not reachable. Showing a demo result so you can try the screens.`
- hi/mr/ta/te/bn carry same keys translated (see `i18n.js:54-186`); emdash → comma/colon/period applied in every language; fallback to `en` if key missing. Lang picker icons unchanged (Phase 2).
- Rendered Phase 1 screens strip legacy leading pictographs at render (`plain()` in pages, `plainLabel` in `UI.jsx`) so i18n stays the copy source while SVG is the visual.
- Backend risk copy (README): `low_confidence Nearest hospital + Hb explainer`, `low Reassurance + diet`, `moderate Diet + clinic this week`, `high ASHA auto-notify + emergency`.

## 9. Icon inventory (replaces §9 emoji inventory for migrated surfaces)

- `UI.jsx Icon` set (35): navigation (`home camera book bowl settings back`), audio (`volume mic`), status (`check checkCircle alertTriangle octagon search info shield`), actions (`refresh chevronRight phone pin bell clipboard clock pencil x`), health pictograms (`activity eye droplet heartHandshake user users`), symptom pictograms (`moon dizzy face wind bolt snow hand cookie`), utility (`signal`).
- Symptom pictogram map: fatigue `moon`, dizziness `dizzy`, pale_skin `face`, breathless `wind`, headache `bolt`, palpitation `activity`, cold_hands `snow`, nails `hand`, craving `cookie`.
- Risk map: low `checkCircle/circle`, moderate `alertTriangle/triangle`, high `octagon/square`, low_confidence `search/diamond`.
- Still emoji (Phase 2 to migrate): Scan good/bad + quality chips, language picker flags, Learn tiles, Diet food tiles + Do/Don't heads, Hospitals buttons, History trend dots, ASHA status + avatar, Settings labels, topbar/table fallbacks.

## 10. How to use this file for changes

1. State change as: "Keep [section] but change X → Y (e.g. `--brand #7c2d2d → #0b5c3f`, or risk `low` icon `checkCircle → heart`)."
2. Ask to propagate to: `styles.css` tokens, `UI.jsx` Icon/RiskBanner/SYMPTOMS/FOODS/EDU_TOPICS, `i18n.js` strings, page headings/buttons.
3. Verify: `npm run build` in `frontend/`, walk Onboarding→Scan→Symptoms→Results + Learn/Diet/ASHA, check 48px targets, focus ring, colorblind (icon+shape+text still clear if color removed), search `frontend/src` for `—` (must be zero), and hi language render.

## 11. Phase 2 (agreed next step after Home/Results/Symptoms feedback)

1. Migrate Scan, Education, Diet, Hospitals, History, ASHA, Settings, Onboarding, Language to the `Icon` + `menu-item` + `eyebrow` patterns; remove remaining emoji-as-control.
2. Translate the new structural microcopy (Home menu subs, `Step 2 of 3`, `Tap what you feel`, `AI details`, `Next step`, `Urgent`) into hi/mr/ta/te/bn keys.
3. Refresh the `Settings.jsx` accessibility comment with the v2 token hexes and measured ratios (§2).
4. Optional: trend visualization in History using shape-coded SVG dots; food tiles with icon-tiles.
