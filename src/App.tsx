import { useState } from 'react';
import {
  Star,
  Plus,
  UserPlus,
  Keyboard,
  PenLine,
  Maximize2,
  Minimize2,
  X,
} from 'lucide-react';
import { useRoomSync } from './hooks/useRoomSync';
import { useFullscreen } from './hooks/useFullscreen';
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
import { StudentVideoSlot } from './components/StudentVideoSlot';
import { SessionRecapModule } from './components/SessionRecapModule';
import { MiniGamesHub } from './components/MiniGamesHub';
import { TimeModule } from './components/TimeModule';
import {
  LessonProgressWidget,
  TopProgressStrip,
} from './components/LessonProgressBar';
import { OnScreenKeyboard } from './components/OnScreenKeyboard';
import { StudentSelector } from './components/StudentSelector';
import { WritingSpaceModule } from './components/WritingSpaceModule';

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
  } = useRoomSync();

  const [accent, setAccent] = useState<VoiceAccent>('en-GB');
  const [speechRate, setSpeechRate] = useState<number>(() => {
    if (typeof window === 'undefined') return 1;
    const saved = window.localStorage.getItem('storybridge_speech_rate');
    const parsed = saved ? parseFloat(saved) : 1;
    return Number.isFinite(parsed) && parsed >= 0.5 && parsed <= 1.4 ? parsed : 1;
  });
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [isWritingDrawerOpen, setIsWritingDrawerOpen] = useState(false);
  const {
    isFullscreen,
    isImmersiveFallback,
    fullscreenNotice,
    dismissNotice,
    toggleFullscreen,
  } = useFullscreen();

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
      patchState({ activeTab: 'builder', guide: { ...state.guide, subTab: 'builder' } });
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
      className={
        isImmersiveFallback
          ? 'fixed inset-0 z-40 overflow-y-auto bg-[#faf9f6] bg-[radial-gradient(rgba(15,23,42,0.06)_1px,transparent_1px)] [background-size:18px_18px] flex flex-col text-slate-900'
          : 'min-h-[100dvh] flex flex-col text-slate-900'
      }
    >
      {/* Top Bar Contract: strictly 1 row, 3 zones separated by gap-8 */}
      <header className="bg-white border-b-2 border-slate-900 sticky top-0 z-30 pt-[env(safe-area-inset-top)]">
        <div
          className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-8 transition-[height] duration-150 ${
            isFullscreen ? 'h-14' : 'h-16'
          }`}
        >
          {/* Zone 1: Single-element brand wordmark */}
          <button
            type="button"
            onClick={() => patchState({ activeTab: 'warmup' })}
            className="font-display text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 cursor-pointer"
          >
            StoryBridge Studio
          </button>

          {/* Zone 2: 5 concise single-line text nav links */}
          <nav
            aria-label="Modules du cours"
            className="hidden md:flex items-center gap-6"
          >
            {NAV_ITEMS.map((item) => {
              const active = state.activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => patchState({ activeTab: item.id })}
                  className={`py-2 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    active
                      ? 'border-rose-600 text-rose-600'
                      : 'border-transparent text-slate-700 hover:text-slate-900 hover:border-slate-900'
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
                className="manga-btn-primary px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap shrink-0 cursor-pointer"
              >
                {roomCode ? `Salle ${roomCode}` : 'Session Visio'}
              </button>
            ) : (
              <div className="px-3.5 py-2 rounded-lg border-2 border-slate-900 bg-slate-50 text-xs font-bold text-slate-900 whitespace-nowrap shrink-0">
                {roomCode ? `Salle ${roomCode}` : activeStudent.name}
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
      <div className="md:hidden bg-white border-b-2 border-slate-900 overflow-x-auto">
        <div className="flex items-center gap-2 px-4 py-2">
          {NAV_ITEMS.map((item) => {
            const active = state.activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => patchState({ activeTab: item.id })}
                className={`px-3 py-1.5 rounded-md text-xs font-bold whitespace-nowrap shrink-0 cursor-pointer ${
                  active
                    ? 'bg-rose-600 text-white border border-slate-900'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Workspace Control Bar (Role, Voice Accent, Live Connection Telemetry, Stars) */}
      <div className="border-b-2 border-slate-900 bg-white/95">
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

            {/* Audio Accent & Speed Parameters (Tutor only) */}
            {role === 'tutor' && (
              <>
                <div className="flex items-center gap-1 p-0.5 bg-slate-200/70 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setAccent('en-GB')}
                    className={`px-2 py-1 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      accent === 'en-GB'
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Audio UK
                  </button>
                  <button
                    type="button"
                    onClick={() => setAccent('en-US')}
                    className={`px-2 py-1 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      accent === 'en-US'
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Audio US
                  </button>
                </div>

                <SpeechSpeedControl
                  speechRate={speechRate}
                  accent={accent}
                  onChangeRate={handleChangeSpeechRate}
                />
              </>
            )}

            <button
              type="button"
              onClick={() => setIsWritingDrawerOpen((v) => !v)}
              aria-pressed={isWritingDrawerOpen}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                isWritingDrawerOpen
                  ? 'bg-rose-600 border-slate-900 text-white'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <PenLine className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Cahier Prof / Élève</span>
            </button>

            <button
              type="button"
              onClick={() => setIsKeyboardOpen((v) => !v)}
              aria-pressed={isKeyboardOpen}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                isKeyboardOpen
                  ? 'bg-slate-900 border-slate-900 text-white'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Keyboard className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Clavier écran</span>
            </button>

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
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[38px] md:min-h-[30px] md:py-1 rounded-lg border text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                isFullscreen
                  ? 'bg-slate-900 border-slate-900 text-white'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
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

            {/* Real WebSocket connection state (only when room active) */}
            {roomCode && (
              <div className="inline-flex items-center gap-1.5 text-xs text-slate-600 pl-1">
                {connected ? (
                  <>
                    <span
                      className="w-2 h-2 rounded-full bg-emerald-500"
                      aria-hidden="true"
                    />
                    <span className="tabular-nums">
                      En direct · {participants.length} connecté
                      {participants.length > 1 ? 's' : ''}
                    </span>
                  </>
                ) : (
                  <span className="text-amber-700">Connexion à la salle...</span>
                )}
              </div>
            )}
          </div>

          {/* Lesson Progress & Session Star Counter */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <LessonProgressWidget
              completedModules={state.completedModules}
              stars={state.stars}
              sessionBaseStars={state.sessionBaseStars}
              role={role}
              onSelectMilestone={handleSelectMilestone}
              onToggleMilestone={handleToggleMilestone}
              onResetProgress={resetLessonProgress}
            />

            <div
              className={`inline-flex items-center gap-1.5 text-xs font-semibold tabular-nums transition-transform ${
                showStarPulse ? 'scale-105 text-amber-700' : 'text-slate-800'
              }`}
            >
              <Star
                className="w-4 h-4 text-amber-500 fill-amber-400"
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
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-amber-300 bg-amber-50 text-amber-900 text-xs font-semibold hover:bg-amber-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" aria-hidden="true" />1 étoile
                </button>
                <button
                  type="button"
                  onClick={handleQuickInvite}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-900 text-xs font-semibold hover:bg-emerald-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5 text-emerald-700" aria-hidden="true" />
                  Inviter l’élève
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {fullscreenNotice && (
        <div className="bg-amber-50 border-b border-amber-300 text-amber-950">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center justify-between gap-3 text-xs font-medium">
            <span>{fullscreenNotice}</span>
            <button
              type="button"
              onClick={dismissNotice}
              aria-label="Fermer l’information"
              className="p-1 rounded hover:bg-amber-100 text-amber-900 shrink-0 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}

      {/* Main Content Stage */}
      <main
        className={`flex-1 w-full mx-auto px-4 sm:px-6 lg:px-8 space-y-6 transition-[padding] duration-150 ${
          isFullscreen ? 'max-w-[1440px] py-5' : 'max-w-7xl py-8'
        }`}
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
              <div className="inline-flex items-center gap-1 p-1 bg-slate-200/70 rounded-lg">
                <button
                  type="button"
                  onClick={() =>
                    patchState({ guide: { ...state.guide, subTab: 'guide' } })
                  }
                  className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    state.guide.subTab === 'guide'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Guide de grammaire
                </button>
                <button
                  type="button"
                  onClick={() =>
                    patchState({ guide: { ...state.guide, subTab: 'builder' } })
                  }
                  className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    state.guide.subTab === 'builder'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Atelier Phrases
                </button>
              </div>
            </div>

            {state.guide.subTab === 'guide' ? (
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
              <div className="inline-flex flex-wrap items-center gap-1 p-1 bg-slate-200/70 rounded-lg">
                <button
                  type="button"
                  onClick={() =>
                    patchState({ quiz: { ...state.quiz, subTab: 'games' } })
                  }
                  className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    state.quiz.subTab === 'games'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Mini-Jeux
                </button>
                <button
                  type="button"
                  onClick={() =>
                    patchState({ quiz: { ...state.quiz, subTab: 'time' } })
                  }
                  className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    state.quiz.subTab === 'time'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  L’heure
                </button>
                <button
                  type="button"
                  onClick={() =>
                    patchState({ quiz: { ...state.quiz, subTab: 'quiz' } })
                  }
                  className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    state.quiz.subTab === 'quiz'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Quiz Bruno Mars
                </button>
                <button
                  type="button"
                  onClick={() =>
                    patchState({ quiz: { ...state.quiz, subTab: 'dialogue' } })
                  }
                  className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    state.quiz.subTab === 'dialogue'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
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
              <div className="inline-flex flex-wrap items-center gap-1 p-1 bg-slate-200/70 rounded-lg">
                <button
                  type="button"
                  onClick={() =>
                    patchState({ recap: { ...state.recap, subTab: 'writing' } })
                  }
                  className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    state.recap.subTab === 'writing'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Cahier Prof &amp; Élève
                </button>
                <button
                  type="button"
                  onClick={() =>
                    patchState({ recap: { ...state.recap, subTab: 'board' } })
                  }
                  className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    state.recap.subTab === 'board' ||
                    (role === 'student' && state.recap.subTab === 'recap')
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
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
                    className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      state.recap.subTab === 'recap'
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
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
        <footer className="border-t-2 border-slate-900 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-600">
            <span className="font-medium">StoryBridge Studio · Édition Manga Interactive pour cours en visio</span>
            {role === 'tutor' && (
              <button
                type="button"
                onClick={() =>
                  patchState({
                    activeTab: 'board',
                    recap: { ...state.recap, subTab: 'recap' },
                  })
                }
                className="text-rose-600 hover:underline font-semibold cursor-pointer"
              >
                Ouvrir le récapitulatif Prof de fin de séance
              </button>
            )}
          </div>
        </footer>
      )}

      {role === 'tutor' && (
        <SessionModal
          isOpen={isSessionModalOpen}
          onClose={() => setIsSessionModalOpen(false)}
          roomCode={roomCode}
          connected={connected}
          participants={participants}
          studentProfiles={studentProfiles}
          activeStudent={activeStudent}
          onAddStudentProfile={addStudentProfile}
          onJoinRoom={joinRoom}
          onLeaveRoom={leaveRoom}
        />
      )}

      <StudentVideoSlot
        roomCode={roomCode}
        connected={connected}
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
          className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] left-[max(1rem,env(safe-area-inset-left))] z-40 inline-flex items-center gap-1.5 px-3 py-2 min-h-[40px] rounded-lg border-2 border-slate-900 bg-white/95 text-slate-900 text-xs font-bold shadow-[2px_2px_0px_#0f172a] hover:bg-slate-100 transition-colors whitespace-nowrap cursor-pointer"
        >
          <Minimize2 className="w-3.5 h-3.5" aria-hidden="true" />
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
