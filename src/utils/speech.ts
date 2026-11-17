import type { VoiceAccent } from '../types/lesson';

export function speakEnglish(
  text: string,
  options: { accent?: VoiceAccent; rate?: number } = {}
): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  const trimmed = text.trim();
  if (!trimmed) return;

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(trimmed);
  const accent = options.accent || 'en-GB';
  utterance.lang = accent;
  utterance.rate = options.rate ?? 1;
  utterance.pitch = 1;

  const voices = window.speechSynthesis.getVoices();
  if (voices.length > 0) {
    const preferred =
      voices.find((v) => v.lang.toLowerCase() === accent.toLowerCase()) ||
      voices.find((v) => v.lang.toLowerCase().startsWith('en'));
    if (preferred) {
      utterance.voice = preferred;
    }
  }

  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking(): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
}
