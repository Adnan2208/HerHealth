# HerHealth Ecosystem — Menstrual Health + Anemia Screening

Mobile-first health app for low-literacy users and ASHA workers. It combines
menstrual health education with non-invasive anemia screening from an eyelid
photo using an on-device style computer-vision + MobileNetV3 pipeline.

## Problem it solves

Anemia is widespread and under-screened in rural areas, especially among women
and adolescent girls. Blood tests require a clinic visit, which many users
delay. HerHealth gives a quick, picture-based screening aid at home and routes
high-risk cases to an ASHA worker for follow-up with a confirmatory Hb blood
test.

Target users:
- Low-literacy women / adolescent girls (simple pictures, voice, 6 languages)
- ASHA workers (triage queue, case follow-up, nearby hospital referrals)

## Key features

**Anemia screening flow**
- Eyelid photo capture with guided framing (Retake / Confirm, lighting hints)
- Symptom entry: tap pictures, type, or speak (9 symptoms: fatigue, dizziness,
  pale skin, breathlessness, headache, palpitation, cold hands, nail changes,
  cravings)
- Color-coded result with 4 risk bands (low, moderate, high, low-confidence)
- Symptom bump: 3+ symptoms raises the band one tier
- High-risk auto-notifies the ASHA queue; low-confidence asks for a clearer
  photo + Hb blood test

**ASHA worker dashboard**
- Alert queue (notified / contacted / in_progress / resolved)
- Patient name, phone, risk, confidence, symptoms, language, location
- Status updates and case notes

**Learning + support**
- Period health education (8 topics) with audio narration
- Iron-rich diet plan (8 foods, do / don't guidance)
- Nearby hospitals list sorted by distance with call / directions links
- Past-checks history (offline-first, stored on device)

**Accessibility-first design**
- 6 languages: English, Hindi, Marathi, Tamil, Telugu, Bengali (native-script picker)
- Listen button on key screens (SpeechSynthesis), voice symptom input
- 48px+ touch targets, visible focus rings, screen-reader labels
- Risk is never color-alone: color + icon + shape + pattern + text label
- Low-bandwidth: no stock photos or CDNs, inline SVG + emoji illustration only
- Offline banner, adjustable text size, colorblind-safe palettes

## How screening works

```
Eyelid photo (image.png)
  -> conjunctiva crop (redness segmentation + square box, margin 0.35;
     fallback to centre crop if detection fails)
  -> BGR to RGB, resize to 224x224, MobileNetV3 preprocessing
  -> anemia_mobilenetv3 classifier (classes: anemic, non-anemic)
  -> risk band mapping + symptom bump -> result + action
```

- Cropper: `Computer-Vision/crop_conjunctiva.py`
- Reference CLI pipeline: `Computer-Vision/final_script.py`
- Model: `Computer-Vision/anemia_mobilenetv3/` (MobileNetV3Large, 224px)
- App backend mirrors the CLI pipeline exactly so local tests and app results match

## Risk bands

| Condition | Band | What the user sees |
|---|---|---|
| Confidence < 0.65 (either label) | `low_confidence` 🔵 | Retake photo + nearest hospital + Hb blood-test explainer |
| `non-anemic`, confidence ≥ 0.65 | `low` 🟢 | Reassurance + diet plan |
| `anemic`, 0.65 ≤ confidence < 0.85 | `moderate` 🟡 | Diet plan + visit clinic this week |
| `anemic`, confidence ≥ 0.85 | `high` 🔴 | ASHA auto-notified + emergency steps + call 108 |

Thresholds live in `backend/app.py` (`LOW_CONF_THRESHOLD`, `HIGH_RISK_THRESHOLD`).

## App screens

Onboarding → Language → Home → Scan → Symptoms → Results,
plus Learn, Diet, Hospitals, History, ASHA Dashboard, Settings via Home and
the bottom tab bar (Home / Scan / Learn / Diet / More).

## Tech stack

- Frontend: React 18 + React Router (HashRouter) + Vite, plain CSS design system
  (`frontend/src/`)
- Backend: FastAPI, Pillow + NumPy, OpenCV cropper, TFLite (ai-edge-litert)
  with TensorFlow rollback and a flagged mock mode for UI testing
  (`backend/app.py`)
- Model training / conversion scripts and the original cropper live in
  `Computer-Vision/` (unchanged reference code)

## Project structure

```
Anemia-Test/
├── Computer-Vision/      # model, cropper, CLI reference pipeline
│   ├── final_script.py   # image.png -> crop -> predict -> verdict
│   ├── crop_conjunctiva.py
│   ├── anemia_mobilenetv3/       # SavedModel (training output)
│   └── anemia_mobilenetv3.tflite # deployable Lite model
├── backend/              # FastAPI screening + ASHA + hospital API
│   ├── app.py            # /api/predict, /api/asha/alerts, /api/hospitals
│   └── requirements.txt
├── frontend/             # Vite + React static SPA
│   └── src/
│       ├── pages/        # Onboarding, Home, Scan, Symptoms, Results,
│       │                 # Education, Diet, Hospitals, History, Asha, Settings
│       ├── components/UI.jsx  # icon set, RiskBanner, chips, symptom/food data
│       ├── i18n.js       # en/hi/mr/ta/te/bn strings
│       └── lib/          # api client, speech, storage
├── design.md             # visual design system (colors, type, screens)
└── README.md             # this file
```

## Privacy

Photos are processed for screening only. Nothing is shared without consent
except a high-risk alert to the ASHA worker queue (name, phone, risk,
symptoms) so follow-up care can reach the patient.

## Medical disclaimer

⚠️ Screening aid only, not a diagnosis. Low-confidence and high-risk results
must be confirmed with an invasive Hb blood test by a health worker.
