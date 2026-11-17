import { useMemo, useState } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Volume2,
  Lightbulb,
  PlusCircle,
} from 'lucide-react';
import { SENTENCE_CHALLENGES } from '../data/lessonData';
import type { BuilderState, UserRole, VoiceAccent } from '../types/lesson';
import { speakEnglish } from '../utils/speech';

interface BuilderModuleProps {
  builder: BuilderState;
  role: UserRole;
  accent: VoiceAccent;
  speechRate: number;
  onUpdate: (patch: Partial<BuilderState>) => void;
  onAwardStar: () => void;
}

function deterministicShuffle(words: string[], seedKey: string): string[] {
  const indexed = words.map((word, idx) => ({ word, idx }));
  let hash = 0;
  for (let i = 0; i < seedKey.length; i++) {
    hash = (hash * 31 + seedKey.charCodeAt(i)) % 100000;
  }
  indexed.sort((a, b) => {
    const scoreA = ((a.idx + 3) * (hash + 17)) % 97;
    const scoreB = ((b.idx + 3) * (hash + 17)) % 97;
    return scoreA - scoreB || a.idx - b.idx;
  });
  return indexed.map((item) => item.word);
}

export function BuilderModule({
  builder,
  role,
  accent,
  speechRate,
  onUpdate,
  onAwardStar,
}: BuilderModuleProps) {
  const [showHint, setShowHint] = useState(false);
  const [draftFr, setDraftFr] = useState('');
  const [draftEn, setDraftEn] = useState('');

  const activeChallenge =
    SENTENCE_CHALLENGES[builder.challengeIndex % SENTENCE_CHALLENGES.length];

  const promptFr = builder.isCustomActive
    ? builder.customPromptFr || 'Phrase créée en direct par le professeur'
    : activeChallenge.promptFr;

  const targetSentence = builder.isCustomActive
    ? builder.customSentenceEn.trim()
    : activeChallenge.targetEn;

  const targetWords = useMemo(
    () => targetSentence.split(/\s+/).filter(Boolean),
    [targetSentence]
  );

  const scrambledWords = useMemo(
    () =>
      deterministicShuffle(
        targetWords,
        builder.isCustomActive ? targetSentence : activeChallenge.id
      ),
    [targetWords, builder.isCustomActive, targetSentence, activeChallenge.id]
  );

  const builtWords = builder.selectedIndices
    .map((idx) => scrambledWords[idx])
    .filter((w): w is string => typeof w === 'string');

  const handleAddToken = (index: number) => {
    if (builder.selectedIndices.includes(index)) return;
    onUpdate({
      selectedIndices: [...builder.selectedIndices, index],
      checkedStatus: 'idle',
    });
  };

  const handleRemoveToken = (indexToRemove: number) => {
    onUpdate({
      selectedIndices: builder.selectedIndices.filter((i) => i !== indexToRemove),
      checkedStatus: 'idle',
    });
  };

  const handleCheck = () => {
    const normalizedBuilt = builtWords.join(' ').trim().toLowerCase();
    const normalizedTarget = targetWords.join(' ').trim().toLowerCase();
    if (normalizedBuilt === normalizedTarget && normalizedTarget.length > 0) {
      onUpdate({ checkedStatus: 'correct' });
      speakEnglish(targetSentence, { accent, rate: speechRate });
      onAwardStar();
    } else {
      onUpdate({ checkedStatus: 'incorrect' });
    }
  };

  const handleSelectChallenge = (idx: number) => {
    setShowHint(false);
    onUpdate({
      challengeIndex: idx,
      isCustomActive: false,
      selectedIndices: [],
      checkedStatus: 'idle',
    });
  };

  const handleLaunchCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draftEn.trim()) return;
    setShowHint(false);
    onUpdate({
      isCustomActive: true,
      customPromptFr: draftFr.trim() || 'Reconstruis la phrase du professeur',
      customSentenceEn: draftEn.trim(),
      selectedIndices: [],
      checkedStatus: 'idle',
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Main Sentence Construction Stage (8 cols) */}
      <div className="lg:col-span-8 manga-panel p-6 lg:p-8 space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="text-xs text-slate-500">
              {builder.isCustomActive
                ? 'Exercice en direct · Phrase sur mesure'
                : `${activeChallenge.topicFr} · Niveau ${activeChallenge.level}`}
            </div>
            <h1 className="text-xl lg:text-2xl font-bold text-slate-900">
              {promptFr}
            </h1>
          </div>

          {!builder.isCustomActive && (
            <button
              type="button"
              onClick={() => setShowHint((v) => !v)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Lightbulb className="w-3.5 h-3.5 text-amber-600" aria-hidden="true" />
              {showHint ? 'Masquer l’indice' : 'Indice grammaire'}
            </button>
          )}
        </div>

        {showHint && !builder.isCustomActive && (
          <div className="p-3.5 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-950">
            {activeChallenge.grammarHintFr}
          </div>
        )}

        {/* Construction Tray */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600">
              Ta phrase en anglais (clique sur les étiquettes pour les placer ou retirer)
            </span>
            {builtWords.length > 0 && (
              <button
                type="button"
                onClick={() =>
                  speakEnglish(builtWords.join(' '), { accent, rate: speechRate })
                }
                className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-700 hover:text-indigo-900 cursor-pointer"
              >
                <Volume2 className="w-3.5 h-3.5" aria-hidden="true" />
                Écouter l’essai
              </button>
            )}
          </div>

          <div className="min-h-[88px] p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap items-center gap-2">
            {builder.selectedIndices.length === 0 ? (
              <span className="text-sm text-slate-400">
                Clique sur les mots ci-dessous dans le bon ordre...
              </span>
            ) : (
              builder.selectedIndices.map((idx) => (
                <button
                  key={`placed-${idx}`}
                  type="button"
                  onClick={() => handleRemoveToken(idx)}
                  className="px-3.5 py-2 rounded-lg bg-white border border-indigo-300 text-sm font-semibold text-slate-900 shadow-2xs hover:bg-rose-50 hover:border-rose-300 transition-colors cursor-pointer"
                >
                  {scrambledWords[idx]}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Available Word Magnets */}
        <div className="space-y-2">
          <div className="text-xs font-semibold text-slate-600">
            Mots disponibles
          </div>
          <div className="flex flex-wrap gap-2">
            {scrambledWords.map((word, idx) => {
              const used = builder.selectedIndices.includes(idx);
              return (
                <button
                  key={`bank-${idx}-${word}`}
                  type="button"
                  disabled={used}
                  onClick={() => handleAddToken(idx)}
                  className={`px-3.5 py-2 rounded-lg border text-sm font-semibold transition-colors ${
                    used
                      ? 'bg-slate-100 border-slate-200 text-slate-300 cursor-default'
                      : 'bg-white border-slate-300 text-slate-800 hover:border-indigo-600 hover:bg-indigo-50 cursor-pointer'
                  }`}
                >
                  {word}
                </button>
              );
            })}
          </div>
        </div>

        {/* Status Message (Explicit icon + text, never color alone) */}
        {builder.checkedStatus === 'correct' && (
          <div
            role="status"
            className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 flex flex-wrap items-center justify-between gap-3"
          >
            <div className="flex items-center gap-2 text-sm font-semibold text-emerald-900">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" aria-hidden="true" />
              <span>Exact ! Tu as gagné 1 étoile pour cette phrase.</span>
            </div>
            <button
              type="button"
              onClick={() =>
                speakEnglish(targetSentence, { accent, rate: speechRate })
              }
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 text-white text-xs font-semibold hover:bg-emerald-800 cursor-pointer"
            >
              <Volume2 className="w-3.5 h-3.5" aria-hidden="true" />
              Réécouter
            </button>
          </div>
        )}

        {builder.checkedStatus === 'incorrect' && (
          <div
            role="status"
            className="p-4 rounded-lg bg-amber-50 border border-amber-200 flex items-center gap-2 text-sm font-medium text-amber-950"
          >
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" aria-hidden="true" />
            <span>
              Presque ! Vérifie l’ordre du sujet, du verbe ou des compléments, puis réessaie.
            </span>
          </div>
        )}

        {/* Action Bar */}
        <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() =>
              onUpdate({ selectedIndices: [], checkedStatus: 'idle' })
            }
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
            Vider le plateau
          </button>

          <div className="flex items-center gap-2.5">
            {!builder.isCustomActive && (
              <button
                type="button"
                onClick={() =>
                  handleSelectChallenge(
                    (builder.challengeIndex + 1) % SENTENCE_CHALLENGES.length
                  )
                }
                className="px-3.5 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Défi suivant
              </button>
            )}
            <button
              type="button"
              disabled={builder.selectedIndices.length === 0}
              onClick={handleCheck}
              className="px-4 py-2 rounded-lg bg-indigo-700 text-white text-xs font-semibold hover:bg-indigo-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              Vérifier la phrase
            </button>
          </div>
        </div>
      </div>

      {/* Right Column: Challenge Picker + Live Tutor Custom Sentence (4 cols) */}
      <aside className="lg:col-span-4 space-y-4">
        {/* Live Custom Sentence Generator for Visio */}
        <div className="manga-panel p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">
              Créer une phrase en direct
            </h2>
            <span className="text-xs text-slate-500">
              {role === 'tutor' ? 'Outil Prof' : 'Libre'}
            </span>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Idéal pendant la visio : écris n’importe quelle phrase anglaise pour la
            découper immédiatement en étiquettes mélangées.
          </p>
          <form onSubmit={handleLaunchCustom} className="space-y-2.5">
            <input
              type="text"
              value={draftFr}
              onChange={(e) => setDraftFr(e.target.value)}
              placeholder="Consigne en français (optionnel)"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600"
            />
            <input
              type="text"
              value={draftEn}
              onChange={(e) => setDraftEn(e.target.value)}
              placeholder="Phrase cible en anglais (ex: She has two cats)"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600"
            />
            <button
              type="submit"
              disabled={!draftEn.trim()}
              className="w-full inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 disabled:opacity-40 cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" aria-hidden="true" />
              Lancer aux tuiles
            </button>
          </form>
        </div>

        {/* Curated Challenge List */}
        <div className="manga-panel p-5 space-y-3">
          <h2 className="text-sm font-semibold text-slate-900">
            Défis de grammaire ({SENTENCE_CHALLENGES.length})
          </h2>
          <div className="space-y-1.5">
            {SENTENCE_CHALLENGES.map((sc, idx) => {
              const active =
                !builder.isCustomActive && builder.challengeIndex === idx;
              return (
                <button
                  key={sc.id}
                  type="button"
                  onClick={() => handleSelectChallenge(idx)}
                  className={`w-full p-2.5 rounded-lg border text-left transition-colors cursor-pointer ${
                    active
                      ? 'bg-indigo-50 border-indigo-600'
                      : 'bg-slate-50/60 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <div className="text-xs font-semibold text-slate-900">
                    {idx + 1}. {sc.topicFr}
                  </div>
                  <div className="text-xs text-slate-500 truncate mt-0.5">
                    {sc.promptFr}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </aside>
    </div>
  );
}
