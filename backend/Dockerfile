FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

# System libs needed by opencv-headless (libgl1/libglib2.0-0) + curl for healthchecks.
# NOTE: no TF system deps needed anymore (ai-edge-litert is self-contained).
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 libglib2.0-0 curl \
    && rm -rf /var/lib/apt/lists/*

# Backend deps first (better layer caching)
COPY backend/requirements.txt ./requirements.txt
RUN pip install --upgrade pip && pip install -r requirements.txt

# App + cropper + TFLite model (NOT the 58MB Keras folder).
# NOTE: build context must be the repo root (Anemia-Test/), e.g.:
#   docker build -f backend/Dockerfile -t herhealth-backend .
COPY backend/app.py ./app.py
COPY Computer-Vision/crop_conjunctiva.py ./crop_conjunctiva.py
COPY Computer-Vision/anemia_mobilenetv3.tflite ./anemia_mobilenetv3.tflite
ENV MODEL_TFLITE=/app/anemia_mobilenetv3.tflite

EXPOSE 8000
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]
