import { useEffect, useMemo, useState } from 'react';
import {
  Check,
  Copy,
  MessageCircle,
  Mic,
  PenLine,
  Sparkles,
  Volume2,
  ClipboardCheck,
  BookmarkCheck,
  Trash2,
  History,
} from 'lucide-react';
import { BRUNO_MARS_QUESTIONS } from './BrunoMarsQuiz';
import { MOOD_OPTIONS, VOCAB_DECKS } from '../data/lessonData';
import type {
  RecapState,
  RoomState,
  SavedSessionRecap,
  VoiceAccent,
} from '../types/lesson';
import { speakEnglish } from '../utils/speech';

interface SessionRecapModuleProps {
  roomState: RoomState;
  recap: RecapState;
  accent: VoiceAccent;
  speechRate: number;
  onUpdateRecap: (patch: Partial<RecapState>) => void;
}

const ORAL_FLUENCY_OPTIONS = [
  'À encourager',
  'En progrès',
  'À l’aise',
  'Très fluide',
];
const ORAL_PRON_OPTIONS = [
  'À travailler',
  'Correcte',
  'Claire',
  'Très naturelle',
];
const ORAL_COMPREHENSION_OPTIONS = [
  'Avec aide',
  'Bonne',
  'Très bonne',
  'Autonome',
];

const WRITTEN_SYNTAX_OPTIONS = [
  'À guider',
  'En progrès',
  'Solide',
  'Maîtrisée',
];
const WRITTEN_SPELLING_OPTIONS = [
  'À consolider',
  'Correcte',
  'Précise',
  'Riche',
];
const WRITTEN_GRAMMAR_OPTIONS = [
  'En découverte',
  'En cours',
  'Acquise',
];

const NEXT_GOAL_PRESETS = [
  'Relire à voix haute les mots du carnet (5 min)',
  'Revoir 5 verbes irréguliers au prétérit',
  'Préparer 3 phrases avec can / must / should',
  'Réécouter le dialogue du café à vitesse 0.85x',
];

const RECAP_ARCHIVE_KEY = 'storybridge_saved_recaps_v1';

