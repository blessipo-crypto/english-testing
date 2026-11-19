import express from 'express';
import fs from 'fs';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const STORE_DIR = path.join(__dirname, 'data');
const STORE_PATH = path.join(STORE_DIR, 'studio-store.json');

interface StrokePoint {
  x: number;
  y: number;
}

interface BoardStroke {
  id: string;
  color: string;
  width: number;
  points: StrokePoint[];
}

interface WordbankItem {
  id: string;
  en: string;
  fr: string;
  note: string;
  addedAt: number;
}

interface RoomState {
  roomCode: string;
  activeTab: 'warmup' | 'vocab' | 'builder' | 'roleplay' | 'board';
  stars: number;
  sessionBaseStars: number;
  completedModules: Array<'warmup' | 'vocab' | 'grammar' | 'games' | 'time' | 'quiz'>;
  warmup: {
    mood: string | null;
    weather: string | null;
    promptIndex: number;
    studentAnswer: string;
  };
  vocab: {
    deckId: string;
    cardIndex: number;
    blindMode: boolean;
    mode: 'cards' | 'match';
    matchedIds: string[];
  };
  builder: {
    challengeIndex: number;
    customPromptFr: string;
    customSentenceEn: string;
    isCustomActive: boolean;
    selectedIndices: number[];
    checkedStatus: 'idle' | 'correct' | 'incorrect';
  };
  roleplay: {
    scenarioId: string;
    activeLineIndex: number;
    hideStudentLines: boolean;
    studentRole: 'A' | 'B';
    revealedIndices: number[];
  };
  quiz: {
    subTab: 'games' | 'time' | 'quiz' | 'dialogue';
    questionIndex: number;
    answers: Record<string, number>;
  };
  games: {
    activeGame: 'wordsearch' | 'vocabmatch' | 'sentence' | 'grammarblitz';
    themeId: string;
  };
  timeModule: {
    mode: 'explore' | 'challenge';
    hour: number;
    minute: number;
    isPm: boolean;
    showZones: boolean;
  };
  guide: {
    subTab: 'guide' | 'builder';
    section: 'irregular' | 'modals' | 'tenses' | 'prepositions';
    hideIrregularForms: boolean;
  };
  recap: {
    subTab: 'writing' | 'board' | 'recap';
    studentName: string;
    oralFluency: string;
    oralPronunciation: string;
    oralComprehension: string;
    oralNotes: string;
    writtenSyntax: string;
    writtenSpelling: string;
    writtenGrammar: string;
    writtenNotes: string;
    nextGoal: string;
  };
  writingSpace: {
    tutorText: string;
    studentText: string;
    tutorStrokes: BoardStroke[];
    studentStrokes: BoardStroke[];
  };
  wordbank: WordbankItem[];
  strokes: BoardStroke[];
  boardNote: string;
}

interface ClientMeta {
  id: string;
  roomCode: string;
  name: string;
  role: 'tutor' | 'student';
  ws: WebSocket;
}

