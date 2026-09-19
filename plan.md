# Plan: Slim backend with TensorFlow Lite + smaller image (HF Spaces Docker)

## 0. Finding — yes, TFLite fits this model

- Model: `Computer-Vision/anemia_mobilenetv3/` = `config.json` (188K) + `model.weights.h5` (58M). Arch from config: `Input [None,224,224,3] float32` → `MobileNetV3Large` → classifier. Standard ops, no custom layers visible → `TFLiteConverter.from_keras_model()` should work.
- Current backend cost: `tensorflow==2.19.0 (~500MB wheel + ~1GB installed)` + `opencv-headless (~90MB)` + `uvicorn[standard]` extras. Docker image likely 1.5–2GB. Too big for Render free (512MB) and slow on HF Spaces.
- Target: `ai-edge-litert (~15MB)` instead of TF, model `.tflite` (~14–29MB quantized vs 58MB now), total image ~300–400MB. Slight CPU latency increase (50–250ms) is fine for this use case.

## 1. What to remove / replace in `backend/requirements.txt`

Current (`backend/requirements.txt:1-10`):
```
fastapi==0.115.6            # KEEP
uvicorn[standard]==0.34.0   # SLIM -> uvicorn==0.34.0 (no httptools/uvloop/websockets; app uses plain HTTP only)
python-multipart==0.0.20    # KEEP (upload parsing)
numpy==1.26.4               # KEEP (or unpin to numpy>=1.26,<2 for py3.11 slim)
pillow==11.1.0              # KEEP (decode + resize; already used)
opencv-python-headless==4.10.0.84  # MAKE OPTIONAL (see §3) — keep for now, remove in phase 2
tensorflow==2.19.0          # REMOVE -> ai-edge-litert==2.2.0
```

Proposed new `backend/requirements.txt`:
```
fastapi==0.115.6
uvicorn==0.34.0
python-multipart==0.0.20
numpy==1.26.4
pillow==11.1.0
opencv-python-headless==4.10.0.84   # optional after phase 2 (PIL fallback already exists)
ai-edge-litert==2.2.0
```

Do NOT copy `Computer-Vision/requirements.txt` (has `matplotlib, flask, opencv-python (non-headless), tf 2.21` — training-only junk).

## 2. Step 1 — Convert model to TFLite (one-off, keep `anemia_mobilenetv3/` as source)

Create `Computer-Vision/convert_to_tflite.py` (run locally, NOT on server):
```python
import tensorflow as tf
model = tf.keras.models.load_model("Computer-Vision/anemia_mobilenetv3")
# A) float32 baseline (accuracy reference)
tf.lite.TFLiteConverter.from_keras_model(model).convert()  # -> anemia_mobilenetv3.tflite
# B) float16 (recommended: ~50% smaller, ~no accuracy loss, CPU+GPU friendly)
conv = tf.lite.TFLiteConverter.from_keras_model(model)
conv.optimizations = [tf.lite.Optimize.DEFAULT]
conv.target_spec.supported_types = [tf.float16]
open("anemia_mobilenetv3_fp16.tflite","wb").write(conv.convert())
# C) int8 full-quant (only if B still too big; needs representative dataset of ~100 eyelid crops)
```
- Commit only ONE file: `Computer-Vision/anemia_mobilenetv3.tflite` (fp16 recommended).
- Validate: run `final_script.py` (TF) vs TFLite script on 5–10 sample `image.png`s; require `|p_anemic_TF - p_anemic_lite| < 0.02` and same `risk_band`. If int8 drifts >2%, ship fp16.

## 3. Step 2 — Rewrite inference in `backend/app.py` (small diff)

- `get_model()` (`app.py:121-144`): replace `import tensorflow as tf; tf.keras.models.load_model` with:
  ```python
  from ai_edge_litert.interpreter import Interpreter
  _model = Interpreter(model_path=str(MODEL_TFLITE)); _model.allocate_tensors()
  ```
  Lazy-load once, same caching pattern. Env: `MODEL_TFLITE=/app/anemia_mobilenetv3.tflite` (fallback `MODEL_DIR` for rollback).
