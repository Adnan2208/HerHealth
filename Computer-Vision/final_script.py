"""Final anemia screening script: image.png -> cropper -> MobileNetV3 -> verdict.

Usage:
    ./Computer-Vision/venv/bin/python final_script.py [--image image.png] [--model Computer-Vision/anemia_mobilenetv3]

Pipeline (no app.py, no old anemia3.h5 logic):
    1. Read image.png with cv2.
    2. Run crop_conjunctiva.segment_conjunctiva (redness map) + square_box
       (margin 0.35), fallback to centre crop if nothing found.
    3. BGR->RGB, resize to 224, mobilenet_v3.preprocess_input (must match
       anemia_mobilenetv3_training.ipynb), predict with anemia_mobilenetv3.
    4. Print final verdict in terminal.

    Class order: ['anemic', 'non-anemic'] (alphabetical, from
    image_dataset_from_directory in training).
"""
import argparse
import os
import sys

import cv2
import numpy as np

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DEFAULT_IMAGE = os.path.join(BASE_DIR, "image.png")
DEFAULT_MODEL = os.path.join(BASE_DIR, "anemia_mobilenetv3")
CROP_SCRIPT_DIR = os.path.join(BASE_DIR, "Computer-Vision")

CLASS_NAMES = ["anemic", "non-anemic"]
IMG_SIZE = 224
MARGIN = 0.35

# Import cropper functions without running app.py / predict.py.
sys.path.insert(0, CROP_SCRIPT_DIR)
from crop_conjunctiva import fallback_box, segment_conjunctiva, square_box


def crop_image(bgr, margin=MARGIN):
    img_h, img_w = bgr.shape[:2]
    bbox, _ = segment_conjunctiva(bgr, debug=False)
    if bbox is None:
        x0, y0, x1, y1 = fallback_box(img_w, img_h)
        method = "fallback-centre"
        det = None
    else:
        x, y, bw, bh = bbox
        det = (int(x), int(y), int(bw), int(bh))
        x0, y0, x1, y1 = square_box(x, y, bw, bh, img_w, img_h, margin=margin)
        method = "redness-segmentation"
    crop = bgr[y0:y1, x0:x1]
    return crop, method, det, (x0, y0, x1, y1)


def main():
    ap = argparse.ArgumentParser(description="Anemia verdict from image.png")
    ap.add_argument("--image", default=DEFAULT_IMAGE)
    ap.add_argument("--model", default=DEFAULT_MODEL)
    ap.add_argument("--save-crop", default="", help="Optional path to save 224px crop")
    args = ap.parse_args()

    if not os.path.isfile(args.image):
        print(f"ERROR: image not found: {args.image}", file=sys.stderr)
        sys.exit(1)
    if not os.path.isdir(args.model) and not os.path.isfile(args.model):
        print(f"ERROR: model not found: {args.model}", file=sys.stderr)
        sys.exit(1)

    import tensorflow as tf
    from tensorflow.keras.applications.mobilenet_v3 import preprocess_input

    bgr = cv2.imread(args.image, cv2.IMREAD_COLOR)
    if bgr is None:
        print(f"ERROR: could not decode image: {args.image}", file=sys.stderr)
        sys.exit(1)
    ih, iw = bgr.shape[:2]
    print(f"[cropper] input: {args.image} ({iw}x{ih})")

    crop, method, det, sq = crop_image(bgr)
    if crop.size == 0:
        print("ERROR: empty crop", file=sys.stderr)
        sys.exit(1)
    x0, y0, x1, y1 = sq
    if det is None:
        print("[cropper] WARNING: no conjunctiva contour -> fallback centre crop")
    else:
        print(f"[cropper] detected bbox: x={det[0]} y={det[1]} w={det[2]} h={det[3]}")
    print(f"[cropper] method={method} square=({x0},{y0},{x1},{y1}) size={x1-x0}x{y1-y0}")

    rgb = cv2.cvtColor(crop, cv2.COLOR_BGR2RGB)
    rgb = cv2.resize(rgb, (IMG_SIZE, IMG_SIZE), interpolation=cv2.INTER_AREA)
    if args.save_crop:
        cv2.imwrite(args.save_crop, cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR))
        print(f"[cropper] saved 224px crop -> {args.save_crop}")

    print(f"[model] loading: {args.model}")
    model = tf.keras.models.load_model(args.model)
    x = preprocess_input(rgb.astype(np.float32))
    x = np.expand_dims(x, 0)
    probs = [float(p) for p in model.predict(x, verbose=0)[0]]
    pred = int(np.argmax(probs))
    label = CLASS_NAMES[pred]

    print("=" * 50)
    print(f"Prob anemic     : {probs[0]:.4f}")
    print(f"Prob non-anemic : {probs[1]:.4f}")
    print(f"Prediction      : {label} ({max(probs)*100:.2f}% confidence)")
    print(f"Crop method     : {method}")
    print("=" * 50)
    print(f"FINAL VERDICT: {label.upper()} ({max(probs)*100:.2f}%)")


if __name__ == "__main__":
    main()
