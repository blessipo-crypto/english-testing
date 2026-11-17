let sharedAudioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return null;
  if (!sharedAudioCtx) {
    sharedAudioCtx = new Ctx();
  }
  if (sharedAudioCtx.state === 'suspended') {
    sharedAudioCtx.resume().catch(() => {});
  }
  return sharedAudioCtx;
}

function playTone(
  freq: number,
  durationSec: number,
  delaySec = 0,
  type: OscillatorType = 'sine',
  gainPeak = 0.08
) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime + delaySec;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(gainPeak, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, now + durationSec);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + durationSec + 0.02);
  } catch {
    // Ignore audio context restriction errors
  }
}

export function playPop(): void {
  playTone(520, 0.07, 0, 'triangle', 0.06);
}

export function playSuccess(): void {
  playTone(523.25, 0.12, 0, 'sine', 0.08);
  playTone(659.25, 0.16, 0.08, 'sine', 0.08);
}

export function playError(): void {
  playTone(260, 0.14, 0, 'triangle', 0.07);
  playTone(210, 0.18, 0.09, 'triangle', 0.06);
}

export function playVictory(): void {
  playTone(523.25, 0.12, 0, 'triangle', 0.08);
  playTone(659.25, 0.12, 0.1, 'triangle', 0.08);
  playTone(783.99, 0.14, 0.2, 'triangle', 0.08);
  playTone(1046.5, 0.26, 0.3, 'triangle', 0.09);
}
