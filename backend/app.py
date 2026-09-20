"""HerHealth Ecosystem anemia screening backend (FastAPI).

Mirrors Computer-Vision/final_script.py exactly:
  upload -> saved internally as image.png -> crop_conjunctiva
  (redness segmentation + square_box margin 0.35, fallback centre crop)
  -> BGR->RGB, resize 224, mobilenet_v3-style scaling ((x/127.5)-1, numpy)
  -> anemia_mobilenetv3.tflite (ai-edge-litert) predict -> verdict JSON.

Inference backends (in order of preference):
  1. Lite  (`MODEL_TFLITE`, default ../Computer-Vision/anemia_mobilenetv3.tflite)
  2. TF rollback (`MODEL_DIR`, only if the .tflite is missing AND TF installed)
  3. Mock (`ANEMIA_MOCK=1`, brightness heuristic, flagged `mock: true`)

Run locally:
    pip install -r requirements.txt
    uvicorn app:app --reload --port 8000
    # model is expected at ../Computer-Vision/anemia_mobilenetv3.tflite
    # or set MODEL_TFLITE env var.

Deploy (free, no 5-min sleep like Render free):
  Frontend (this repo's /frontend) -> Netlify or Vercel (static).
  Backend (this folder) -> Hugging Face Spaces (Docker), Koyeb, Railway,
  Fly.io, or any Docker host. Set FRONTEND_URL for CORS + VITE_API_URL
  in the frontend to point at the backend URL.

Why not backend on Netlify/Vercel?
  Even the Lite model + cv2 exceed serverless size/timeout limits.
  Static frontend + separate Python backend is the only reliable free path.
  (A fully-static TF.js in-browser option is a future enhancement.)
"""

import io
import json
import os
import sys
import tempfile
import time
import uuid
from datetime import datetime, timezone
from pathlib import Path

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

# ---------------------------------------------------------------- paths ---
HERE = Path(__file__).resolve().parent
REPO_ROOT = HERE.parent
CV_DIR = REPO_ROOT / "Computer-Vision"
DEFAULT_MODEL_DIR = CV_DIR / "anemia_mobilenetv3"

MODEL_DIR = Path(os.environ.get("MODEL_DIR", str(DEFAULT_MODEL_DIR)))
MODEL_TFLITE = Path(
    os.environ.get("MODEL_TFLITE", str(CV_DIR / "anemia_mobilenetv3.tflite"))
)
ALERTS_FILE = Path(os.environ.get("ALERTS_FILE", str(HERE / "alerts.json")))
FRONTEND_URL = os.environ.get("FRONTEND_URL", "*")
MOCK_MODE = os.environ.get("ANEMIA_MOCK", "0") == "1"

CLASS_NAMES = ["anemic", "non-anemic"]
IMG_SIZE = 224
MARGIN = 0.35

# Risk thresholds (tune as needed; documented in README + frontend)
LOW_CONF_THRESHOLD = 0.65   # below this -> "low_confidence" regardless of band
HIGH_RISK_THRESHOLD = 0.85  # anemic prob >= this -> "high" (red)
# anemic + conf in [LOW_CONF, HIGH_RISK) -> "moderate" (yellow)
# non-anemic + conf >= LOW_CONF -> "low" (green)

# Symptom bump: >=3 reported symptoms bumps one tier (low->moderate, moderate->high)
SYMPTOM_BUMP_COUNT = 3

# ---------------------------------------------------------------- cropper --
# Import the exact cropper from Computer-Vision without running app.py.
# Falls back to a PIL centre-crop if cv2 is unavailable (light hosts).
sys.path.insert(0, str(CV_DIR))
try:
    import cv2  # type: ignore

    HAVE_CV2 = True
except Exception:  # pragma: no cover
    cv2 = None  # type: ignore
    HAVE_CV2 = False

try:
    from crop_conjunctiva import fallback_box, segment_conjunctiva, square_box

    HAVE_CROPPER = True
