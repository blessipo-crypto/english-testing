import { useMemo, useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  Volume2,
  RotateCcw,
  ChevronRight,
  Sparkles,
  Flame,
} from 'lucide-react';
import { GRAMMAR_BLITZ_QUESTIONS } from '../../data/gamesData';
import type { VoiceAccent } from '../../types/lesson';
import { speakEnglish } from '../../utils/speech';
import { playError, playSuccess, playVictory } from '../../utils/soundFx';

interface GrammarBlitzGameProps {
  accent: VoiceAccent;
  speechRate: number;
  onAwardStar: () => void;
}

type FilterCategory = 'all' | 'irregular' | 'modals' | 'prepositions' | 'tenses';

const CATEGORIES: Array<{ id: FilterCategory; label: string }> = [
  { id: 'all', label: 'Tout mélanger (6)' },
  { id: 'prepositions', label: 'AT / ON / IN' },
  { id: 'irregular', label: 'Verbes irréguliers' },
  { id: 'modals', label: 'Modaux' },
  { id: 'tenses', label: 'Temps simples' },
];

export function GrammarBlitzGame({
  accent,
  speechRate,
  onAwardStar,
}: GrammarBlitzGameProps) {
  const [category, setCategory] = useState<FilterCategory>('all');
  const [roundSeed, setRoundSeed] = useState(0);
  const [qIndex, setQIndex] = useState(0);
  const [pickedIndex, setPickedIndex] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [finished, setFinished] = useState(false);

  const questions = useMemo(() => {
    const pool =
      category === 'all'
        ? GRAMMAR_BLITZ_QUESTIONS
        : GRAMMAR_BLITZ_QUESTIONS.filter((q) => q.category === category);
    const rotated = pool.map((_, idx) => pool[(idx + roundSeed) % pool.length]);
    return rotated.slice(0, 6);
  }, [category, roundSeed]);

  const activeQ = questions[qIndex % questions.length];
  const isAnswered = pickedIndex !== null;
  const isRight = isAnswered && pickedIndex === activeQ.correctIndex;

  const restart = (nextCat: FilterCategory = category, bumpSeed = true) => {
    setCategory(nextCat);
    if (bumpSeed) setRoundSeed((s) => s + 3);
    setQIndex(0);
    setPickedIndex(null);
    setScore(0);
    setStreak(0);
    setFinished(false);
  };

  const handleChoose = (optIdx: number) => {
    if (isAnswered) return;
    setPickedIndex(optIdx);
    const right = optIdx === activeQ.correctIndex;
    if (right) {
      setScore((s) => s + 1);
      setStreak((st) => st + 1);
      if (qIndex === questions.length - 1) {
        playVictory();
      } else {
        playSuccess();
      }
    } else {
      setStreak(0);
      playError();
    }
    speakEnglish(activeQ.completedEn, { accent, rate: speechRate });
  };

  const handleNext = () => {
    if (qIndex + 1 >= questions.length) {
      setFinished(true);
      onAwardStar();
    } else {
      setQIndex((i) => i + 1);
      setPickedIndex(null);
    }
  };

  return (
    <div className="manga-panel p-5 sm:p-7 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b sb-divider">
        <div>
          <div className="text-xs font-semibold sb-text-accent">
            Défi Grammaire · Réflexes rapides sur les règles du guide
          </div>
          <h2 className="text-xl font-bold tracking-wide sb-text-primary">
            Question <span className="tabular-nums sb-text-accent">{qIndex + 1}/{questions.length}</span> ·{' '}
            <span className="text-[var(--sb-danger)]">{activeQ.categoryLabelFr}</span>
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold sb-text-reward tabular-nums tracking-wide">
            <Flame className="w-4 h-4 text-[var(--sb-danger)]" aria-hidden="true" />
            <span>Score : {score}/{questions.length}</span>
            {streak >= 2 && <span className="sb-text-success">· Série x{streak}</span>}
          </div>
          <button
            type="button"
            onClick={() => restart(category, true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-b-2 sb-chip-idle border-b-[var(--sb-border-3d)] text-xs font-bold hover:border-[var(--sb-reward)] hover:sb-text-reward whitespace-nowrap shrink-0 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
            Recommencer
          </button>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-1.5">
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => restart(c.id, false)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold tracking-wide whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
              category === c.id ? 'sb-chip-solid' : 'sb-chip-idle'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {finished ? (
        <div className="p-6 rounded-2xl sb-status-success border space-y-4">
          <div className="flex items-center gap-2 text-lg font-bold tracking-wide sb-text-success">
            <Sparkles className="w-6 h-6 sb-text-reward shrink-0" aria-hidden="true" />
            <span>
              Défi terminé ! Score : {score} / {questions.length} (+1 étoile)
            </span>
          </div>
          <p className="text-sm sb-text-secondary">
            {score >= questions.length - 1
              ? 'Impressionnant ! Tes réflexes sur les règles de base sont solides.'
              : 'Bien joué ! Tu peux relancer une partie pour viser le sans-faute.'}
          </p>
          <button
            type="button"
            onClick={() => restart(category, true)}
            className="manga-btn-primary px-4 py-2 rounded-xl text-xs font-bold tracking-wide cursor-pointer"
          >
            Rejouer une partie
          </button>
        </div>
      ) : (
        <>
          {/* Question Card */}
          <div className="p-5 rounded-2xl sb-surface-soft border space-y-2">
            <div className="text-xs font-semibold sb-text-accent">{activeQ.promptFr}</div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xl sm:text-2xl font-bold sb-text-primary">
                {activeQ.sentenceWithBlank}
              </p>
              <button
                type="button"
                onClick={() =>
                  speakEnglish(activeQ.completedEn, { accent, rate: speechRate })
                }
                aria-label="Écouter la phrase complète"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-b-4 sb-audio-btn border-b-[var(--sb-border-3d)] text-xs font-bold shrink-0 cursor-pointer"
              >
                <Volume2 className="w-4 h-4" aria-hidden="true" />
                Audio
              </button>
            </div>
          </div>

          {/* 3 Options */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {activeQ.options.map((opt, idx) => {
              const chosen = pickedIndex === idx;
              const rightOpt = idx === activeQ.correctIndex;
              let cls = 'sb-card-option cursor-pointer';
              let markerCls = 'bg-[var(--sb-accent)] group-hover:bg-[var(--sb-hover-accent)]';
              if (isAnswered) {
                if (rightOpt) {
                  cls =
                    'sb-status-success border-b-[var(--sb-success-3d)] cursor-default';
                  markerCls = 'bg-[var(--sb-success)]';
                } else if (chosen) {
                  cls =
                    'sb-status-danger border-b-[var(--sb-danger-3d)] cursor-default';
                  markerCls = 'bg-[var(--sb-danger)]';
                } else {
                  cls = 'sb-card-used cursor-default';
                  markerCls = 'bg-[var(--sb-text-used)]';
                }
              }

              return (
                <button
                  key={`${activeQ.id}-${idx}`}
                  type="button"
                  disabled={isAnswered}
                  onClick={() => handleChoose(idx)}
                  className={`group min-h-[56px] px-4 py-3 rounded-2xl border border-b-4 text-base font-bold flex items-center justify-between gap-2 transition-all ${cls}`}
                >
                  <span className="flex items-center gap-3 min-w-0">
                    <span
                      aria-hidden="true"
                      className={`w-2.5 h-2.5 rotate-45 shrink-0 transition-colors ${markerCls}`}
                    />
                    <span>{opt}</span>
                  </span>
                  {isAnswered && rightOpt && (
                    <CheckCircle2 className="w-4 h-4 sb-text-success shrink-0" />
                  )}
                  {isAnswered && chosen && !rightOpt && (
                    <XCircle className="w-4 h-4 text-[var(--sb-danger)] shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Explanation & Next */}
          {isAnswered && (
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl sb-surface-soft border">
              <div className="space-y-0.5">
                <div className="text-sm font-bold sb-text-primary">
                  {isRight ? 'Exact !' : 'À retenir :'} « {activeQ.completedEn} »
                </div>
                <p className="text-xs sb-text-secondary">{activeQ.explanationFr}</p>
              </div>
              <button
                type="button"
                onClick={handleNext}
                className="manga-btn-primary inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold tracking-wide whitespace-nowrap shrink-0 cursor-pointer"
              >
                {qIndex + 1 >= questions.length ? 'Voir mon score' : 'Suivant'}
                <ChevronRight className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
