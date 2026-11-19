import { useEffect, useRef, useState } from 'react';
import {
  Star,
  Plus,
  UserPlus,
  Keyboard,
  PenLine,
  Maximize2,
  Minimize2,
  X,
  Download,
  Lock,
  Unlock,
  Volume2,
  VolumeX,
  Eye,
} from 'lucide-react';
import { useRoomSync } from './hooks/useRoomSync';
import { useFullscreen } from './hooks/useFullscreen';
import { useTheme } from './hooks/useTheme';
import {
  getSavedAccent,
  initVoiceModules,
  saveAccent,
  unlockAudioPlayback,
} from './utils/speech';
import type { LessonMilestoneId, ModuleTab, VoiceAccent } from './types/lesson';
import { WarmupModule } from './components/WarmupModule';
import { VocabModule } from './components/VocabModule';
import { BuilderModule } from './components/BuilderModule';
import { RoleplayModule } from './components/RoleplayModule';
import { BoardModule } from './components/BoardModule';
import { SessionModal } from './components/SessionModal';
import { SpeechSpeedControl } from './components/SpeechSpeedControl';
import { BrunoMarsQuiz } from './components/BrunoMarsQuiz';
import { GrammarGuideModule } from './components/GrammarGuideModule';
import { TensesModule } from './components/TensesModule';
import { StudentVideoSlot } from './components/StudentVideoSlot';
import { SessionRecapModule } from './components/SessionRecapModule';
import { MiniGamesHub } from './components/MiniGamesHub';
import { TimeModule } from './components/TimeModule';
import { AppDownloadModal } from './components/AppDownloadModal';
import {
  LessonProgressWidget,
  TopProgressStrip,
} from './components/LessonProgressBar';
import { OnScreenKeyboard } from './components/OnScreenKeyboard';
import { StudentSelector } from './components/StudentSelector';
import { WritingSpaceModule } from './components/WritingSpaceModule';
import { ThemeSelector } from './components/ThemeSelector';

const NAV_ITEMS: Array<{ id: ModuleTab; label: string }> = [
  { id: 'warmup', label: 'Rituel' },
  { id: 'vocab', label: 'Vocabulaire' },
  { id: 'builder', label: 'Grammaire' },
  { id: 'roleplay', label: 'Jeux & Quiz' },
  { id: 'board', label: 'Bilan & Tableau' },
];

