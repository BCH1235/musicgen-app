# server.py — Robust Replicate backend for MusicGen (text generate + convert)

import os
import uuid
import time
import threading
from pathlib import Path
from typing import Any, Dict, Optional, List, Union

from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

# ─────────────────────────────────────────────────────────────────────────────
# Load .env placed next to this file
# ─────────────────────────────────────────────────────────────────────────────
load_dotenv(dotenv_path=Path(__file__).parent / ".env", override=True)

app = Flask(__name__, static_url_path="/static")
CORS(app, resources={r"/api/*": {"origins": "*"}})

# ─────────────────────────────────────────────────────────────────────────────
# In-memory tasks (for dev)
#  task_id -> {"status": "queued|running|succeeded|failed",
#              "result": {...}, "audioUrl": "...", "error": "..."}
# ─────────────────────────────────────────────────────────────────────────────
TASKS: Dict[str, Dict[str, Any]] = {}


def mk_result(
    audio_url: str,
    title: str = "AI_Track",
    genres: Optional[List[str]] = None,
    moods: Optional[List[str]] = None,
    duration: int = 10,
    kind: str = "generated",
) -> Dict[str, Any]:
    return {
        "id": str(uuid.uuid4()),
        "title": title,
        "genres": genres or [],
        "moods": moods or [],
        "duration": duration,
        "audioUrl": audio_url,  # frontend uses this key
        "createdAt": time.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "type": kind,
    }


# ─────────────────────────────────────────────────────────────────────────────
# Replicate client
# ─────────────────────────────────────────────────────────────────────────────
import replicate

REPLICATE_TOKEN = os.getenv("REPLICATE_API_TOKEN")
MODEL_SLUG = os.getenv("REPLICATE_MODEL", "meta/musicgen")  # can be "meta/musicgen:version"

client = replicate.Client(api_token=REPLICATE_TOKEN) if REPLICATE_TOKEN else None

print("Provider:", "Replicate" if client else "None")
print("Model   :", MODEL_SLUG)
if REPLICATE_TOKEN:
    print("Token starts with:", REPLICATE_TOKEN[:3], "...")


# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────
def _extract_audio_url(output: Any) -> Optional[str]:
    """
    Extract an mp3 URL from many possible Replicate output shapes.
    Handles:
      - str
      - replicate.helpers.FileOutput (str() prints URL, or has .url)
      - list/tuple of above
      - dict with url-ish keys or nested structures
    """
    def as_url(v: Any) -> Optional[str]:
        # direct string
        if isinstance(v, str) and v.startswith("http"):
            return v
        # object pretty-print to string (FileOutput prints the URL)
        try:
            s = str(v)
            if isinstance(s, str) and s.startswith("http"):
                return s
        except Exception:
            pass
        # object.url attribute
        try:
            u = getattr(v, "url", None)
            if isinstance(u, str) and u.startswith("http"):
                return u
        except Exception:
            pass
        return None

    # single value
    u = as_url(output)
    if u:
        return u

    # list / tuple
    if isinstance(output, (list, tuple)):
        for item in output:
            u = as_url(item)
            if u:
                return u

    # dict with common keys
    if isinstance(output, dict):
        for key in ("audioUrl", "audio_url", "url", "audio", "output"):
            if key in output:
                u = as_url(output[key])
                if u:
                    return u

        # files: [{url: ...}] or files: ["https://..."]
        files = output.get("files")
        if isinstance(files, list):
            for f in files:
                if isinstance(f, dict):
                    u = as_url(f.get("url"))
                    if u:
                        return u
                else:
                    u = as_url(f)
                    if u:
                        return u

        # deeper nests
        for parent in ("result", "data", "prediction"):
            if parent in output:
                u = _extract_audio_url(output[parent])
                if u:
                    return u

    return None


def _run_replicate(input_dict: Dict[str, Any]) -> str:
    """
    Call Replicate and always return a single audio URL string.
    Also prints the raw output for easy debugging.
    """
    if not client:
        raise RuntimeError("No Replicate token loaded from .env")

    try:
        out = client.run(MODEL_SLUG, input=input_dict)
        print("[Replicate] raw output:", out, type(out))
    except Exception as e:
        print("[Replicate] exception:", repr(e))
        raise

    url = _extract_audio_url(out)
    if not url:
        # Sometimes {"output": "https://..."} or ["https://..."]
        if isinstance(out, dict) and isinstance(out.get("output"), str):
            return out["output"]
        if isinstance(out, list) and out and isinstance(out[0], str):
            return out[0]
        raise RuntimeError(f"Replicate returned no audio URL. raw={out}")
    return url


