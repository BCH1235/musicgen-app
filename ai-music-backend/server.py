# server.py — Replicate-only backend using one meta/musicgen slug for both modes

import os, uuid, time
from pathlib import Path
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

# Load .env from THIS folder
load_dotenv(dotenv_path=Path(__file__).parent / ".env", override=True)

app = Flask(__name__, static_url_path="/static")
CORS(app, resources={r"/api/*": {"origins": "*"}})

# In-memory tasks (simple for dev)
TASKS = {}  # task_id -> {"status": "...", "result": {...}, "error": "..."}

def _ok(result):  return {"status": "completed", "result": result}
def _fail(msg):   return {"status": "failed", "error": str(msg)}
def _result(audio_url, title="AI_Track", genres=None, moods=None, duration=10, kind="generated"):
    return {
        "id": str(uuid.uuid4()),
        "title": title,
        "genres": genres or [],
        "moods": moods or [],
        "duration": duration,
        "audioUrl": audio_url,  # frontend reads this key
        "createdAt": time.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "type": kind
    }

# --------- Replicate client ----------
import replicate

REPLICATE_TOKEN = os.getenv("REPLICATE_API_TOKEN")
MODEL_SLUG = os.getenv("REPLICATE_MODEL", "meta/musicgen")  # ok to be just meta/musicgen
client = replicate.Client(api_token=REPLICATE_TOKEN) if REPLICATE_TOKEN else None

# Helpful startup prints
print("Provider:", "Replicate" if client else "None")
print("Model   :", MODEL_SLUG)
if REPLICATE_TOKEN:
    print("Token starts with:", REPLICATE_TOKEN[:3])  # r8_

def _run_musicgen(inputs: dict) -> str:
    """Call Replicate and always return a single audio URL string."""
    if not client:
        raise RuntimeError("No Replicate token loaded from .env")
    out = client.run(MODEL_SLUG, input=inputs)
    if isinstance(out, list) and out:
        return out[0]
    if isinstance(out, str) and out:
        return out
    raise RuntimeError("Replicate returned no audio URL.")

# --------- API: text -> music ----------
@app.route("/api/music/generate", methods=["POST"])
def generate_music():
    data = request.get_json(force=True, silent=True) or {}
    prompt   = data.get("description") or "instrumental background music"
    genres   = data.get("genres") or []
    moods    = data.get("moods") or []
    duration = int(data.get("duration") or 10)  # many versions cap at 30s

    task_id = uuid.uuid4().hex
    TASKS[task_id] = {"status": "running"}
    try:
        # Minimal inputs for best compatibility
        audio_url = _run_musicgen({"prompt": prompt})
        TASKS[task_id] = _ok(_result(audio_url, "AI_Generated_Track", genres, moods, duration, "generated"))
    except Exception as e:
        TASKS[task_id] = _fail(e)
    return jsonify({"taskId": task_id})

# --------- API: convert (melody-guided) ----------
@app.route("/api/music/convert", methods=["POST"])
def convert_music():
    file = request.files.get("file")
    prompt = request.form.get("prompt") or "convert style"
    target_genre = request.form.get("targetGenre") or ""
    intensity = int(request.form.get("intensity") or 3)
    duration = int(request.form.get("duration") or 10)

    task_id = uuid.uuid4().hex
    TASKS[task_id] = {"status": "running"}
    try:
        if not file:
            raise RuntimeError("No file uploaded")

        # Replicate's schema: supply an audio file via `input_audio`
        # If `continuation=True`, it continues the clip; else it mimics the melody. :contentReference[oaicite:2]{index=2}
        os.makedirs("tmp", exist_ok=True)
        tmp_path = f"tmp/{uuid.uuid4().hex}_{file.filename}"
        file.save(tmp_path)

        full_prompt = f"{prompt}. target genre: {target_genre}, intensity {intensity}"
        with open(tmp_path, "rb") as f:
            audio_url = _run_musicgen({
                "prompt": full_prompt,
                "input_audio": f,      # key name from the schema
                "continuation": False  # mimic melody (not extend). :contentReference[oaicite:3]{index=3}
            })

        TASKS[task_id] = _ok(_result(audio_url, "Converted_Track",
                                     [target_genre] if target_genre else [], [], duration, "converted"))
    except Exception as e:
        TASKS[task_id] = _fail(e)
    return jsonify({"taskId": task_id})

# --------- API: poll status ----------
@app.route("/api/music/task/status", methods=["GET"])
def task_status():
    task_id = request.args.get("task_id")
    task = TASKS.get(task_id)
    if not task:
        return jsonify({"status": "failed", "error": "Unknown task"}), 404
    return jsonify(task)

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
