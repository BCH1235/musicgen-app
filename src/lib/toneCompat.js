// src/lib/toneCompat.js
// Tone.js 로더 + 어디서 왔든(ESM/전역/버전) 안전하게 오디오 시작하기

let cachedTone = null;

/** ESM 'tone'을 동적 임포트하여 네임스페이스 객체를 반환 */
export async function getTone() {
  if (cachedTone) return cachedTone;
  const mod = await import(/* webpackChunkName: "tone" */ 'tone');
  // tone은 default가 없는 버전이 대부분이므로 네임스페이스 전체를 사용
  const ToneNS = mod?.default ?? mod;
  cachedTone = ToneNS;
  return ToneNS;
}

/** 어떤 버전에서도 동작하도록 오디오 컨텍스트를 여는 유틸리티 */
export async function ensureAudioStart(Tone) {
  // 1) 최신 v14 계열: Tone.start()
  try {
    if (typeof Tone?.start === 'function') {
      await Tone.start();
      return;
    }
  } catch (_) {}

  // 2) 컨텍스트 직접 resume
  try {
    const ctx =
      Tone?.getContext?.() ??
      Tone?.context ??
      Tone?.Context ?? // (드물게 존재)
      null;

    if (ctx?.resume) {
      await ctx.resume();
      if (ctx?.state === 'running') return;
    }

    // rawContext / audioContext 폴백
    const ac = ctx?.rawContext || ctx?.audioContext || ctx?._context || ctx?._audioContext;
    if (ac?.resume) await ac.resume();
  } catch (_) {}
}