export function SessionRecapModule({
  roomState,
  recap,
  accent,
  speechRate,
  onUpdateRecap,
}: SessionRecapModuleProps) {
  const [copied, setCopied] = useState(false);
  const [savedConfirmed, setSavedConfirmed] = useState(false);
  const [savedRecaps, setSavedRecaps] = useState<SavedSessionRecap[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const raw = window.localStorage.getItem(RECAP_ARCHIVE_KEY);
      return raw ? (JSON.parse(raw) as SavedSessionRecap[]) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    fetch('/api/recaps')
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { recaps?: SavedSessionRecap[] } | null) => {
        if (data && Array.isArray(data.recaps) && data.recaps.length > 0) {
          setSavedRecaps(data.recaps);
          try {
            window.localStorage.setItem(
              RECAP_ARCHIVE_KEY,
              JSON.stringify(data.recaps)
            );
          } catch {
            // ignore
          }
        }
      })
      .catch(() => {});
  }, []);

  const quizAnsweredCount = Object.keys(roomState.quiz.answers).length;
  const quizScore = BRUNO_MARS_QUESTIONS.reduce(
    (acc, q) => (roomState.quiz.answers[q.id] === q.correctIndex ? acc + 1 : acc),
    0
  );

  const activeDeck = VOCAB_DECKS.find((d) => d.id === roomState.vocab.deckId);
  const moodLabel = MOOD_OPTIONS.find((m) => m.id === roomState.warmup.mood);

  const automaticSynthesis = useMemo(() => {
    const dateStr = new Date().toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    const studentLabel = recap.studentName.trim() || 'l’élève';

    const activities: string[] = [];
    if (moodLabel) {
      activities.push(
        `Rituel d’accueil en anglais (humeur : « ${moodLabel.en} »${
          roomState.warmup.studentAnswer.trim()
            ? `, réponse personnelle : « ${roomState.warmup.studentAnswer.trim()} »`
            : ''
        })`
      );
    }
    if (activeDeck) {
      const matched = roomState.vocab.matchedIds.length;
      activities.push(
        `Vocabulaire : thème « ${activeDeck.titleFr} »${
          matched > 0
            ? ` (${matched}/${activeDeck.cards.length} paires associées)`
            : ''
        }`
      );
    }
    if (quizAnsweredCount > 0) {
      activities.push(
        `Quiz Bruno Mars en anglais : ${quizScore}/${BRUNO_MARS_QUESTIONS.length} bonnes réponses`
      );
    }
    if (roomState.wordbank.length > 0) {
      activities.push(
        `${roomState.wordbank.length} mot${roomState.wordbank.length > 1 ? 's' : ''} / expression${roomState.wordbank.length > 1 ? 's' : ''} ajouté${roomState.wordbank.length > 1 ? 's' : ''} au carnet`
      );
    }

    const oralSummary = [
      `• À l’oral : prise de parole jugée « ${recap.oralFluency.toLowerCase()} », prononciation « ${recap.oralPronunciation.toLowerCase()} » et compréhension en visio « ${recap.oralComprehension.toLowerCase()} ».`,
      recap.oralNotes.trim()
        ? `  Observation oral : ${recap.oralNotes.trim()}`
        : '',
    ]
      .filter(Boolean)
      .join('\n');

    const writtenSummary = [
      `• À l’écrit : construction de phrases « ${recap.writtenSyntax.toLowerCase()} », orthographe & vocabulaire « ${recap.writtenSpelling.toLowerCase()} », application des règles « ${recap.writtenGrammar.toLowerCase()} ».`,
      recap.writtenNotes.trim()
        ? `  Observation écrit : ${recap.writtenNotes.trim()}`
        : '',
    ]
      .filter(Boolean)
      .join('\n');

    const vocabList =
      roomState.wordbank.length > 0
        ? roomState.wordbank
            .slice(0, 12)
            .map((w) => `  - ${w.en} : ${w.fr}`)
            .join('\n')
        : '  - Aucun mot ajouté pendant cette séance.';

    const lines = [
      `Bilan du cours d’anglais — ${dateStr}`,
      `Élève : ${studentLabel} · Étoiles obtenues : ${roomState.stars}`,
      '',
      'Synthèse automatique :',
      oralSummary,
      writtenSummary,
      '',
      activities.length > 0
        ? `Activités travaillées :\n${activities.map((a) => `  - ${a}`).join('\n')}`
        : '',
      '',
      `Vocabulaire à retenir :\n${vocabList}`,
      recap.nextGoal.trim()
        ? `\nObjectif pour le prochain cours :\n  → ${recap.nextGoal.trim()}`
        : '',
      roomState.boardNote.trim()
        ? `\nMémo du tableau :\n  ${roomState.boardNote.trim()}`
        : '',
    ];

    return lines.filter((line) => line !== undefined).join('\n').replace(/\n{3,}/g, '\n\n').trim();
  }, [activeDeck, moodLabel, quizAnsweredCount, quizScore, recap, roomState]);

  const englishPraiseLine = useMemo(() => {
    const namePart = recap.studentName.trim()
      ? ` ${recap.studentName.trim()}`
      : '';
    return `Great job today${namePart}! You earned ${roomState.stars} stars in English. Keep practising and see you next lesson!`;
  }, [recap.studentName, roomState.stars]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(automaticSynthesis);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  };

  const handleSaveSession = async () => {
    const newEntry: SavedSessionRecap = {
      id: `recap-${Date.now().toString(36)}`,
      savedAt: Date.now(),
      dateLabel: new Date().toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }),
      studentName: recap.studentName.trim() || 'Élève',
      stars: roomState.stars,
      wordCount: roomState.wordbank.length,
      summaryText: automaticSynthesis,
      nextGoal: recap.nextGoal.trim(),
    };

    const nextList = [newEntry, ...savedRecaps].slice(0, 50);
    setSavedRecaps(nextList);
    try {
      window.localStorage.setItem(RECAP_ARCHIVE_KEY, JSON.stringify(nextList));
    } catch {
      // ignore
    }

    try {
      const res = await fetch('/api/recaps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEntry),
      });
      if (res.ok) {
        const data = (await res.json()) as { recaps?: SavedSessionRecap[] };
        if (Array.isArray(data.recaps)) {
          setSavedRecaps(data.recaps);
        }
      }
    } catch {
      // LocalStorage fallback already saved
    }

    setSavedConfirmed(true);
    window.setTimeout(() => setSavedConfirmed(false), 3000);
  };

  const handleDeleteSavedRecap = async (id: string) => {
    const nextList = savedRecaps.filter((r) => r.id !== id);
    setSavedRecaps(nextList);
    try {
      window.localStorage.setItem(RECAP_ARCHIVE_KEY, JSON.stringify(nextList));
    } catch {
      // ignore
    }
    try {
      await fetch(`/api/recaps/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
    } catch {
      // ignore
    }
  };

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(
    automaticSynthesis
  )}`;

  return (
    <div className="space-y-6">
      {/* Top Activity Telemetry Strip */}
      <section className="manga-panel p-5 lg:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="text-xs font-semibold text-rose-600 flex items-center gap-1.5">
              <ClipboardCheck className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Espace Professeur · Fin de séance</span>
            </div>
            <h1 className="text-xl lg:text-2xl font-bold text-slate-900">
              Récapitulatif Oral & Écrit avec synthèse automatique
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="recap-student-name" className="text-xs font-semibold text-slate-600 whitespace-nowrap">
              Prénom de l’élève :
            </label>
            <input
              id="recap-student-name"
              type="text"
              value={recap.studentName}
              onChange={(e) => onUpdateRecap({ studentName: e.target.value })}
              placeholder="Ex: Chloé"
              className="w-36 rounded-lg border-2 border-slate-900 bg-white px-3 py-1.5 text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-600"
            />
          </div>
        </div>

        {/* Real Session Indicators */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-slate-200">
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
            <div className="text-xs text-slate-500">Étoiles de la séance</div>
            <div className="text-lg font-bold text-slate-900 tabular-nums mt-0.5">
              {roomState.stars} étoile{roomState.stars > 1 ? 's' : ''}
            </div>
          </div>
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
            <div className="text-xs text-slate-500">Carnet de mots</div>
            <div className="text-lg font-bold text-slate-900 tabular-nums mt-0.5">
              {roomState.wordbank.length} mot{roomState.wordbank.length > 1 ? 's' : ''}
            </div>
          </div>
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
            <div className="text-xs text-slate-500">Quiz Bruno Mars</div>
            <div className="text-lg font-bold text-slate-900 tabular-nums mt-0.5">
              {quizAnsweredCount > 0
                ? `${quizScore} / ${BRUNO_MARS_QUESTIONS.length}`
                : 'Non commencé'}
            </div>
          </div>
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
            <div className="text-xs text-slate-500">Paires vocabulaire</div>
            <div className="text-lg font-bold text-slate-900 tabular-nums mt-0.5">
              {roomState.vocab.matchedIds.length} trouvée
              {roomState.vocab.matchedIds.length > 1 ? 's' : ''}
            </div>
          </div>
        </div>
      </section>

      {/* Main Split: Evaluation Rubric (Left 7 cols) + Auto-Synthesis Export (Right 5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 space-y-6">
          {/* Oral Evaluation Panel */}
          <section className="manga-panel p-6 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Mic className="w-4 h-4 text-rose-600" aria-hidden="true" />
              <h2 className="text-base font-bold text-slate-900">
                1. Bilan à l’Oral (Expression & Compréhension)
              </h2>
            </div>

            <div className="space-y-3">
              <div>
                <div className="text-xs font-semibold text-slate-600 mb-1.5">
                  Aisance & prise de parole
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {ORAL_FLUENCY_OPTIONS.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => onUpdateRecap({ oralFluency: opt })}
                      className={`px-2.5 py-2 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
                        recap.oralFluency === opt
                          ? 'bg-slate-900 border-slate-900 text-white'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-xs font-semibold text-slate-600 mb-1.5">
                  Prononciation & intonation
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {ORAL_PRON_OPTIONS.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => onUpdateRecap({ oralPronunciation: opt })}
                      className={`px-2.5 py-2 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
                        recap.oralPronunciation === opt
                          ? 'bg-slate-900 border-slate-900 text-white'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-xs font-semibold text-slate-600 mb-1.5">
                  Compréhension orale en visio
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {ORAL_COMPREHENSION_OPTIONS.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => onUpdateRecap({ oralComprehension: opt })}
                      className={`px-2.5 py-2 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
                        recap.oralComprehension === opt
                          ? 'bg-slate-900 border-slate-900 text-white'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-1">
                <label
                  htmlFor="oral-notes-input"
                  className="text-xs font-semibold text-slate-600 block mb-1"
                >
                  Remarque ciblée à l’oral (optionnel)
                </label>
                <input
                  id="oral-notes-input"
                  type="text"
                  value={recap.oralNotes}
                  onChange={(e) => onUpdateRecap({ oralNotes: e.target.value })}
                  placeholder="Ex : Très bonne participation au jeu de rôle, penser à bien prononcer le -s final."
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-600"
                />
              </div>
            </div>
          </section>

          {/* Written Evaluation Panel */}
          <section className="manga-panel p-6 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <PenLine className="w-4 h-4 text-rose-600" aria-hidden="true" />
              <h2 className="text-base font-bold text-slate-900">
                2. Bilan à l’Écrit (Phrases, Orthographe & Grammaire)
              </h2>
            </div>

            <div className="space-y-3">
              <div>
                <div className="text-xs font-semibold text-slate-600 mb-1.5">
                  Construction de phrases
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {WRITTEN_SYNTAX_OPTIONS.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => onUpdateRecap({ writtenSyntax: opt })}
                      className={`px-2.5 py-2 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
                        recap.writtenSyntax === opt
                          ? 'bg-slate-900 border-slate-900 text-white'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-xs font-semibold text-slate-600 mb-1.5">
                  Orthographe & vocabulaire
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {WRITTEN_SPELLING_OPTIONS.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => onUpdateRecap({ writtenSpelling: opt })}
                      className={`px-2.5 py-2 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
                        recap.writtenSpelling === opt
                          ? 'bg-slate-900 border-slate-900 text-white'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-xs font-semibold text-slate-600 mb-1.5">
                  Application des règles (temps, modaux, prépositions)
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {WRITTEN_GRAMMAR_OPTIONS.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => onUpdateRecap({ writtenGrammar: opt })}
                      className={`px-2.5 py-2 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
                        recap.writtenGrammar === opt
                          ? 'bg-slate-900 border-slate-900 text-white'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-1">
                <label
                  htmlFor="written-notes-input"
                  className="text-xs font-semibold text-slate-600 block mb-1"
                >
                  Remarque ciblée à l’écrit (optionnel)
                </label>
                <input
                  id="written-notes-input"
                  type="text"
                  value={recap.writtenNotes}
                  onChange={(e) => onUpdateRecap({ writtenNotes: e.target.value })}
                  placeholder="Ex : Ordre des mots bien compris dans les questions avec Do/Does."
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-600"
                />
              </div>

              <div className="pt-2 border-t border-slate-100 space-y-2">
                <label
                  htmlFor="next-goal-input"
                  className="text-xs font-semibold text-slate-600 block"
                >
                  Objectif / Mini-devoir pour le prochain cours
                </label>
                <input
                  id="next-goal-input"
                  type="text"
                  value={recap.nextGoal}
                  onChange={(e) => onUpdateRecap({ nextGoal: e.target.value })}
                  placeholder="Choisis une suggestion ci-dessous ou écris ton objectif..."
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-600"
                />
                <div className="flex flex-wrap gap-1.5">
                  {NEXT_GOAL_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => onUpdateRecap({ nextGoal: preset })}
                      className="px-2.5 py-1 rounded-md border border-slate-200 bg-slate-50 hover:bg-rose-50 hover:border-rose-300 text-[11px] font-medium text-slate-700 cursor-pointer"
                    >
                      + {preset}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Right Column: Live Automatic Synthesis & Closing Praise (5 cols) */}
        <aside className="lg:col-span-5 space-y-5">
          <div className="manga-panel p-5 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-rose-600" aria-hidden="true" />
                <h2 className="text-base font-bold text-slate-900">
                  Synthèse automatique
                </h2>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-800 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
                      Copié
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                      Copier
                    </>
                  )}
                </button>
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 border-2 border-slate-900 text-white text-xs font-bold hover:bg-emerald-700"
                >
                  <MessageCircle className="w-3.5 h-3.5" aria-hidden="true" />
                  WhatsApp
                </a>
              </div>
            </div>

            <pre className="whitespace-pre-wrap font-sans text-xs text-slate-800 leading-relaxed bg-slate-50 border border-slate-200 rounded-lg p-4 max-h-[420px] overflow-y-auto">
              {automaticSynthesis}
            </pre>

            <button
              type="button"
              onClick={handleSaveSession}
              className="manga-btn-primary w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold cursor-pointer"
            >
              {savedConfirmed ? (
                <>
                  <Check className="w-4 h-4" aria-hidden="true" />
                  Séance sauvegardée pour la prochaine fois !
                </>
              ) : (
                <>
                  <BookmarkCheck className="w-4 h-4" aria-hidden="true" />
                  Sauvegarder ce bilan pour la prochaine fois
                </>
              )}
            </button>
          </div>

          {/* Closing English Audio Praise for the Student */}
          <div className="manga-panel p-5 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-slate-900">
                Mot de fin en anglais pour l’élève
              </h3>
              <button
                type="button"
                onClick={() =>
                  speakEnglish(englishPraiseLine, { accent, rate: speechRate })
                }
                className="manga-btn-primary inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer"
              >
                <Volume2 className="w-3.5 h-3.5" aria-hidden="true" />
                Lire
              </button>
            </div>
            <p className="text-sm font-medium text-slate-800 leading-relaxed">
              “{englishPraiseLine}”
            </p>
          </div>
        </aside>
      </div>

      {/* Saved Session History for Next Lesson */}
      <section className="manga-panel p-6 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-rose-600" aria-hidden="true" />
            <h2 className="text-base font-bold text-slate-900">
              Historique sauvegardé ({savedRecaps.length})
            </h2>
          </div>
          <span className="text-xs text-slate-500">
            Conservé automatiquement pour les prochains cours
          </span>
        </div>

        {savedRecaps.length === 0 ? (
          <p className="text-xs text-slate-500 py-3">
            Aucune séance archivée pour l’instant. Cliquez sur « Sauvegarder ce bilan pour la prochaine fois » ci-dessus à la fin du cours.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {savedRecaps.map((item) => (
              <article
                key={item.id}
                className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-xs font-bold text-slate-900">
                      {item.dateLabel} · {item.studentName}
                    </div>
                    <div className="text-[11px] text-slate-500 tabular-nums mt-0.5">
                      {item.stars} étoiles · {item.wordCount} mots au carnet
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <a
                      href={`https://wa.me/?text=${encodeURIComponent(
                        item.summaryText
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Envoyer ce bilan archivé sur WhatsApp"
                      className="p-1.5 rounded-md text-emerald-700 hover:bg-emerald-100"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                    </a>
                    <button
                      type="button"
                      onClick={() => handleDeleteSavedRecap(item.id)}
                      aria-label="Supprimer cette archive"
                      className="p-1.5 rounded-md text-slate-400 hover:text-rose-700 hover:bg-rose-50 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {item.nextGoal && (
                  <p className="text-xs font-medium text-indigo-800">
                    Objectif fixé : {item.nextGoal}
                  </p>
                )}

                <details className="text-xs text-slate-600">
                  <summary className="cursor-pointer font-semibold text-slate-700 hover:text-slate-900">
                    Lire le bilan complet
                  </summary>
                  <pre className="mt-2 whitespace-pre-wrap font-sans text-xs text-slate-700 bg-white border border-slate-200 rounded-lg p-3">
                    {item.summaryText}
                  </pre>
                </details>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
