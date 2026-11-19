import type { VoiceAccent } from '../types/lesson';
import { VOICE_ACCENT_MODULES } from '../data/voiceModules';

export const STUDIO_HD_VOICE_URI = 'studio-hd';

const ACCENT_STORAGE_KEY = 'storybridge_voice_accent';
const VOICE_URI_PREFIX = 'storybridge_voice_uri_';
const DEFAULT_CLOUD_ORIGIN =
  'https://ais-dev-afm5mejj742ehjjk5blxlb-880439402821.europe-west2.run.app';

declare global {
  interface Window {
    storybridgeDesktop?: {
      isElectron?: boolean;
      fetchTtsAudio?: (text: string, lang: VoiceAccent) => Promise<string | null>;
    };
  }
}

export interface VoiceMatchResult {
  voice: SpeechSynthesisVoice | null;
  voicesForAccent: SpeechSynthesisVoice[];
  allEnglishVoices: SpeechSynthesisVoice[];
  isExactAccentMatch: boolean;
  isStudioHdActive: boolean;
  label: string;
}

export interface AudioSyncSpeakPayload {
  text: string;
  accent: VoiceAccent;
  rate: number;
}

export interface AudioSyncBridge {
  onSpeak?: (payload: AudioSyncSpeakPayload) => void;
  onStop?: () => void;
  onAutoplayBlocked?: (payload: AudioSyncSpeakPayload) => void;
}

const listeners = new Set<() => void>();
let voicesInitialized = false;

// Studio HD Audio state
const ttsBlobCache = new Map<string, string>();
let activeAudio: HTMLAudioElement | null = null;
let activePlaybackToken = 0;
let audioSyncBridge: AudioSyncBridge | null = null;
let sharedUnlockContext: AudioContext | null = null;
let audioUnlocked = false;

export function registerAudioSyncBridge(bridge: AudioSyncBridge | null): void {
  audioSyncBridge = bridge;
}

export function unlockAudioPlayback(): void {
  if (typeof window === 'undefined' || audioUnlocked) return;
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (AudioCtx) {
      if (!sharedUnlockContext) {
        sharedUnlockContext = new AudioCtx();
      }
      if (sharedUnlockContext.state === 'suspended') {
        void sharedUnlockContext.resume().catch(() => {});
      }
    }
    const silentAudio = new Audio(
      'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA'
    );
    silentAudio.volume = 0;
    void silentAudio
      .play()
      .then(() => {
        audioUnlocked = true;
      })
      .catch(() => {
        // Ignore until next user gesture
      });
  } catch {
    // Ignore audio unlock errors
  }
}

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

  try {
    window.speechSynthesis.getVoices();
    const onVoicesChanged = () => {
      notifyVoiceListeners();
    };
    if (typeof window.speechSynthesis.addEventListener === 'function') {
      window.speechSynthesis.addEventListener('voiceschanged', onVoicesChanged);
    } else {
      window.speechSynthesis.onvoiceschanged = onVoicesChanged;
    }
  } catch {
    // ignore speechSynthesis init errors in restricted environments
  }
}

export function subscribeVoiceChanges(listener: () => void): () => void {
  initVoiceModules();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function refreshSystemVoices(): void {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.getVoices();
    } catch {
      // ignore
    }
  }
  notifyVoiceListeners();
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
  if (typeof window === 'undefined') return STUDIO_HD_VOICE_URI;
  const saved = window.localStorage.getItem(`${VOICE_URI_PREFIX}${accent}`);
  return saved || STUDIO_HD_VOICE_URI;
}

