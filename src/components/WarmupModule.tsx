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
            <p className="text-xs font-semibold text-rose-600">
              Chapitre 01 · Rituel d’ouverture · Niveau A1–A2 (11 ans)
            </p>
            <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 tracking-tight text-balance">
              Bienvenue dans ton studio manga d’anglais en direct
            </h1>
            <p className="text-slate-600 text-[15px] leading-relaxed max-w-2xl">
              On commence chaque épisode en visio par 5 minutes d’échauffement oral :
              dire comment tu te sens, décrire la météo et relever une question
              « Would You Rather? ».
            </p>
          </div>

          {/* 4 quick lesson steps */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => onNavigateModule('vocab')}
              className="text-left p-3 rounded-lg bg-slate-50 hover:bg-rose-50 border-2 border-slate-900 transition-colors cursor-pointer"
            >
              <div className="text-xs font-mono text-rose-600 font-semibold tabular-nums">01 · Cartes</div>
              <div className="text-sm font-bold text-slate-900 mt-0.5 truncate">
                Vocabulaire
              </div>
            </button>
            <button
              type="button"
              onClick={() => onNavigateModule('builder')}
              className="text-left p-3 rounded-lg bg-slate-50 hover:bg-rose-50 border-2 border-slate-900 transition-colors cursor-pointer"
            >
              <div className="text-xs font-mono text-rose-600 font-semibold tabular-nums">02 · Fiches</div>
              <div className="text-sm font-bold text-slate-900 mt-0.5 truncate">
                Guide & Phrases
              </div>
            </button>
            <button
              type="button"
              onClick={() => onNavigateModule('roleplay')}
              className="text-left p-3 rounded-lg bg-slate-50 hover:bg-rose-50 border-2 border-slate-900 transition-colors cursor-pointer"
            >
              <div className="text-xs font-mono text-rose-600 font-semibold tabular-nums">03 · Arcade</div>
              <div className="text-sm font-bold text-slate-900 mt-0.5 truncate">
                Mini-Jeux & L’heure
              </div>
            </button>
            <button
              type="button"
              onClick={() => onNavigateModule('board')}
              className="text-left p-3 rounded-lg bg-slate-50 hover:bg-rose-50 border-2 border-slate-900 transition-colors cursor-pointer"
            >
              <div className="text-xs font-mono text-rose-600 font-semibold tabular-nums">04 · Notes</div>
              <div className="text-sm font-bold text-slate-900 mt-0.5 truncate">
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
              <h2 className="text-lg font-bold text-slate-900">
                1. How are you today?
              </h2>
              <p className="text-sm text-slate-500 mt-0.5">
                Clique sur ton humeur et la météo pour construire ta bulle de dialogue.
              </p>
            </div>
            <button
              type="button"
              onClick={() => speakEnglish(spokenOpener, { accent, rate: speechRate })}
              className="manga-btn-primary inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Volume2 className="w-4 h-4" aria-hidden="true" />
              Écouter
            </button>
          </div>

          {/* Mood grid */}
          <div className="space-y-2">
            <div className="text-xs font-semibold text-slate-600">
              My mood today (Mon humeur)
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {MOOD_OPTIONS.map((mood) => {
                const active = warmup.mood === mood.id;
                return (
                  <button
                    key={mood.id}
                    type="button"
                    onClick={() =>
                      onUpdate({ mood: active ? null : mood.id })
                    }
                    className={`px-3 py-2.5 rounded-lg border text-left transition-colors cursor-pointer ${
                      active
                        ? 'bg-indigo-50 border-indigo-600 text-indigo-950'
                        : 'bg-slate-50/70 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="text-sm font-semibold">{mood.en}</div>
                    <div className="text-xs text-slate-500">{mood.fr}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Weather grid */}
          <div className="space-y-2">
            <div className="text-xs font-semibold text-slate-600">
              Outside my window (La météo)
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {WEATHER_OPTIONS.map((weather) => {
                const active = warmup.weather === weather.id;
                return (
                  <button
                    key={weather.id}
                    type="button"
                    onClick={() =>
                      onUpdate({ weather: active ? null : weather.id })
                    }
                    className={`px-3 py-2.5 rounded-lg border text-left transition-colors cursor-pointer ${
                      active
                        ? 'bg-indigo-50 border-indigo-600 text-indigo-950'
                        : 'bg-slate-50/70 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="text-sm font-semibold">{weather.en}</div>
                    <div className="text-xs text-slate-500">{weather.fr}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Live Spoken Sentence Box */}
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-xs text-slate-500">Phrase à lire à voix haute :</div>
              <p className="text-base font-semibold text-slate-900 mt-0.5">
                “{spokenOpener}”
              </p>
            </div>
            {role === 'tutor' && (
              <button
                type="button"
                onClick={onAwardStar}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-amber-300 bg-amber-50 text-amber-900 text-xs font-semibold hover:bg-amber-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-600" aria-hidden="true" />
                Valider +1 étoile
              </button>
            )}
          </div>
        </div>

        {/* Right: Would You Rather? Oral Icebreaker */}
        <div className="lg:col-span-6 manga-panel p-6 space-y-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                2. Question « Would You Rather? »
              </h2>
              <p className="text-sm text-slate-500 mt-0.5 tabular-nums">
                Défi oral {(warmup.promptIndex % ICEBREAKER_PROMPTS.length) + 1} sur{' '}
                {ICEBREAKER_PROMPTS.length}
              </p>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={handlePrevPrompt}
                aria-label="Question précédente"
                className="p-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleNextPrompt}
                aria-label="Question suivante"
                className="p-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="p-5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <p className="text-lg font-semibold text-slate-900 leading-snug">
                {currentPrompt.questionEn}
              </p>
              <button
                type="button"
                onClick={() =>
                  speakEnglish(currentPrompt.questionEn, { accent, rate: speechRate })
                }
                aria-label="Écouter la question en anglais"
                className="p-2 rounded-lg bg-white border border-slate-200 text-indigo-700 hover:bg-indigo-50 transition-colors shrink-0 cursor-pointer"
              >
                <Volume2 className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setShowFrenchQuestion((v) => !v)}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
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
              <p className="text-sm text-slate-600 pt-2 border-t border-slate-200/70">
                {currentPrompt.questionFr}
              </p>
            )}

            {/* Quick choice starters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  const starter = `I would rather choose: ${currentPrompt.optionA.toLowerCase()} because `;
                  onUpdate({ studentAnswer: starter });
                  speakEnglish(currentPrompt.optionA, { accent, rate: speechRate });
                }}
                className="px-4 py-3 rounded-lg bg-white border border-slate-200 hover:border-indigo-500 text-left text-sm font-medium text-slate-800 transition-colors cursor-pointer"
              >
                Option A · {currentPrompt.optionA}
              </button>
              <button
                type="button"
                onClick={() => {
                  const starter = `I would rather choose: ${currentPrompt.optionB.toLowerCase()} because `;
                  onUpdate({ studentAnswer: starter });
                  speakEnglish(currentPrompt.optionB, { accent, rate: speechRate });
                }}
                className="px-4 py-3 rounded-lg bg-white border border-slate-200 hover:border-indigo-500 text-left text-sm font-medium text-slate-800 transition-colors cursor-pointer"
              >
                Option B · {currentPrompt.optionB}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label
                htmlFor="icebreaker-answer"
                className="text-xs font-semibold text-slate-600"
              >
                Ta réponse en anglais (synchronisée en direct)
              </label>
              <span className="text-xs text-slate-500 font-mono">
                {currentPrompt.starterEn}
              </span>
            </div>
            <textarea
              id="icebreaker-answer"
              rows={2}
              value={warmup.studentAnswer}
              onChange={(e) => onUpdate({ studentAnswer: e.target.value })}
              placeholder="Écris ou dicte ton idée ici (ex: I would rather have a pet dragon because it can fly)..."
              className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
            />
            {warmup.studentAnswer.trim().length > 0 && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() =>
                    speakEnglish(warmup.studentAnswer, { accent, rate: speechRate })
                  }
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-indigo-700 hover:bg-indigo-50 transition-colors cursor-pointer"
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
