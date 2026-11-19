import { useState } from 'react';
import { Volume2, ChevronLeft, ChevronRight, Sparkles, Eye, EyeOff } from 'lucide-react';
import {
  HERO_BANNER_IMAGE,
  ICEBREAKER_PROMPTS,
  MOOD_OPTIONS,
  WEATHER_OPTIONS,
} from '../data/lessonData';
import type { UserRole, VoiceAccent, WarmupState } from '../types/lesson';
import { speakEnglish } from '../utils/speech';
import { ResilientImage } from './ResilientImage';

interface WarmupModuleProps {
  warmup: WarmupState;
  role: UserRole;
  accent: VoiceAccent;
  speechRate: number;
  onUpdate: (patch: Partial<WarmupState>) => void;
  onAwardStar: () => void;
  onNavigateModule: (tab: 'vocab' | 'builder' | 'roleplay' | 'board') => void;
}

export function WarmupModule({
  warmup,
  role,
  accent,
  speechRate,
  onUpdate,
  onAwardStar,
  onNavigateModule,
}: WarmupModuleProps) {
  const [showFrenchQuestion, setShowFrenchQuestion] = useState(false);

  const currentPrompt =
    ICEBREAKER_PROMPTS[warmup.promptIndex % ICEBREAKER_PROMPTS.length];

  const selectedMood = MOOD_OPTIONS.find((m) => m.id === warmup.mood);
  const selectedWeather = WEATHER_OPTIONS.find((w) => w.id === warmup.weather);

  const spokenOpener = (() => {
    if (selectedMood && selectedWeather) {
      return `Hello! Today I feel ${selectedMood.en} and the weather is ${selectedWeather.en}.`;
    }
    if (selectedMood) {
      return `Hello! Today I feel ${selectedMood.en}.`;
    }
    if (selectedWeather) {
      return `Hello! Today the weather is ${selectedWeather.en}.`;
    }
    return 'Hello! How are you feeling today?';
  })();

  const handleNextPrompt = () => {
    onUpdate({
      promptIndex: (warmup.promptIndex + 1) % ICEBREAKER_PROMPTS.length,
      studentAnswer: '',
    });
  };

  const handlePrevPrompt = () => {
    onUpdate({
      promptIndex:
        (warmup.promptIndex - 1 + ICEBREAKER_PROMPTS.length) %
        ICEBREAKER_PROMPTS.length,
      studentAnswer: '',
    });
  };

  return (
    <div className="space-y-8">
      {/* Split Hero: Editorial Welcome + Manga Studio Window Art */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-7 manga-panel p-6 lg:p-8 flex flex-col justify-between gap-6">
          <div className="space-y-3">
            <p className="text-xs font-bold tracking-wide sb-text-accent">
              Chapitre 01 · Rituel d’ouverture · Niveau A1–A2 (11 ans)
            </p>
            <h1 className="text-2xl lg:text-3xl font-bold sb-text-primary tracking-wide text-balance">
              Bienvenue dans ton studio manga d’anglais en direct
            </h1>
            <p className="sb-text-secondary text-[15px] leading-relaxed max-w-2xl">
              On commence chaque épisode en visio par 5 minutes d’échauffement oral :
              dire comment tu te sens, décrire la météo et relever une question
              « Would You Rather? ».
            </p>
          </div>

          {/* 4 quick lesson steps */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t sb-divider">
            <button
              type="button"
              onClick={() => onNavigateModule('vocab')}
              className="text-left p-3 rounded-2xl border border-b-4 sb-card-option transition-all cursor-pointer group"
            >
              <div className="text-xs font-mono sb-text-reward font-bold tabular-nums">01 · Cartes</div>
              <div className="text-sm font-bold tracking-wide sb-text-primary group-hover:sb-text-accent mt-0.5 truncate">
                Vocabulaire
              </div>
            </button>
            <button
              type="button"
              onClick={() => onNavigateModule('builder')}
              className="text-left p-3 rounded-2xl border border-b-4 sb-card-option transition-all cursor-pointer group"
            >
              <div className="text-xs font-mono sb-text-reward font-bold tabular-nums">02 · Fiches</div>
              <div className="text-sm font-bold tracking-wide sb-text-primary group-hover:sb-text-accent mt-0.5 truncate">
                Guide & Phrases
              </div>
            </button>
            <button
              type="button"
              onClick={() => onNavigateModule('roleplay')}
              className="text-left p-3 rounded-2xl border border-b-4 sb-card-option transition-all cursor-pointer group"
            >
              <div className="text-xs font-mono sb-text-reward font-bold tabular-nums">03 · Arcade</div>
              <div className="text-sm font-bold tracking-wide sb-text-primary group-hover:sb-text-reward mt-0.5 truncate">
                Mini-Jeux & L’heure
              </div>
            </button>
            <button
              type="button"
              onClick={() => onNavigateModule('board')}
              className="text-left p-3 rounded-2xl border border-b-4 sb-card-option transition-all cursor-pointer group"
            >
              <div className="text-xs font-mono sb-text-reward font-bold tabular-nums">04 · Notes</div>
              <div className="text-sm font-bold tracking-wide sb-text-primary group-hover:sb-text-accent mt-0.5 truncate">
                Tableau & Carnet
              </div>
            </button>
          </div>
        </div>

        <div className="lg:col-span-5 manga-panel overflow-hidden min-h-[240px]">
          <ResilientImage
            src={HERO_BANNER_IMAGE}
            alt="Illustration manga d'une élève avec casque audio à son bureau face à Londres et Big Ben"
            fallbackTitle="StoryBridge Manga Studio"
            className="w-full h-full lg:h-full object-cover"
          />
        </div>
      </section>

      {/* Two-Column Check-in & Icebreaker Stage */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Mood & Weather Builder */}
        <div className="lg:col-span-6 manga-panel p-6 space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold tracking-wide sb-text-primary">
                1. How are you today?
              </h2>
              <p className="text-sm sb-text-muted mt-0.5">
                Clique sur ton humeur et la météo pour construire ta bulle de dialogue.
              </p>
            </div>
            <button
              type="button"
              onClick={() => speakEnglish(spokenOpener, { accent, rate: speechRate })}
              className="manga-btn-primary inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Volume2 className="w-4 h-4" aria-hidden="true" />
              Écouter
            </button>
          </div>

          {/* Mood grid */}
          <div className="space-y-2">
            <div className="text-xs font-bold tracking-wide sb-text-accent">
              My mood today (Mon humeur)
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {MOOD_OPTIONS.map((mood) => {
                const active = warmup.mood === mood.id;
                return (
                  <button
                    key={mood.id}
                    type="button"
                    onClick={() =>
                      onUpdate({ mood: active ? null : mood.id })
                    }
                    className={`px-3 py-2.5 rounded-2xl border border-b-4 text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                      active ? 'sb-card-selected' : 'sb-card-option'
                    }`}
                  >
                    <span
                      className={`w-2.5 h-2.5 rotate-45 shrink-0 transition-colors ${
                        active ? 'bg-[var(--sb-reward)]' : 'bg-[var(--sb-accent)]/75'
                      }`}
                      aria-hidden="true"
                    />
                    <div className="min-w-0">
                      <div className="text-sm font-bold tracking-wide truncate">{mood.en}</div>
                      <div className="text-xs sb-text-muted truncate">{mood.fr}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Weather grid */}
          <div className="space-y-2">
            <div className="text-xs font-bold tracking-wide sb-text-accent">
              Outside my window (La météo)
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {WEATHER_OPTIONS.map((weather) => {
                const active = warmup.weather === weather.id;
                return (
                  <button
                    key={weather.id}
                    type="button"
                    onClick={() =>
                      onUpdate({ weather: active ? null : weather.id })
                    }
                    className={`px-3 py-2.5 rounded-2xl border border-b-4 text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                      active ? 'sb-card-selected' : 'sb-card-option'
                    }`}
                  >
                    <span
                      className={`w-2.5 h-2.5 rounded-full border-2 shrink-0 ${
                        active
                          ? 'bg-[var(--sb-reward)] border-[var(--sb-reward)]'
                          : 'bg-transparent border-[var(--sb-accent)]/80'
                      }`}
                      aria-hidden="true"
                    />
                    <div className="min-w-0">
                      <div className="text-sm font-bold tracking-wide truncate">{weather.en}</div>
                      <div className="text-xs sb-text-muted truncate">{weather.fr}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Live Spoken Sentence Box */}
          <div className="pt-4 border-t sb-divider flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-xs sb-text-muted">Phrase à lire à voix haute :</div>
              <p className="text-base font-bold sb-text-reward mt-0.5">
                “{spokenOpener}”
              </p>
            </div>
            {role === 'tutor' && (
              <button
                type="button"
                onClick={onAwardStar}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-b-2 sb-reward-btn text-xs font-bold whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                Valider +1 étoile
              </button>
            )}
          </div>
        </div>

        {/* Right: Would You Rather? Oral Icebreaker */}
        <div className="lg:col-span-6 manga-panel p-6 space-y-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold tracking-wide sb-text-primary">
                2. Question « Would You Rather? »
              </h2>
              <p className="text-sm sb-text-muted mt-0.5 tabular-nums">
                Défi oral {(warmup.promptIndex % ICEBREAKER_PROMPTS.length) + 1} sur{' '}
                {ICEBREAKER_PROMPTS.length}
              </p>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={handlePrevPrompt}
                aria-label="Question précédente"
                className="p-2 rounded-xl border sb-chip-idle transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleNextPrompt}
                aria-label="Question suivante"
                className="p-2 rounded-xl border sb-chip-idle transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="p-5 rounded-2xl border sb-surface-soft space-y-4">
            <div className="flex items-start justify-between gap-3">
              <p className="text-lg font-bold sb-text-primary leading-snug">
                {currentPrompt.questionEn}
              </p>
              <button
                type="button"
                onClick={() =>
                  speakEnglish(currentPrompt.questionEn, { accent, rate: speechRate })
                }
                aria-label="Écouter la question en anglais"
                className="p-2 rounded-xl border sb-audio-btn transition-colors shrink-0 cursor-pointer"
              >
                <Volume2 className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setShowFrenchQuestion((v) => !v)}
                className="inline-flex items-center gap-1.5 text-xs font-bold sb-text-muted hover:sb-text-accent transition-colors cursor-pointer"
              >
                {showFrenchQuestion ? (
                  <EyeOff className="w-3.5 h-3.5" aria-hidden="true" />
                ) : (
                  <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                )}
                {showFrenchQuestion ? 'Masquer l’aide en français' : 'Afficher l’aide en français'}
              </button>
            </div>

            {showFrenchQuestion && (
              <p className="text-sm sb-text-secondary pt-2 border-t sb-divider">
                {currentPrompt.questionFr}
              </p>
            )}

            {/* Quick choice starters styled as battle cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  const starter = `I would rather choose: ${currentPrompt.optionA.toLowerCase()} because `;
                  onUpdate({ studentAnswer: starter });
                  speakEnglish(currentPrompt.optionA, { accent, rate: speechRate });
                }}
                className="px-4 py-3.5 rounded-2xl border border-b-4 sb-card-option text-left text-sm font-bold transition-all cursor-pointer flex items-center gap-3 group"
              >
                <span
                  className="w-3 h-3 rotate-45 bg-[var(--sb-accent)] group-hover:bg-[var(--sb-reward)] shrink-0 transition-colors"
                  aria-hidden="true"
                />
                <span>Option A · {currentPrompt.optionA}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  const starter = `I would rather choose: ${currentPrompt.optionB.toLowerCase()} because `;
                  onUpdate({ studentAnswer: starter });
                  speakEnglish(currentPrompt.optionB, { accent, rate: speechRate });
                }}
                className="px-4 py-3.5 rounded-2xl border border-b-4 sb-card-option text-left text-sm font-bold transition-all cursor-pointer flex items-center gap-3 group"
              >
                <span
                  className="w-3 h-3 rounded-full border-2 border-[var(--sb-danger)] group-hover:border-[var(--sb-accent)] group-hover:bg-[var(--sb-accent-soft)] shrink-0 transition-colors"
                  aria-hidden="true"
                />
                <span>Option B · {currentPrompt.optionB}</span>
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label
                htmlFor="icebreaker-answer"
                className="text-xs font-bold tracking-wide sb-text-secondary"
              >
                Ta réponse en anglais (synchronisée en direct)
              </label>
              <span className="text-xs sb-text-accent font-mono">
                {currentPrompt.starterEn}
              </span>
            </div>
            <textarea
              id="icebreaker-answer"
              rows={2}
              value={warmup.studentAnswer}
              onChange={(e) => onUpdate({ studentAnswer: e.target.value })}
              placeholder="Écris ou dicte ton idée ici (ex: I would rather have a pet dragon because it can fly)..."
              className="w-full rounded-2xl border sb-input px-3.5 py-2.5 text-sm"
            />
            {warmup.studentAnswer.trim().length > 0 && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() =>
                    speakEnglish(warmup.studentAnswer, { accent, rate: speechRate })
                  }
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold sb-text-accent hover:bg-[var(--sb-accent-soft)] transition-colors cursor-pointer"
                >
                  <Volume2 className="w-3.5 h-3.5" aria-hidden="true" />
                  Lire ma phrase à voix haute
                </button>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
