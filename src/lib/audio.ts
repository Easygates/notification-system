import type { AlertSettings } from "@/lib/types";

let audioContext: AudioContext | null = null;

function getAudioContext() {
  if (typeof window === "undefined") return null;
  const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) return null;
  if (!audioContext) audioContext = new AudioContextClass();
  return audioContext;
}

export async function unlockAudio() {
  const context = getAudioContext();
  if (!context) throw new Error("This browser does not support audio alerts.");
  if (context.state === "suspended") await context.resume();
}

export function playAlert(settings: Pick<AlertSettings, "tone" | "volume">) {
  const context = getAudioContext();
  if (!context || context.state !== "running") return;
  const notes = settings.tone === "chime" ? [659.25, 830.61, 987.77] : settings.tone === "bell" ? [1046.5, 1318.5] : [880, 880];
  notes.forEach((frequency, index) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const start = context.currentTime + index * (settings.tone === "beep" ? 0.24 : 0.15);
    oscillator.type = "sine";
    oscillator.frequency.value = frequency;
    const duration = settings.tone === "bell" ? 0.65 : 0.27;
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime((settings.volume / 100) * 0.2, start + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.02);
  });
}
