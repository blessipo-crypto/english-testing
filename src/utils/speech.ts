import type { VoiceAccent } from '../types/lesson';
import { VOICE_ACCENT_MODULES } from '../data/voiceModules';

const ACCENT_STORAGE_KEY = 'storybridge_voice_accent';
const VOICE_URI_PREFIX = 'storybridge_voice_uri_';

export interface VoiceMatchResult {
  voice: SpeechSynthesisVoice | null;
  voicesForAccent: SpeechSynthesisVoice[];
  allEnglishVoices: SpeechSynthesisVoice[];
  isExactAccentMatch: boolean;
  label: string;
}

const listeners = new Set<() => void>();
let voicesInitialized = false;

function normalizeLang(lang: string | undefined): string {
  return (lang || '').trim().replace(/_/g, '-').toLowerCase();
}

function notifyVoiceListeners() {
  listeners.forEach((cb) => {
    try {
      cb();
    } catch {
      // ignore listener error
    }
  });
}

export function initVoiceModules(): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  if (voicesInitialized) return;
  voicesInitialized = true;

  // Trigger initial load in Chromium/Electron
  window.speechSynthesis.getVoices();

  const onVoicesChanged = () => {
    notifyVoiceListeners();
  };

  if (typeof window.speechSynthesis.addEventListener === 'function') {
    window.speechSynthesis.addEventListener('voiceschanged', onVoicesChanged);
  } else {
    window.speechSynthesis.onvoiceschanged = onVoicesChanged;
  }
}

export function subscribeVoiceChanges(listener: () => void): () => void {
  initVoiceModules();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getSavedAccent(): VoiceAccent {
  if (typeof window === 'undefined') return 'en-GB';
  const raw = window.localStorage.getItem(ACCENT_STORAGE_KEY);
  return raw === 'en-US' ? 'en-US' : 'en-GB';
}

export function saveAccent(accent: VoiceAccent): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(ACCENT_STORAGE_KEY, accent);
  } catch {
    // ignore storage errors
  }
}

export function getSavedVoiceUri(accent: VoiceAccent): string {
  if (typeof window === 'undefined') return '';
  return window.localStorage.getItem(`${VOICE_URI_PREFIX}${accent}`) || '';
}

export function setSavedVoiceUri(accent: VoiceAccent, voiceUri: string): void {
  if (typeof window === 'undefined') return;
  try {
    if (!voiceUri) {
      window.localStorage.removeItem(`${VOICE_URI_PREFIX}${accent}`);
    } else {
      window.localStorage.setItem(`${VOICE_URI_PREFIX}${accent}`, voiceUri);
    }
    notifyVoiceListeners();
  } catch {
    // ignore storage errors
  }
}

function scoreVoiceForModule(
  voice: SpeechSynthesisVoice,
  accent: VoiceAccent
): number {
  const mod = VOICE_ACCENT_MODULES[accent];
  const lang = normalizeLang(voice.lang);
  const name = voice.name.toLowerCase();

  // Exclude voices explicitly belonging to another English variant
  if (mod.excludedNameTokens.some((tok) => name.includes(tok))) {
    return -100;
  }

  let score = 0;

  // Exact BCP-47 tag match (e.g. en-gb or en-us)
  if (mod.acceptedLangTags.some((tag) => lang === tag || lang.startsWith(`${tag}-`))) {
    score += 100;
  } else if (accent === 'en-GB' && (lang.startsWith('en-au') || lang.startsWith('en-ie') || lang.startsWith('en-nz'))) {
    // Commonwealth fallback before US if GB voice isn't installed
    score += 20;
  } else if (lang.startsWith('en')) {
    score += 1;
  } else {
    return -100;
  }

  // Name-based priority ranking (Natural / Online / Google / Microsoft / Apple voices)
  const patternIndex = mod.preferredVoicePatterns.findIndex((pattern) =>
    name.includes(pattern)
  );
  if (patternIndex !== -1) {
    score += 80 - patternIndex;
  }

  if (name.includes('natural') || name.includes('online') || name.includes('google')) {
    score += 15;
  }

  if (!voice.localService) {
    score += 5;
  }

  return score;
}

