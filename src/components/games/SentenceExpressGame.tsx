import { useMemo, useState } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Volume2,
  ChevronRight,
  Sparkles,
  Flame,
} from 'lucide-react';
import { SENTENCE_EXPRESS_ROUNDS } from '../../data/gamesData';
import type { VoiceAccent } from '../../types/lesson';
import { speakEnglish } from '../../utils/speech';
import { playError, playPop, playSuccess, playVictory } from '../../utils/soundFx';

interface SentenceExpressGameProps {
  accent: VoiceAccent;
  speechRate: number;
  onAwardStar: () => void;
}

const ROUND_COUNT = 5;

function shuffleTokens(words: string[], seedKey: string): string[] {
  const indexed = words.map((word, idx) => ({ word, idx }));
  let hash = 7;
  for (let i = 0; i < seedKey.length; i++) {
    hash = (hash * 31 + seedKey.charCodeAt(i)) % 100003;
  }
  indexed.sort((a, b) => {
    const scoreA = ((a.idx + 5) * (hash + 11)) % 89;
    const scoreB = ((b.idx + 5) * (hash + 11)) % 89;
    return scoreA - scoreB || a.idx - b.idx;
  });
  return indexed.map((item) => item.word);
}

export function SentenceExpressGame({
  accent,
  speechRate,
  onAwardStar,
}: SentenceExpressGameProps) {
  const [setOffset, setSetOffset] = useState(0);
  const [trapMode, setTrapMode] = useState(false);
  const [roundIdx, setRoundIdx] = useState(0);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [status, setStatus] = useState<'idle' | 'correct' | 'incorrect'>('idle');
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [solvedCurrent, setSolvedCurrent] = useState(false);
  const [completed, setCompleted] = useState(false);

  const rounds = useMemo(() => {
    const picked = [];
    for (let i = 0; i < ROUND_COUNT; i++) {
      picked.push(
        SENTENCE_EXPRESS_ROUNDS[(setOffset + i) % SENTENCE_EXPRESS_ROUNDS.length]
      );
    }
    return picked;
  }, [setOffset]);

  const activeRound = rounds[roundIdx];

  const tokens = useMemo(() => {
    const baseWords = activeRound.targetEn.split(/\s+/).filter(Boolean);
    const list =
      trapMode && activeRound.distractor
        ? [...baseWords, activeRound.distractor]
        : baseWords;
    return shuffleTokens(list, `${activeRound.id}-${setOffset}-${trapMode}`);
  }, [activeRound, setOffset, trapMode]);

  const builtWords = selectedIndices
    .map((idx) => tokens[idx])
    .filter((w): w is string => typeof w === 'string');

  const handleToggleMode = (nextTrap: boolean) => {
    setTrapMode(nextTrap);
    setSelectedIndices([]);
    setStatus('idle');
    setSolvedCurrent(false);
  };

  const handleRestartSet = (advanceSet = false) => {
    if (advanceSet) {
      setSetOffset((prev) => (prev + ROUND_COUNT) % SENTENCE_EXPRESS_ROUNDS.length);
    }
    setRoundIdx(0);
    setSelectedIndices([]);
    setStatus('idle');
    setScore(0);
    setStreak(0);
    setSolvedCurrent(false);
    setCompleted(false);
  };

  const handleAddWord = (idx: number) => {
    if (selectedIndices.includes(idx) || solvedCurrent) return;
    playPop();
    setSelectedIndices((prev) => [...prev, idx]);
    setStatus('idle');
  };

  const handleRemoveWord = (idxToRemove: number) => {
    if (solvedCurrent) return;
    playPop();
    setSelectedIndices((prev) => prev.filter((i) => i !== idxToRemove));
    setStatus('idle');
  };

  const handleVerify = () => {
    const attempt = builtWords.join(' ').trim().toLowerCase();
    const target = activeRound.targetEn.trim().toLowerCase();
    if (attempt === target) {
      setStatus('correct');
      if (!solvedCurrent) {
        setSolvedCurrent(true);
        setScore((s) => s + 1);
        setStreak((st) => st + 1);
      }
      speakEnglish(activeRound.targetEn, { accent, rate: speechRate });
      if (roundIdx === ROUND_COUNT - 1) {
        playVictory();
        setCompleted(true);
        onAwardStar();
      } else {
        playSuccess();
      }
    } else {
      playError();
      setStatus('incorrect');
      setStreak(0);
    }
  };

  const handleNextRound = () => {
    if (roundIdx + 1 >= ROUND_COUNT) {
      setCompleted(true);
      return;
    }
    setRoundIdx((r) => r + 1);
    setSelectedIndices([]);
    setStatus('idle');
    setSolvedCurrent(false);
  };

  return (
    <div className="manga-panel p-5 sm:p-7 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="text-xs text-slate-500">
            Phrase Express · Remets les étiquettes dans le bon ordre grammatical
          </div>
          <h2 className="text-xl font-bold text-slate-900">
            Manche <span className="tabular-nums">{roundIdx + 1}/{ROUND_COUNT}</span> ·{' '}
            <span className="text-rose-600">{activeRound.grammarTag}</span>
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-800 tabular-nums">
            <Flame className="w-4 h-4 text-rose-600" aria-hidden="true" />
            <span>Score : {score}/{ROUND_COUNT}</span>
            {streak >= 2 && <span className="text-emerald-700">· Série x{streak}</span>}
          </div>

          <div className="flex items-center gap-1 p-0.5 bg-slate-100 border border-slate-300 rounded-lg">
            <button
              type="button"
              onClick={() => handleToggleMode(false)}
              className={`px-2.5 py-1 text-xs font-bold rounded-md whitespace-nowrap shrink-0 cursor-pointer ${
                !trapMode ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
              }`}
            >
              Classique
            </button>
            <button
              type="button"
              onClick={() => handleToggleMode(true)}
              className={`px-2.5 py-1 text-xs font-bold rounded-md whitespace-nowrap shrink-0 cursor-pointer ${
                trapMode ? 'bg-slate-900 text-white' : 'text-slate-600'
              }`}
            >
              Défi (+1 piège)
            </button>
          </div>

          <button
            type="button"
            onClick={() => handleRestartSet(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-2 border-slate-900 bg-white text-slate-900 text-xs font-bold hover:bg-slate-50 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
            Nouvelle série
          </button>
        </div>
      </div>

      {completed ? (
        <div className="p-6 rounded-xl bg-emerald-50 border-2 border-slate-900 space-y-4">
          <div className="flex items-center gap-2 text-lg font-bold text-emerald-950">
            <Sparkles className="w-6 h-6 text-emerald-600 shrink-0" aria-hidden="true" />
            <span>
              Série terminée ! Score : {score} / {ROUND_COUNT} (+1 étoile gagnée)
            </span>
          </div>
          <p className="text-sm text-emerald-900">
            Tu maîtrises encore mieux l’ordre des mots en anglais ! Tu peux lancer une nouvelle série de 5 phrases inédites ou activer le mode « Défi (+1 piège) ».
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => handleRestartSet(true)}
              className="manga-btn-primary px-4 py-2 rounded-lg text-xs font-bold cursor-pointer"
            >
              5 nouvelles phrases
            </button>
            <button
              type="button"
              onClick={() => handleRestartSet(false)}
              className="px-4 py-2 rounded-lg border-2 border-slate-900 bg-white text-slate-900 text-xs font-bold hover:bg-slate-50 cursor-pointer"
            >
              Rejouer cette série
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* French Target Prompt */}
          <div className="p-5 rounded-xl bg-slate-50 border-2 border-slate-900 space-y-1">
            <div className="text-xs font-semibold text-slate-500">
              Traduis en anglais en cliquant sur les tuiles :
            </div>
            <p className="text-xl font-bold text-slate-900">{activeRound.promptFr}</p>
            {trapMode && (
              <p className="text-xs text-rose-700 font-semibold pt-1">
                Attention : 1 mot piège s’est glissé dans la réserve, ne l’utilise pas !
              </p>
            )}
          </div>

          {/* Answer Tray */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-600">Ta phrase :</span>
              {builtWords.length > 0 && (
                <button
                  type="button"
                  onClick={() =>
                    speakEnglish(builtWords.join(' '), { accent, rate: speechRate })
                  }
                  className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 hover:text-rose-800 cursor-pointer"
                >
                  <Volume2 className="w-3.5 h-3.5" aria-hidden="true" />
                  Écouter
                </button>
              )}
            </div>

            <div className="min-h-[78px] p-4 rounded-xl bg-white border-2 border-dashed border-slate-400 flex flex-wrap items-center gap-2">
              {selectedIndices.length === 0 ? (
                <span className="text-sm text-slate-400">
                  Clique sur les mots ci-dessous pour former la phrase...
                </span>
              ) : (
                selectedIndices.map((idx) => (
                  <button
                    key={`built-${idx}`}
                    type="button"
                    onClick={() => handleRemoveWord(idx)}
                    className="px-3.5 py-2 rounded-lg bg-slate-900 text-white text-sm font-bold hover:bg-rose-600 transition-colors cursor-pointer"
                  >
                    {tokens[idx]}
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Word Tiles Bank */}
          <div className="flex flex-wrap gap-2">
            {tokens.map((word, idx) => {
              const used = selectedIndices.includes(idx);
              return (
                <button
                  key={`tile-${idx}-${word}`}
                  type="button"
                  disabled={used || solvedCurrent}
                  onClick={() => handleAddWord(idx)}
                  className={`min-h-[42px] px-4 py-2 rounded-lg border-2 text-sm font-bold transition-colors ${
                    used
                      ? 'bg-slate-100 border-slate-200 text-slate-300 cursor-default'
                      : 'bg-white border-slate-900 text-slate-900 hover:bg-amber-50 cursor-pointer'
                  }`}
                >
                  {word}
                </button>
              );
            })}
          </div>

          {/* Feedback */}
          {status === 'correct' && (
            <div
              role="status"
              className="p-4 rounded-xl bg-emerald-50 border-2 border-slate-900 space-y-1.5"
            >
              <div className="flex items-center gap-2 text-sm font-bold text-emerald-950">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>Exact ! « {activeRound.targetEn} »</span>
              </div>
              <p className="text-xs text-emerald-900">{activeRound.tipFr}</p>
            </div>
          )}

          {status === 'incorrect' && (
            <div
              role="status"
              className="p-4 rounded-xl bg-amber-50 border-2 border-slate-900 space-y-1"
            >
              <div className="flex items-center gap-2 text-sm font-bold text-amber-950">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                <span>Presque ! Vérifie l’ordre ou le mot piège.</span>
              </div>
              <p className="text-xs text-amber-900">Astuce : {activeRound.tipFr}</p>
            </div>
          )}

          {/* Bottom Controls */}
          <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              disabled={solvedCurrent || selectedIndices.length === 0}
              onClick={() => {
                setSelectedIndices([]);
                setStatus('idle');
              }}
              className="px-3.5 py-2 rounded-lg border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
            >
              Effacer
            </button>

            <div className="flex items-center gap-2.5">
              {!solvedCurrent ? (
                <button
                  type="button"
                  disabled={selectedIndices.length === 0}
                  onClick={handleVerify}
                  className="manga-btn-primary px-5 py-2 rounded-lg text-xs font-bold disabled:opacity-40 cursor-pointer"
                >
                  Vérifier
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleNextRound}
                  className="manga-btn-primary inline-flex items-center gap-1.5 px-5 py-2 rounded-lg text-xs font-bold cursor-pointer"
                >
                  Manche suivante
                  <ChevronRight className="w-4 h-4" aria-hidden="true" />
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
