"""One-off model conversion: Keras MobileNetV3 -> TensorFlow Lite (float32).

Run LOCALLY with the full-TF toolchain env (NOT on the server):
    .venv/bin/python Computer-Vision/convert_to_tflite.py [--parity-n 20]

Toolchain (local only, never shipped):
    pip install "tf2onnx>=1.16" onnx "onnx2tf>=1.26" ai-edge-litert

Pipeline:
    1. Load `anemia_mobilenetv3/` (Keras 3 Functional).
    2. Flatten the nested `MobileNetV3Large` submodel into one graph
       (identical math, weights copied 1:1 by order+shape, verified below).
    3. Export SavedModel -> tf2onnx (opset 17) -> onnx2tf to
       `anemia_mobilenetv3.tflite` (float32, ~12MB).

Why not direct TFLiteConverter: TF 2.19's MLIR importer cannot inline the
nested Functional call (`StatefulPartitionedCall`, ERROR_NEEDS_FLEX_OPS),
and ai-edge-litert has no Flex fallback. The tf2onnx/onnx2tf route traces
the graph differently and produces clean builtin-only TFLite.

Why float32, not fp16: the fp16 variant builds fine but CRASHES on CPU-only
hosts (`Mul ... got FLOAT16`: the CPU kernel path lacks fp16 Mul). Free
prod tiers are CPU-only, so float32 (~12MB vs 58MB h5) is the ship target.

onnx2tf flags that matter:
    -b 1                # fix batch (decorative; batch is already 1)
    -k <input_name>     # REQUIRED: without it onnx2tf folds the NCHW->NHWC
                        # transpose with the wrong permutation and emits a
                        # scrambled [1,224,3,224] input. With -k the model
                        # keeps clean NHWC [1,224,224,3]. Verified by parity.

Parity gates (synthetic 224px crops: random + reddish eyelid-like gradients;
no sample photos are stored in the repo, so this checks numerical equivalence
of the converted graph, not clinical accuracy):
    TF-orig vs TF-flat : |dp| < 2e-2  (structural tripwire; fp16-compute
                          rounding between identical graphs measures ~5e-3)
    TF-orig vs Lite    : |p_anemic diff| < 0.02 and same argmax class
                          (THE shipping gate)

NOTE on preprocessing (measured, TF 2.19): `mobilenet_v3.preprocess_input`
on float32 input is the IDENTITY, so final_script.py / app.py effectively
feed RAW [0,255] pixels and the inner Rescaling(1/127.5, offset=-1) is the
only normalization (single, correct). The Lite serving path replicates this
exactly (see backend/app.py preprocess_for_model). Do NOT "fix" scaling.
"""

import argparse
import os
import shutil
import subprocess
import sys

import numpy as np

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.path.join(BASE_DIR, "anemia_mobilenetv3")
TFLITE_OUT = os.path.join(BASE_DIR, "anemia_mobilenetv3.tflite")
SM_DIR = "/tmp/anemia_flat_savedmodel"
ONNX_PATH = "/tmp/anemia_flat.onnx"

FLAT_TOL = 2e-2
PARITY_TOL = 0.02
OPSET = 17


def load_keras():
    import tensorflow as tf

    print(f"[convert] loading Keras model: {MODEL_DIR}", flush=True)
    import time

    t0 = time.time()
    model = tf.keras.models.load_model(MODEL_DIR)
    print(f"[convert] loaded in {time.time() - t0:.1f}s", flush=True)
    return model


