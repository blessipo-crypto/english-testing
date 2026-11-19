import { useEffect, useRef, useState } from 'react';
import { Gauge, Volume2, Square, RotateCcw, Check } from 'lucide-react';
import type { VoiceAccent } from '../types/lesson';
import {
  VOICE_ACCENT_MODULES,
  VOICE_COMPARISON_SAMPLES,
} from '../data/voiceModules';
import {
  getSavedVoiceUri,
  resolveVoiceModule,
  setSavedVoiceUri,
  speakEnglish,
  stopSpeaking,
  subscribeVoiceChanges,
} from '../utils/speech';

interface SpeechSpeedControlProps {
  speechRate: number;
  accent: VoiceAccent;
  onChangeRate: (rate: number) => void;
  onChangeAccent?: (accent: VoiceAccent) => void;
}

const PRESETS = [
  { value: 0.65, label: '0.65x', hint: 'Très lent' },
  { value: 0.85, label: '0.85x', hint: 'Doux' },
  { value: 1.0, label: '1.0x', hint: 'Normal' },
  { value: 1.2, label: '1.2x', hint: 'Rapide' },
];

function formatRate(rate: number): string {
  return `${Number(rate.toFixed(2))}x`;
}

function describeRate(rate: number): string {
  if (rate <= 0.7) return 'Très lent · Articulation détaillée';
  if (rate <= 0.9) return 'Doux · Idéal pour bien entendre';
  if (rate <= 1.1) return 'Normal · Rythme naturel';
  return 'Rapide · Défi compréhension';
}