export function setSavedVoiceUri(accent: VoiceAccent, voiceUri: string): void {
  if (typeof window === 'undefined') return;
  try {
    if (!voiceUri || voiceUri === STUDIO_HD_VOICE_URI) {
      window.localStorage.setItem(`${VOICE_URI_PREFIX}${accent}`, STUDIO_HD_VOICE_URI);
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

  if (mod.excludedNameTokens.some((tok) => name.includes(tok))) {
    return -100;
  }

  let score = 0;
  if (mod.acceptedLangTags.some((tag) => lang === tag || lang.startsWith(`${tag}-`))) {
    score += 100;
  } else if (
    accent === 'en-GB' &&
    (lang.startsWith('en-au') || lang.startsWith('en-ie') || lang.startsWith('en-nz'))
  ) {
    score += 20;
  } else if (lang.startsWith('en')) {
    score += 1;
  } else {
    return -100;
  }

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
  const mod = VOICE_ACCENT_MODULES[accent];
  const savedUri = getSavedVoiceUri(accent);
  const isStudioHdActive = !savedUri || savedUri === STUDIO_HD_VOICE_URI;

  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return {
      voice: null,
      voicesForAccent: [],
      allEnglishVoices: [],
      isExactAccentMatch: isStudioHdActive,
      isStudioHdActive,
      label: isStudioHdActive
        ? `Studio HD (${mod.bcp47})`
        : VOICE_ACCENT_MODULES[accent].regionLabel,
    };
  }

  let allVoices: SpeechSynthesisVoice[] = [];
  try {
    allVoices = window.speechSynthesis.getVoices();
  } catch {
    allVoices = [];
  }

  const allEnglishVoices = allVoices.filter((v) =>
    normalizeLang(v.lang).startsWith('en')
  );

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

  if (isStudioHdActive) {
    return {
      voice: voicesForAccent[0] || null,
      voicesForAccent,
      allEnglishVoices,
      isExactAccentMatch: true,
      isStudioHdActive: true,
      label: `Voix Studio HD (${mod.shortLabel} · ${mod.bcp47})`,
    };
  }

  if (savedUri !== 'system-auto') {
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
        isStudioHdActive: false,
        label: manualMatch.name,
      };
    }
  }

  if (voicesForAccent.length > 0) {
    return {
      voice: voicesForAccent[0],
      voicesForAccent,
      allEnglishVoices,
      isExactAccentMatch: true,
      isStudioHdActive: false,
      label: voicesForAccent[0].name,
    };
  }

  const rankedFallback = [...allEnglishVoices].sort(
    (a, b) => scoreVoiceForModule(b, accent) - scoreVoiceForModule(a, accent)
  );
  const fallbackVoice = rankedFallback[0] || null;

  return {
    voice: fallbackVoice,
    voicesForAccent: [],
    allEnglishVoices,
    isExactAccentMatch: false,
    isStudioHdActive: false,
    label: fallbackVoice
      ? `${fallbackVoice.name} (fallback)`
      : `Synthèse système (${mod.bcp47})`,
  };
}

function getEffectiveTtsApiOrigin(): string {
  if (typeof window === 'undefined') return '';
  const isLocalPackaged =
    window.location.protocol === 'file:' ||
    window.location.protocol === 'capacitor:' ||
    (window.location.hostname === 'localhost' && !window.location.port);

  if (!isLocalPackaged) {
    return '';
  }

  const customOrigin = window.localStorage.getItem('storybridge_sync_server_url')?.trim();
  if (customOrigin) {
    try {
      return new URL(customOrigin).origin;
    } catch {
      // fall through
    }
  }
  return DEFAULT_CLOUD_ORIGIN;
}

function splitTextIntoTtsChunks(text: string, maxLen = 175): string[] {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (!normalized) return [];
  if (normalized.length <= maxLen) return [normalized];

  const chunks: string[] = [];
  let remaining = normalized;

  while (remaining.length > maxLen) {
    let splitIdx = -1;
    // Prefer sentence or clause boundaries
    for (const sep of ['. ', '! ', '? ', '; ', ', ', ' ']) {
      const idx = remaining.lastIndexOf(sep, maxLen);
      if (idx > 25) {
        splitIdx = idx + (sep === ' ' ? 0 : 1);
        break;
      }
    }
    if (splitIdx <= 0) {
      splitIdx = maxLen;
    }
    const piece = remaining.slice(0, splitIdx).trim();
    if (piece) chunks.push(piece);
    remaining = remaining.slice(splitIdx).trim();
  }
  if (remaining) chunks.push(remaining);
  return chunks;
}

