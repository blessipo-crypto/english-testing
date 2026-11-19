import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  BoardStroke,
  LessonMilestoneId,
  RoomParticipant,
  RoomState,
  StudentProfile,
  UserRole,
  WordbankItem,
} from '../types/lesson';

const DEFAULT_LOCAL_STATE: RoomState = {
  roomCode: 'SOLO',
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
  const [participants, setParticipants] = useState<RoomParticipant[]>([]);
  const [lastCelebrationAt, setLastCelebrationAt] = useState<number>(0);

  const activeStudentNameRef = useRef(activeStudent.name);
  activeStudentNameRef.current = activeStudent.name;

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
      if (!wsBase) {
        return;
      }
      const participantName = role === 'tutor' ? 'Prof' : activeStudentNameRef.current;
      const wsUrl = `${wsBase}/ws?room=${encodeURIComponent(
        roomCode
      )}&role=${role}&name=${encodeURIComponent(participantName)}`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!isUnmounted) setConnected(true);
      };

      ws.onmessage = (event) => {
        let msg: Record<string, unknown>;
        try {
          msg = JSON.parse(event.data as string) as Record<string, unknown>;
        } catch {
          return;
        }

        if (msg.type === 'room:init' && msg.state) {
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
        if (!isUnmounted) {
          setConnected(false);
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

  const patchState = useCallback(
    (patch: Partial<RoomState>) => {
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
      sendMessage({ type: 'state:patch', patch });
    },
    [sendMessage]
  );

  const updateWritingText = useCallback(
    (owner: 'tutor' | 'student', text: string) => {
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
    [sendMessage]
  );

  const addWritingStroke = useCallback(
    (owner: 'tutor' | 'student', stroke: BoardStroke) => {
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
    [sendMessage]
  );

  const undoWritingStroke = useCallback(
    (owner: 'tutor' | 'student') => {
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
    [sendMessage]
  );

  const clearWritingStrokes = useCallback(
    (owner: 'tutor' | 'student') => {
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
    [sendMessage]
  );

  const addWord = useCallback(
    (item: Omit<WordbankItem, 'id' | 'addedAt'>) => {
      const fullItem: WordbankItem = {
        ...item,
        id: `wb-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
        addedAt: Date.now(),
      };
      setState((prev) => ({ ...prev, wordbank: [fullItem, ...prev.wordbank] }));
      sendMessage({ type: 'wordbank:add', item: fullItem });
    },
    [sendMessage]
  );

  const removeWord = useCallback(
    (id: string) => {
      setState((prev) => ({
        ...prev,
        wordbank: prev.wordbank.filter((w) => w.id !== id),
      }));
      sendMessage({ type: 'wordbank:remove', id });
    },
    [sendMessage]
  );

  const addStroke = useCallback(
    (stroke: BoardStroke) => {
      setState((prev) => {
        if (prev.strokes.some((s) => s.id === stroke.id)) return prev;
        return { ...prev, strokes: [...prev.strokes, stroke] };
      });
      sendMessage({ type: 'stroke:add', stroke });
    },
    [sendMessage]
  );

  const undoLastStroke = useCallback(() => {
    setState((prev) => {
      const last = prev.strokes[prev.strokes.length - 1];
      if (!last) return prev;
      sendMessage({ type: 'stroke:undo', id: last.id });
      return { ...prev, strokes: prev.strokes.slice(0, -1) };
    });
  }, [sendMessage]);

  const clearStrokes = useCallback(() => {
    setState((prev) => ({ ...prev, strokes: [] }));
    sendMessage({ type: 'stroke:clear' });
  }, [sendMessage]);

  const awardStar = useCallback(() => {
    if (roomCode && connected) {
      sendMessage({ type: 'celebrate:star' });
    } else {
      setState((prev) => ({ ...prev, stars: prev.stars + 1 }));
      setLastCelebrationAt(Date.now());
    }
  }, [roomCode, connected, sendMessage]);

  const completeModule = useCallback(
    (milestone: LessonMilestoneId) => {
      setState((prev) => {
        if (prev.completedModules.includes(milestone)) return prev;
        const next = [...prev.completedModules, milestone];
        sendMessage({ type: 'state:patch', patch: { completedModules: next } });
        return { ...prev, completedModules: next };
      });
    },
    [sendMessage]
  );

  const resetLessonProgress = useCallback(() => {
    setState((prev) => {
      const patch = {
        completedModules: [] as LessonMilestoneId[],
        sessionBaseStars: prev.stars,
      };
      sendMessage({ type: 'state:patch', patch });
      return { ...prev, ...patch };
    });
  }, [sendMessage]);

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
    (type: string, payload?: unknown) => {
      sendMessage({ type, payload });
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
