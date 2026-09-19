# HerHealth Ecosystem — Menstrual Health + Anemia Screening (Eyelid AI)

Mobile-first app for low-literacy users + ASHA worker dashboard.
Upload an eyelid photo → server saves it as `image.png` → runs the
`Computer-Vision/final_script.py` pipeline → color-coded result.

```
Anemia-Test/
├── Computer-Vision/      # original model + cropper (unchanged)
│   ├── final_script.py   # CLI reference pipeline
│   ├── crop_conjunctiva.py
│   └── anemia_mobilenetv3/  # MobileNetV3Large, 224px, ['anemic','non-anemic']
├── backend/              # FastAPI — mirrors final_script.py, deploy to HF Spaces/Koyeb
│   ├── app.py            # POST /api/predict, ASHA alerts, hospitals
│   ├── requirements.txt
│   └── Dockerfile        # build context = repo root
└── frontend/             # Vite + React static SPA — deploy to Netlify/Vercel
    └── src/              # onboarding→scan→symptoms→results, learn, asha, diet…
```

## Why split deploy? (read before pushing)

Your model needs **TensorFlow (~500 MB) + OpenCV**. Netlify/Vercel serverless
functions cap out at ~50–250 MB / 10–60 s — the model **cannot** run there.
The reliable free path is:

| Part | Where | Why |
|---|---|---|
| `frontend/` (static) | **Netlify or Vercel** (free, fast CDN, no sleep) | Zero backend, instant |
| `backend/` (FastAPI+TF) | **Hugging Face Spaces (Docker, free)** / Koyeb / Railway / Fly.io | No 5-min sleep like Render free; keeps model warm |

The frontend talks to the backend via `VITE_API_URL`. Without a backend it
shows a clearly-labeled **demo result** so screens are still testable.

## 1) Run locally (5 min)

```bash
# backend (needs Python 3.11+)
pip install fastapi "uvicorn[standard]" python-multipart pillow numpy
# + for REAL AI: pip install opencv-python-headless tensorflow
cd backend
ANEMIA_MOCK=1 uvicorn app:app --port 8000   # mock (no TF download)
# real: uvicorn app:app --port 8000   (MODEL_DIR defaults to ../Computer-Vision/anemia_mobilenetv3)

# frontend (needs Node 20+)
cd ../frontend
npm install
npm run dev   # http://localhost:5173  (vite proxies /api → :8000)
```

Flow: Home → **Scan** (add photo, Retake/Confirm + light/size hints) →
**Symptoms** (tap pictures / type / 🎤 speak) → **Results** (4 states below).
The backend saves each upload as `image.png` in an isolated temp dir, then
runs crop → 224px → `mobilenet_v3.preprocess_input` → predict — same as
`final_script.py`.

## 2) Deploy backend (pick one, ~10 min)

### Option A — Hugging Face Spaces (recommended free, no Render-style sleep)
1. New Space → SDK **Docker** → blank.
2. Push `backend/Dockerfile` as `Dockerfile`, `backend/app.py` as `app.py`,
   plus `crop_conjunctiva.py` + `anemia_mobilenetv3/` + `requirements.txt`
   (Dockerfile already `COPY`s them from repo root — push whole repo).
3. Space exposes port **7860**: set `CMD` port accordingly or map 8000→7860
   (edit Dockerfile `EXPOSE`/`--port` if needed; HF injects `$PORT` — use
   `--port 7860`).
4. Set Space secrets: `FRONTEND_URL=https://<your-netlify>.netlify.app`.
5. Test: `https://<space>.hf.space/api/health` → `{"status":"ok",...}`.

### Option B — Koyeb / Railway / Fly.io (Docker, free tier)
```bash
docker build -f backend/Dockerfile -t herhealth-backend .
docker run -p 8000:8000 -e FRONTEND_URL='*' herhealth-backend
# then point the platform at this Dockerfile, expose 8000.
```

## 3) Deploy frontend to Netlify / Vercel

**Netlify:** New site → import repo → *Base directory* `frontend/` →
Build `npm run build`, Publish `dist/` → Env var
`VITE_API_URL=https://<your-backend>` → Deploy.

**Vercel:** New project → import repo → *Root Directory* `frontend/` →
Framework **Vite** → Env var `VITE_API_URL=https://<your-backend>` → Deploy.

`frontend/vercel.json`, `netlify.toml`, `public/_redirects` are included.
HashRouter is used so deep links work with zero rewrite config.

## 4) API contract

- `GET /api/health` → `{status, model_exists, have_cv2, mock_mode}`
- `POST /api/predict` (multipart: `image`, `symptoms` JSON array, `name`,
  `phone`, `language`, `lat`, `lon`) → saved as `image.png` → returns:
  ```json
  { "label": "anemic", "prob_anemic": 0.91, "prob_non_anemic": 0.09,
    "confidence": 0.91, "crop_method": "redness-segmentation",
    "risk_band": "high", "action": "asha_help",
    "asha_notified": true, "alert_id": "abc123", "mock": false }
  ```
- `GET /api/asha/alerts[?status=]` → queue; `PATCH /api/asha/alerts/{id}`
  `{"status":"contacted"|"in_progress"|"resolved"}`.
- `GET /api/hospitals?lat=&lon=` → distance-sorted demo list.

### Risk bands (single source of truth = backend `to_risk_band`)
| conf < 0.65 (any label) | `low_confidence` 🔵 | Nearest hospital + Hb blood-test explainer |
| `non-anemic`, conf ≥ 0.65 | `low` 🟢 | Reassurance + diet plan |
| `anemic`, 0.65 ≤ conf < 0.85 | `moderate` 🟡 | Diet plan + clinic this week |
| `anemic`, conf ≥ 0.85 | `high` 🔴 | ASHA auto-notify + emergency steps |
- ≥3 symptoms bumps one tier (low→moderate→high). Thresholds tunable in
  `backend/app.py` (`LOW_CONF_THRESHOLD`, `HIGH_RISK_THRESHOLD`).

## 5) Accessibility (built in, annotated in code)
- 6 languages (en/hi/mr/ta/te/bn), native-script picker, 🔊 Listen on key
  screens (SpeechSynthesis, no server), 🎤 voice symptom entry.
- ≥48 px targets, visible focus rings, logical focus order, aria-labels on
  all icon controls; risk = color **+ icon + pattern + text** (colorblind-safe);
  confidence = bar **+ % text**; history = dots, not charts.
- Noto Sans (Devanagari/Tamil/Telugu/Bengali), text-size setting, offline
  banner, low-bandwidth (no stock imagery — emoji/SVG illustration only).

## ⚠️ Medical disclaimer
Screening aid only — not a diagnosis. Low-confidence and high-risk results
must be confirmed with an invasive Hb blood test by a health worker.