async function fetchTtsChunkAudioUrl(
  chunk: string,
  accent: VoiceAccent
): Promise<string | null> {
  const key = `${accent}:${chunk}`;
  const cached = ttsBlobCache.get(key);
  if (cached) return cached;

  // 1. Electron desktop IPC bridge (works directly inside .exe without CORS/server auth)
  if (typeof window !== 'undefined' && window.storybridgeDesktop?.fetchTtsAudio) {
    try {
      const dataUri = await window.storybridgeDesktop.fetchTtsAudio(chunk, accent);
      if (dataUri) {
        if (ttsBlobCache.size >= 200) {
          const oldest = ttsBlobCache.keys().next().value;
          if (oldest) {
            const oldUrl = ttsBlobCache.get(oldest);
            if (oldUrl?.startsWith('blob:')) URL.revokeObjectURL(oldUrl);
            ttsBlobCache.delete(oldest);
          }
        }
        ttsBlobCache.set(key, dataUri);
        return dataUri;
      }
    } catch {
      // fallback below
    }
  }

  // 2. Server-side /api/tts proxy (works on Web, Cloud Run, Mobile, and Android APK)
  try {
    const baseOrigin = getEffectiveTtsApiOrigin();
    const url = `${baseOrigin}/api/tts?tl=${encodeURIComponent(
      accent
    )}&q=${encodeURIComponent(chunk)}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('audio')) return null;
    const blob = await res.blob();
    if (!blob || blob.size === 0) return null;
    const objectUrl = URL.createObjectURL(blob);
    if (ttsBlobCache.size >= 200) {
      const oldest = ttsBlobCache.keys().next().value;
      if (oldest) {
        const oldUrl = ttsBlobCache.get(oldest);
        if (oldUrl?.startsWith('blob:')) URL.revokeObjectURL(oldUrl);
        ttsBlobCache.delete(oldest);
      }
    }
    ttsBlobCache.set(key, objectUrl);
    return objectUrl;
  } catch {
    return null;
  }
}

function speakWithSystemSynthesis(
  text: string,
  accent: VoiceAccent,
  rate: number
): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  try {
    window.speechSynthesis.cancel();
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }
    const mod = VOICE_ACCENT_MODULES[accent];
    const resolved = resolveVoiceModule(accent);
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = resolved.voice?.lang || mod.bcp47;
    utterance.rate = rate;
    utterance.pitch = 1;
    if (resolved.voice) {
      utterance.voice = resolved.voice;
    }
    window.speechSynthesis.speak(utterance);
  } catch {
    // ignore speechSynthesis errors
  }
}

async function speakWithStudioHd(
  text: string,
  accent: VoiceAccent,
  rate: number,
  token: number
): Promise<'ok' | 'blocked' | 'unavailable'> {
  const chunks = splitTextIntoTtsChunks(text);
  if (chunks.length === 0) return 'ok';

  for (const chunk of chunks) {
    if (token !== activePlaybackToken) return 'ok';
    const audioUrl = await fetchTtsChunkAudioUrl(chunk, accent);
    if (token !== activePlaybackToken) return 'ok';
    if (!audioUrl) {
      return 'unavailable';
    }

    const result = await new Promise<'ok' | 'blocked' | 'unavailable'>((resolve) => {
      const audio = new Audio(audioUrl);
      activeAudio = audio;
      audio.playbackRate = Math.max(0.5, Math.min(1.5, rate));
      if ('preservesPitch' in audio) {
        (audio as HTMLAudioElement & { preservesPitch: boolean }).preservesPitch = true;
      }

      const finish = (status: 'ok' | 'blocked' | 'unavailable') => {
        if (activeAudio === audio) {
          activeAudio = null;
        }
        audio.onended = null;
        audio.onerror = null;
        resolve(status);
      };

      audio.onended = () => finish('ok');
      audio.onerror = () => finish('unavailable');
      audio.play().catch((err: unknown) => {
        const errName =
          err && typeof err === 'object' && 'name' in err
            ? String((err as { name: unknown }).name)
            : '';
        finish(errName === 'NotAllowedError' ? 'blocked' : 'unavailable');
      });
    });

    if (result !== 'ok') return result;
  }

  return 'ok';
}

function stopLocalPlaybackOnly(): void {
  activePlaybackToken += 1;
  if (activeAudio) {
    try {
      activeAudio.pause();
      activeAudio.currentTime = 0;
    } catch {
      // ignore
    }
    activeAudio = null;
  }
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // ignore
    }
  }
}

export function stopSpeaking(options?: { broadcast?: boolean }): void {
  stopLocalPlaybackOnly();
  const shouldBroadcast =
    !options || typeof options !== 'object' || !('broadcast' in options) || options.broadcast !== false;
  if (shouldBroadcast) {
    audioSyncBridge?.onStop?.();
  }
}

export function speakEnglish(
  text: string,
  options: { accent?: VoiceAccent; rate?: number; fromRemote?: boolean } = {}
): void {
  if (typeof window === 'undefined') return;
  const trimmed = text.trim();
  if (!trimmed) return;

  stopLocalPlaybackOnly();
  const token = activePlaybackToken;

  const accent: VoiceAccent = options.accent || getSavedAccent();
  const rate = options.rate ?? 1;
  const resolved = resolveVoiceModule(accent);

  if (!options.fromRemote) {
    unlockAudioPlayback();
    audioSyncBridge?.onSpeak?.({ text: trimmed, accent, rate });
  }

  if (resolved.isStudioHdActive) {
    void speakWithStudioHd(trimmed, accent, rate, token).then((status) => {
      if (token !== activePlaybackToken) return;
      if (status === 'blocked' && options.fromRemote) {
        audioSyncBridge?.onAutoplayBlocked?.({ text: trimmed, accent, rate });
        return;
      }
      if (status !== 'ok') {
        speakWithSystemSynthesis(trimmed, accent, rate);
      }
    });
    return;
  }

  speakWithSystemSynthesis(trimmed, accent, rate);
}