except Exception as e:  # pragma: no cover
    print(f"[warn] crop_conjunctiva import failed ({e}); using PIL fallback", flush=True)
    HAVE_CROPPER = False


def _crop_with_cv2(img_bgr):
    """Exact logic from final_script.py:crop_image."""
    ih, iw = img_bgr.shape[:2]
    bbox, _ = segment_conjunctiva(img_bgr, debug=False)
    if bbox is None:
        x0, y0, x1, y1 = fallback_box(iw, ih)
        method = "fallback-centre"
        det = None
    else:
        x, y, bw, bh = bbox
        det = (int(x), int(y), int(bw), int(bh))
        x0, y0, x1, y1 = square_box(x, y, bw, bh, iw, ih, margin=MARGIN)
        method = "redness-segmentation"
    crop = img_bgr[y0:y1, x0:x1]
    return crop, method, det, (x0, y0, x1, y1)


def _crop_with_pil(pil_img):
    """Lightweight fallback when cv2 is unavailable: centre crop biased below centre."""
    w, h = pil_img.size
    side = int(round(min(w, h) * 0.80))
    cx = w / 2
    cy = h / 2 + 0.06 * h
    x0 = int(round(cx - side / 2))
    y0 = int(round(cy - side / 2))
    x0 = max(0, min(w - side, x0))
    y0 = max(0, min(h - side, y0))
    return pil_img.crop((x0, y0, x0 + side, y0 + side)), "fallback-centre-pil", None, (x0, y0, x0 + side, y0 + side)


# ---------------------------------------------------------------- model -----
# Backend kinds: "lite" (ai-edge-litert, prod default), "tf" (rollback),
# "mock" (ANEMIA_MOCK=1). _model holds the interpreter / keras model.
_model = None
_model_error = None
_model_kind = None


def _load_lite():
    from ai_edge_litert.interpreter import Interpreter

    print(f"[model] loading Lite: {MODEL_TFLITE}", flush=True)
    interp = Interpreter(model_path=str(MODEL_TFLITE))
    interp.allocate_tensors()
    print("[model] Lite loaded OK", flush=True)
    return interp


def _load_tf():
    import tensorflow as tf  # local import: keeps --help/fast paths light

    print(f"[model] loading TF rollback: {MODEL_DIR}", flush=True)
    keras_model = tf.keras.models.load_model(str(MODEL_DIR))
    print("[model] TF loaded OK", flush=True)
    return keras_model


def get_model():
    """Lazy-load the model once; Lite first, TF rollback, else 503.

    Returns (model, kind). Raises HTTPException with a helpful message if
    no backend is available (mock mode is handled by the caller).
    """
    global _model, _model_error, _model_kind
    if MOCK_MODE:
        return None, "mock"
    if _model is not None:
        return _model, _model_kind
    if _model_error is not None:
        raise _model_error
    errors = []
    if MODEL_TFLITE.exists():
        try:
            _model = _load_lite()
            _model_kind = "lite"
            return _model, _model_kind
        except Exception as e:
            errors.append(f"Lite load failed ({e})")
    else:
        errors.append(f"{MODEL_TFLITE} not found")
    if MODEL_DIR.exists():
        try:
            _model = _load_tf()
            _model_kind = "tf"
            return _model, _model_kind
        except Exception as e:
            errors.append(f"TF rollback failed ({e})")
    else:
        errors.append(f"{MODEL_DIR} not found")
    msg = (
        f"Model unavailable: {'; '.join(errors)}. "
        "Set MODEL_TFLITE env var, or run with ANEMIA_MOCK=1 for UI testing."
    )
    print(f"[model] ERROR: {msg}", flush=True)
    _model_error = HTTPException(status_code=503, detail=msg)
    raise _model_error


def predict_probs(model, kind, x):
    """Run one preprocessed batch; returns [p_anemic, p_non_anemic]."""
    if kind == "lite":
        inp = model.get_input_details()[0]
        out = model.get_output_details()[0]
        model.set_tensor(inp["index"], x.astype(inp["dtype"]))
        model.invoke()
        return [float(p) for p in model.get_tensor(out["index"])[0]]
    # TF rollback: identical math to final_script.py.
    return [float(p) for p in model.predict(x, verbose=0)[0]]


