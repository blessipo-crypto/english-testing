import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  BoardStroke,
  ControlMode,
  LessonMilestoneId,
  RemoteAudioEvent,
  RoomParticipant,
  RoomState,
  StudentProfile,
  UserRole,
  VoiceAccent,
  WordbankItem,
} from '../types/lesson';
import {
  registerAudioSyncBridge,
  speakEnglish,
  stopSpeaking,
  unlockAudioPlayback,
  type AudioSyncSpeakPayload,
} from '../utils/speech';

const DEFAULT_LOCAL_STATE: RoomState = {
  roomCode: 'SOLO',
  controlMode: 'shared',
  audioSync: true,
  activeTab: 'warmup',
  stars: 3,
  sessionBaseStars: 3,
  completedModules: [],
  warmup: {
    mood: null,
    weather: null,
    promptIndex: 0,
    studentAnswer: '',
  },
  vocab: {
    deckId: 'hobbies',
    cardIndex: 0,
    blindMode: false,
    mode: 'cards',
    matchedIds: [],
  },
  builder: {
    challengeIndex: 0,
    customPromptFr: '',
    customSentenceEn: '',
    isCustomActive: false,
    selectedIndices: [],
    checkedStatus: 'idle',
  },
  roleplay: {
    scenarioId: 'cafe',
    activeLineIndex: 0,
    hideStudentLines: false,
    studentRole: 'B',
    revealedIndices: [],
  },
  quiz: {
    subTab: 'games',
    questionIndex: 0,
    answers: {},
  },
  games: {
    activeGame: 'wordsearch',
    themeId: 'hobbies',
  },
  timeModule: {
    mode: 'explore',
    hour: 3,
    minute: 15,
    isPm: true,
    showZones: true,
  },
  guide: {
    subTab: 'tenses',
    section: 'irregular',
    hideIrregularForms: false,
  },
  recap: {
    subTab: 'board',
    studentName: '',
    oralFluency: 'En progrès',
    oralPronunciation: 'Claire',
    oralComprehension: 'Bonne',
    oralNotes: '',
    writtenSyntax: 'En progrès',
    writtenSpelling: 'Correcte',
    writtenGrammar: 'En cours',
    writtenNotes: '',
    nextGoal: 'Relire à voix haute les mots du carnet (5 min)',
  },
  writingSpace: {
    tutorText: '',
    studentText: '',
    tutorStrokes: [],
    studentStrokes: [],
  },
  wordbank: [
    {
      id: 'seed-1',
      en: 'sketchbook',
      fr: 'carnet de croquis',
      note: 'Prononcer : skètch-bouk',
      addedAt: Date.now() - 60000,
    },
    {
      id: 'seed-2',
      en: 'Would you like...?',
      fr: 'Voudriez-vous... ? (poli)',
      note: 'Très utile au café ou au magasin',
      addedAt: Date.now() - 30000,
    },
  ],
  strokes: [],
  boardNote: '',
};

const LEGACY_SOLO_STORAGE_KEY = 'storybridge_solo_state_v1';
const SOLO_STATE_PREFIX = 'storybridge_solo_state_';
const PROFILES_STORAGE_KEY = 'storybridge_student_profiles_v1';
const ACTIVE_STUDENT_KEY = 'storybridge_active_student_id_v1';

function getSoloKeyForProfile(profileId: string): string {
  return `${SOLO_STATE_PREFIX}${profileId}_v1`;
}

function createFreshStateForProfile(profileName?: string): RoomState {
  return {
    ...DEFAULT_LOCAL_STATE,
    warmup: { ...DEFAULT_LOCAL_STATE.warmup },
    vocab: { ...DEFAULT_LOCAL_STATE.vocab },
    builder: { ...DEFAULT_LOCAL_STATE.builder },
    roleplay: { ...DEFAULT_LOCAL_STATE.roleplay },
    quiz: { ...DEFAULT_LOCAL_STATE.quiz, answers: {} },
    games: { ...DEFAULT_LOCAL_STATE.games },
    timeModule: { ...DEFAULT_LOCAL_STATE.timeModule },
    guide: { ...DEFAULT_LOCAL_STATE.guide },
    recap: {
      ...DEFAULT_LOCAL_STATE.recap,
      studentName: profileName || '',
    },
    writingSpace: {
      tutorText: '',
      studentText: '',
      tutorStrokes: [],
      studentStrokes: [],
    },
    wordbank: DEFAULT_LOCAL_STATE.wordbank.map((w) => ({ ...w })),
    strokes: [],
  };
}