export default function App() {
  const {
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
  } = useRoomSync();

  const [accent, setAccent] = useState<VoiceAccent>(() => getSavedAccent());
  const [speechRate, setSpeechRate] = useState<number>(() => {
    if (typeof window === 'undefined') return 1;
    const saved = window.localStorage.getItem('storybridge_speech_rate');
    const parsed = saved ? parseFloat(saved) : 1;
    return Number.isFinite(parsed) && parsed >= 0.5 && parsed <= 1.4 ? parsed : 1;
  });
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [isWritingDrawerOpen, setIsWritingDrawerOpen] = useState(false);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const {
    isFullscreen,
    isImmersiveFallback,
    fullscreenNotice,
    dismissNotice,
    toggleFullscreen,
  } = useFullscreen();
  const { theme, setTheme } = useTheme();
  const mainRef = useRef<HTMLElement | null>(null);

  const isMirrorLocked = role === 'student' && state.controlMode === 'tutor-only';

  useEffect(() => {
    initVoiceModules();
  }, []);

  useEffect(() => {
    const handleFirstGesture = () => {
      unlockAudioPlayback();
    };
    document.addEventListener('pointerdown', handleFirstGesture, { once: true, passive: true });
    document.addEventListener('keydown', handleFirstGesture, { once: true, passive: true });
    return () => {
      document.removeEventListener('pointerdown', handleFirstGesture);
      document.removeEventListener('keydown', handleFirstGesture);
    };
  }, []);

  useEffect(() => {
    if (mainRef.current) {
      (mainRef.current as HTMLElement & { inert: boolean }).inert = isMirrorLocked;
    }
    if (isMirrorLocked) {
      setIsKeyboardOpen(false);
    }
  }, [isMirrorLocked]);

  const handleChangeAccent = (nextAccent: VoiceAccent) => {
    setAccent(nextAccent);
    saveAccent(nextAccent);
  };

  const handleChangeSpeechRate = (nextRate: number) => {
    const clamped = Math.max(0.5, Math.min(1.4, Math.round(nextRate * 20) / 20));
    setSpeechRate(clamped);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('storybridge_speech_rate', String(clamped));
    }
  };

  const showStarPulse = Date.now() - lastCelebrationAt < 2500;

  const handleQuickInvite = () => {
    if (!roomCode) {
      const randomSuffix = Math.floor(10 + Math.random() * 90);
      joinRoom(`LNDN${randomSuffix}`);
    }
    setIsSessionModalOpen(true);
  };

  const handleSelectMilestone = (id: LessonMilestoneId) => {
    if (id === 'warmup') {
      patchState({ activeTab: 'warmup' });
    } else if (id === 'vocab') {
      patchState({ activeTab: 'vocab' });
    } else if (id === 'grammar') {
      patchState({ activeTab: 'builder', guide: { ...state.guide, subTab: state.guide.subTab || 'tenses' } });
    } else if (id === 'games') {
      patchState({ activeTab: 'roleplay', quiz: { ...state.quiz, subTab: 'games' } });
    } else if (id === 'time') {
      patchState({ activeTab: 'roleplay', quiz: { ...state.quiz, subTab: 'time' } });
    } else if (id === 'quiz') {
      patchState({ activeTab: 'roleplay', quiz: { ...state.quiz, subTab: 'quiz' } });
    }
  };

  const handleToggleMilestone = (id: LessonMilestoneId) => {
    const exists = state.completedModules.includes(id);
    const next = exists
      ? state.completedModules.filter((m) => m !== id)
      : [...state.completedModules, id];
    patchState({ completedModules: next });
  };

  return (
    <div
      className={`transition-colors duration-300 ${
        isImmersiveFallback
          ? 'fixed inset-0 z-40 overflow-y-auto sb-app-fallback flex flex-col'
          : 'min-h-[100dvh] flex flex-col sb-text-primary'
      }`}
    >
      {/* Top Bar Contract: strictly 1 row, 3 zones separated by gap-8 */}
      <header className="sb-header backdrop-blur-md sticky top-0 z-30 pt-[env(safe-area-inset-top)]">
        <div
          className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-8 transition-[height] duration-150 ${
            isFullscreen ? 'h-14' : 'h-16'
          }`}
        >
          {/* Zone 1: Single-element brand wordmark with minimalist geometric emblem */}
          <button
            type="button"
            disabled={isMirrorLocked}
            onClick={() => patchState({ activeTab: 'warmup' })}
            className={`inline-flex items-center gap-2.5 font-display text-lg font-bold tracking-wide sb-header-brand whitespace-nowrap shrink-0 group ${
              isMirrorLocked ? 'cursor-default' : 'cursor-pointer'
            }`}
          >
            <svg
              viewBox="0 0 28 28"
              className="w-6 h-6 shrink-0 drop-shadow-sm"
              aria-hidden="true"
            >
              <circle
                cx="14"
                cy="14"
                r="12"
                style={{ fill: 'var(--sb-emblem-fill)', stroke: 'var(--sb-emblem-ring)' }}
                strokeWidth="1.6"
              />
              <path
                d="M 2.5 14 A 11.5 11.5 0 0 1 25.5 14 Z"
                style={{ fill: 'var(--sb-emblem-top)' }}
              />
              <rect
                x="2"
                y="12.6"
                width="24"
                height="2.8"
                style={{ fill: 'var(--sb-emblem-ring)' }}
              />
              <circle
                cx="14"
                cy="14"
                r="4.2"
                style={{ fill: 'var(--sb-emblem-fill)', stroke: 'var(--sb-emblem-ring)' }}
                strokeWidth="1.6"
              />
              <circle cx="14" cy="14" r="1.7" style={{ fill: 'var(--sb-emblem-core)' }} />
            </svg>
            <span className="sb-header-brand-text transition-colors duration-300">
              StoryBridge Studio
            </span>
          </button>

          {/* Zone 2: 5 concise single-line text nav links */}
          <nav
            aria-label="Modules du cours"
            className={`hidden md:flex items-center gap-6 ${
              isMirrorLocked ? 'pointer-events-none opacity-75 select-none' : ''
            }`}
          >
            {NAV_ITEMS.map((item) => {
              const active = state.activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  disabled={isMirrorLocked}
                  onClick={() => patchState({ activeTab: item.id })}
                  className={`py-2 text-sm font-bold tracking-wide border-b-2 transition-colors duration-300 whitespace-nowrap shrink-0 cursor-pointer ${
                    active ? 'sb-header-nav-active' : 'sb-header-nav-idle'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: 1 primary action (tutor manages visio session settings; student sees status) */}
          <div className="shrink-0">
            {role === 'tutor' ? (
              <button
                type="button"
                onClick={() => setIsSessionModalOpen(true)}
                className="manga-btn-primary px-4 py-2 rounded-xl text-xs font-bold tracking-wide whitespace-nowrap shrink-0 cursor-pointer"
              >
                {roomCode ? `Salle ${roomCode}` : 'Session Visio'}
              </button>
            ) : (
              <div className="px-3.5 py-2 rounded-xl border sb-header-pill text-xs font-bold tracking-wide whitespace-nowrap shrink-0 transition-colors duration-300 inline-flex items-center gap-1.5">
                {isMirrorLocked && <Eye className="w-3.5 h-3.5" aria-hidden="true" />}
                <span>{roomCode ? `Salle ${roomCode}` : activeStudent.name}</span>
              </div>
            )}
          </div>
        </div>
        <TopProgressStrip
          completedModules={state.completedModules}
          stars={state.stars}
          sessionBaseStars={state.sessionBaseStars}
        />
      </header>

      {/* Mobile Navigation Strip (below header, compact) */}
      <div
        className={`md:hidden sb-toolbar overflow-x-auto ${
          isMirrorLocked ? 'pointer-events-none opacity-75 select-none' : ''
        }`}
      >
        <div className="flex items-center gap-2 px-4 py-2">
          {NAV_ITEMS.map((item) => {
            const active = state.activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                disabled={isMirrorLocked}
                onClick={() => patchState({ activeTab: item.id })}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold tracking-wide whitespace-nowrap shrink-0 cursor-pointer border transition-colors duration-300 ${
                  active ? 'sb-chip-solid border-b-2' : 'border-transparent sb-seg-idle'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Workspace Control Bar (Role, Voice Accent, Live Connection Telemetry, Stars) */}
      <div className="sb-toolbar backdrop-blur-sm relative z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            {/* Tutor / Student Segmented Control + Multi-Student Profile Switcher */}
            <StudentSelector
              role={role}
              isInvitedStudent={isInvitedStudent}
              studentProfiles={studentProfiles}
              activeStudent={activeStudent}
              onSwitchRole={switchRole}
              onSelectStudent={selectStudentProfile}
              onAddStudent={addStudentProfile}
              onRenameStudent={renameStudentProfile}
              onRemoveStudent={removeStudentProfile}
              onOpenInviteModal={handleQuickInvite}
            />

            {/* Audio Accent Modules (UK / US) & Speed Parameters */}
            <div
              className={`flex items-center gap-1 p-0.5 sb-seg-track border rounded-xl ${
                isMirrorLocked ? 'pointer-events-none opacity-65 select-none' : ''
              }`}
            >
              <button
                type="button"
                disabled={isMirrorLocked}
                onClick={() => handleChangeAccent('en-GB')}
                className={`px-2.5 py-1 text-xs font-bold tracking-wide rounded-lg transition-colors duration-300 whitespace-nowrap shrink-0 cursor-pointer ${
                  accent === 'en-GB' ? 'sb-seg-active' : 'sb-seg-idle'
                }`}
              >
                Audio UK
              </button>
              <button
                type="button"
                disabled={isMirrorLocked}
                onClick={() => handleChangeAccent('en-US')}
                className={`px-2.5 py-1 text-xs font-bold tracking-wide rounded-lg transition-colors duration-300 whitespace-nowrap shrink-0 cursor-pointer ${
                  accent === 'en-US' ? 'sb-seg-active' : 'sb-seg-idle'
                }`}
              >
                Audio US
              </button>
            </div>

            <SpeechSpeedControl
              speechRate={speechRate}
              accent={accent}
              onChangeRate={handleChangeSpeechRate}
              onChangeAccent={handleChangeAccent}
            />

            <button
              type="button"
              disabled={isMirrorLocked}
              onClick={() => setIsWritingDrawerOpen((v) => !v)}
              aria-pressed={isWritingDrawerOpen}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-xs font-bold tracking-wide transition-colors duration-300 whitespace-nowrap shrink-0 ${
                isMirrorLocked ? 'pointer-events-none opacity-60 cursor-default' : 'cursor-pointer'
              } ${isWritingDrawerOpen ? 'sb-chip-danger-solid' : 'sb-chip-idle'}`}
            >
              <PenLine
                className={`w-3.5 h-3.5 ${isWritingDrawerOpen ? 'text-white' : 'sb-text-accent'}`}
                aria-hidden="true"
              />
              <span>Cahier Prof / Élève</span>
            </button>

            <button
              type="button"
              disabled={isMirrorLocked}
              onClick={() => setIsKeyboardOpen((v) => !v)}
              aria-pressed={isKeyboardOpen}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-xs font-bold tracking-wide transition-colors duration-300 whitespace-nowrap shrink-0 ${
                isMirrorLocked ? 'pointer-events-none opacity-60 cursor-default' : 'cursor-pointer'
              } ${isKeyboardOpen ? 'sb-chip-solid' : 'sb-chip-idle'}`}
            >
              <Keyboard className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Clavier écran</span>
            </button>

            {role === 'tutor' && (
              <>
                <button
                  type="button"
                  onClick={() =>
                    setControlMode(state.controlMode === 'tutor-only' ? 'shared' : 'tutor-only')
                  }
                  aria-pressed={state.controlMode === 'tutor-only'}
                  title={
                    state.controlMode === 'tutor-only'
                      ? 'Mode Miroir activé : seul le professeur contrôle l’écran. Cliquer pour repasser en mode partagé.'
                      : 'Cliquer pour garder la main uniquement (l’élève verra l’écran en mode miroir lecture seule).'
                  }
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-xs font-bold tracking-wide transition-colors duration-300 whitespace-nowrap shrink-0 cursor-pointer ${
                    state.controlMode === 'tutor-only' ? 'sb-chip-danger-solid' : 'sb-chip-idle'
                  }`}
                >
                  {state.controlMode === 'tutor-only' ? (
                    <Lock className="w-3.5 h-3.5" aria-hidden="true" />
                  ) : (
                    <Unlock className="w-3.5 h-3.5 sb-text-accent" aria-hidden="true" />
                  )}
                  <span>
                    {state.controlMode === 'tutor-only' ? 'Main Prof seul (Miroir)' : 'Main partagée'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setAudioSync(!state.audioSync)}
                  aria-pressed={state.audioSync}
                  title={
                    state.audioSync
                      ? 'Son synchronisé actif : chaque mot anglais écouté par l’élève ou le professeur est diffusé en direct des deux côtés.'
                      : 'Son synchronisé coupé : chacun écoute uniquement sur son appareil.'
                  }
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-xs font-bold tracking-wide transition-colors duration-300 whitespace-nowrap shrink-0 cursor-pointer ${
                    state.audioSync ? 'sb-chip-solid' : 'sb-chip-idle'
                  }`}
                >
                  {state.audioSync ? (
                    <Volume2 className="w-3.5 h-3.5" aria-hidden="true" />
                  ) : (
                    <VolumeX className="w-3.5 h-3.5" aria-hidden="true" />
                  )}
                  <span>{state.audioSync ? 'Son synchro : ON' : 'Son synchro : OFF'}</span>
                </button>
              </>
            )}

            <button
              type="button"
              onClick={toggleFullscreen}
              aria-pressed={isFullscreen}
              aria-label={
                isFullscreen
                  ? 'Quitter le mode plein écran'
                  : 'Activer le mode plein écran'
              }
              title={
                isFullscreen
                  ? 'Quitter le plein écran (Échap)'
                  : 'Passer en plein écran pour masquer l’interface du navigateur'
              }
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[38px] md:min-h-[30px] md:py-1 rounded-xl border text-xs font-bold tracking-wide transition-colors duration-300 whitespace-nowrap shrink-0 cursor-pointer ${
                isFullscreen ? 'sb-chip-solid' : 'sb-chip-idle'
              }`}
            >
              {isFullscreen ? (
                <>
                  <Minimize2 className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Quitter plein écran</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Plein écran</span>
                </>
              )}
            </button>

            <ThemeSelector theme={theme} onSelectTheme={setTheme} />

            <button
              type="button"
              onClick={() => setIsDownloadModalOpen(true)}
              aria-label="Télécharger l'application portable Windows ou Android"
              title="Télécharger StoryBridge Studio Portable (.exe Windows / .apk Android)"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[38px] md:min-h-[30px] md:py-1 rounded-xl border text-xs font-bold tracking-wide transition-colors duration-300 whitespace-nowrap shrink-0 cursor-pointer sb-chip-idle hover:sb-chip-solid"
            >
              <Download className="w-3.5 h-3.5 sb-text-accent" aria-hidden="true" />
              <span>App Portable (.exe)</span>
            </button>

            {/* Real WebSocket connection state (only when room active) */}
            {roomCode && (
              <div className="inline-flex items-center gap-2 text-xs sb-text-secondary pl-1">
                {connected ? (
                  <>
                    <span
                      className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.75)]"
                      aria-hidden="true"
                    />
                    <span className="tabular-nums font-semibold">
                      En direct · {participants.length} connecté
                      {participants.length > 1 ? 's' : ''}
                    </span>
                    {role === 'student' && state.audioSync && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border sb-chip-active text-[11px] font-bold">
                        <Volume2 className="w-3 h-3 sb-text-accent" aria-hidden="true" />
                        Son synchro
                      </span>
                    )}
                  </>
                ) : (
                  <span className="sb-text-reward font-semibold">Connexion à la salle...</span>
                )}
              </div>
            )}
          </div>

          {/* Lesson Progress & Session Star Counter */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <div className={isMirrorLocked ? 'pointer-events-none opacity-75' : ''}>
              <LessonProgressWidget
                completedModules={state.completedModules}
                stars={state.stars}
                sessionBaseStars={state.sessionBaseStars}
                role={role}
                onSelectMilestone={handleSelectMilestone}
                onToggleMilestone={handleToggleMilestone}
                onResetProgress={resetLessonProgress}
              />
            </div>

            <div
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl border sb-reward-pill text-xs font-bold tracking-wide tabular-nums transition-transform ${
                showStarPulse ? 'scale-105 shadow-md' : ''
              }`}
            >
              <Star
                className="w-4 h-4 fill-current shrink-0"
                aria-hidden="true"
              />
              <span>
                {state.stars} étoile{state.stars > 1 ? 's' : ''}
              </span>
            </div>

            {role === 'tutor' && (
              <>
                <button
                  type="button"
                  onClick={awardStar}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl border border-b-2 sb-reward-btn text-xs font-bold tracking-wide whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" aria-hidden="true" />1 étoile
                </button>
                <button
                  type="button"
                  onClick={handleQuickInvite}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl border border-b-2 sb-status-success border-b-emerald-700 text-xs font-bold tracking-wide hover:opacity-90 transition-colors duration-300 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" aria-hidden="true" />
                  Inviter l’élève
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {isMirrorLocked && (
        <div className="sb-status-warn border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex flex-wrap items-center justify-between gap-2 text-xs font-bold">
            <div className="inline-flex items-center gap-2">
              <Eye className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>
                Mode Miroir Professeur actif — Vous suivez l’écran du professeur en direct sans pouvoir modifier les exercices.
              </span>
            </div>
            {state.audioSync && (
              <span className="inline-flex items-center gap-1 text-[11px] opacity-90">
                <Volume2 className="w-3.5 h-3.5" aria-hidden="true" />
                Écoute anglaise synchronisée en temps réel
              </span>
            )}
          </div>
        </div>
      )}

      {blockedRemoteAudio && (
        <div className="sb-status-warn border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex flex-wrap items-center justify-between gap-3 text-xs font-semibold">
            <div className="inline-flex items-center gap-2">
              <Volume2 className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>
                Son synchronisé en attente (« {blockedRemoteAudio.text} ») : votre navigateur demande un clic pour autoriser l’écoute en direct.
              </span>
            </div>
            <button
              type="button"
              onClick={replayBlockedRemoteAudio}
              className="px-3 py-1 rounded-lg manga-btn-primary text-xs font-bold cursor-pointer shrink-0"
            >
              Activer &amp; écouter en direct
            </button>
          </div>
        </div>
      )}

      {fullscreenNotice && (
        <div className="sb-status-warn border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center justify-between gap-3 text-xs font-semibold">
            <span>{fullscreenNotice}</span>
            <button
              type="button"
              onClick={dismissNotice}
              aria-label="Fermer l’information"
              className="p-1 rounded hover:opacity-80 shrink-0 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}

      {/* Main Content Stage */}
      <main
        ref={mainRef}
        aria-readonly={isMirrorLocked || undefined}
        className={`flex-1 w-full mx-auto px-4 sm:px-6 lg:px-8 space-y-6 transition-[padding] duration-150 ${
          isFullscreen ? 'max-w-[1440px] py-5' : 'max-w-7xl py-8'
        } ${isMirrorLocked ? 'pointer-events-none select-none' : ''}`}
      >
        {isWritingDrawerOpen &&
          !(state.activeTab === 'board' && state.recap.subTab === 'writing') && (
            <WritingSpaceModule
              writingSpace={state.writingSpace}
              role={role}
              studentName={activeStudent.name}
              accent={accent}
              speechRate={speechRate}
              compact
              onUpdateText={updateWritingText}
              onAddStroke={addWritingStroke}
              onUndoStroke={undoWritingStroke}
              onClearStrokes={clearWritingStrokes}
              onAwardStar={awardStar}
              onOpenFullView={() => {
                setIsWritingDrawerOpen(false);
                patchState({
                  activeTab: 'board',
                  recap: { ...state.recap, subTab: 'writing' },
                });
              }}
            />
          )}

        {state.activeTab === 'warmup' && (
          <WarmupModule
            warmup={state.warmup}
            role={role}
            accent={accent}
            speechRate={speechRate}
            onUpdate={(patch) => patchState({ warmup: { ...state.warmup, ...patch } })}
            onAwardStar={() => {
              awardStar();
              completeModule('warmup');
            }}
            onNavigateModule={(tab) => patchState({ activeTab: tab })}
          />
        )}

        {state.activeTab === 'vocab' && (
          <VocabModule
            vocab={state.vocab}
            accent={accent}
            speechRate={speechRate}
            wordbank={state.wordbank}
            onUpdate={(patch) => patchState({ vocab: { ...state.vocab, ...patch } })}
            onAddWord={addWord}
            onAwardStar={() => {
              awardStar();
              completeModule('vocab');
            }}
          />
        )}

        {state.activeTab === 'builder' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="inline-flex flex-wrap items-center gap-1 p-1 sb-surface border rounded-2xl">
                <button
                  type="button"
                  onClick={() =>
                    patchState({ guide: { ...state.guide, subTab: 'tenses' } })
                  }
                  className={`px-3.5 py-1.5 text-xs font-bold tracking-wide rounded-xl transition-colors duration-300 whitespace-nowrap shrink-0 cursor-pointer ${
                    state.guide.subTab === 'tenses' ? 'sb-seg-active' : 'sb-seg-idle'
                  }`}
                >
                  Formation des Temps
                </button>
                <button
                  type="button"
                  onClick={() =>
                    patchState({ guide: { ...state.guide, subTab: 'guide' } })
                  }
                  className={`px-3.5 py-1.5 text-xs font-bold tracking-wide rounded-xl transition-colors duration-300 whitespace-nowrap shrink-0 cursor-pointer ${
                    state.guide.subTab === 'guide' ? 'sb-seg-active' : 'sb-seg-idle'
                  }`}
                >
                  Guide de grammaire
                </button>
                <button
                  type="button"
                  onClick={() =>
                    patchState({ guide: { ...state.guide, subTab: 'builder' } })
                  }
                  className={`px-3.5 py-1.5 text-xs font-bold tracking-wide rounded-xl transition-colors duration-300 whitespace-nowrap shrink-0 cursor-pointer ${
                    state.guide.subTab === 'builder' ? 'sb-seg-active' : 'sb-seg-idle'
                  }`}
                >
                  Atelier Phrases
                </button>
              </div>
            </div>

            {state.guide.subTab === 'tenses' ? (
              <TensesModule
                accent={accent}
                speechRate={speechRate}
                wordbank={state.wordbank}
                activeCategory={state.guide.tensesCategory}
                onAddWord={addWord}
                onAwardStar={() => {
                  awardStar();
                  completeModule('grammar');
                }}
                onChangeCategory={(tensesCategory) =>
                  patchState({ guide: { ...state.guide, tensesCategory } })
                }
              />
            ) : state.guide.subTab === 'guide' ? (
              <GrammarGuideModule
                section={state.guide.section}
                hideIrregularForms={state.guide.hideIrregularForms}
                accent={accent}
                speechRate={speechRate}
                wordbank={state.wordbank}
                onChangeSection={(section) =>
                  patchState({ guide: { ...state.guide, section } })
                }
                onToggleHideIrregular={() =>
                  patchState({
                    guide: {
                      ...state.guide,
                      hideIrregularForms: !state.guide.hideIrregularForms,
                    },
                  })
                }
                onAddWord={addWord}
                onOpenTensesModule={(tensesCategory) =>
                  patchState({
                    guide: {
                      ...state.guide,
                      subTab: 'tenses',
                      ...(tensesCategory ? { tensesCategory } : {}),
                    },
                  })
                }
              />
            ) : (
              <BuilderModule
                builder={state.builder}
                role={role}
                accent={accent}
                speechRate={speechRate}
                onUpdate={(patch) =>
                  patchState({ builder: { ...state.builder, ...patch } })
                }
                onAwardStar={() => {
                  awardStar();
                  completeModule('grammar');
                }}
              />
            )}
          </div>
        )}

        {state.activeTab === 'roleplay' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="inline-flex flex-wrap items-center gap-1 p-1 sb-surface border rounded-2xl">
                <button
                  type="button"
                  onClick={() =>
                    patchState({ quiz: { ...state.quiz, subTab: 'games' } })
                  }
                  className={`px-3.5 py-1.5 text-xs font-bold tracking-wide rounded-xl transition-colors duration-300 whitespace-nowrap shrink-0 cursor-pointer ${
                    state.quiz.subTab === 'games' ? 'sb-seg-active' : 'sb-seg-idle'
                  }`}
                >
                  Mini-Jeux
                </button>
                <button
                  type="button"
                  onClick={() =>
                    patchState({ quiz: { ...state.quiz, subTab: 'time' } })
                  }
                  className={`px-3.5 py-1.5 text-xs font-bold tracking-wide rounded-xl transition-colors duration-300 whitespace-nowrap shrink-0 cursor-pointer ${
                    state.quiz.subTab === 'time' ? 'sb-seg-active' : 'sb-seg-idle'
                  }`}
                >
                  L’heure
                </button>
                <button
                  type="button"
                  onClick={() =>
                    patchState({ quiz: { ...state.quiz, subTab: 'quiz' } })
                  }
                  className={`px-3.5 py-1.5 text-xs font-bold tracking-wide rounded-xl transition-colors duration-300 whitespace-nowrap shrink-0 cursor-pointer ${
                    state.quiz.subTab === 'quiz' ? 'sb-seg-active' : 'sb-seg-idle'
                  }`}
                >
                  Quiz Bruno Mars
                </button>
                <button
                  type="button"
                  onClick={() =>
                    patchState({ quiz: { ...state.quiz, subTab: 'dialogue' } })
                  }
                  className={`px-3.5 py-1.5 text-xs font-bold tracking-wide rounded-xl transition-colors duration-300 whitespace-nowrap shrink-0 cursor-pointer ${
                    state.quiz.subTab === 'dialogue' ? 'sb-seg-active' : 'sb-seg-idle'
                  }`}
                >
                  Jeux de rôle
                </button>
              </div>
            </div>

            {state.quiz.subTab === 'games' && (
              <MiniGamesHub
                games={state.games}
                wordbank={state.wordbank}
                accent={accent}
                speechRate={speechRate}
                onUpdate={(patch) =>
                  patchState({ games: { ...state.games, ...patch } })
                }
                onAwardStar={() => {
                  awardStar();
                  completeModule('games');
                }}
              />
            )}

            {state.quiz.subTab === 'time' && (
              <TimeModule
                timeModule={state.timeModule}
                accent={accent}
                speechRate={speechRate}
                onUpdate={(patch) =>
                  patchState({ timeModule: { ...state.timeModule, ...patch } })
                }
                onAwardStar={() => {
                  awardStar();
                  completeModule('time');
                }}
              />
            )}

            {state.quiz.subTab === 'quiz' && (
              <BrunoMarsQuiz
                quiz={state.quiz}
                accent={accent}
                speechRate={speechRate}
                onUpdate={(patch) =>
                  patchState({ quiz: { ...state.quiz, ...patch } })
                }
                onAwardStar={() => {
                  awardStar();
                  completeModule('quiz');
                }}
              />
            )}

            {state.quiz.subTab === 'dialogue' && (
              <RoleplayModule
                roleplay={state.roleplay}
                role={role}
                accent={accent}
                speechRate={speechRate}
                onUpdate={(patch) =>
                  patchState({ roleplay: { ...state.roleplay, ...patch } })
                }
                onAwardStar={() => {
                  awardStar();
                  completeModule('quiz');
                }}
              />
            )}
          </div>
        )}

        {state.activeTab === 'board' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="inline-flex flex-wrap items-center gap-1 p-1 sb-surface border rounded-2xl">
                <button
                  type="button"
                  onClick={() =>
                    patchState({ recap: { ...state.recap, subTab: 'writing' } })
                  }
                  className={`px-3.5 py-1.5 text-xs font-bold tracking-wide rounded-xl transition-colors duration-300 whitespace-nowrap shrink-0 cursor-pointer ${
                    state.recap.subTab === 'writing' ? 'sb-seg-active' : 'sb-seg-idle'
                  }`}
                >
                  Cahier Prof &amp; Élève
                </button>
                <button
                  type="button"
                  onClick={() =>
                    patchState({ recap: { ...state.recap, subTab: 'board' } })
                  }
                  className={`px-3.5 py-1.5 text-xs font-bold tracking-wide rounded-xl transition-colors duration-300 whitespace-nowrap shrink-0 cursor-pointer ${
                    state.recap.subTab === 'board' ||
                    (role === 'student' && state.recap.subTab === 'recap')
                      ? 'sb-seg-active'
                      : 'sb-seg-idle'
                  }`}
                >
                  Tableau &amp; Carnet
                </button>
                {role === 'tutor' && (
                  <button
                    type="button"
                    onClick={() =>
                      patchState({ recap: { ...state.recap, subTab: 'recap' } })
                    }
                    className={`px-3.5 py-1.5 text-xs font-bold tracking-wide rounded-xl transition-colors duration-300 whitespace-nowrap shrink-0 cursor-pointer ${
                      state.recap.subTab === 'recap' ? 'sb-seg-active' : 'sb-seg-idle'
                    }`}
                  >
                    Récapitulatif Prof (Oral &amp; Écrit)
                  </button>
                )}
              </div>
            </div>

            {state.recap.subTab === 'writing' ? (
              <WritingSpaceModule
                writingSpace={state.writingSpace}
                role={role}
                studentName={activeStudent.name}
                accent={accent}
                speechRate={speechRate}
                onUpdateText={updateWritingText}
                onAddStroke={addWritingStroke}
                onUndoStroke={undoWritingStroke}
                onClearStrokes={clearWritingStrokes}
                onAwardStar={awardStar}
              />
            ) : role === 'tutor' && state.recap.subTab === 'recap' ? (
              <SessionRecapModule
                roomState={state}
                recap={state.recap}
                accent={accent}
                speechRate={speechRate}
                onUpdateRecap={(patch) =>
                  patchState({ recap: { ...state.recap, ...patch } })
                }
              />
            ) : (
              <BoardModule
                strokes={state.strokes}
                boardNote={state.boardNote}
                wordbank={state.wordbank}
                stars={state.stars}
                role={role}
                accent={accent}
                speechRate={speechRate}
                onAddStroke={addStroke}
                onUndoStroke={undoLastStroke}
                onClearStrokes={clearStrokes}
                onUpdateNote={(boardNote) => patchState({ boardNote })}
                onAddWord={addWord}
                onRemoveWord={removeWord}
              />
            )}
          </div>
        )}
      </main>

      {!isFullscreen && (
        <footer className="sb-footer">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-wrap items-center justify-between gap-4 text-xs sb-text-muted">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setIsDownloadModalOpen(true)}
                className="inline-flex items-center gap-1.5 sb-text-accent hover:underline font-bold tracking-wide cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Télécharger la version portable (.exe & .apk)</span>
              </button>
              {role === 'tutor' && (
                <button
                  type="button"
                  onClick={() =>
                    patchState({
                      activeTab: 'board',
                      recap: { ...state.recap, subTab: 'recap' },
                    })
                  }
                  className="sb-text-accent hover:underline font-bold tracking-wide cursor-pointer"
                >
                  Ouvrir le récapitulatif Prof
                </button>
              )}
            </div>
          </div>
        </footer>
      )}

      <AppDownloadModal
        isOpen={isDownloadModalOpen}
        onClose={() => setIsDownloadModalOpen(false)}
      />

      {role === 'tutor' && (
        <SessionModal
          isOpen={isSessionModalOpen}
          onClose={() => setIsSessionModalOpen(false)}
          roomCode={roomCode}
          connected={connected}
          controlMode={state.controlMode}
          audioSync={state.audioSync}
          onChangeControlMode={setControlMode}
          onChangeAudioSync={setAudioSync}
          participants={participants}
          studentProfiles={studentProfiles}
          activeStudent={activeStudent}
          onAddStudentProfile={addStudentProfile}
          onJoinRoom={joinRoom}
          onLeaveRoom={leaveRoom}
        />
      )}

      {remoteAudioNotice && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-[max(4.5rem,env(safe-area-inset-bottom))] left-[max(1rem,env(safe-area-inset-left))] z-40 max-w-sm manga-panel-sm px-3.5 py-2.5 flex items-center gap-2.5 shadow-xl"
        >
          <span className="p-1.5 rounded-lg sb-chip-solid shrink-0">
            <Volume2 className="w-3.5 h-3.5" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1 text-xs">
            <div className="font-bold sb-text-primary truncate">
              {remoteAudioNotice.fromRole === 'tutor' ? 'Professeur' : remoteAudioNotice.by}{' '}
              écoute ({remoteAudioNotice.accent === 'en-GB' ? 'UK' : 'US'})
            </div>
            <div className="sb-text-accent font-semibold truncate">
              « {remoteAudioNotice.text} »
            </div>
          </div>
          <button
            type="button"
            onClick={dismissRemoteAudioNotice}
            aria-label="Fermer la notification audio"
            className="p-1 rounded sb-text-muted hover:sb-text-primary shrink-0 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>
      )}

      <StudentVideoSlot
        roomCode={roomCode}
        connected={connected}
        selfId={selfId}
        participants={participants}
        role={role}
        studentName={activeStudent.name}
        studentCount={participants.filter((p) => p.role === 'student').length || 1}
        sendRtcSignal={sendRtcSignal}
        subscribeRtcSignal={subscribeRtcSignal}
      />

      {isFullscreen && !isKeyboardOpen && (
        <button
          type="button"
          onClick={toggleFullscreen}
          aria-label="Quitter le mode plein écran"
          title="Quitter le mode plein écran (Échap)"
          className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] left-[max(1rem,env(safe-area-inset-left))] z-40 inline-flex items-center gap-1.5 px-3 py-2 min-h-[40px] rounded-xl border border-b-4 sb-card-option text-xs font-bold tracking-wide shadow-lg whitespace-nowrap cursor-pointer"
        >
          <Minimize2 className="w-3.5 h-3.5 sb-text-accent" aria-hidden="true" />
          <span>Quitter plein écran</span>
        </button>
      )}

      <OnScreenKeyboard
        isOpen={isKeyboardOpen}
        onClose={() => setIsKeyboardOpen(false)}
      />
    </div>
  );
}
