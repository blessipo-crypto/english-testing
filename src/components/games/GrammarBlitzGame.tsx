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
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="text-xs text-slate-500">
            Défi Grammaire · Réflexes rapides sur les règles du guide
          </div>
          <h2 className="text-xl font-bold text-slate-900">
            Question <span className="tabular-nums">{qIndex + 1}/{questions.length}</span> ·{' '}
            <span className="text-rose-600">{activeQ.categoryLabelFr}</span>
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-800 tabular-nums">
            <Flame className="w-4 h-4 text-rose-600" aria-hidden="true" />
            <span>Score : {score}/{questions.length}</span>
            {streak >= 2 && <span className="text-emerald-700">· Série x{streak}</span>}
          </div>
          <button
            type="button"
            onClick={() => restart(category, true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-2 border-slate-900 bg-white text-slate-900 text-xs font-bold hover:bg-slate-50 whitespace-nowrap shrink-0 cursor-pointer"
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
            className={`px-3 py-1.5 rounded-lg border text-xs font-bold whitespace-nowrap shrink-0 cursor-pointer ${
              category === c.id
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {finished ? (
        <div className="p-6 rounded-xl bg-emerald-50 border-2 border-slate-900 space-y-4">
          <div className="flex items-center gap-2 text-lg font-bold text-emerald-950">
            <Sparkles className="w-6 h-6 text-emerald-600 shrink-0" aria-hidden="true" />
            <span>
              Défi terminé ! Score : {score} / {questions.length} (+1 étoile)
            </span>
          </div>
          <p className="text-sm text-emerald-900">
            {score >= questions.length - 1
              ? 'Impressionnant ! Tes réflexes sur les règles de base sont solides.'
              : 'Bien joué ! Tu peux relancer une partie pour viser le sans-faute.'}
          </p>
          <button
            type="button"
            onClick={() => restart(category, true)}
            className="manga-btn-primary px-4 py-2 rounded-lg text-xs font-bold cursor-pointer"
          >
            Rejouer une partie
          </button>
        </div>
      ) : (
        <>
          {/* Question Card */}
          <div className="p-5 rounded-xl bg-slate-50 border-2 border-slate-900 space-y-2">
            <div className="text-xs font-semibold text-slate-600">{activeQ.promptFr}</div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xl sm:text-2xl font-bold text-slate-900">
                {activeQ.sentenceWithBlank}
              </p>
              <button
                type="button"
                onClick={() =>
                  speakEnglish(activeQ.completedEn, { accent, rate: speechRate })
                }
                aria-label="Écouter la phrase complète"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border-2 border-slate-900 bg-white text-slate-900 text-xs font-bold hover:bg-slate-100 shrink-0 cursor-pointer"
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
              let cls =
                'bg-white border-slate-900 text-slate-900 hover:bg-amber-50 cursor-pointer';
              if (isAnswered) {
                if (rightOpt) {
                  cls = 'bg-emerald-50 border-emerald-600 text-emerald-950 cursor-default';
                } else if (chosen) {
                  cls = 'bg-rose-50 border-rose-500 text-rose-950 cursor-default';
                } else {
                  cls = 'bg-slate-50 border-slate-200 text-slate-400 cursor-default';
                }
              }

              return (
                <button
                  key={`${activeQ.id}-${idx}`}
                  type="button"
                  disabled={isAnswered}
                  onClick={() => handleChoose(idx)}
                  className={`min-h-[54px] px-4 py-3 rounded-xl border-2 text-base font-bold flex items-center justify-between gap-2 transition-colors ${cls}`}
                >
                  <span>{opt}</span>
                  {isAnswered && rightOpt && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  )}
                  {isAnswered && chosen && !rightOpt && (
                    <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Explanation & Next */}
          {isAnswered && (
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-white border-2 border-slate-900">
              <div className="space-y-0.5">
                <div className="text-sm font-bold text-slate-900">
                  {isRight ? 'Exact !' : 'À retenir :'} « {activeQ.completedEn} »
                </div>
                <p className="text-xs text-slate-600">{activeQ.explanationFr}</p>
              </div>
              <button
                type="button"
                onClick={handleNext}
                className="manga-btn-primary inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap shrink-0 cursor-pointer"
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