def _set_task_status(task_id: str, status: str, **kwargs):
    TASKS[task_id] = {"status": status, **kwargs}


# ─────────────────────────────────────────────────────────────────────────────
# Background workers
# ─────────────────────────────────────────────────────────────────────────────
def worker_generate(task_id: str, prompt: str, genres, moods, duration: int):
    try:
        _set_task_status(task_id, "running")
        # Use broadly-compatible inputs (unsupported keys are ignored by some versions)
        audio_url = _run_replicate({
            "prompt": prompt,
            "output_format": "mp3",
            "model_version": "stereo-large",
            "normalization_strategy": "peak",
            # Some versions also accept "duration" (seconds); harmless if ignored:
            "duration": duration
        })
        res = mk_result(audio_url, "AI_Generated_Track", genres, moods, duration, "generated")
        _set_task_status(task_id, "succeeded", result=res, audioUrl=res["audioUrl"])
    except Exception as e:
        _set_task_status(task_id, "failed", error=str(e))


def worker_convert(task_id: str, tmp_path: str, prompt: str, target_genre: str, intensity: int, duration: int):
    try:
        _set_task_status(task_id, "running")
        full_prompt = f"{prompt}. target genre: {target_genre}, intensity {intensity}"
        with open(tmp_path, "rb") as f:
            audio_url = _run_replicate({
                "prompt": full_prompt,
                "input_audio": f,           # melody-guided / continuation-capable models
                "continuation": False,
                "output_format": "mp3",
            })
        res = mk_result(audio_url, "Converted_Track",
                        [target_genre] if target_genre else [], [], duration, "converted")
        _set_task_status(task_id, "succeeded", result=res, audioUrl=res["audioUrl"])
    except Exception as e:
        _set_task_status(task_id, "failed", error=str(e))
    finally:
        try:
            if os.path.exists(tmp_path):
                os.remove(tmp_path)
        except Exception:
            pass


# ─────────────────────────────────────────────────────────────────────────────
# API endpoints
# ─────────────────────────────────────────────────────────────────────────────
@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({
        "ok": True,
        "provider": "Replicate" if client else "None",
        "model": MODEL_SLUG,
    })


@app.route("/api/music/generate", methods=["POST"])
def generate_music():
    data = request.get_json(force=True, silent=True) or {}
    prompt   = data.get("description") or "instrumental background music"
    genres   = data.get("genres") or []
    moods    = data.get("moods") or []
    duration = int(data.get("duration") or 10)

    task_id = uuid.uuid4().hex
    _set_task_status(task_id, "queued")

    t = threading.Thread(
        target=worker_generate,
        args=(task_id, prompt, genres, moods, duration),
        daemon=True,
    )
    t.start()

    return jsonify({"taskId": task_id})


@app.route("/api/music/convert", methods=["POST"])
def convert_music():
    file = request.files.get("file")
    prompt = request.form.get("prompt") or "convert style"
    target_genre = request.form.get("targetGenre") or ""
    intensity = int(request.form.get("intensity") or 3)
    duration = int(request.form.get("duration") or 10)

    task_id = uuid.uuid4().hex
    _set_task_status(task_id, "queued")

    if not file:
        _set_task_status(task_id, "failed", error="No file uploaded")
        return jsonify({"taskId": task_id})

    os.makedirs("tmp", exist_ok=True)
    tmp_path = f"tmp/{uuid.uuid4().hex}_{file.filename}"
    file.save(tmp_path)

    t = threading.Thread(
        target=worker_convert,
        args=(task_id, tmp_path, prompt, target_genre, intensity, duration),
        daemon=True,
    )
    t.start()

    return jsonify({"taskId": task_id})


@app.route("/api/music/task/status", methods=["GET"])
def task_status():
    task_id = request.args.get("task_id")
    task = TASKS.get(task_id)
    if not task:
        return jsonify({"status": "failed", "error": "Unknown task"}), 404

    # Always include audioUrl at top-level to simplify frontend
    return jsonify({
        "taskId": task_id,
        "status": task.get("status"),
        "audioUrl": task.get("audioUrl"),
        "result": task.get("result"),
        "error": task.get("error"),
    })


# ─────────────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    # Match your frontend .env (REACT_APP_API_BASE_URL=http://127.0.0.1:5000/api)
    app.run(host="127.0.0.1", port=5000, debug=True)