def preprocess_for_model(crop_rgb_224):
    """Match final_script.py / original serving behavior EXACTLY (numpy, no TF).

    Measured fact (TF 2.19): `mobilenet_v3.preprocess_input` on float32 input
    returns it UNCHANGED (identity), so the deployed pipeline feeds RAW
    [0,255] pixels and the model's inner Rescaling(1/127.5, -1) does the only
    [0,255]->[-1,1] mapping. Do NOT add (x/127.5)-1 here: that
    double-normalizes and shifts outputs catastrophically (measured
    p_anemic 0.9994 -> 0.026 on the same crop). Only expand batch dim.
    """
    import numpy as np

    return np.expand_dims(crop_rgb_224.astype("float32"), 0)


def mock_probs_from_brightness(crop_rgb_224) -> list:
    """Deterministic mock when TF unavailable: darker/redder crop -> higher anemic prob.

    Lets the frontend + deploy pipeline be tested without downloading TF.
    Clearly flagged with `mock: true` in the response.
    """
    import numpy as np

    arr = np.asarray(crop_rgb_224, dtype=np.float32)
    # crude pallor heuristic: low red-channel mean -> more "anemic"
    r_mean = float(arr[:, :, 0].mean()) / 255.0
    p_anemic = float(min(0.95, max(0.05, 0.85 - r_mean * 0.7)))
    return [p_anemic, 1.0 - p_anemic]


# ---------------------------------------------------------------- risk ------
def to_risk_band(label: str, confidence: float, symptoms: list) -> tuple:
    """Map (label, confidence, symptoms) -> (risk_band, action_key, bumped).

    Bands: low | moderate | low_confidence | high
    """
    if confidence < LOW_CONF_THRESHOLD:
        band = "low_confidence"
        action = "hospital_hb_test"
        return band, action, False
    if label == "non-anemic":
        band, action = "low", "diet_plan"
    else:
        # label == anemic
        prob_anemic_conf = confidence  # argmax was anemic, so conf == p(anemic)
        if prob_anemic_conf >= HIGH_RISK_THRESHOLD:
            band, action = "high", "asha_help"
        else:
            band, action = "moderate", "diet_plan"
    # symptom bump (only upward, never out of low_confidence)
    bumped = False
    if len(symptoms) >= SYMPTOM_BUMP_COUNT:
        if band == "low":
            band, action, bumped = "moderate", "diet_plan", True
        elif band == "moderate":
            band, action, bumped = "high", "asha_help", True
    return band, action, bumped


# ---------------------------------------------------------------- alerts ----
def _read_alerts() -> list:
    try:
        if ALERTS_FILE.exists():
            return json.loads(ALERTS_FILE.read_text(encoding="utf-8"))
    except Exception as e:
        print(f"[warn] alerts read failed: {e}", flush=True)
    return []


def _write_alerts(alerts: list) -> None:
    try:
        ALERTS_FILE.write_text(json.dumps(alerts, indent=2), encoding="utf-8")
    except Exception as e:
        print(f"[warn] alerts write failed: {e}", flush=True)


# ---------------------------------------------------------------- app -------
app = FastAPI(title="HerHealth Ecosystem Anemia Screening API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if FRONTEND_URL == "*" else [o.strip().rstrip("/") for o in FRONTEND_URL.split(",") if o.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "model_tflite": str(MODEL_TFLITE),
        "model_tflite_exists": MODEL_TFLITE.exists(),
        "model_dir": str(MODEL_DIR),
        "model_exists": MODEL_DIR.exists(),
        "backend": _model_kind or ("mock" if MOCK_MODE else "unloaded"),
        "have_cv2": HAVE_CV2,
        "have_cropper": HAVE_CROPPER,
        "mock_mode": MOCK_MODE,
        "time": datetime.now(timezone.utc).isoformat(),
    }