function createInitialRoomState(roomCode: string): RoomState {
  return {
    roomCode,
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
}

interface SavedSessionRecap {
  id: string;
  savedAt: number;
  dateLabel: string;
  studentName: string;
  stars: number;
  wordCount: number;
  summaryText: string;
  nextGoal: string;
}

const rooms = new Map<string, RoomState>();
const roomClients = new Map<string, Map<string, ClientMeta>>();
let savedRecaps: SavedSessionRecap[] = [];
let saveTimer: ReturnType<typeof setTimeout> | null = null;

function loadStore() {
  try {
    if (!fs.existsSync(STORE_PATH)) return;
    const raw = fs.readFileSync(STORE_PATH, 'utf8');
    const parsed = JSON.parse(raw) as {
      rooms?: Record<string, RoomState>;
      savedRecaps?: SavedSessionRecap[];
    };
    if (parsed.rooms && typeof parsed.rooms === 'object') {
      for (const [code, state] of Object.entries(parsed.rooms)) {
        const base = createInitialRoomState(code);
        rooms.set(code, {
          ...base,
          ...state,
          sessionBaseStars:
            typeof state.sessionBaseStars === 'number'
              ? state.sessionBaseStars
              : base.sessionBaseStars,
          completedModules: Array.isArray(state.completedModules)
            ? state.completedModules
            : base.completedModules,
          games: state.games ? { ...base.games, ...state.games } : base.games,
          timeModule: state.timeModule ? { ...base.timeModule, ...state.timeModule } : base.timeModule,
          writingSpace: state.writingSpace
            ? {
                ...base.writingSpace,
                ...state.writingSpace,
                tutorStrokes: Array.isArray(state.writingSpace.tutorStrokes)
                  ? state.writingSpace.tutorStrokes
                  : base.writingSpace.tutorStrokes,
                studentStrokes: Array.isArray(state.writingSpace.studentStrokes)
                  ? state.writingSpace.studentStrokes
                  : base.writingSpace.studentStrokes,
              }
            : base.writingSpace,
        });
      }
    }
    if (Array.isArray(parsed.savedRecaps)) {
      savedRecaps = parsed.savedRecaps;
    }
  } catch {
    // Start fresh if store file cannot be parsed
  }
}

function scheduleSaveStore() {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      fs.mkdirSync(STORE_DIR, { recursive: true });
      const payload = {
        rooms: Object.fromEntries(rooms.entries()),
        savedRecaps,
      };
      fs.writeFileSync(STORE_PATH, JSON.stringify(payload, null, 2), 'utf8');
    } catch {
      // Ignore write errors in read-only environments
    }
  }, 300);
}

loadStore();

function getOrCreateRoom(rawCode: string): RoomState {
  const code = rawCode.trim().toUpperCase().slice(0, 12) || 'DEMO';
  let state = rooms.get(code);
  if (!state) {
    state = createInitialRoomState(code);
    rooms.set(code, state);
    scheduleSaveStore();
  }
  return state;
}

function getParticipants(roomCode: string) {
  const clients = roomClients.get(roomCode);
  if (!clients) return [];
  return Array.from(clients.values()).map((c) => ({
    id: c.id,
    name: c.name,
    role: c.role,
  }));
}

function broadcastToRoom(roomCode: string, payload: unknown, excludeClientId?: string) {
  const clients = roomClients.get(roomCode);
  if (!clients) return;
  const serialized = JSON.stringify(payload);
  for (const [id, client] of clients.entries()) {
    if (excludeClientId && id === excludeClientId) continue;
    if (client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(serialized);
    }
  }
}

