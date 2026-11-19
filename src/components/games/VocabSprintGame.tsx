import { useEffect, useMemo, useState } from 'react';
import {
  Check,
  RotateCcw,
  Sparkles,
  Timer,
  Volume2,
  Flame,
} from 'lucide-react';
import { VOCAB_DECKS } from '../../data/lessonData';
import type { VoiceAccent, WordbankItem } from '../../types/lesson';
import { speakEnglish } from '../../utils/speech';
import { playError, playPop, playSuccess, playVictory } from '../../utils/soundFx';

interface VocabSprintGameProps {
  themeId: string;
  wordbank: WordbankItem[];
  accent: VoiceAccent;
  speechRate: number;
  onChangeTheme: (themeId: string) => void;
  onAwardStar: () => void;
}

interface PairItem {
  id: string;
  en: string;
  fr: string;
}

const TIME_VOCAB_PAIRS: PairItem[] = [
  { id: 'tm-1', en: "It's three o'clock", fr: 'Il est 3 heures pile' },
  { id: 'tm-2', en: 'a quarter past four', fr: '4 heures et quart' },
  { id: 'tm-3', en: 'half past seven', fr: '7 heures et demie' },
  { id: 'tm-4', en: 'a quarter to nine', fr: '9 heures moins le quart' },
  { id: 'tm-5', en: 'midday / noon', fr: 'midi (12 h)' },
  { id: 'tm-6', en: 'midnight', fr: 'minuit (00 h)' },
];

function deterministicOrder<T extends { id: string }>(items: T[], salt: number): T[] {
  return [...items].sort((a, b) => {
    const scoreA = (a.id.charCodeAt(0) * 13 + a.id.charCodeAt(a.id.length - 1) * salt) % 97;
    const scoreB = (b.id.charCodeAt(0) * 13 + b.id.charCodeAt(b.id.length - 1) * salt) % 97;
    return scoreA - scoreB || a.id.localeCompare(b.id);
  });
}