export function SpeechSpeedControl({
  speechRate,
  accent,
  onChangeRate,
  onChangeAccent,
}: SpeechSpeedControlProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'voices' | 'speed'>('voices');
  const [, setVoiceRefreshTick] = useState(0);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeVoiceChanges(() => {
      setVoiceRefreshTick((t) => t + 1);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const handleOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen]);

  const ukMatch = resolveVoiceModule('en-GB');
  const usMatch = resolveVoiceModule('en-US');
  const savedUkUri = getSavedVoiceUri('en-GB');
  const savedUsUri = getSavedVoiceUri('en-US');

  const renderAccentModuleCard = (moduleAccent: VoiceAccent) => {
    const mod = VOICE_ACCENT_MODULES[moduleAccent];
    const match = moduleAccent === 'en-GB' ? ukMatch : usMatch;
    const savedUri = moduleAccent === 'en-GB' ? savedUkUri : savedUsUri;
    const isActiveModule = accent === moduleAccent;
    const selectableVoices =
      match.voicesForAccent.length > 0
        ? match.voicesForAccent
        : match.allEnglishVoices;

    return (
      <div
        key={moduleAccent}
        className={`p-3 rounded-xl border space-y-2 transition-colors ${
          isActiveModule ? 'sb-card-selected' : 'sb-surface-soft sb-divider'
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="px-1.5 py-0.5 rounded bg-cyan-500/15 text-cyan-400 font-mono text-[10px] font-bold">
                {mod.shortLabel}
              </span>
              <span className="text-xs font-bold sb-text-primary truncate">
                {mod.title}
              </span>
            </div>
            <p className="text-[10px] sb-text-muted truncate mt-0.5">
              {mod.regionLabel}
            </p>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() =>
                speakEnglish(mod.sampleSentence, {
                  accent: moduleAccent,
                  rate: speechRate,
                })
              }
              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border sb-chip-idle text-[11px] font-bold cursor-pointer"
              title={`Tester la voix ${mod.shortLabel}`}
            >
              <Volume2 className="w-3 h-3 sb-text-accent" aria-hidden="true" />
              <span>Test</span>
            </button>
            {onChangeAccent && (
              <button
                type="button"
                onClick={() => onChangeAccent(moduleAccent)}
                className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold cursor-pointer ${
                  isActiveModule
                    ? 'sb-chip-solid'
                    : 'border sb-chip-idle hover:sb-text-primary'
                }`}
              >
                {isActiveModule && <Check className="w-3 h-3" aria-hidden="true" />}
                <span>{isActiveModule ? 'Actif' : 'Choisir'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Voice selector for this accent module */}
        <div className="space-y-1">
          <select
            aria-label={`Voix pour ${mod.title}`}
            value={savedUri}
            onChange={(e) => setSavedVoiceUri(moduleAccent, e.target.value)}
            className="w-full rounded-lg border sb-input px-2.5 py-1.5 text-[11px] cursor-pointer"
          >
            <option value="">
              Auto ({match.voice ? match.voice.name : mod.bcp47})
            </option>
            {selectableVoices.map((voice) => (
              <option key={voice.voiceURI} value={voice.voiceURI}>
                {voice.name} ({voice.lang})
              </option>
            ))}
          </select>

          {!match.isExactAccentMatch && (
            <p className="text-[10px] text-amber-400 leading-snug">
              Voix native {mod.bcp47} non détectée sur ce système — sélection manuelle ou voix de secours active.
            </p>
          )}
        </div>
      </div>
    );
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-xs font-bold tracking-wide transition-colors duration-300 whitespace-nowrap shrink-0 cursor-pointer tabular-nums ${
          isOpen ? 'sb-chip-active' : 'sb-chip-idle'
        }`}
      >
        <Gauge className="w-3.5 h-3.5 sb-text-accent" aria-hidden="true" />
        <span>
          Voix {accent === 'en-GB' ? 'UK' : 'US'} · {formatRate(speechRate)}
        </span>
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-label="Modules de voix UK / US et vitesse de lecture"
          className="absolute right-0 sm:left-0 mt-2 w-96 max-w-[calc(100vw-2rem)] manga-panel-sm p-4 space-y-3.5 z-40 max-h-[82vh] overflow-y-auto"
        >
          {/* Sub-navigation: Voice Modules vs Speed */}
          <div className="flex items-center justify-between gap-2">
            <div className="inline-flex items-center gap-1 p-0.5 sb-seg-track border rounded-xl">
              <button
                type="button"
                onClick={() => setActiveTab('voices')}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                  activeTab === 'voices' ? 'sb-seg-active' : 'sb-seg-idle'
                }`}
              >
                Modules Voix UK / US
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('speed')}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                  activeTab === 'speed' ? 'sb-seg-active' : 'sb-seg-idle'
                }`}
              >
                Vitesse ({formatRate(speechRate)})
              </button>
            </div>

            <button
              type="button"
              onClick={stopSpeaking}
              aria-label="Arrêter la lecture"
              title="Arrêter la lecture"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border sb-chip-idle text-xs font-bold cursor-pointer"
            >
              <Square className="w-3 h-3" aria-hidden="true" />
              <span>Stop</span>
            </button>
          </div>

          {activeTab === 'voices' ? (
            <div className="space-y-3">
              {renderAccentModuleCard('en-GB')}
              {renderAccentModuleCard('en-US')}

              {/* Quick UK vs US pronunciation comparison */}
              <div className="pt-2 border-t sb-divider space-y-2">
                <div className="text-[11px] font-bold sb-text-secondary">
                  Comparateur express UK vs US (en cours) :
                </div>
                <div className="space-y-1.5">
                  {VOICE_COMPARISON_SAMPLES.map((sample) => (
                    <div
                      key={sample.id}
                      className="p-2 rounded-lg sb-surface-soft border sb-divider space-y-1"
                    >
                      <div className="text-[11px] font-bold sb-text-primary">
                        “{sample.en}”
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            speakEnglish(sample.en, {
                              accent: 'en-GB',
                              rate: speechRate,
                            })
                          }
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-400 text-[10px] font-bold cursor-pointer hover:opacity-90"
                        >
                          <Volume2 className="w-2.5 h-2.5" aria-hidden="true" />
                          <span>UK</span>
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            speakEnglish(sample.en, {
                              accent: 'en-US',
                              rate: speechRate,
                            })
                          }
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-violet-500/15 text-violet-300 text-[10px] font-bold cursor-pointer hover:opacity-90"
                        >
                          <Volume2 className="w-2.5 h-2.5" aria-hidden="true" />
                          <span>US</span>
                        </button>
                        <span className="text-[10px] sb-text-muted">
                          {accent === 'en-GB' ? sample.ukTip : sample.usTip}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <label
                    htmlFor="speech-rate-slider"
                    className="text-xs font-bold tracking-wide sb-text-primary block"
                  >
                    Vitesse de lecture :{' '}
                    <span className="font-mono sb-text-accent tabular-nums">
                      {formatRate(speechRate)}
                    </span>
                  </label>
                  <p className="text-xs sb-text-muted mt-0.5">
                    {describeRate(speechRate)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onChangeRate(1)}
                  aria-label="Réinitialiser à 1.0x"
                  title="Réinitialiser à 1.0x"
                  className="p-1.5 rounded-lg sb-text-muted hover:sb-text-accent cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Slider */}
              <div className="space-y-1.5">
                <input
                  id="speech-rate-slider"
                  type="range"
                  min={0.5}
                  max={1.4}
                  step={0.05}
                  value={speechRate}
                  onChange={(e) => onChangeRate(parseFloat(e.target.value))}
                  className="w-full cursor-pointer"
                  style={{ accentColor: 'var(--sb-accent)' }}
                />
                <div className="flex items-center justify-between text-[11px] sb-text-muted font-mono tabular-nums">
                  <span>0.5x Lent</span>
                  <span>1.0x Normal</span>
                  <span>1.4x Rapide</span>
                </div>
              </div>

              {/* Quick Presets */}
              <div className="grid grid-cols-4 gap-1.5">
                {PRESETS.map((preset) => {
                  const active = Math.abs(speechRate - preset.value) < 0.01;
                  return (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() => onChangeRate(preset.value)}
                      className={`py-1.5 px-2 rounded-xl border border-b-2 text-center transition-colors duration-300 cursor-pointer ${
                        active ? 'sb-card-selected' : 'sb-card-option'
                      }`}
                    >
                      <div className="text-xs font-bold font-mono tabular-nums">
                        {preset.label}
                      </div>
                      <div className="text-[10px] sb-text-muted truncate">
                        {preset.hint}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Live Voice Test */}
              <div className="pt-3 border-t sb-divider flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() =>
                    speakEnglish(
                      VOICE_ACCENT_MODULES[accent].sampleSentence,
                      { accent, rate: speechRate }
                    )
                  }
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl manga-btn-primary text-xs font-bold cursor-pointer"
                >
                  <Volume2 className="w-3.5 h-3.5" aria-hidden="true" />
                  Tester ({accent === 'en-GB' ? 'UK' : 'US'})
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
