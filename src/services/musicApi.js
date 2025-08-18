// src/services/musicApi.js

const IN_PROGRESS = new Set(['queued', 'running', 'processing', 'starting', 'pending']);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const API_BASE = (process.env.REACT_APP_API_BASE_URL || 'http://127.0.0.1:5000/api').replace(/\/$/, '');

function pickStatus(j) {
  const candidates = [
    j?.status, j?.state, j?.task_status, j?.taskStatus,
    j?.prediction?.status, j?.data?.status
  ];
  const raw = candidates.find((v) => v != null) ?? '';
  return String(raw).toLowerCase();
}

function pickAudioUrl(j) {
  // 흔한 모든 후보를 한 번에 긁어옵니다.
  const candidates = [
    j?.audioUrl, j?.audio_url, j?.url,
    j?.result?.audioUrl, j?.result?.audio_url, j?.result?.url, j?.result?.audio,
    j?.data?.audioUrl, j?.data?.audio_url, j?.data?.url, j?.data?.audio,
    j?.prediction?.output,
    j?.output,
    j?.files,                 // [{url: "..."}] 같은 케이스
  ];

  // 첫 번째로 "무언가 있는" 후보를 잡습니다.
  let out = candidates.find((v) => v != null);

  // 배열이면 첫 원소
  if (Array.isArray(out)) out = out[0];

  // 객체면 url / audio 같은 필드 꺼냄
  if (out && typeof out === 'object') {
    if (typeof out.url === 'string') out = out.url;
    else if (typeof out.audio === 'string') out = out.audio;
    else if (Array.isArray(out.output)) out = out.output[0];
  }

  if (typeof out === 'string') return out;
  return undefined;
}

export async function generateAndWait(payload, onStatus) {
  // 1) 생성
  const genRes = await fetch(`${API_BASE}/music/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!genRes.ok) throw new Error(`Generate failed: ${genRes.status} ${await genRes.text()}`);
  const genJson = await genRes.json();
  console.log('[generate] response:', genJson);

  const taskId = genJson.task_id || genJson.taskId || genJson.id;
  if (!taskId) throw new Error('No task id from server');

  // 2) 폴링 (최대 3분)
  const deadline = Date.now() + 3 * 60 * 1000;
  let last = null;

  while (true) {
    if (Date.now() > deadline) throw new Error('Timeout: generation took too long');

    await sleep(3000);

    const stRes = await fetch(`${API_BASE}/music/task/status?task_id=${encodeURIComponent(taskId)}`);
    if (!stRes.ok) throw new Error(`Status failed: ${stRes.status} ${await stRes.text()}`);

    const stJson = await stRes.json();
    console.log('[status]', stJson);
    onStatus?.(stJson);

    const st = pickStatus(stJson);
    if (!st || IN_PROGRESS.has(st)) continue;

    last = stJson;
    break;
  }

  const finalStatus = pickStatus(last);
  if (!['succeeded', 'completed', 'success'].includes(finalStatus)) {
    const errMsg = last?.error || last?.message || last?.result?.error || last?.prediction?.error || `Generation failed (${finalStatus || 'unknown'})`;
    throw new Error(errMsg);
  }

  const audioUrl = pickAudioUrl(last);
  if (!audioUrl) throw new Error('Replicate returned no audio URL.');

  return { status: 'succeeded', result: { audioUrl } };
}