export function VocabSprintGame({
  themeId,
  wordbank,
  accent,
  speechRate,
  onChangeTheme,
  onAwardStar,
}: VocabSprintGameProps) {
  const [roundSeed, setRoundSeed] = useState(11);
  const [selectedEn, setSelectedEn] = useState<string | null>(null);
  const [matchedIds, setMatchedIds] = useState<string[]>([]);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [chronoEnabled, setChronoEnabled] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(60);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [starAwarded, setStarAwarded] = useState(false);

  const pairs = useMemo<PairItem[]>(() => {
    if (themeId === 'time') return TIME_VOCAB_PAIRS;
    if (themeId === 'wordbank' && wordbank.length >= 4) {
      return wordbank.slice(0, 6).map((w) => ({ id: w.id, en: w.en, fr: w.fr }));
    }
    const deck = VOCAB_DECKS.find((d) => d.id === themeId) || VOCAB_DECKS[0];
    return deck.cards.slice(0, 6).map((c) => ({ id: c.id, en: c.en, fr: c.fr }));
  }, [themeId, wordbank]);

  const leftItems = useMemo(() => deterministicOrder(pairs, roundSeed), [pairs, roundSeed]);
  const rightItems = useMemo(
    () => deterministicOrder(pairs, roundSeed + 19),
    [pairs, roundSeed]
  );

  const resetGame = (nextChrono = chronoEnabled) => {
    setSelectedEn(null);
    setMatchedIds([]);
    setStreak(0);
    setBestStreak(0);
    setSecondsLeft(60);
    setChronoEnabled(nextChrono);
    setFeedback(null);
    setStarAwarded(false);
    setRoundSeed((s) => s + 7);
  };

  useEffect(() => {
    resetGame(chronoEnabled);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [themeId]);

  const allMatched = pairs.length > 0 && matchedIds.length === pairs.length;
  const timedOut = chronoEnabled && secondsLeft <= 0 && !allMatched;

  useEffect(() => {
    if (!chronoEnabled || allMatched || secondsLeft <= 0) return;
    const timer = window.setInterval(() => {
      setSecondsLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [chronoEnabled, allMatched, secondsLeft]);

  const handleSelectFr = (frId: string) => {
    if (timedOut) return;
    if (!selectedEn) {
      setFeedback('Clique d’abord sur une carte anglaise à gauche.');
      return;
    }

    if (selectedEn === frId) {
      const nextMatched = [...matchedIds, frId];
      const nextStreak = streak + 1;
      setMatchedIds(nextMatched);
      setStreak(nextStreak);
      setBestStreak((b) => Math.max(b, nextStreak));
      setSelectedEn(null);
      setFeedback(
        nextStreak >= 3 ? `Super série x${nextStreak} !` : 'Paire validée !'
      );

      if (nextMatched.length === pairs.length) {
        playVictory();
        if (!starAwarded) {
          setStarAwarded(true);
          onAwardStar();
        }
      } else {
        playSuccess();
      }
    } else {
      playError();
      setStreak(0);
      setSelectedEn(null);
      setFeedback('Pas celle-ci ! Écoute bien le mot anglais et réessaie.');
    }
  };

  return (
    <div className="manga-panel p-5 sm:p-7 space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b sb-divider">
        <div>
          <div className="text-xs font-semibold sb-text-accent">
            Duo Flash · Associe rapidement chaque mot anglais à son sens
          </div>
          <h2 className="text-xl font-bold tracking-wide sb-text-primary">
            Sprint d’association ({matchedIds.length}/{pairs.length} paires)
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold sb-text-reward tabular-nums tracking-wide">
            <Flame className="w-4 h-4 text-[var(--sb-danger)]" aria-hidden="true" />
            <span>Série : {streak}</span>
            {bestStreak >= 2 && (
              <span className="sb-text-muted">· Record {bestStreak}</span>
            )}
          </div>

          <button
            type="button"
            onClick={() => resetGame(!chronoEnabled)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-b-2 text-xs font-bold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
              chronoEnabled
                ? 'sb-chip-danger-solid border-b-[var(--sb-danger-3d)]'
                : 'sb-chip-idle border-b-[var(--sb-border-3d)] hover:border-[var(--sb-reward)] hover:sb-text-reward'
            }`}
          >
            <Timer className="w-3.5 h-3.5" aria-hidden="true" />
            {chronoEnabled ? (
              <span className="tabular-nums">Chrono {secondsLeft}s</span>
            ) : (
              'Activer Chrono 60s'
            )}
          </button>

          <button
            type="button"
            onClick={() => resetGame(chronoEnabled)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-b-2 sb-chip-idle border-b-[var(--sb-border-3d)] text-xs font-bold whitespace-nowrap shrink-0 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
            Mélanger
          </button>
        </div>
      </div>

      {/* Theme Selector Bar */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold sb-text-muted mr-1">Thème :</span>
        {VOCAB_DECKS.map((d) => (
          <button
            key={d.id}
            type="button"
            onClick={() => onChangeTheme(d.id)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
              themeId === d.id ? 'sb-chip-solid' : 'sb-chip-idle'
            }`}
          >
            {d.titleFr}
          </button>
        ))}
        <button
          type="button"
          onClick={() => onChangeTheme('time')}
          className={`px-3 py-1.5 rounded-xl border text-xs font-bold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
            themeId === 'time' ? 'sb-chip-solid' : 'sb-chip-idle'
          }`}
        >
          L’heure anglaise
        </button>
        {wordbank.length >= 4 && (
          <button
            type="button"
            onClick={() => onChangeTheme('wordbank')}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
              themeId === 'wordbank'
                ? 'sb-chip-solid'
                : 'sb-reward-pill hover:bg-[var(--sb-reward)] hover:text-[var(--sb-reward-contrast)]'
            }`}
          >
            Mon Carnet
          </button>
        )}
      </div>

      {/* Status Messages */}
      {allMatched && (
        <div
          role="status"
          className="p-4 rounded-2xl sb-status-success border flex flex-wrap items-center justify-between gap-3"
        >
          <div className="flex items-center gap-2 text-sm font-bold sb-text-success">
            <Sparkles className="w-5 h-5 sb-text-reward shrink-0" aria-hidden="true" />
            <span>
              Bravo ! Les {pairs.length} paires sont trouvées (+1 étoile) · Meilleure série : {bestStreak}.
            </span>
          </div>
          <button
            type="button"
            onClick={() => resetGame(chronoEnabled)}
            className="manga-btn-primary px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 cursor-pointer"
          >
            Rejouer
          </button>
        </div>
      )}

      {timedOut && (
        <div
          role="status"
          className="p-4 rounded-2xl sb-status-warn border flex flex-wrap items-center justify-between gap-3"
        >
          <span className="text-sm font-bold sb-text-primary">
            Temps écoulé ! Tu as trouvé {matchedIds.length}/{pairs.length} paires.
          </span>
          <button
            type="button"
            onClick={() => resetGame(true)}
            className="manga-btn-primary px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 cursor-pointer"
          >
            Retenter en 60s
          </button>
        </div>
      )}

      {feedback && !allMatched && !timedOut && (
        <div className="text-xs font-bold sb-text-reward">{feedback}</div>
      )}

      {/* Two-Column Match Arena */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2.5">
          <div className="text-xs font-bold tracking-wide sb-text-accent">1. Mot en anglais</div>
          {leftItems.map((item) => {
            const matched = matchedIds.includes(item.id);
            const selected = selectedEn === item.id;
            return (
              <div key={`en-${item.id}`} className="flex items-stretch gap-2">
                <button
                  type="button"
                  disabled={matched || timedOut}
                  onClick={() => {
                    playPop();
                    setSelectedEn(item.id);
                    setFeedback(null);
                    speakEnglish(item.en, { accent, rate: speechRate });
                  }}
                  className={`group flex-1 min-h-[50px] px-4 py-3 rounded-2xl border border-b-4 text-left text-sm font-bold flex items-center justify-between transition-all ${
                    matched
                      ? 'sb-status-success border-b-[var(--sb-success-3d)] cursor-default'
                      : selected
                        ? 'sb-status-danger border-b-[var(--sb-danger-3d)] cursor-pointer'
                        : 'sb-card-option cursor-pointer'
                  }`}
                >
                  <span className="flex items-center gap-3 min-w-0">
                    <span
                      aria-hidden="true"
                      className={`w-2.5 h-2.5 rotate-45 shrink-0 transition-colors ${
                        matched
                          ? 'bg-[var(--sb-success)]'
                          : selected
                            ? 'bg-[var(--sb-danger)]'
                            : 'bg-[var(--sb-accent)] group-hover:bg-[var(--sb-hover-accent)]'
                      }`}
                    />
                    <span>{item.en}</span>
                  </span>
                  {matched && <Check className="w-4 h-4 sb-text-success shrink-0" />}
                </button>
                <button
                  type="button"
                  onClick={() => speakEnglish(item.en, { accent, rate: speechRate })}
                  aria-label={`Écouter ${item.en}`}
                  className="px-3 rounded-2xl border border-b-4 sb-audio-btn border-b-[var(--sb-border-3d)] shrink-0 cursor-pointer"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>

        <div className="space-y-2.5">
          <div className="text-xs font-bold tracking-wide sb-text-reward">2. Sens en français</div>
          {rightItems.map((item) => {
            const matched = matchedIds.includes(item.id);
            return (
              <button
                key={`fr-${item.id}`}
                type="button"
                disabled={matched || timedOut}
                onClick={() => handleSelectFr(item.id)}
                className={`group w-full min-h-[50px] px-4 py-3 rounded-2xl border border-b-4 text-left text-sm font-bold flex items-center justify-between transition-all ${
                  matched
                    ? 'sb-status-success border-b-[var(--sb-success-3d)] cursor-default'
                    : 'sb-card-option cursor-pointer'
                }`}
              >
                <span className="flex items-center gap-3 min-w-0">
                  <span
                    aria-hidden="true"
                    className={`w-2.5 h-2.5 rounded-full border-2 shrink-0 transition-colors ${
                      matched
                        ? 'border-[var(--sb-success)] bg-[var(--sb-success)]'
                        : 'border-[var(--sb-reward)] group-hover:border-[var(--sb-accent)] group-hover:bg-[var(--sb-accent)]'
                    }`}
                  />
                  <span>{item.fr}</span>
                </span>
                {matched && <Check className="w-4 h-4 sb-text-success shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
