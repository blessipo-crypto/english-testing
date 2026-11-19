import { useMemo, useState } from 'react';
import {
  Volume2,
  Eye,
  EyeOff,
  BookmarkPlus,
  Check,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { VOCAB_DECKS } from '../data/lessonData';
import type { VocabState, VoiceAccent, WordbankItem } from '../types/lesson';
import { speakEnglish } from '../utils/speech';
import { ResilientImage } from './ResilientImage';

interface VocabModuleProps {
  vocab: VocabState;
  accent: VoiceAccent;
  speechRate: number;
  wordbank: WordbankItem[];
  onUpdate: (patch: Partial<VocabState>) => void;
  onAddWord: (item: Omit<WordbankItem, 'id' | 'addedAt'>) => void;
  onAwardStar: () => void;
}

export function VocabModule({
  vocab,
  accent,
  speechRate,
  wordbank,
  onUpdate,
  onAddWord,
  onAwardStar,
}: VocabModuleProps) {
  const [revealInBlind, setRevealInBlind] = useState(false);
  const [selectedEnId, setSelectedEnId] = useState<string | null>(null);
  const [matchError, setMatchError] = useState<string | null>(null);

  const activeDeck =
    VOCAB_DECKS.find((d) => d.id === vocab.deckId) || VOCAB_DECKS[0];
  const cardIndex = vocab.cardIndex % activeDeck.cards.length;
  const activeCard = activeDeck.cards[cardIndex];

  const isAlreadyInWordbank = wordbank.some(
    (w) => w.en.toLowerCase() === activeCard.en.toLowerCase()
  );

  // Deterministic shuffled order for French matching column based on deckId
  const shuffledFrCards = useMemo(() => {
    const copy = [...activeDeck.cards];
    copy.sort((a, b) => a.fr.localeCompare(b.fr));
    return copy;
  }, [activeDeck]);

  const handleSelectCard = (index: number) => {
    setRevealInBlind(false);
    onUpdate({ cardIndex: index });
  };

  const handleMatchFr = (frCardId: string) => {
    if (!selectedEnId) {
      setMatchError('Sélectionne d’abord un mot anglais à gauche.');
      return;
    }
    if (selectedEnId === frCardId) {
      const nextMatched = vocab.matchedIds.includes(frCardId)
        ? vocab.matchedIds
        : [...vocab.matchedIds, frCardId];
      const matchedCard = activeDeck.cards.find((c) => c.id === frCardId);
      if (matchedCard) {
        speakEnglish(matchedCard.en, { accent, rate: speechRate });
      }
      setSelectedEnId(null);
      setMatchError(null);
      onUpdate({ matchedIds: nextMatched });
      if (nextMatched.length === activeDeck.cards.length) {
        onAwardStar();
      }
    } else {
      setMatchError('Pas tout à fait ! Réessaie avec une autre traduction.');
      setSelectedEnId(null);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Main Interactive Stage (Left 8 cols) */}
      <div className="lg:col-span-8 space-y-6">
        {/* Deck Header & Mode Switcher */}
        <div className="manga-panel p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="text-xs font-bold tracking-wide sb-text-accent">
              Thème actif · {activeDeck.cards.length} mots illustrés
            </div>
            <h1 className="text-xl font-bold tracking-wide sb-text-primary">
              {activeDeck.titleFr}
            </h1>
          </div>

          <div className="flex items-center gap-1 p-1 sb-seg-track border rounded-2xl self-start sm:self-auto shrink-0">
            <button
              type="button"
              onClick={() => onUpdate({ mode: 'cards' })}
              className={`px-3 py-1.5 text-xs font-bold tracking-wide rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                vocab.mode === 'cards' ? 'sb-seg-active' : 'sb-seg-idle'
              }`}
            >
              Cartes Audio
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedEnId(null);
                setMatchError(null);
                onUpdate({ mode: 'match' });
              }}
              className={`px-3 py-1.5 text-xs font-bold tracking-wide rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                vocab.mode === 'match' ? 'sb-seg-active' : 'sb-seg-idle'
              }`}
            >
              Jeu d’association
            </button>
          </div>
        </div>

        {vocab.mode === 'cards' ? (
          <div className="manga-panel overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-12 items-stretch">
              {/* Theme Artwork */}
              <div className="md:col-span-5 sb-surface border-b md:border-b-0 md:border-r sb-divider">
                <ResilientImage
                  src={activeDeck.imageUrl}
                  alt={activeDeck.titleEn}
                  fallbackTitle={activeDeck.titleEn}
                  className="w-full h-56 md:h-full object-cover"
                />
              </div>

              {/* Active Flashcard Content */}
              <div className="md:col-span-7 p-6 lg:p-8 flex flex-col justify-between gap-6">
                <div className="space-y-4">
                  {/* Top metadata + Blind Test toggle */}
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="text-xs sb-text-muted flex items-center gap-2 font-semibold">
                      <span className="sb-text-accent">{activeCard.partOfSpeech}</span>
                      <span aria-hidden="true">·</span>
                      <span className="sb-text-reward">Niveau {activeCard.level}</span>
                      <span aria-hidden="true">·</span>
                      <span className="tabular-nums">
                        Carte {cardIndex + 1}/{activeDeck.cards.length}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setRevealInBlind(false);
                        onUpdate({ blindMode: !vocab.blindMode });
                      }}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-xs font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        vocab.blindMode ? 'sb-reward-pill' : 'sb-chip-idle'
                      }`}
                    >
                      {vocab.blindMode ? (
                        <EyeOff className="w-3.5 h-3.5" aria-hidden="true" />
                      ) : (
                        <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                      )}
                      {vocab.blindMode ? 'Mode Défi actif' : 'Masquer traduction'}
                    </button>
                  </div>

                  {/* Main English Word + Audio Controls */}
                  <div className="space-y-2 pt-2">
                    <div className="flex flex-wrap items-baseline gap-3">
                      <h2 className="text-3xl lg:text-4xl font-bold sb-text-primary tracking-wide">
                        {activeCard.en}
                      </h2>
                      <span className="font-mono text-sm sb-text-accent">
                        {activeCard.phonetic}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() =>
                          speakEnglish(activeCard.en, { accent, rate: speechRate })
                        }
                        className="manga-btn-primary inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        <Volume2 className="w-4 h-4" aria-hidden="true" />
                        Prononcer
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          speakEnglish(activeCard.en, { accent, rate: 0.7 })
                        }
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-b-2 sb-card-option text-xs font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        Lent (0.7x)
                      </button>
                    </div>
                  </div>

                  {/* French Meaning (or Blind Quiz toggle) */}
                  <div className="pt-3 border-t sb-divider">
                    {vocab.blindMode && !revealInBlind ? (
                      <button
                        type="button"
                        onClick={() => setRevealInBlind(true)}
                        className="px-3.5 py-2 rounded-xl border sb-reward-btn text-xs font-bold transition-colors cursor-pointer"
                      >
                        Révéler la traduction française
                      </button>
                    ) : (
                      <p className="text-lg font-bold sb-text-reward">
                        {activeCard.fr}
                      </p>
                    )}
                  </div>

                  {/* Example Sentence */}
                  <div className="p-4 rounded-2xl border sb-surface-soft space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold sb-text-primary leading-relaxed">
                        “{activeCard.exampleEn}”
                      </p>
                      <button
                        type="button"
                        onClick={() =>
                          speakEnglish(activeCard.exampleEn, {
                            accent,
                            rate: speechRate,
                          })
                        }
                        aria-label="Écouter la phrase d'exemple"
                        className="p-1.5 rounded-lg border sb-audio-btn shrink-0 cursor-pointer"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {(!vocab.blindMode || revealInBlind) && (
                      <p className="text-xs sb-text-muted">
                        {activeCard.exampleFr}
                      </p>
                    )}
                  </div>
                </div>

                {/* Card Footer Navigation & Wordbank */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t sb-divider">
                  <button
                    type="button"
                    disabled={isAlreadyInWordbank}
                    onClick={() =>
                      onAddWord({
                        en: activeCard.en,
                        fr: activeCard.fr,
                        note: `${activeCard.phonetic} · ${activeCard.exampleEn}`,
                      })
                    }
                    className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold transition-colors whitespace-nowrap shrink-0 ${
                      isAlreadyInWordbank
                        ? 'sb-status-success cursor-default'
                        : 'sb-chip-idle cursor-pointer'
                    }`}
                  >
                    {isAlreadyInWordbank ? (
                      <>
                        <Check className="w-3.5 h-3.5 sb-text-success" aria-hidden="true" />
                        Ajouté au carnet
                      </>
                    ) : (
                      <>
                        <BookmarkPlus className="w-3.5 h-3.5 sb-text-accent" aria-hidden="true" />
                        Ajouter au carnet
                      </>
                    )}
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        handleSelectCard(
                          (cardIndex - 1 + activeDeck.cards.length) %
                            activeDeck.cards.length
                        )
                      }
                      className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border sb-chip-idle text-xs font-bold cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" aria-hidden="true" />
                      Précédent
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleSelectCard(
                          (cardIndex + 1) % activeDeck.cards.length
                        )
                      }
                      className="manga-btn-primary inline-flex items-center gap-1 px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer"
                    >
                      Suivant
                      <ChevronRight className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Interactive Match Game */
          <div className="manga-panel p-6 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold tracking-wide sb-text-primary">
                  Associe chaque mot anglais à sa traduction
                </h2>
                <p className="text-xs sb-text-accent font-bold mt-0.5 tabular-nums">
                  {vocab.matchedIds.length} / {activeDeck.cards.length} paires trouvées
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedEnId(null);
                  setMatchError(null);
                  onUpdate({ matchedIds: [] });
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border sb-chip-idle text-xs font-bold cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                Recommencer
              </button>
            </div>

            {matchError && (
              <div
                role="status"
                className="px-4 py-2.5 rounded-xl border sb-status-warn text-xs font-bold"
              >
                {matchError}
              </div>
            )}

            {vocab.matchedIds.length === activeDeck.cards.length && (
              <div
                role="status"
                className="px-4 py-3 rounded-2xl border sb-status-success text-sm font-bold flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4 sb-text-reward" aria-hidden="true" />
                Bravo ! Toutes les paires du thème ont été associées (+1 étoile).
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* English column */}
              <div className="space-y-2.5">
                <div className="text-xs font-bold tracking-wide sb-text-accent">
                  1. Mot en anglais
                </div>
                {activeDeck.cards.map((card) => {
                  const matched = vocab.matchedIds.includes(card.id);
                  const selected = selectedEnId === card.id;
                  return (
                    <button
                      key={card.id}
                      type="button"
                      disabled={matched}
                      onClick={() => {
                        setMatchError(null);
                        setSelectedEnId(card.id);
                        speakEnglish(card.en, { accent, rate: speechRate });
                      }}
                      className={`w-full px-4 py-3 rounded-2xl border border-b-4 text-left text-sm font-bold flex items-center justify-between gap-2 transition-all ${
                        matched
                          ? 'sb-status-success border-b-emerald-700 cursor-default'
                          : selected
                            ? 'sb-card-selected cursor-pointer'
                            : 'sb-card-option cursor-pointer'
                      }`}
                    >
                      <span className="flex items-center gap-2.5 min-w-0">
                        <span
                          className={`w-2.5 h-2.5 rotate-45 shrink-0 ${
                            matched
                              ? 'bg-emerald-500'
                              : selected
                                ? 'bg-[var(--sb-reward)]'
                                : 'bg-[var(--sb-accent)]'
                          }`}
                          aria-hidden="true"
                        />
                        <span className="truncate">{card.en}</span>
                      </span>
                      {matched && (
                        <Check className="w-4 h-4 sb-text-success shrink-0" aria-hidden="true" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* French column */}
              <div className="space-y-2.5">
                <div className="text-xs font-bold tracking-wide sb-text-reward">
                  2. Traduction en français
                </div>
                {shuffledFrCards.map((card) => {
                  const matched = vocab.matchedIds.includes(card.id);
                  return (
                    <button
                      key={card.id}
                      type="button"
                      disabled={matched}
                      onClick={() => handleMatchFr(card.id)}
                      className={`w-full px-4 py-3 rounded-2xl border border-b-4 text-left text-sm font-bold flex items-center justify-between gap-2 transition-all ${
                        matched
                          ? 'sb-status-success border-b-emerald-700 cursor-default'
                          : 'sb-card-option cursor-pointer'
                      }`}
                    >
                      <span className="flex items-center gap-2.5 min-w-0">
                        <span
                          className={`w-2.5 h-2.5 rounded-full border-2 shrink-0 ${
                            matched
                              ? 'bg-emerald-500 border-emerald-500'
                              : 'border-[var(--sb-reward)]'
                          }`}
                          aria-hidden="true"
                        />
                        <span className="truncate">{card.fr}</span>
                      </span>
                      {matched && (
                        <Check className="w-4 h-4 sb-text-success shrink-0" aria-hidden="true" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Right Sidebar: Deck Switcher & Word List (4 cols) */}
      <aside className="lg:col-span-4 space-y-4">
        <div className="manga-panel p-5 space-y-3">
          <h2 className="text-sm font-bold tracking-wide sb-text-primary">
            Choisir un thème
          </h2>
          <div className="space-y-2">
            {VOCAB_DECKS.map((deck) => {
              const isSelected = deck.id === activeDeck.id;
              return (
                <button
                  key={deck.id}
                  type="button"
                  onClick={() => {
                    setRevealInBlind(false);
                    setSelectedEnId(null);
                    setMatchError(null);
                    onUpdate({ deckId: deck.id, cardIndex: 0, matchedIds: [] });
                  }}
                  className={`w-full p-3 rounded-2xl border border-b-4 text-left transition-all cursor-pointer ${
                    isSelected ? 'sb-card-selected' : 'sb-card-option'
                  }`}
                >
                  <div className="text-sm font-bold sb-text-primary">
                    {deck.titleFr}
                  </div>
                  <div className="text-xs sb-text-muted mt-0.5">
                    {deck.titleEn} · {deck.cards.length} cartes
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="manga-panel p-5 space-y-3">
          <h2 className="text-sm font-bold tracking-wide sb-text-primary">
            Mots de ce thème
          </h2>
          <div className="divide-y sb-divide">
            {activeDeck.cards.map((c, idx) => {
              const isCurrent = idx === cardIndex && vocab.mode === 'cards';
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    setRevealInBlind(false);
                    onUpdate({ mode: 'cards', cardIndex: idx });
                  }}
                  className={`w-full py-2.5 px-2.5 text-left flex items-center justify-between gap-2 rounded-xl transition-colors cursor-pointer ${
                    isCurrent
                      ? 'bg-[var(--sb-accent-soft)] sb-text-accent font-bold'
                      : 'sb-text-secondary hover:bg-[var(--sb-bg-surface)]'
                  }`}
                >
                  <span className="text-sm font-semibold">{c.en}</span>
                  <span className="text-xs sb-text-muted truncate">
                    {vocab.blindMode ? '•••' : c.fr}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </aside>
    </div>
  );
}