function normalizeLoadedState(raw: string | null, fallbackName?: string): RoomState {
  const base = createFreshStateForProfile(fallbackName);
  if (!raw) return base;
  try {
    const parsed = JSON.parse(raw) as Partial<RoomState>;
    const mergedRecap = parsed.recap
      ? { ...base.recap, ...parsed.recap }
      : base.recap;
    if (!mergedRecap.studentName && fallbackName) {
      mergedRecap.studentName = fallbackName;
    }
    return {
      ...base,
      ...parsed,
      controlMode: parsed.controlMode === 'tutor-only' ? 'tutor-only' : 'shared',
      audioSync: typeof parsed.audioSync === 'boolean' ? parsed.audioSync : true,
      sessionBaseStars:
        typeof parsed.sessionBaseStars === 'number'
          ? parsed.sessionBaseStars
          : base.sessionBaseStars,
      completedModules: Array.isArray(parsed.completedModules)
        ? parsed.completedModules
        : base.completedModules,
      warmup: parsed.warmup ? { ...base.warmup, ...parsed.warmup } : base.warmup,
      vocab: parsed.vocab ? { ...base.vocab, ...parsed.vocab } : base.vocab,
      builder: parsed.builder ? { ...base.builder, ...parsed.builder } : base.builder,
      roleplay: parsed.roleplay ? { ...base.roleplay, ...parsed.roleplay } : base.roleplay,
      quiz: parsed.quiz ? { ...base.quiz, ...parsed.quiz } : base.quiz,
      games: parsed.games ? { ...base.games, ...parsed.games } : base.games,
      timeModule: parsed.timeModule ? { ...base.timeModule, ...parsed.timeModule } : base.timeModule,
      guide: parsed.guide ? { ...base.guide, ...parsed.guide } : base.guide,
      recap: mergedRecap,
      writingSpace: parsed.writingSpace
        ? {
            ...base.writingSpace,
            ...parsed.writingSpace,
            tutorStrokes: Array.isArray(parsed.writingSpace.tutorStrokes)
              ? parsed.writingSpace.tutorStrokes
              : [],
            studentStrokes: Array.isArray(parsed.writingSpace.studentStrokes)
              ? parsed.writingSpace.studentStrokes
              : [],
          }
        : base.writingSpace,
    };
  } catch {
    return base;
  }
}

function loadSavedSoloState(profileId: string, profileName?: string): RoomState {
  if (typeof window === 'undefined') return createFreshStateForProfile(profileName);
  try {
    const profileKey = getSoloKeyForProfile(profileId);
    const directRaw = window.localStorage.getItem(profileKey);
    if (directRaw) {
      return normalizeLoadedState(directRaw, profileName);
    }
    if (profileId === 'student-1') {
      const legacyRaw = window.localStorage.getItem(LEGACY_SOLO_STORAGE_KEY);
      if (legacyRaw) {
        return normalizeLoadedState(legacyRaw, profileName);
      }
    }
    return createFreshStateForProfile(profileName);
  } catch {
    return createFreshStateForProfile(profileName);
  }
}

function getInitialUrlStudentName(): string | null {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  const raw = params.get('name') || params.get('student');
  const trimmed = raw ? raw.trim().slice(0, 32) : '';
  return trimmed || null;
}

function loadInitialProfiles(): { profiles: StudentProfile[]; activeId: string } {
  const defaultProfile: StudentProfile = {
    id: 'student-1',
    name: 'Élève 1',
    level: 'A1',
    createdAt: Date.now(),
  };

  if (typeof window === 'undefined') {
    return { profiles: [defaultProfile], activeId: defaultProfile.id };
  }

  let profiles: StudentProfile[] = [];
  try {
    const rawProfiles = window.localStorage.getItem(PROFILES_STORAGE_KEY);
    if (rawProfiles) {
      const parsed = JSON.parse(rawProfiles) as StudentProfile[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        profiles = parsed.filter((p) => p && typeof p.id === 'string' && typeof p.name === 'string');
      }
    }
  } catch {
    profiles = [];
  }

  if (profiles.length === 0) {
    // Seed name from legacy solo recap if present
    try {
      const legacyRaw = window.localStorage.getItem(LEGACY_SOLO_STORAGE_KEY);
      if (legacyRaw) {
        const legacyParsed = JSON.parse(legacyRaw) as Partial<RoomState>;
        const legacyName = legacyParsed?.recap?.studentName?.trim();
        if (legacyName) {
          defaultProfile.name = legacyName.slice(0, 32);
        }
      }
    } catch {
      // Ignore
    }
    profiles = [defaultProfile];
  }

  const savedActiveId = window.localStorage.getItem(ACTIVE_STUDENT_KEY);
  let activeId =
    savedActiveId && profiles.some((p) => p.id === savedActiveId)
      ? savedActiveId
      : profiles[0].id;

  const urlStudentName = getInitialUrlStudentName();
  if (urlStudentName) {
    const existing = profiles.find(
      (p) => p.name.toLowerCase() === urlStudentName.toLowerCase()
    );
    if (existing) {
      activeId = existing.id;
    } else {
      const invitedProfile: StudentProfile = {
        id: `student-${Date.now().toString(36)}`,
        name: urlStudentName,
        level: 'A1',
        createdAt: Date.now(),
      };
      profiles = [...profiles, invitedProfile];
      activeId = invitedProfile.id;
    }
  }

  return { profiles, activeId };
}

