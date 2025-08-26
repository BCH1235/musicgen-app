import os, uuid, time, threading
from io import BytesIO
from pathlib import Path
from typing import Any, Dict, Optional, List

from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from werkzeug.utils import secure_filename
import replicate

# ───── env ──────────────────────────────────────────────────────────
load_dotenv(dotenv_path=Path(__file__).parent / ".env", override=True)

app = Flask(__name__, static_url_path="/static")
CORS(app, resources={r"/api/*": {"origins": "*"}})

REPLICATE_TOKEN = os.getenv("REPLICATE_API_TOKEN")
MODEL_SLUG = os.getenv("REPLICATE_MODEL", "meta/musicgen")
client = replicate.Client(api_token=REPLICATE_TOKEN) if REPLICATE_TOKEN else None

# ───── in-memory tasks ──────────────────────────────────────────────
TASKS: Dict[str, Dict[str, Any]] = {}

def _set_task_status(task_id: str, status: str, **kwargs):
    TASKS[task_id] = {"status": status, **kwargs}

def mk_result(audio_url: str, title="AI_Track",
              genres: Optional[List[str]] = None,
              moods: Optional[List[str]] = None,
              duration: int = 10, kind: str = "generated"):
    return {
        "id": str(uuid.uuid4()),
        "title": title,
        "genres": genres or [],
        "moods": moods or [],
        "duration": duration,
        "audioUrl": audio_url,
        "createdAt": time.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "type": kind,
    }

def _extract_audio_url(output: Any) -> Optional[str]:
    def as_url(v: Any) -> Optional[str]:
        if isinstance(v, str) and v.startswith("http"): return v
        try:
            u = getattr(v, "url", None)
            if isinstance(u, str) and u.startswith("http"): return u
        except Exception:
            pass
        return None

    u = as_url(output)
    if u: return u
    if isinstance(output, (list, tuple)):
        for item in output:
            u = as_url(item)
            if u: return u
    if isinstance(output, dict):
        for key in ("audioUrl", "audio_url", "url", "audio", "output"):
            if key in output:
                u = as_url(output[key])
                if u: return u
        files = output.get("files")
        if isinstance(files, list):
            for f in files:
                if isinstance(f, dict):
                    u = as_url(f.get("url"))
                    if u: return u
                else:
                    u = as_url(f)
                    if u: return u
        for parent in ("result", "data", "prediction"):
            if parent in output:
                u = _extract_audio_url(output[parent])
                if u: return u
    return None

def _run_replicate(input_dict: Dict[str, Any]) -> str:
    if not client:
        raise RuntimeError("No Replicate token loaded from .env")
    out = client.run(MODEL_SLUG, input=input_dict)
    url = _extract_audio_url(out)
    if not url:
        if isinstance(out, dict) and isinstance(out.get("output"), str):
            return out["output"]
        if isinstance(out, list) and out and isinstance(out[0], str):
            return out[0]
        raise RuntimeError(f"Replicate returned no audio URL. raw={out}")
    return url

# ───── worker ───────────────────────────────────────────────────────
def worker_generate(task_id: str, prompt: str, genres, moods, duration: int,
                    tmp_path: Optional[str]):
    """
    - prompt + (선택) input_audio 로 생성
    - 파일은 BytesIO로 읽어 전달해 'seek of closed file' 방지
    """
    try:
        _set_task_status(task_id, "running")

        inputs: Dict[str, Any] = {
            "prompt": prompt or "instrumental background music",
            "duration": duration,
            "output_format": "mp3",
            "normalization_strategy": "peak",
        }

        if tmp_path:
            with open(tmp_path, "rb") as f:
                data = f.read()
            bio = BytesIO(data)          # 메모리 스트림(닫히지 않음)
            # 일부 라이브러리는 name 확장자로 MIME 판단하므로 설정
            setattr(bio, "name", os.path.basename(tmp_path))
            bio.seek(0)
            inputs["input_audio"] = bio
            inputs["continuation"] = False

        audio_url = _run_replicate(inputs)
        res = mk_result(audio_url, "AI_Generated_Track", genres, moods, duration, "generated")
        _set_task_status(task_id, "succeeded", result=res, audioUrl=res["audioUrl"])
    except Exception as e:
        # 디버그에 바로 보이도록 로그
        print("[worker_generate] ERROR:", repr(e))
        _set_task_status(task_id, "failed", error=str(e))
    finally:
        if tmp_path:
            try: os.remove(tmp_path)
            except Exception: pass

# ───── endpoints ────────────────────────────────────────────────────
@app.route("/api/music/generate", methods=["POST"])
def generate_music():
    """
    JSON + multipart/form-data 둘 다 지원
    - JSON: {"description","genres","moods","duration"}
    - multipart: fields(description, genres(json), moods(json), duration, file=<audio>)
    """
    ct = (request.content_type or "")
    is_multipart = ct.startswith("multipart/form-data")

    if is_multipart:
        data = request.form
        up = request.files.get("file")
    else:
        data = request.get_json(force=True, silent=True) or {}
        up = None

    import json
    def as_list(v):
        if v is None: return []
        if isinstance(v, list): return v
        if isinstance(v, str):
            try: return json.loads(v)
            except Exception: return [v] if v else []
        return []

    prompt   = data.get("description") or "instrumental background music"
    genres   = as_list(data.get("genres"))
    moods    = as_list(data.get("moods"))
    try:
        duration = int(data.get("duration") or 10)
    except Exception:
        duration = 10

    tmp_path = None
    if up:
        os.makedirs("tmp", exist_ok=True)
        safe = secure_filename(up.filename or f"audio_{uuid.uuid4().hex}.wav")
        tmp_path = os.path.join("tmp", f"{uuid.uuid4().hex}_{safe}")
        up.save(tmp_path)

    task_id = uuid.uuid4().hex
    _set_task_status(task_id, "queued")
    threading.Thread(
        target=worker_generate,
        args=(task_id, prompt, genres, moods, duration, tmp_path),
        daemon=True
    ).start()
    return jsonify({"taskId": task_id})

@app.route("/api/music/task/status", methods=["GET"])
def task_status():
    task_id = request.args.get("task_id") or request.args.get("taskId")
    task = TASKS.get(task_id)
    if not task:
        return jsonify({"status": "failed", "error": "Unknown task"}), 404
    return jsonify({
        "taskId": task_id,
        "status": task.get("status"),
        "audioUrl": task.get("audioUrl"),
        "result": task.get("result"),
        "error": task.get("error"),
    })

if __name__ == "__main__":
    # 프런트 기본값과 맞춰 5000포트
    app.run(host="127.0.0.1", port=5000, debug=True)