- `preprocess_for_model()` (`app.py:147-153`): replace `from tensorflow.keras.applications.mobilenet_v3 import preprocess_input` with numpy one-liner (same math): `x = (crop.astype("float32") / 127.5) - 1.0; return np.expand_dims(x, 0)`.
- Predict: replace `model.predict(x)` with `set_tensor → invoke → get_tensor`. Keep output contract identical (`label, prob_anemic, confidence, risk_band` — `to_risk_band` untouched).
- ⚠️ Verify scaling quirk before shipping: `config.json` already contains a `Rescaling(scale=0.00784, offset=-1)` layer INSIDE the model, but `final_script.py:97` + `app.py` also apply `preprocess_input` OUTSIDE. That looks like double normalization. Preserve current behavior exactly in the Lite port (apply the same external step), log it, and only "fix" it as a separate experiment with re-validation — otherwise risk bands shift.

## 4. Step 3 — Optional phase 2: drop OpenCV (~90MB + `libgl1`)

- `app.py` already has `_crop_with_pil()` fallback (`app.py:103-113`). Cropper `crop_conjunctiva.py` needs `cv2` (morphology, contours), but the fallback is acceptable for low-end hosts.
- Option: `try: import cv2 except: use PIL path` (already coded) → make `opencv-headless` optional in requirements and drop `libgl1 libglib2.0-0` from Dockerfile. Saves ~100MB + faster cold start. Cost: slightly less accurate crop on hard cases. Decide after Lite ships; keep cv2 for v1.

## 5. Step 4 — Slim Dockerfile + HF Spaces port

Current `backend/Dockerfile` uses port 8000; HF Spaces Docker requires 7860 and `Dockerfile` at repo root.
- Create root `Dockerfile` (copy of backend one, edited):
  - `FROM python:3.11-slim`, keep `libgl1` only if keeping cv2, else drop it (keep `curl` for healthchecks).
  - `COPY backend/requirements.txt`, `COPY backend/app.py`, `COPY Computer-Vision/crop_conjunctiva.py`, `COPY Computer-Vision/anemia_mobilenetv3.tflite ./` (NOT the 58MB h5 folder).
  - `ENV MODEL_TFLITE=/app/anemia_mobilenetv3.tflite`
  - `EXPOSE 7860` + `CMD ["uvicorn","app:app","--host","0.0.0.0","--port","7860","--workers","1"]`
- Expected image: ~350MB (vs ~1.8GB now). Cold start on HF free CPU: TF ~20–40s → Lite ~5–10s.

## 6. Deploy + keep-awake (HF Spaces, free)

1. New Space → SDK Docker → push repo (root `Dockerfile` present).
2. Secrets: `FRONTEND_URL=https://<netlify>.netlify.app`. Frontend `VITE_API_URL=https://<space>.hf.space`.
3. UptimeRobot free: HTTP GET `https://<space>.hf.space/api/health` every 5 min (prevents 48h sleep; Render-style 15-min sleep doesn't apply here).
4. Note: `alerts.json` is ephemeral file storage — resets on Space restart. Fine for demo; move to Postgres/Supabase for prod.

## 7. Test checklist

- [ ] `ANEMIA_MOCK=1` still boots without Lite installed.
- [ ] Real Lite: `/api/health` ok, `POST /api/predict` on 3 test eyelid photos returns same band as old TF server (±2%).
- [ ] Latency: log `inference_ms` — expect <300ms CPU (acceptable per request: "some latency OK").
- [ ] Frontend full flow: Scan → Symptoms → Results (all 4 bands), ASHA alert on high.
- [ ] Rollback: keep `MODEL_DIR` + TF code path behind env flag for one release; delete after parity confirmed.

## 8. Order of work (do not skip)

1. Convert + parity-check TFLite (fp16) locally.
2. Patch `app.py` inference + numpy preprocess (keep API identical).
3. Update `backend/requirements.txt` (drop TF, slim uvicorn, add litert).
4. Add root `Dockerfile` (7860, .tflite only).
5. Deploy to HF Spaces + Netlify env + UptimeRobot.
6. (Later) decide on dropping OpenCV.