@app.post("/api/predict")
async def predict(
    image: UploadFile = File(..., description="Eyelid photo (jpg/png)"),
    symptoms: str = Form(default="[]", description='JSON array, e.g. ["fatigue","dizziness"]'),
    name: str = Form(default=""),
    phone: str = Form(default=""),
    language: str = Form(default="en"),
    lat: str = Form(default=""),
    lon: str = Form(default=""),
):
    t0 = time.time()
    # ---- validate + parse symptoms ----
    try:
        symptoms_list = json.loads(symptoms) if isinstance(symptoms, str) else list(symptoms)
        if not isinstance(symptoms_list, list):
            raise ValueError("symptoms must be a JSON array")
        symptoms_list = [str(s) for s in symptoms_list][:20]
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid symptoms JSON: {e}")

    raw = await image.read()
    if not raw or len(raw) < 100:
        raise HTTPException(status_code=400, detail="Empty image upload")
    if len(raw) > 12 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Image too large (max 12MB)")

    # ---- save as image.png (as requested) then run final_script pipeline ----
    # Use an isolated temp dir per request so concurrent users don't clash,
    # but the file inside is always named image.png for traceability.
    tmpdir = tempfile.mkdtemp(prefix="herhealth_")
    image_png = os.path.join(tmpdir, "image.png")
    with open(image_png, "wb") as f:
        f.write(raw)

    try:
        import numpy as np
        from PIL import Image
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Missing PIL/numpy: {e}")

    # decode
    try:
        pil = Image.open(io.BytesIO(raw)).convert("RGB")
    except Exception:
        raise HTTPException(status_code=400, detail="Could not decode image (use JPG/PNG)")

    iw, ih = pil.size
    mock_used = False

    if HAVE_CV2 and HAVE_CROPPER:
        buf = np.frombuffer(raw, dtype=np.uint8)
        bgr = cv2.imdecode(buf, cv2.IMREAD_COLOR)
        if bgr is None:
            raise HTTPException(status_code=400, detail="Could not decode image with OpenCV")
        ih, iw = bgr.shape[:2]
        crop_bgr, method, det, sq = _crop_with_cv2(bgr)
        if crop_bgr.size == 0:
            raise HTTPException(status_code=422, detail="Empty crop; try a clearer photo")
        import numpy as _np  # noqa

        crop_rgb = cv2.cvtColor(crop_bgr, cv2.COLOR_BGR2RGB)
        crop_rgb = cv2.resize(crop_rgb, (IMG_SIZE, IMG_SIZE), interpolation=cv2.INTER_AREA)
    else:
        crop_pil, method, det, sq = _crop_with_pil(pil)
        crop_pil = crop_pil.resize((IMG_SIZE, IMG_SIZE))
        crop_rgb = np.asarray(crop_pil)
        det = None

    x0, y0, x1, y1 = [int(v) for v in sq]
    print(f"[cropper] input: image.png ({iw}x{ih}) method={method} square=({x0},{y0},{x1},{y1})", flush=True)

    # ---- model ----
    model, kind = None, "mock"
    try:
        model, kind = get_model()
    except HTTPException as he:
        # In non-mock mode a missing model is a hard error (503 with instructions).
        raise he

    if model is None:  # MOCK_MODE
        probs = mock_probs_from_brightness(crop_rgb)
        mock_used = True
        model_ms = 0
    else:
        x = preprocess_for_model(crop_rgb)
        m0 = time.time()
        probs = predict_probs(model, kind, x)
        model_ms = int((time.time() - m0) * 1000)
        print(f"[model] backend={kind} inference_ms={model_ms}", flush=True)

    import numpy as np2

    pred = int(np2.argmax(probs))
    label = CLASS_NAMES[pred]
    confidence = float(max(probs))

    band, action, bumped = to_risk_band(label, confidence, symptoms_list)

    # ---- auto-notify ASHA on high risk ----
    asha_notified = False
    alert_id = None
    if band == "high":
        alerts = _read_alerts()
        alert_id = uuid.uuid4().hex[:12]
        alerts.insert(
            0,
            {
                "id": alert_id,
                "name": name or "Unnamed patient",
                "phone": phone or "",
                "risk": "high",
                "label": label,
                "confidence": round(confidence, 4),
                "prob_anemic": round(probs[0], 4),
                "symptoms": symptoms_list,
                "language": language,
                "lat": lat,
                "lon": lon,
                "status": "notified",
                "created_at": datetime.now(timezone.utc).isoformat(),
            },
        )
        _write_alerts(alerts)
        asha_notified = True

    elapsed_ms = int((time.time() - t0) * 1000)
    print(f"FINAL VERDICT: {label.upper()} ({confidence*100:.2f}%) band={band}", flush=True)

    return {
        "label": label,
        "prob_anemic": round(probs[0], 4),
        "prob_non_anemic": round(probs[1], 4),
        "confidence": round(confidence, 4),
        "crop_method": method,
        "bbox_detected": det,
        "square": [x0, y0, x1, y1],
        "input_size": [iw, ih],
        "risk_band": band,  # low | moderate | low_confidence | high
        "action": action,  # diet_plan | hospital_hb_test | asha_help
        "symptom_bumped": bumped,
        "symptoms": symptoms_list,
        "asha_notified": asha_notified,
        "alert_id": alert_id,
        "mock": mock_used,
        "inference_ms": elapsed_ms,
        "model_ms": model_ms,
        "backend": kind,
    }