def flatten_model(orig):
    """Rebuild the identical graph without the nested Functional submodel.

    keras>=3 applications bake Rescaling(1/127.5, offset=-1) in as the first
    backbone layer, which matches the original model's inner Rescaling, so no
    extra Rescaling is added (double scaling breaks outputs; measured 0.89).
    """
    import tensorflow as tf

    tf.keras.mixed_precision.set_global_policy("mixed_float16")

    head_dense = orig.get_layer("dense")
    head_out = orig.get_layer("dense_1")
    rate0 = orig.get_layer("dropout").get_config().get("rate", 0.3)
    rate1 = orig.get_layer("dropout_1").get_config().get("rate", 0.3)

    inputs = tf.keras.Input(shape=(224, 224, 3))
    backbone = tf.keras.applications.MobileNetV3Large(
        input_tensor=inputs, include_top=False, weights=None
    )
    inner_rescaling = backbone.layers[1]
    assert type(inner_rescaling).__name__ == "Rescaling", (
        f"expected baked-in Rescaling, got {type(inner_rescaling).__name__}; "
        "keras applications layout changed, refusing to guess"
    )
    cfg = inner_rescaling.get_config()
    assert abs(cfg["scale"] - 1.0 / 127.5) < 1e-9 and cfg["offset"] == -1.0, (
        f"baked-in Rescaling differs from original: {cfg}"
    )
    x = backbone.output
    x = tf.keras.layers.GlobalAveragePooling2D()(x)
    x = tf.keras.layers.Dropout(rate0)(x)
    x = tf.keras.layers.Dense(128, activation=head_dense.get_config()["activation"])(x)
    x = tf.keras.layers.Dropout(rate1)(x)
    outputs = tf.keras.layers.Dense(2, activation=head_out.get_config()["activation"])(x)
    flat = tf.keras.Model(inputs, outputs)

    old_w = orig.weights
    new_w = flat.weights
    assert len(old_w) == len(new_w), f"weight count {len(old_w)} != {len(new_w)}"
    for a, b in zip(old_w, new_w):
        assert tuple(a.shape) == tuple(b.shape), f"shape {tuple(a.shape)} != {tuple(b.shape)}"
    flat.set_weights([w.numpy() for w in old_w])
    print(f"[flatten] transferred {len(old_w)} weight tensors 1:1 by order+shape", flush=True)
    return flat


def synthetic_crops(n, seed=7):
    """Mimic 224px RGB crops: uniform random + reddish eyelid-like gradients."""
    rng = np.random.default_rng(seed)
    crops = []
    for i in range(n):
        if i % 2 == 0:
            crops.append((rng.random((224, 224, 3)) * 255).astype(np.uint8))
        else:
            yy, xx = np.mgrid[0:224, 0:224].astype(np.float32)
            base = np.stack(
                [
                    120 + 80 * (xx / 224) + rng.normal(0, 12, (224, 224)),
                    40 + 40 * (yy / 224) + rng.normal(0, 10, (224, 224)),
                    40 + 30 * (yy / 224) + rng.normal(0, 10, (224, 224)),
                ],
                axis=-1,
            )
            crops.append(np.clip(base, 0, 255).astype(np.uint8))
    return crops


def preprocess(crop):
    """Replicate the serving input EXACTLY.

    Measured fact (TF 2.19): `mobilenet_v3.preprocess_input` on float32 input
    is the IDENTITY (returns [0,255] unchanged), matching final_script.py and
    the original app.py which both call it on `.astype('float32')` arrays.
    The model's inner Rescaling(1/127.5, -1) is therefore the ONLY [0,255] ->
    [-1,1] mapping (single, correct normalization; the suspected "double
    normalization" does not occur at runtime). We call the real TF function
    here rather than hard-coding, so any TF-version behavior change fails
    loudly in parity instead of silently shipping a shifted model.
    """
    from tensorflow.keras.applications.mobilenet_v3 import preprocess_input

    return np.expand_dims(preprocess_input(crop.astype("float32")), 0)


def tf_predict(model, x):
    return np.asarray(model.predict(x, verbose=0)[0], dtype=np.float64)


def lite_predict(tflite_path, x):
    from ai_edge_litert.interpreter import Interpreter

    interp = Interpreter(model_path=tflite_path)
    interp.allocate_tensors()
    inp = interp.get_input_details()[0]
    out = interp.get_output_details()[0]
    interp.set_tensor(inp["index"], x.astype(inp["dtype"]))
    interp.invoke()
    return np.asarray(interp.get_tensor(out["index"])[0], dtype=np.float64)