export function useRoomSync() {
  const [roomCode, setRoomCode] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    const param = new URLSearchParams(window.location.search).get('room');
    return param ? param.trim().toUpperCase().slice(0, 12) : null;
  });

  const [isInvitedStudent] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return new URLSearchParams(window.location.search).get('role') === 'student';
  });

  const [role, setRole] = useState<UserRole>(() => {
    if (typeof window === 'undefined') return 'tutor';
    const param = new URLSearchParams(window.location.search).get('role');
    return param === 'student' ? 'student' : 'tutor';
  });

  const initialProfileBundleRef = useRef<{ profiles: StudentProfile[]; activeId: string } | null>(null);
  if (!initialProfileBundleRef.current) {
    initialProfileBundleRef.current = loadInitialProfiles();
  }

  const [studentProfiles, setStudentProfiles] = useState<StudentProfile[]>(
    initialProfileBundleRef.current.profiles
  );
  const [activeStudentId, setActiveStudentId] = useState<string>(
    initialProfileBundleRef.current.activeId
  );

  const activeStudent =
    studentProfiles.find((p) => p.id === activeStudentId) || studentProfiles[0];

  const [state, setState] = useState<RoomState>(() =>
    loadSavedSoloState(
      initialProfileBundleRef.current!.activeId,
      initialProfileBundleRef.current!.profiles.find(
        (p) => p.id === initialProfileBundleRef.current!.activeId
      )?.name
    )
  );
  const [connected, setConnected] = useState(false);
  const [selfId, setSelfId] = useState<string | null>(null);
  const [participants, setParticipants] = useState<RoomParticipant[]>([]);
  const [lastCelebrationAt, setLastCelebrationAt] = useState<number>(0);
  const [remoteAudioNotice, setRemoteAudioNotice] = useState<RemoteAudioEvent | null>(null);
  const [blockedRemoteAudio, setBlockedRemoteAudio] = useState<AudioSyncSpeakPayload | null>(null);

  const activeStudentNameRef = useRef(activeStudent.name);
  activeStudentNameRef.current = activeStudent.name;
  const stateRef = useRef(state);
  stateRef.current = state;
  const roleRef = useRef(role);
  roleRef.current = role;
  const audioNoticeTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(studentProfiles));
      window.localStorage.setItem(ACTIVE_STUDENT_KEY, activeStudentId);
    } catch {
      // Ignore storage quota errors
    }
  }, [studentProfiles, activeStudentId]);

  useEffect(() => {
    if (roomCode || typeof window === 'undefined') return;
    try {
      const serialized = JSON.stringify(state);
      window.localStorage.setItem(getSoloKeyForProfile(activeStudentId), serialized);
      if (activeStudentId === 'student-1') {
        window.localStorage.setItem(LEGACY_SOLO_STORAGE_KEY, serialized);
      }
    } catch {
      // Ignore storage quota errors
    }
  }, [roomCode, state, activeStudentId]);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<number | null>(null);
  const rtcListenersRef = useRef<
    Set<(msg: { type: string; fromId?: string; fromRole?: UserRole; payload?: unknown }) => void>
  >(new Set());

  const sendMessage = useCallback((payload: unknown) => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(payload));
    }
  }, []);

  useEffect(() => {
    if (!roomCode) {
      setConnected(false);
      setParticipants([]);
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      return;
    }

    let isUnmounted = false;

    const connect = () => {
      if (isUnmounted) return;
      const customOrigin =
        typeof window !== 'undefined'
          ? window.localStorage.getItem('storybridge_sync_server_url')?.trim()
          : '';
      let wsBase = '';
      if (customOrigin) {
        try {
          const parsed = new URL(customOrigin);
          const wsProto = parsed.protocol === 'https:' ? 'wss:' : 'ws:';
          wsBase = `${wsProto}//${parsed.host}`;
        } catch {
          wsBase = '';
        }
      }
      const isPackagedLocal =
        window.location.protocol === 'file:' ||
        window.location.protocol === 'capacitor:' ||
        (window.location.hostname === 'localhost' && !window.location.port);
      if (!wsBase && !isPackagedLocal && (window.location.protocol === 'http:' || window.location.protocol === 'https:')) {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        wsBase = `${protocol}//${window.location.host}`;
      }
      // In packaged offline apps (Electron .exe / Capacitor .apk), fallback to live Cloud Run server to sync rooms
      if (!wsBase && isPackagedLocal) {
        wsBase = 'wss://ais-dev-afm5mejj742ehjjk5blxlb-880439402821.europe-west2.run.app';
      }
      if (!wsBase) {
        return;
      }
      const participantName = role === 'tutor' ? 'Prof' : activeStudentNameRef.current;
      const wsUrl = `${wsBase}/ws?room=${encodeURIComponent(
        roomCode
      )}&role=${role}&name=${encodeURIComponent(participantName)}`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      let heartbeatTimer: number | null = null;

      ws.onopen = () => {
        if (!isUnmounted) setConnected(true);
        heartbeatTimer = window.setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' }));
          }
        }, 20000);
      };

      ws.onmessage = (event) => {
        let msg: Record<string, unknown>;
        try {
          msg = JSON.parse(event.data as string) as Record<string, unknown>;
        } catch {
          return;
        }

        if (msg.type === 'room:init' && msg.state) {
          if (typeof msg.clientId === 'string') {
            setSelfId(msg.clientId);
          }
          setState(msg.state as RoomState);
          if (Array.isArray(msg.participants)) {
            setParticipants(msg.participants as RoomParticipant[]);
          }
        } else if (msg.type === 'presence:update' && Array.isArray(msg.participants)) {
          setParticipants(msg.participants as RoomParticipant[]);
        } else if (msg.type === 'state:patched' && msg.patch) {
          const patch = msg.patch as Partial<RoomState>;
          setState((prev) => ({
            ...prev,
            ...patch,
            warmup: patch.warmup ? { ...prev.warmup, ...patch.warmup } : prev.warmup,
            vocab: patch.vocab ? { ...prev.vocab, ...patch.vocab } : prev.vocab,
            builder: patch.builder ? { ...prev.builder, ...patch.builder } : prev.builder,
            roleplay: patch.roleplay ? { ...prev.roleplay, ...patch.roleplay } : prev.roleplay,
            quiz: patch.quiz ? { ...prev.quiz, ...patch.quiz } : prev.quiz,
            games: patch.games ? { ...prev.games, ...patch.games } : prev.games,
            timeModule: patch.timeModule ? { ...prev.timeModule, ...patch.timeModule } : prev.timeModule,
            guide: patch.guide ? { ...prev.guide, ...patch.guide } : prev.guide,
            recap: patch.recap ? { ...prev.recap, ...patch.recap } : prev.recap,
            writingSpace: patch.writingSpace
              ? { ...prev.writingSpace, ...patch.writingSpace }
              : prev.writingSpace,
          }));
        } else if (msg.type === 'wordbank:added' && msg.item) {
          const item = msg.item as WordbankItem;
          setState((prev) => {
            if (prev.wordbank.some((w) => w.id === item.id)) return prev;
            return { ...prev, wordbank: [item, ...prev.wordbank] };
          });
        } else if (msg.type === 'wordbank:removed' && typeof msg.id === 'string') {
          setState((prev) => ({
            ...prev,
            wordbank: prev.wordbank.filter((w) => w.id !== msg.id),
          }));
        } else if (msg.type === 'stroke:added' && msg.stroke) {
          const stroke = msg.stroke as BoardStroke;
          setState((prev) => {
            if (prev.strokes.some((s) => s.id === stroke.id)) return prev;
            return { ...prev, strokes: [...prev.strokes, stroke] };
          });
        } else if (msg.type === 'stroke:removed' && typeof msg.id === 'string') {
          setState((prev) => ({
            ...prev,
            strokes: prev.strokes.filter((s) => s.id !== msg.id),
          }));
        } else if (msg.type === 'stroke:cleared') {
          setState((prev) => ({ ...prev, strokes: [] }));
        } else if (
          msg.type === 'writing:stroke:added' &&
          (msg.owner === 'tutor' || msg.owner === 'student') &&
          msg.stroke
        ) {
          const stroke = msg.stroke as BoardStroke;
          const owner = msg.owner;
          setState((prev) => {
            const list =
              owner === 'tutor'
                ? prev.writingSpace.tutorStrokes
                : prev.writingSpace.studentStrokes;
            if (list.some((s) => s.id === stroke.id)) return prev;
            return {
              ...prev,
              writingSpace: {
                ...prev.writingSpace,
                [owner === 'tutor' ? 'tutorStrokes' : 'studentStrokes']: [
                  ...list,
                  stroke,
                ],
              },
            };
          });
        } else if (
          msg.type === 'writing:stroke:removed' &&
          (msg.owner === 'tutor' || msg.owner === 'student') &&
          typeof msg.id === 'string'
        ) {
          const owner = msg.owner;
          const targetId = msg.id as string;
          setState((prev) => ({
            ...prev,
            writingSpace: {
              ...prev.writingSpace,
              [owner === 'tutor' ? 'tutorStrokes' : 'studentStrokes']: (
                owner === 'tutor'
                  ? prev.writingSpace.tutorStrokes
                  : prev.writingSpace.studentStrokes
              ).filter((s) => s.id !== targetId),
            },
          }));
        } else if (
          msg.type === 'writing:stroke:cleared' &&
          (msg.owner === 'tutor' || msg.owner === 'student')
        ) {
          const owner = msg.owner;
          setState((prev) => ({
            ...prev,
            writingSpace: {
              ...prev.writingSpace,
              [owner === 'tutor' ? 'tutorStrokes' : 'studentStrokes']: [],
            },
          }));
        } else if (msg.type === 'star:celebrated' && typeof msg.stars === 'number') {
          setState((prev) => ({ ...prev, stars: msg.stars as number }));
          setLastCelebrationAt(Date.now());
        } else if (msg.type === 'audio:speak' && typeof msg.text === 'string') {
          if (!stateRef.current.audioSync) return;
          const accent: VoiceAccent = msg.accent === 'en-US' ? 'en-US' : 'en-GB';
          const rate =
            typeof msg.rate === 'number' && Number.isFinite(msg.rate)
              ? Math.max(0.5, Math.min(1.4, msg.rate))
              : 1;
          const fromRole: UserRole = msg.fromRole === 'tutor' ? 'tutor' : 'student';
          const by =
            typeof msg.by === 'string' && msg.by.trim()
              ? msg.by.trim()
              : fromRole === 'tutor'
                ? 'Professeur'
                : 'Élève';
          setBlockedRemoteAudio(null);
          setRemoteAudioNotice({
            text: msg.text,
            accent,
            rate,
            by,
            fromRole,
            at: Date.now(),
          });
          if (audioNoticeTimerRef.current) {
            window.clearTimeout(audioNoticeTimerRef.current);
          }
          audioNoticeTimerRef.current = window.setTimeout(() => {
            setRemoteAudioNotice(null);
          }, 4500);
          speakEnglish(msg.text, { accent, rate, fromRemote: true });
        } else if (msg.type === 'audio:stop') {
          if (!stateRef.current.audioSync) return;
          stopSpeaking({ broadcast: false });
        } else if (typeof msg.type === 'string' && msg.type.startsWith('rtc:')) {
          const signal = {
            type: msg.type,
            fromId: typeof msg.fromId === 'string' ? msg.fromId : undefined,
            fromRole:
              msg.fromRole === 'tutor' || msg.fromRole === 'student'
                ? (msg.fromRole as UserRole)
                : undefined,
            payload: msg.payload,
          };
          rtcListenersRef.current.forEach((listener) => listener(signal));
        }
      };

      ws.onclose = () => {
        if (heartbeatTimer) clearInterval(heartbeatTimer);
        if (!isUnmounted) {
          setConnected(false);
          setSelfId(null);
          reconnectTimerRef.current = window.setTimeout(connect, 2000);
        }
      };
    };

    connect();

    return () => {
      isUnmounted = true;
      if (reconnectTimerRef.current) {
        window.clearTimeout(reconnectTimerRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [roomCode, role]);

  useEffect(() => {
    if (!roomCode || !connected || !state.audioSync) {
      registerAudioSyncBridge(null);
      if (!roomCode || !state.audioSync) {
        setRemoteAudioNotice(null);
        setBlockedRemoteAudio(null);
      }
      return;
    }
    registerAudioSyncBridge({
      onSpeak: (payload) => {
        sendMessage({ type: 'audio:speak', ...payload });
      },
      onStop: () => {
        sendMessage({ type: 'audio:stop' });
      },
      onAutoplayBlocked: (payload) => {
        setBlockedRemoteAudio(payload);
      },
    });
    return () => {
      registerAudioSyncBridge(null);
    };
  }, [roomCode, connected, state.audioSync, sendMessage]);

  useEffect(() => {
    return () => {
      if (audioNoticeTimerRef.current) {
        window.clearTimeout(audioNoticeTimerRef.current);
      }
    };
  }, []);

  const joinRoom = useCallback((code: string) => {
    const normalized = code.trim().toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 12) || 'LNDN';
    setRoomCode(normalized);
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('room', normalized);
      window.history.replaceState({}, '', url.toString());
    } catch {
      // Ignore history errors in packaged file:// mode
    }
  }, []);

  const leaveRoom = useCallback(() => {
    setRoomCode(null);
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete('room');
      url.searchParams.delete('name');
      url.searchParams.delete('student');
      window.history.replaceState({}, '', url.toString());
    } catch {
      // Ignore history errors in packaged file:// mode
    }
    setState(loadSavedSoloState(activeStudentId, activeStudentNameRef.current));
  }, [activeStudentId]);

  const isStudentMirrorLocked = useCallback(() => {
    return roleRef.current === 'student' && stateRef.current.controlMode === 'tutor-only';
  }, []);

  const patchState = useCallback(
    (patch: Partial<RoomState>) => {
      if (isStudentMirrorLocked()) return;
      const sanitizedPatch: Partial<RoomState> = { ...patch };
      if (roleRef.current !== 'tutor') {
        delete sanitizedPatch.controlMode;
        delete sanitizedPatch.audioSync;
      }
      setState((prev) => ({
        ...prev,
        ...sanitizedPatch,
        warmup: sanitizedPatch.warmup
          ? { ...prev.warmup, ...sanitizedPatch.warmup }
          : prev.warmup,
        vocab: sanitizedPatch.vocab ? { ...prev.vocab, ...sanitizedPatch.vocab } : prev.vocab,
        builder: sanitizedPatch.builder
          ? { ...prev.builder, ...sanitizedPatch.builder }
          : prev.builder,
        roleplay: sanitizedPatch.roleplay
          ? { ...prev.roleplay, ...sanitizedPatch.roleplay }
          : prev.roleplay,
        quiz: sanitizedPatch.quiz ? { ...prev.quiz, ...sanitizedPatch.quiz } : prev.quiz,
        games: sanitizedPatch.games ? { ...prev.games, ...sanitizedPatch.games } : prev.games,
        timeModule: sanitizedPatch.timeModule
          ? { ...prev.timeModule, ...sanitizedPatch.timeModule }
          : prev.timeModule,
        guide: sanitizedPatch.guide ? { ...prev.guide, ...sanitizedPatch.guide } : prev.guide,
        recap: sanitizedPatch.recap ? { ...prev.recap, ...sanitizedPatch.recap } : prev.recap,
        writingSpace: sanitizedPatch.writingSpace
          ? { ...prev.writingSpace, ...sanitizedPatch.writingSpace }
          : prev.writingSpace,
      }));
      sendMessage({ type: 'state:patch', patch: sanitizedPatch });
    },
    [isStudentMirrorLocked, sendMessage]
  );

  const setControlMode = useCallback(
    (controlMode: ControlMode) => {
      if (roleRef.current !== 'tutor') return;
      patchState({ controlMode });
    },
    [patchState]
  );

  const setAudioSync = useCallback(
    (audioSync: boolean) => {
      if (roleRef.current !== 'tutor') return;
      patchState({ audioSync });
    },
    [patchState]
  );

  const dismissRemoteAudioNotice = useCallback(() => {
    setRemoteAudioNotice(null);
  }, []);

  const replayBlockedRemoteAudio = useCallback(() => {
    unlockAudioPlayback();
    setBlockedRemoteAudio((pending) => {
      if (pending) {
        speakEnglish(pending.text, {
          accent: pending.accent,
          rate: pending.rate,
          fromRemote: true,
        });
      }
      return null;
    });
  }, []);

  const updateWritingText = useCallback(
    (owner: 'tutor' | 'student', text: string) => {
      if (isStudentMirrorLocked()) return;
      const field = owner === 'tutor' ? 'tutorText' : 'studentText';
      setState((prev) => ({
        ...prev,
        writingSpace: {
          ...prev.writingSpace,
          [field]: text,
        },
      }));
      sendMessage({ type: 'state:patch', patch: { writingSpace: { [field]: text } } });
    },
    [isStudentMirrorLocked, sendMessage]
  );

  const addWritingStroke = useCallback(
    (owner: 'tutor' | 'student', stroke: BoardStroke) => {
      if (isStudentMirrorLocked()) return;
      const field = owner === 'tutor' ? 'tutorStrokes' : 'studentStrokes';
      setState((prev) => {
        const current = prev.writingSpace[field];
        if (current.some((s) => s.id === stroke.id)) return prev;
        return {
          ...prev,
          writingSpace: {
            ...prev.writingSpace,
            [field]: [...current, stroke],
          },
        };
      });
      sendMessage({ type: 'writing:stroke:add', owner, stroke });
    },
    [isStudentMirrorLocked, sendMessage]
  );

  const undoWritingStroke = useCallback(
    (owner: 'tutor' | 'student') => {
      if (isStudentMirrorLocked()) return;
      const field = owner === 'tutor' ? 'tutorStrokes' : 'studentStrokes';
      setState((prev) => {
        const current = prev.writingSpace[field];
        const last = current[current.length - 1];
        if (!last) return prev;
        sendMessage({ type: 'writing:stroke:undo', owner, id: last.id });
        return {
          ...prev,
          writingSpace: {
            ...prev.writingSpace,
            [field]: current.slice(0, -1),
          },
        };
      });
    },
    [isStudentMirrorLocked, sendMessage]
  );

  const clearWritingStrokes = useCallback(
    (owner: 'tutor' | 'student') => {
      if (isStudentMirrorLocked()) return;
      const field = owner === 'tutor' ? 'tutorStrokes' : 'studentStrokes';
      setState((prev) => ({
        ...prev,
        writingSpace: {
          ...prev.writingSpace,
          [field]: [],
        },
      }));
      sendMessage({ type: 'writing:stroke:clear', owner });
    },
    [isStudentMirrorLocked, sendMessage]
  );

  const addWord = useCallback(
    (item: Omit<WordbankItem, 'id' | 'addedAt'>) => {
      if (isStudentMirrorLocked()) return;
      const fullItem: WordbankItem = {
        ...item,
        id: `wb-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
        addedAt: Date.now(),
      };
      setState((prev) => ({ ...prev, wordbank: [fullItem, ...prev.wordbank] }));
      sendMessage({ type: 'wordbank:add', item: fullItem });
    },
    [isStudentMirrorLocked, sendMessage]
  );

  const removeWord = useCallback(
    (id: string) => {
      if (isStudentMirrorLocked()) return;
      setState((prev) => ({
        ...prev,
        wordbank: prev.wordbank.filter((w) => w.id !== id),
      }));
      sendMessage({ type: 'wordbank:remove', id });
    },
    [isStudentMirrorLocked, sendMessage]
  );

  const addStroke = useCallback(
    (stroke: BoardStroke) => {
      if (isStudentMirrorLocked()) return;
      setState((prev) => {
        if (prev.strokes.some((s) => s.id === stroke.id)) return prev;
        return { ...prev, strokes: [...prev.strokes, stroke] };
      });
      sendMessage({ type: 'stroke:add', stroke });
    },
    [isStudentMirrorLocked, sendMessage]
  );

  const undoLastStroke = useCallback(() => {
    if (isStudentMirrorLocked()) return;
    setState((prev) => {
      const last = prev.strokes[prev.strokes.length - 1];
      if (!last) return prev;
      sendMessage({ type: 'stroke:undo', id: last.id });
      return { ...prev, strokes: prev.strokes.slice(0, -1) };
    });
  }, [isStudentMirrorLocked, sendMessage]);

  const clearStrokes = useCallback(() => {
    if (isStudentMirrorLocked()) return;
    setState((prev) => ({ ...prev, strokes: [] }));
    sendMessage({ type: 'stroke:clear' });
  }, [isStudentMirrorLocked, sendMessage]);

  const awardStar = useCallback(() => {
    if (isStudentMirrorLocked()) return;
    if (roomCode && connected) {
      sendMessage({ type: 'celebrate:star' });
    } else {
      setState((prev) => ({ ...prev, stars: prev.stars + 1 }));
      setLastCelebrationAt(Date.now());
    }
  }, [isStudentMirrorLocked, roomCode, connected, sendMessage]);

  const completeModule = useCallback(
    (milestone: LessonMilestoneId) => {
      if (isStudentMirrorLocked()) return;
      setState((prev) => {
        if (prev.completedModules.includes(milestone)) return prev;
        const next = [...prev.completedModules, milestone];
        sendMessage({ type: 'state:patch', patch: { completedModules: next } });
        return { ...prev, completedModules: next };
      });
    },
    [isStudentMirrorLocked, sendMessage]
  );

  const resetLessonProgress = useCallback(() => {
    if (isStudentMirrorLocked()) return;
    setState((prev) => {
      const patch = {
        completedModules: [] as LessonMilestoneId[],
        sessionBaseStars: prev.stars,
      };
      sendMessage({ type: 'state:patch', patch });
      return { ...prev, ...patch };
    });
  }, [isStudentMirrorLocked, sendMessage]);

  const switchRole = useCallback(
    (nextRole: UserRole, customName?: string) => {
      if (isInvitedStudent && nextRole === 'tutor') return;
      setRole(nextRole);
      const nextName =
        customName?.trim() ||
        (nextRole === 'tutor' ? 'Prof' : activeStudentNameRef.current);
      sendMessage({ type: 'role:update', role: nextRole, name: nextName });
    },
    [isInvitedStudent, sendMessage]
  );

  const selectStudentProfile = useCallback(
    (profileId: string, alsoSwitchToStudentRole = false) => {
      const target = studentProfiles.find((p) => p.id === profileId);
      if (!target) return;

      if (!roomCode && typeof window !== 'undefined' && profileId !== activeStudentId) {
        try {
          const serialized = JSON.stringify(state);
          window.localStorage.setItem(getSoloKeyForProfile(activeStudentId), serialized);
          if (activeStudentId === 'student-1') {
            window.localStorage.setItem(LEGACY_SOLO_STORAGE_KEY, serialized);
          }
        } catch {
          // Ignore storage quota errors
        }
      }

      setActiveStudentId(target.id);
      activeStudentNameRef.current = target.name;

      if (!roomCode) {
        const loaded = loadSavedSoloState(target.id, target.name);
        setState(loaded);
      } else {
        patchState({
          recap: {
            ...state.recap,
            studentName: target.name,
          },
        });
      }

      if (alsoSwitchToStudentRole) {
        setRole('student');
        sendMessage({ type: 'role:update', role: 'student', name: target.name });
      } else if (role === 'student') {
        sendMessage({ type: 'role:update', role: 'student', name: target.name });
      }
    },
    [activeStudentId, patchState, role, roomCode, sendMessage, state, studentProfiles]
  );

  const addStudentProfile = useCallback(
    (rawName: string, level: 'A1' | 'A2' = 'A1', alsoSwitchToStudentRole = false): StudentProfile => {
      const cleanName =
        rawName.trim().slice(0, 32) || `Élève ${studentProfiles.length + 1}`;
      const newProfile: StudentProfile = {
        id: `student-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`,
        name: cleanName,
        level,
        createdAt: Date.now(),
      };

      if (!roomCode && typeof window !== 'undefined') {
        try {
          const serialized = JSON.stringify(state);
          window.localStorage.setItem(getSoloKeyForProfile(activeStudentId), serialized);
          if (activeStudentId === 'student-1') {
            window.localStorage.setItem(LEGACY_SOLO_STORAGE_KEY, serialized);
          }
        } catch {
          // Ignore
        }
      }

      const freshState = createFreshStateForProfile(cleanName);
      if (!roomCode && typeof window !== 'undefined') {
        try {
          window.localStorage.setItem(
            getSoloKeyForProfile(newProfile.id),
            JSON.stringify(freshState)
          );
        } catch {
          // Ignore
        }
      }

      setStudentProfiles((prev) => [...prev, newProfile]);
      setActiveStudentId(newProfile.id);
      activeStudentNameRef.current = cleanName;

      if (!roomCode) {
        setState(freshState);
      } else {
        patchState({
          recap: {
            ...state.recap,
            studentName: cleanName,
          },
        });
      }

      if (alsoSwitchToStudentRole) {
        setRole('student');
        sendMessage({ type: 'role:update', role: 'student', name: cleanName });
      } else if (role === 'student') {
        sendMessage({ type: 'role:update', role: 'student', name: cleanName });
      }

      return newProfile;
    },
    [activeStudentId, patchState, role, roomCode, sendMessage, state, studentProfiles.length]
  );

  const renameStudentProfile = useCallback(
    (profileId: string, rawName: string, nextLevel?: 'A1' | 'A2') => {
      const cleanName = rawName.trim().slice(0, 32);
      if (!cleanName) return;

      setStudentProfiles((prev) =>
        prev.map((p) =>
          p.id === profileId
            ? { ...p, name: cleanName, level: nextLevel ?? p.level }
            : p
        )
      );

      if (profileId === activeStudentId) {
        activeStudentNameRef.current = cleanName;
        patchState({
          recap: {
            ...state.recap,
            studentName: cleanName,
          },
        });
        if (role === 'student') {
          sendMessage({ type: 'role:update', role: 'student', name: cleanName });
        }
      }
    },
    [activeStudentId, patchState, role, sendMessage, state.recap]
  );

  const removeStudentProfile = useCallback(
    (profileId: string) => {
      if (studentProfiles.length <= 1) return;
      const remaining = studentProfiles.filter((p) => p.id !== profileId);
      setStudentProfiles(remaining);

      if (typeof window !== 'undefined') {
        try {
          window.localStorage.removeItem(getSoloKeyForProfile(profileId));
        } catch {
          // Ignore
        }
      }

      if (profileId === activeStudentId && remaining[0]) {
        const fallback = remaining[0];
        setActiveStudentId(fallback.id);
        activeStudentNameRef.current = fallback.name;
        if (!roomCode) {
          setState(loadSavedSoloState(fallback.id, fallback.name));
        } else {
          patchState({
            recap: {
              ...state.recap,
              studentName: fallback.name,
            },
          });
        }
        if (role === 'student') {
          sendMessage({ type: 'role:update', role: 'student', name: fallback.name });
        }
      }
    },
    [activeStudentId, patchState, role, roomCode, sendMessage, state.recap, studentProfiles]
  );

  const sendRtcSignal = useCallback(
    (type: string, payload?: unknown, toId?: string) => {
      sendMessage(toId ? { type, payload, toId } : { type, payload });
    },
    [sendMessage]
  );

  const subscribeRtcSignal = useCallback(
    (
      listener: (msg: {
        type: string;
        fromId?: string;
        fromRole?: UserRole;
        payload?: unknown;
      }) => void
    ) => {
      rtcListenersRef.current.add(listener);
      return () => {
        rtcListenersRef.current.delete(listener);
      };
    },
    []
  );

  return {
    roomCode,
    connected,
    selfId,
    participants,
    role,
    isInvitedStudent,
    switchRole,
    studentProfiles,
    activeStudent,
    selectStudentProfile,
    addStudentProfile,
    renameStudentProfile,
    removeStudentProfile,
    state,
    lastCelebrationAt,
    remoteAudioNotice,
    blockedRemoteAudio,
    dismissRemoteAudioNotice,
    replayBlockedRemoteAudio,
    setControlMode,
    setAudioSync,
    joinRoom,
    leaveRoom,
    patchState,
    addWord,
    removeWord,
    addStroke,
    undoLastStroke,
    clearStrokes,
    updateWritingText,
    addWritingStroke,
    undoWritingStroke,
    clearWritingStrokes,
    awardStar,
    completeModule,
    resetLessonProgress,
    sendRtcSignal,
    subscribeRtcSignal,
  };
}