# ---------------------------------------------------------------- ASHA ------
@app.get("/api/asha/alerts")
def list_alerts(status: str = ""):
    alerts = _read_alerts()
    if status:
        alerts = [a for a in alerts if a.get("status") == status]
    return {"count": len(alerts), "alerts": alerts}


@app.patch("/api/asha/alerts/{alert_id}")
def update_alert(alert_id: str, payload: dict):
    alerts = _read_alerts()
    allowed = {"notified", "contacted", "in_progress", "resolved"}
    for a in alerts:
        if a.get("id") == alert_id:
            if "status" in payload:
                if payload["status"] not in allowed:
                    raise HTTPException(status_code=400, detail=f"status must be one of {sorted(allowed)}")
                a["status"] = payload["status"]
            if "note" in payload:
                a["note"] = str(payload["note"])[:500]
            a["updated_at"] = datetime.now(timezone.utc).isoformat()
            _write_alerts(alerts)
            return a
    raise HTTPException(status_code=404, detail="alert not found")


# ---------------------------------------------------------------- hospitals -
# Static demo list (Maharashtra-centric). Frontend uses device geolocation +
# Haversine to sort by distance and links out to OSM/Google Maps directions.
HOSPITALS = [
    {"name": "Primary Health Centre — Demo", "area": "District HQ", "phone": "102", "lat": 19.0760, "lon": 72.8777, "type": "govt"},
    {"name": "Civil Hospital — Demo", "area": "City Centre", "phone": "108", "lat": 18.5204, "lon": 73.8567, "type": "govt"},
    {"name": "Rural Health Clinic — Demo", "area": "Block Level", "phone": "104", "lat": 19.9975, "lon": 73.7898, "type": "clinic"},
]


@app.get("/api/hospitals")
def hospitals(lat: float = 19.0760, lon: float = 72.8777):
    import math

    def km(a, b, c, d):
        r = 6371.0
        p1, p2 = math.radians(a), math.radians(c)
        dp = math.radians(c - a)
        dl = math.radians(d - b)
        h = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
        return round(2 * r * math.asin(math.sqrt(h)), 1)

    out = [{**h, "distance_km": km(lat, lon, h["lat"], h["lon"])} for h in HOSPITALS]
    out.sort(key=lambda h: h["distance_km"])
    return {"count": len(out), "hospitals": out}


@app.get("/")
def root():
    return JSONResponse(
        {
            "service": "HerHealth Ecosystem Anemia Screening API",
            "docs": "/docs",
            "health": "/api/health",
            "predict": "POST /api/predict (multipart: image, symptoms, name, phone, language, lat, lon)",
        }
    )
