import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  BoardStroke,
  RoomParticipant,
  RoomState,
  UserRole,
  WordbankItem,
} from '../types/lesson';

const DEFAULT_LOCAL_STATE: RoomState = {
  roomCode: 'SOLO',
  activeTab: 'warmup',
  stars: 3,
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
    subTab: 'guide',
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

const SOLO_STORAGE_KEY = 'storybridge_solo_state_v1';

function loadSavedSoloState(): RoomState {
  if (typeof window === 'undefined') return DEFAULT_LOCAL_STATE;
  try {
    const raw = window.localStorage.getItem(SOLO_STORAGE_KEY);
    if (!raw) return DEFAULT_LOCAL_STATE;
    const parsed = JSON.parse(raw) as Partial<RoomState>;
    return {
      ...DEFAULT_LOCAL_STATE,
      ...parsed,
      warmup: parsed.warmup ? { ...DEFAULT_LOCAL_STATE.warmup, ...parsed.warmup } : DEFAULT_LOCAL_STATE.warmup,
      vocab: parsed.vocab ? { ...DEFAULT_LOCAL_STATE.vocab, ...parsed.vocab } : DEFAULT_LOCAL_STATE.vocab,
      builder: parsed.builder ? { ...DEFAULT_LOCAL_STATE.builder, ...parsed.builder } : DEFAULT_LOCAL_STATE.builder,
      roleplay: parsed.roleplay ? { ...DEFAULT_LOCAL_STATE.roleplay, ...parsed.roleplay } : DEFAULT_LOCAL_STATE.roleplay,
      quiz: parsed.quiz ? { ...DEFAULT_LOCAL_STATE.quiz, ...parsed.quiz } : DEFAULT_LOCAL_STATE.quiz,
      games: parsed.games ? { ...DEFAULT_LOCAL_STATE.games, ...parsed.games } : DEFAULT_LOCAL_STATE.games,
      timeModule: parsed.timeModule ? { ...DEFAULT_LOCAL_STATE.timeModule, ...parsed.timeModule } : DEFAULT_LOCAL_STATE.timeModule,
      guide: parsed.guide ? { ...DEFAULT_LOCAL_STATE.guide, ...parsed.guide } : DEFAULT_LOCAL_STATE.guide,
      recap: parsed.recap ? { ...DEFAULT_LOCAL_STATE.recap, ...parsed.recap } : DEFAULT_LOCAL_STATE.recap,
    };
  } catch {
    return DEFAULT_LOCAL_STATE;
  }
}

export function useRoomSync() {
  const [roomCode, setRoomCode] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    const param = new URLSearchParams(window.location.search).get('room');
    return param ? param.trim().toUpperCase().slice(0, 12) : null;
  });

  const [role, setRole] = useState<UserRole>(() => {
    if (typeof window === 'undefined') return 'tutor';
    const param = new URLSearchParams(window.location.search).get('role');
    return param === 'student' ? 'student' : 'tutor';
  });

  const [state, setState] = useState<RoomState>(() => loadSavedSoloState());
  const [connected, setConnected] = useState(false);
  const [participants, setParticipants] = useState<RoomParticipant[]>([]);
  const [lastCelebrationAt, setLastCelebrationAt] = useState<number>(0);

  useEffect(() => {
    if (roomCode || typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(SOLO_STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore storage quota errors
    }
  }, [roomCode, state]);

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
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws?room=${encodeURIComponent(roomCode)}&role=${role}`;
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
    const url = new URL(window.location.href);
    url.searchParams.set('room', normalized);
    window.history.replaceState({}, '', url.toString());
  }, []);

  const leaveRoom = useCallback(() => {
    setRoomCode(null);
    const url = new URL(window.location.href);
    url.searchParams.delete('room');
    window.history.replaceState({}, '', url.toString());
  }, []);

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
      }));
      sendMessage({ type: 'state:patch', patch });
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

  const switchRole = useCallback(
    (nextRole: UserRole) => {
      setRole(nextRole);
      sendMessage({ type: 'role:update', role: nextRole });
    },
    [sendMessage]
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
    switchRole,
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
    awardStar,
    sendRtcSignal,
    subscribeRtcSignal,
  };
}
