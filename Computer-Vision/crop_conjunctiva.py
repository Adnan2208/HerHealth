"""Conjunctiva cropper for non-invasive anemia detection.

Pipeline:
  1. Load eye photo (e.g. image.png).
  2. Segment the palpebral conjunctiva via a redness map (R-G) with an
     adaptive threshold (mean + std), morphological cleanup and contour
     scoring biased to the central / lower-middle region where the
     conjunctiva normally appears.
  3. Expand the bounding box with a margin, force it square, clip to the
     image and crop.
  4. Save the full-resolution crop plus a 128x128 version matching the
     anemia3.h5 model input, plus a debug visualisation.

Fallback: if no plausible conjunctiva contour is found, do a centred
square crop biased slightly below the image centre (matches the framing
of the 224x224 training images).

Usage:
  ./venv/bin/python crop_conjunctiva.py --input image.png --output cropped_conjunctiva.jpg
  ./venv/bin/python crop_conjunctiva.py --input image.png --output cropped_conjunctiva.jpg --size 128 --margin 0.35
"""
import argparse
import os
import sys

import cv2
import numpy as np


def _candidates_for_thresh(redness, thresh, h, w, kernel):
    """Score conjunctiva-like contours at one redness threshold."""
    mask = ((redness > thresh).astype(np.uint8)) * 255

    # Cleanup: close gaps inside conjunctiva, remove small speckles.
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)
    mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel)

    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    img_area = h * w
    candidates = []
    for c in contours:
        area = cv2.contourArea(c)
        # Conjunctiva band is small: a fraction of a percent up to ~8% of
        # the frame. Anything bigger is merged skin/face, not conjunctiva.
        if area < 0.001 * img_area or area > 0.10 * img_area:
            continue
        x, y, bw, bh = cv2.boundingRect(c)
        if bw < 20 or bh < 15:
            continue
        # Conjunctiva is a horizontal band: much wider than tall.
        if bw < 1.2 * bh:
            continue
        M = cv2.moments(c)
        cx = (M["m10"] / M["m00"]) if M["m00"] else x + bw / 2
        cy = (M["m01"] / M["m00"]) if M["m00"] else y + bh / 2
        # Must lie roughly in the central / middle region (not fingers at
        # the bottom edge, not forehead at the top).
        if not (0.10 * w < cx < 0.95 * w and 0.20 * h < cy < 0.85 * h):
            continue
        # Prefer large + central + lower (conjunctiva is usually below centre).
        centrality = 1.0 - min(1.0, abs(cx - w / 2) / (w / 2))
        lower_bias = 0.5 + 0.5 * min(1.0, max(0.0, (cy - 0.35 * h) / (0.4 * h)))
        score = area * (0.5 + 0.5 * centrality) * lower_bias
        candidates.append((score, (x, y, bw, bh)))
    candidates.sort(key=lambda t: t[0], reverse=True)
    return candidates, mask


def segment_conjunctiva(bgr, debug=False):
    """Return (x, y, w, h) bbox of conjunctiva in pixel coords, plus mask."""
    h, w = bgr.shape[:2]
    b, g, r = cv2.split(bgr)
    redness = r.astype(np.float32) - g.astype(np.float32)

    mean, std = float(redness.mean()), float(redness.std())
    # Try strict thresholds first (vivid-red only), then relax. A high
    # threshold isolates the small conjunctiva crescent; a low one merges
    # skin/face into huge blobs, which the area cap then rejects.
    adaptive = float(np.clip(mean + 1.0 * std, 45.0, 60.0))
    thresholds = [75.0, 65.0, 55.0, adaptive]
    # De-duplicate while keeping order.
    seen, ordered = set(), []
    for t in thresholds:
        key = round(t, 1)
        if key not in seen:
            seen.add(key)
            ordered.append(t)

    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (9, 9))
    best, best_mask, used = None, None, None
    for thresh in ordered:
        candidates, mask = _candidates_for_thresh(redness, thresh, h, w, kernel)
        if debug:
            print(f"[cropper]   th={thresh:.1f} mask_frac={mask.mean()/255:.4f} "
                  f"candidates={len(candidates)}" +
                  (f" top={candidates[0][1]}" if candidates else ""))
        if candidates and best is None:
            best, best_mask, used = candidates[0][1], mask, thresh

    if debug:
        print(f"[cropper] redness mean={mean:.1f} std={std:.1f} "
              f"used_thresh={used} bbox={best}")
    if best is None:
        # Return the adaptive-threshold mask for the debug view.
        _, best_mask = _candidates_for_thresh(redness, adaptive, h, w, kernel)
        return None, best_mask
    return best, best_mask