def check_flatten(orig, flat, n):
    print(f"[flatten] verifying TF-orig == TF-flat on {n} crops (tol={FLAT_TOL}) ...", flush=True)
    worst = 0.0
    for crop in synthetic_crops(n):
        x = preprocess(crop)
        d = float(np.max(np.abs(tf_predict(orig, x) - tf_predict(flat, x))))
        worst = max(worst, d)
    ok = worst < FLAT_TOL
    print(f"[flatten] worst |dp|={worst:.2e} -> {'PASS' if ok else 'FAIL'}", flush=True)
    return ok


def run(cmd):
    print(f"[convert] $ {' '.join(cmd)}", flush=True)
    subprocess.run(cmd, check=True)


def convert_onnx_path(flat):
    if os.path.isdir(SM_DIR):
        shutil.rmtree(SM_DIR)
    flat.export(SM_DIR)
    run(
        [
            sys.executable, "-m", "tf2onnx.convert",
            "--saved-model", SM_DIR,
            "--output", ONNX_PATH,
            "--opset", str(OPSET),
        ]
    )
    # Find the graph input name for -k (keep-layout flag).
    import onnx

    model = onnx.load(ONNX_PATH)
    input_name = model.graph.input[0].name
    out_dir = "/tmp/anemia_tflite_out"
    if os.path.isdir(out_dir):
        shutil.rmtree(out_dir)
    run(
        [
            "onnx2tf",
            "-i", ONNX_PATH,
            "-o", out_dir,
            "-b", "1",
            "-k", input_name,
        ]
    )
    built = os.path.join(out_dir, os.path.basename(ONNX_PATH).replace(".onnx", "_float32.tflite"))
    if not os.path.isfile(built):
        # Fall back to whatever float32 artifact exists.
        cands = [f for f in os.listdir(out_dir) if f.endswith(".tflite") and "float32" in f]
        if not cands:
            raise FileNotFoundError(f"no float32 tflite in {out_dir}: {os.listdir(out_dir)}")
        built = os.path.join(out_dir, sorted(cands)[0])
    shutil.copyfile(built, TFLITE_OUT)
    size_mb = os.path.getsize(TFLITE_OUT) / 1e6
    print(f"[convert] wrote {TFLITE_OUT} ({size_mb:.1f} MB)", flush=True)
    return TFLITE_OUT


def parity_check(orig, tflite_path, n):
    print(f"[parity] TF-orig vs Lite on {n} synthetic crops (tol={PARITY_TOL}) ...", flush=True)
    worst = 0.0
    mismatches = 0
    for i, crop in enumerate(synthetic_crops(n)):
        x = preprocess(crop)
        p_tf = tf_predict(orig, x)
        p_lite = lite_predict(tflite_path, x)
        d = float(abs(p_tf[0] - p_lite[0]))
        worst = max(worst, d)
        same = int(np.argmax(p_tf)) == int(np.argmax(p_lite))
        if d >= PARITY_TOL or not same:
            mismatches += 1
        print(
            f"[parity] crop {i:02d}: tf={p_tf[0]:.4f} lite={p_lite[0]:.4f} "
            f"|d|={d:.5f} same_class={same}",
            flush=True,
        )
    ok = mismatches == 0
    print(f"[parity] worst |d|={worst:.5f} mismatches={mismatches}/{n} -> {'PASS' if ok else 'FAIL'}", flush=True)
    return ok


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--parity-n", type=int, default=20)
    ap.add_argument("--skip-parity", action="store_true")
    args = ap.parse_args()

    if not os.path.isdir(MODEL_DIR):
        print(f"ERROR: model dir not found: {MODEL_DIR}", file=sys.stderr)
        sys.exit(1)

    orig = load_keras()
    flat = flatten_model(orig)
    if not check_flatten(orig, flat, max(6, min(args.parity_n, 12))):
        print("ERROR: flatten verification failed; refusing to convert", file=sys.stderr)
        sys.exit(2)

    tflite_path = convert_onnx_path(flat)
    if not args.skip_parity and not parity_check(orig, tflite_path, args.parity_n):
        print("ERROR: parity gate failed; not shipping this file", file=sys.stderr)
        sys.exit(2)
    print(f"[done] ship this file: {tflite_path}", flush=True)


if __name__ == "__main__":
    main()