export function resolveVoiceModule(accent: VoiceAccent): VoiceMatchResult {
  initVoiceModules();
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return {
      voice: null,
      voicesForAccent: [],
      allEnglishVoices: [],
      isExactAccentMatch: false,
      label: VOICE_ACCENT_MODULES[accent].regionLabel,
    };
  }

  const allVoices = window.speechSynthesis.getVoices();
  const allEnglishVoices = allVoices.filter((v) =>
    normalizeLang(v.lang).startsWith('en')
  );

  const mod = VOICE_ACCENT_MODULES[accent];

  // Exact accent voices (all matching en-GB or en-US tags/names)
  const voicesForAccent = allEnglishVoices
    .filter((v) => {
      const lang = normalizeLang(v.lang);
      const name = v.name.toLowerCase();
      const matchesTag = mod.acceptedLangTags.some(
        (tag) => lang === tag || lang.startsWith(`${tag}-`)
      );
      const matchesExplicitName =
        accent === 'en-GB'
          ? name.includes('uk english') ||
            name.includes('british') ||
            name.includes('united kingdom')
          : name.includes('us english') ||
            name.includes('american') ||
            name.includes('united states');
      return matchesTag || matchesExplicitName;
    })
    .sort((a, b) => scoreVoiceForModule(b, accent) - scoreVoiceForModule(a, accent));

  // Check if user selected a specific voice for this accent module
  const savedUri = getSavedVoiceUri(accent);
  if (savedUri) {
    const manualMatch = allEnglishVoices.find((v) => v.voiceURI === savedUri);
    if (manualMatch) {
      const lang = normalizeLang(manualMatch.lang);
      const isExact = mod.acceptedLangTags.some(
        (tag) => lang === tag || lang.startsWith(`${tag}-`)
      );
      return {
        voice: manualMatch,
        voicesForAccent,
        allEnglishVoices,
        isExactAccentMatch: isExact,
        label: manualMatch.name,
      };
    }
  }

  // Automatic best match from module ranking
  if (voicesForAccent.length > 0) {
    return {
      voice: voicesForAccent[0],
      voicesForAccent,
      allEnglishVoices,
      isExactAccentMatch: true,
      label: voicesForAccent[0].name,
    };
  }

  // Fallback to highest-scoring English voice if exact regional voice isn't installed on OS
  const rankedFallback = [...allEnglishVoices].sort(
    (a, b) => scoreVoiceForModule(b, accent) - scoreVoiceForModule(a, accent)
  );
  const fallbackVoice = rankedFallback[0] || null;

  return {
    voice: fallbackVoice,
    voicesForAccent: [],
    allEnglishVoices,
    isExactAccentMatch: false,
    label: fallbackVoice
      ? `${fallbackVoice.name} (fallback)`
      : `Synthèse système (${mod.bcp47})`,
  };
}

export function speakEnglish(
  text: string,
  options: { accent?: VoiceAccent; rate?: number } = {}
): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  const trimmed = text.trim();
  if (!trimmed) return;

  initVoiceModules();

  try {
    window.speechSynthesis.cancel();
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }
  } catch {
    // ignore speechSynthesis state errors
  }

  const accent: VoiceAccent = options.accent || getSavedAccent();
  const mod = VOICE_ACCENT_MODULES[accent];
  const resolved = resolveVoiceModule(accent);

  const utterance = new SpeechSynthesisUtterance(trimmed);
  utterance.lang = resolved.voice?.lang || mod.bcp47;
  utterance.rate = options.rate ?? 1;
  utterance.pitch = 1;

  if (resolved.voice) {
    utterance.voice = resolved.voice;
  }

  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking(): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
}