def square_box(x, y, bw, bh, img_w, img_h, margin=0.35):
    """Expand bbox by margin, force square, clip to image. Returns (x0,y0,x1,y1)."""
    cx, cy = x + bw / 2, y + bh / 2
    side = max(bw, bh) * (1.0 + margin)
    # Don't let the crop exceed the frame; keep at least 40% of min dim.
    side = min(side, img_w, img_h)
    x0 = int(round(cx - side / 2))
    y0 = int(round(cy - side / 2))
    x1 = int(round(x0 + side))
    y1 = int(round(y0 + side))
    # Shift back inside the image if overflowing.
    if x0 < 0:
        x1 -= x0
        x0 = 0
    if y0 < 0:
        y1 -= y0
        y0 = 0
    if x1 > img_w:
        x0 -= (x1 - img_w)
        x1 = img_w
    if y1 > img_h:
        y0 -= (y1 - img_h)
        y1 = img_h
    x0, y0 = max(0, x0), max(0, y0)
    return x0, y0, x1, y1


def fallback_box(img_w, img_h):
    """Centred square crop biased slightly below centre (eye framing)."""
    side = int(round(min(img_w, img_h) * 0.80))
    cx = img_w / 2
    cy = img_h / 2 + 0.06 * img_h  # conjunctiva sits below the middle
    x0 = int(round(cx - side / 2))
    y0 = int(round(cy - side / 2))
    x0 = max(0, min(img_w - side, x0))
    y0 = max(0, min(img_h - side, y0))
    return x0, y0, x0 + side, y0 + side


def main():
    ap = argparse.ArgumentParser(description="Crop conjunctiva region for anemia model")
    ap.add_argument("--input", default="image.png", help="Input eye photo")
    ap.add_argument("--output", default="cropped_conjunctiva.jpg", help="Output cropped image (full res)")
    ap.add_argument("--size", type=int, default=128, help="Model input size (saves <name>_128.jpg)")
    ap.add_argument("--margin", type=float, default=0.35, help="Margin around detected bbox")
    ap.add_argument("--debug-out", default="crop_debug.jpg", help="Visualisation with bbox overlay")
    args = ap.parse_args()

    if not os.path.isfile(args.input):
        print(f"ERROR: input not found: {args.input}", file=sys.stderr)
        sys.exit(1)

    bgr = cv2.imread(args.input, cv2.IMREAD_COLOR)
    if bgr is None:
        print(f"ERROR: could not read image: {args.input}", file=sys.stderr)
        sys.exit(1)
    img_h, img_w = bgr.shape[:2]
    print(f"[cropper] input: {args.input} ({img_w}x{img_h})")

    bbox, mask = segment_conjunctiva(bgr, debug=True)
    if bbox is None:
        print("[cropper] WARNING: no conjunctiva contour found, using fallback centre crop")
        x0, y0, x1, y1 = fallback_box(img_w, img_h)
        method = "fallback-centre"
    else:
        x, y, bw, bh = bbox
        print(f"[cropper] detected conjunctiva bbox: x={x} y={y} w={bw} h={bh}")
        x0, y0, x1, y1 = square_box(x, y, bw, bh, img_w, img_h, margin=args.margin)
        method = "redness-segmentation"

    print(f"[cropper] method={method} square crop=({x0},{y0},{x1},{y1}) size={x1-x0}x{y1-y0}")
    crop = bgr[y0:y1, x0:x1]
    if crop.size == 0:
        print("ERROR: empty crop, check bbox", file=sys.stderr)
        sys.exit(1)

    cv2.imwrite(args.output, crop)
    print(f"[cropper] saved full-res crop -> {args.output} ({crop.shape[1]}x{crop.shape[0]})")

    # Model-size version.
    resized = cv2.resize(crop, (args.size, args.size), interpolation=cv2.INTER_AREA)
    base, ext = os.path.splitext(args.output)
    resized_path = f"{base}_{args.size}{ext or '.jpg'}"
    cv2.imwrite(resized_path, resized)
    print(f"[cropper] saved model-size crop -> {resized_path} ({args.size}x{args.size})")

    # Debug visualisation.
    vis = bgr.copy()
    cv2.rectangle(vis, (x0, y0), (x1, y1), (0, 255, 0), 3)
    if bbox is not None:
        x, y, bw, bh = bbox
        cv2.rectangle(vis, (x, y), (x + bw, y + bh), (0, 0, 255), 2)
    cv2.putText(vis, method, (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 2)
    cv2.imwrite(args.debug_out, vis)
    print(f"[cropper] saved debug visualisation -> {args.debug_out}")


if __name__ == "__main__":
    main()