async function startServer() {
  const app = express();
  app.use(express.json());

  app.get('/favicon.ico', (_req, res) => {
    const icoCandidates = [
      path.join(__dirname, 'public', 'favicon.ico'),
      path.join(__dirname, 'dist', 'favicon.ico'),
      path.join(__dirname, 'favicon.ico'),
    ];
    for (const p of icoCandidates) {
      if (fs.existsSync(p)) {
        res.type('image/x-icon').sendFile(p);
        return;
      }
    }
    res.status(204).end();
  });

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, activeRooms: rooms.size, savedRecaps: savedRecaps.length });
  });

  app.get('/api/recaps', (_req, res) => {
    res.json({ recaps: savedRecaps });
  });

  app.post('/api/recaps', (req, res) => {
    const body = req.body as Partial<SavedSessionRecap>;
    if (!body || typeof body.summaryText !== 'string' || !body.summaryText.trim()) {
      res.status(400).json({ error: 'summaryText required' });
      return;
    }
    const item: SavedSessionRecap = {
      id:
        typeof body.id === 'string' && body.id
          ? body.id
          : `recap-${Date.now().toString(36)}`,
      savedAt: typeof body.savedAt === 'number' ? body.savedAt : Date.now(),
      dateLabel:
        typeof body.dateLabel === 'string' && body.dateLabel
          ? body.dateLabel
          : new Date().toLocaleDateString('fr-FR'),
      studentName: typeof body.studentName === 'string' ? body.studentName : '',
      stars: typeof body.stars === 'number' ? body.stars : 0,
      wordCount: typeof body.wordCount === 'number' ? body.wordCount : 0,
      summaryText: body.summaryText,
      nextGoal: typeof body.nextGoal === 'string' ? body.nextGoal : '',
    };
    savedRecaps = [item, ...savedRecaps.filter((r) => r.id !== item.id)].slice(0, 50);
    scheduleSaveStore();
    res.json({ ok: true, recap: item, recaps: savedRecaps });
  });

  app.delete('/api/recaps/:id', (req, res) => {
    const targetId = req.params.id;
    savedRecaps = savedRecaps.filter((r) => r.id !== targetId);
    scheduleSaveStore();
    res.json({ ok: true, recaps: savedRecaps });
  });

  // Windows Portable EXE download endpoint
  app.get('/api/download/windows-exe', (_req, res) => {
    const candidates = [
      path.join(__dirname, 'packaging', 'windows', 'dist', 'StoryBridge-Studio-Debug.exe'),
      path.join(__dirname, 'packaging', 'windows', 'dist', 'StoryBridge-Studio-Portable.exe'),
      path.join(__dirname, 'packaging', 'windows', 'dist', 'StoryBridge-Studio-Setup.exe'),
      path.join(__dirname, 'StoryBridge-Studio-Debug.exe'),
    ];
    for (const exePath of candidates) {
      if (fs.existsSync(exePath)) {
        res.setHeader('Content-Disposition', 'attachment; filename="StoryBridge-Studio-Debug.exe"');
        res.setHeader('Content-Type', 'application/vnd.microsoft.portable-executable');
        res.sendFile(exePath);
        return;
      }
    }
    res.status(404).json({
      error: 'StoryBridge-Studio-Debug.exe en cours de compilation ou introuvable.',
      hint: 'Exécutez "npm run pack:debug" dans packaging/windows ou le workflow GitHub Actions.',
    });
  });

  // Android APK download endpoint
  app.get('/api/download/android-apk', (_req, res) => {
    const apkCandidates = [
      path.join(
        __dirname,
        'packaging',
        'android',
        'android',
        'app',
        'build',
        'outputs',
        'apk',
        'debug',
        'app-debug.apk'
      ),
      path.join(__dirname, 'packaging', 'android', 'app-debug.apk'),
      path.join(__dirname, 'app-debug.apk'),
    ];
    for (const apkPath of apkCandidates) {
      if (fs.existsSync(apkPath)) {
        res.setHeader('Content-Disposition', 'attachment; filename="StoryBridge-Studio-Debug.apk"');
        res.setHeader('Content-Type', 'application/vnd.android.package-archive');
        res.sendFile(apkPath);
        return;
      }
    }
    res.status(404).json({
      error: 'app-debug.apk en cours de compilation ou introuvable.',
      hint: 'Exécutez le workflow GitHub Actions ou compilez dans packaging/android.',
    });
  });

  // Packaging status endpoint
  app.get('/api/download/status', (_req, res) => {
    const exeCandidates = [
      path.join(__dirname, 'packaging', 'windows', 'dist', 'StoryBridge-Studio-Debug.exe'),
      path.join(__dirname, 'packaging', 'windows', 'dist', 'StoryBridge-Studio-Portable.exe'),
      path.join(__dirname, 'packaging', 'windows', 'dist', 'StoryBridge-Studio-Setup.exe'),
      path.join(__dirname, 'StoryBridge-Studio-Debug.exe'),
    ];
    let exeFile: string | null = null;
    let exeSize = 0;
    for (const p of exeCandidates) {
      if (fs.existsSync(p)) {
        exeFile = path.basename(p);
        exeSize = fs.statSync(p).size;
        break;
      }
    }

    const apkCandidates = [
      path.join(
        __dirname,
        'packaging',
        'android',
        'android',
        'app',
        'build',
        'outputs',
        'apk',
        'debug',
        'app-debug.apk'
      ),
      path.join(__dirname, 'packaging', 'android', 'app-debug.apk'),
      path.join(__dirname, 'app-debug.apk'),
    ];
    let apkFile: string | null = null;
    let apkSize = 0;
    for (const p of apkCandidates) {
      if (fs.existsSync(p)) {
        apkFile = path.basename(p);
        apkSize = fs.statSync(p).size;
        break;
      }
    }

    res.json({
      windowsExe: {
        available: !!exeFile,
        filename: exeFile || 'StoryBridge-Studio-Debug.exe',
        sizeBytes: exeSize,
        downloadUrl: '/api/download/windows-exe',
      },
      androidApk: {
        available: !!apkFile,
        filename: apkFile || 'app-debug.apk',
        sizeBytes: apkSize,
        downloadUrl: '/api/download/android-apk',
      },
    });
  });

  const server = http.createServer(app);
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws, req) => {
    const reqUrl = new URL(req.url || '/ws', `http://${req.headers.host || 'localhost:3000'}`);
    const roomCode = (reqUrl.searchParams.get('room') || 'DEMO').trim().toUpperCase().slice(0, 12);
    const roleParam = reqUrl.searchParams.get('role') === 'tutor' ? 'tutor' : 'student';
    const nameParam = (reqUrl.searchParams.get('name') || (roleParam === 'tutor' ? 'Prof' : 'Élève')).slice(0, 32);
    const clientId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

    const state = getOrCreateRoom(roomCode);
    let clients = roomClients.get(roomCode);
    if (!clients) {
      clients = new Map();
      roomClients.set(roomCode, clients);
    }

    const clientMeta: ClientMeta = {
      id: clientId,
      roomCode,
      name: nameParam,
      role: roleParam,
      ws,
    };
    clients.set(clientId, clientMeta);

    ws.send(
      JSON.stringify({
        type: 'room:init',
        clientId,
        state,
        participants: getParticipants(roomCode),
      })
    );

    broadcastToRoom(
      roomCode,
      {
        type: 'presence:update',
        participants: getParticipants(roomCode),
      },
      clientId
    );

    ws.on('message', (raw) => {
      let msg: Record<string, unknown>;
      try {
        msg = JSON.parse(raw.toString()) as Record<string, unknown>;
      } catch {
        return;
      }

      const currentState = getOrCreateRoom(roomCode);
      const msgType = typeof msg.type === 'string' ? msg.type : '';

      if (msgType === 'ping') {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'pong' }));
        }
        return;
      }

      if (msgType === 'state:patch' && msg.patch && typeof msg.patch === 'object') {
        const patch = msg.patch as Partial<RoomState>;
        if (patch.activeTab) currentState.activeTab = patch.activeTab;
        if (typeof patch.stars === 'number') currentState.stars = Math.max(0, Math.min(999, patch.stars));
        if (typeof patch.sessionBaseStars === 'number') {
          currentState.sessionBaseStars = Math.max(0, Math.min(999, patch.sessionBaseStars));
        }
        if (Array.isArray(patch.completedModules)) {
          currentState.completedModules = patch.completedModules;
        }
        if (typeof patch.boardNote === 'string') currentState.boardNote = patch.boardNote;
        if (patch.warmup) currentState.warmup = { ...currentState.warmup, ...patch.warmup };
        if (patch.vocab) currentState.vocab = { ...currentState.vocab, ...patch.vocab };
        if (patch.builder) currentState.builder = { ...currentState.builder, ...patch.builder };
        if (patch.roleplay) currentState.roleplay = { ...currentState.roleplay, ...patch.roleplay };
        if (patch.quiz) currentState.quiz = { ...currentState.quiz, ...patch.quiz };
        if (patch.games) currentState.games = { ...currentState.games, ...patch.games };
        if (patch.timeModule) currentState.timeModule = { ...currentState.timeModule, ...patch.timeModule };
        if (patch.guide) currentState.guide = { ...currentState.guide, ...patch.guide };
        if (patch.recap) currentState.recap = { ...currentState.recap, ...patch.recap };
        if (patch.writingSpace) {
          currentState.writingSpace = {
            ...currentState.writingSpace,
            ...patch.writingSpace,
          };
        }
        scheduleSaveStore();

        broadcastToRoom(
          roomCode,
          {
            type: 'state:patched',
            patch,
            senderId: clientId,
          },
          clientId
        );
      } else if (msgType === 'role:update' && (msg.role === 'tutor' || msg.role === 'student')) {
        clientMeta.role = msg.role;
        if (typeof msg.name === 'string' && msg.name.trim()) {
          clientMeta.name = msg.name.trim().slice(0, 32);
        }
        broadcastToRoom(roomCode, {
          type: 'presence:update',
          participants: getParticipants(roomCode),
        });
      } else if (msgType === 'wordbank:add' && msg.item && typeof msg.item === 'object') {
        const item = msg.item as WordbankItem;
        if (!item.id || currentState.wordbank.some((w) => w.id === item.id)) return;
        currentState.wordbank = [item, ...currentState.wordbank].slice(0, 100);
        scheduleSaveStore();
        broadcastToRoom(roomCode, { type: 'wordbank:added', item }, clientId);
      } else if (msgType === 'wordbank:remove' && typeof msg.id === 'string') {
        currentState.wordbank = currentState.wordbank.filter((w) => w.id !== msg.id);
        scheduleSaveStore();
        broadcastToRoom(roomCode, { type: 'wordbank:removed', id: msg.id }, clientId);
      } else if (msgType === 'stroke:add' && msg.stroke && typeof msg.stroke === 'object') {
        const stroke = msg.stroke as BoardStroke;
        if (!stroke.id || currentState.strokes.some((s) => s.id === stroke.id)) return;
        currentState.strokes = [...currentState.strokes, stroke].slice(-250);
        scheduleSaveStore();
        broadcastToRoom(roomCode, { type: 'stroke:added', stroke }, clientId);
      } else if (msgType === 'stroke:undo' && typeof msg.id === 'string') {
        currentState.strokes = currentState.strokes.filter((s) => s.id !== msg.id);
        scheduleSaveStore();
        broadcastToRoom(roomCode, { type: 'stroke:removed', id: msg.id }, clientId);
      } else if (msgType === 'stroke:clear') {
        currentState.strokes = [];
        scheduleSaveStore();
        broadcastToRoom(roomCode, { type: 'stroke:cleared' }, clientId);
      } else if (
        msgType === 'writing:stroke:add' &&
        (msg.owner === 'tutor' || msg.owner === 'student') &&
        msg.stroke &&
        typeof msg.stroke === 'object'
      ) {
        const stroke = msg.stroke as BoardStroke;
        const owner = msg.owner;
        const target =
          owner === 'tutor'
            ? currentState.writingSpace.tutorStrokes
            : currentState.writingSpace.studentStrokes;
        if (!stroke.id || target.some((s) => s.id === stroke.id)) return;
        const updated = [...target, stroke].slice(-250);
        if (owner === 'tutor') {
          currentState.writingSpace.tutorStrokes = updated;
        } else {
          currentState.writingSpace.studentStrokes = updated;
        }
        scheduleSaveStore();
        broadcastToRoom(
          roomCode,
          { type: 'writing:stroke:added', owner, stroke },
          clientId
        );
      } else if (
        msgType === 'writing:stroke:undo' &&
        (msg.owner === 'tutor' || msg.owner === 'student') &&
        typeof msg.id === 'string'
      ) {
        const owner = msg.owner;
        if (owner === 'tutor') {
          currentState.writingSpace.tutorStrokes =
            currentState.writingSpace.tutorStrokes.filter((s) => s.id !== msg.id);
        } else {
          currentState.writingSpace.studentStrokes =
            currentState.writingSpace.studentStrokes.filter((s) => s.id !== msg.id);
        }
        scheduleSaveStore();
        broadcastToRoom(
          roomCode,
          { type: 'writing:stroke:removed', owner, id: msg.id },
          clientId
        );
      } else if (
        msgType === 'writing:stroke:clear' &&
        (msg.owner === 'tutor' || msg.owner === 'student')
      ) {
        const owner = msg.owner;
        if (owner === 'tutor') {
          currentState.writingSpace.tutorStrokes = [];
        } else {
          currentState.writingSpace.studentStrokes = [];
        }
        scheduleSaveStore();
        broadcastToRoom(
          roomCode,
          { type: 'writing:stroke:cleared', owner },
          clientId
        );
      } else if (msgType === 'celebrate:star') {
        currentState.stars = Math.min(999, currentState.stars + 1);
        scheduleSaveStore();
        broadcastToRoom(roomCode, {
          type: 'star:celebrated',
          stars: currentState.stars,
          by: clientMeta.name,
        });
      } else if (
        msgType === 'rtc:offer' ||
        msgType === 'rtc:answer' ||
        msgType === 'rtc:ice' ||
        msgType === 'rtc:camera-off' ||
        msgType === 'rtc:request-offer'
      ) {
        broadcastToRoom(
          roomCode,
          {
            type: msgType,
            fromId: clientId,
            fromRole: clientMeta.role,
            payload: msg.payload ?? null,
          },
          clientId
        );
      }
    });

    ws.on('close', () => {
      const activeClients = roomClients.get(roomCode);
      if (activeClients) {
        activeClients.delete(clientId);
        if (activeClients.size === 0) {
          roomClients.delete(roomCode);
        } else {
          broadcastToRoom(roomCode, {
            type: 'presence:update',
            participants: getParticipants(roomCode),
          });
        }
      }
    });
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);

    // Explicit fallback for client-side routing on any unhandled GET request
    app.use('*', async (req, res, next) => {
      if (req.method !== 'GET') {
        return next();
      }
      try {
        const indexHtmlPath = path.resolve(__dirname, 'index.html');
        if (fs.existsSync(indexHtmlPath)) {
          let template = fs.readFileSync(indexHtmlPath, 'utf-8');
          template = await vite.transformIndexHtml(req.originalUrl, template);
          res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
          return;
        }
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        return next(e);
      }
      next();
    });
  } else {
    const distDir = path.join(__dirname, 'dist');
    const distIndex = path.join(distDir, 'index.html');
    if (fs.existsSync(distDir)) {
      app.use(express.static(distDir));
    }
    app.get('*', (_req, res) => {
      if (fs.existsSync(distIndex)) {
        res.sendFile(distIndex);
      } else {
        res.status(200).send(
          '<!doctype html><html><body style="font-family:sans-serif;padding:32px;text-align:center;">' +
            '<h2>StoryBridge Studio</h2>' +
            '<p>Build de production introuvable. Exécutez <code>npm run build</code>.</p>' +
            '</body></html>'
        );
      }
    });
  }

  // In development container with Nginx (AI Studio Dev environment), Nginx listens on 8080 and proxies to port 3000.
  // In production container (Cloud Run deployment / Shared App), Cloud Run directly routes to process.env.PORT (8080).
  const isDevContainer = !!process.env.CONTROL_PLANE_PORT || !!process.env.DEFAULT_APP_PORT;
  const port = isDevContainer
    ? Number(process.env.DEFAULT_APP_PORT || 3000)
    : Number(process.env.PORT || 3000);

  server.listen(port, '0.0.0.0', () => {
    console.log(`StoryBridge Studio listening on http://localhost:${port} (mode: ${process.env.NODE_ENV || 'development'}, container: ${isDevContainer ? 'dev' : 'production'})`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
