/**
 * Tiny procedural sound effects via the Web Audio API — no audio asset files.
 * The AudioContext is created lazily and resumed from within input handlers so
 * it satisfies browser autoplay policies.
 */

type WebkitWindow = typeof window & { webkitAudioContext?: typeof AudioContext };

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext ?? (window as WebkitWindow).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

/** Call once from a user gesture (e.g. first click/keypress) to unlock audio. */
export function unlockAudio(): void {
  getCtx();
}

function tone(context: AudioContext, freq: number, startAt: number, duration: number): void {
  const osc = context.createOscillator();
  const gain = context.createGain();
  osc.type = "triangle";
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.0001, startAt);
  gain.gain.exponentialRampToValueAtTime(0.18, startAt + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);
  osc.connect(gain).connect(context.destination);
  osc.start(startAt);
  osc.stop(startAt + duration + 0.02);
}

function playNotes(freqs: number[], step: number, duration: number): void {
  const context = getCtx();
  if (!context) return;
  const now = context.currentTime;
  freqs.forEach((f, i) => tone(context, f, now + i * step, duration));
}

/** Gentle ascending chime when a creature is attracted. */
export function playAttract(): void {
  playNotes([523.25, 659.25, 783.99], 0.1, 0.18);
}

/** Brighter fanfare when a request is completed. */
export function playRequestComplete(): void {
  playNotes([523.25, 659.25, 783.99, 1046.5], 0.11, 0.22);
}
