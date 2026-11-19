import { useEffect, useState } from 'react';
import {
  Gauge,
  Volume2,
  Square,
  RotateCcw,
  Check,
  X,
  RefreshCw,
  SlidersHorizontal,
} from 'lucide-react';
import type { VoiceAccent } from '../types/lesson';
import {
  VOICE_ACCENT_MODULES,
  VOICE_COMPARISON_SAMPLES,
} from '../data/voiceModules';
import {
  getSavedVoiceUri,
  refreshSystemVoices,
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
  const [customCompareText, setCustomCompareText] = useState(
    'Today I am drinking water at half past four.'
  );
  const [, setVoiceRefreshTick] = useState(0);

  useEffect(() => {
    const unsubscribe = subscribeVoiceChanges(() => {
      setVoiceRefreshTick((t) => t + 1);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    refreshSystemVoices();
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('keydown', handleEsc);
    return () => {
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
        className={`p-4 rounded-2xl border space-y-3 transition-colors ${
          isActiveModule ? 'sb-card-selected' : 'sb-surface-soft sb-divider'
        }`}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="px-2 py-0.5 rounded-md bg-cyan-500/15 text-cyan-400 font-mono text-[11px] font-bold">
                {mod.shortLabel}
              </span>
              <span className="text-sm font-bold sb-text-primary truncate">
                {mod.title}
              </span>
            </div>
            <p className="text-[11px] sb-text-muted mt-0.5">
              {mod.regionLabel}
            </p>
          </div>

          {onChangeAccent && (
            <button
              type="button"
              onClick={() => onChangeAccent(moduleAccent)}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold shrink-0 cursor-pointer ${
                isActiveModule
                  ? 'sb-chip-solid'
                  : 'border sb-chip-idle hover:sb-text-primary'
              }`}
            >
              {isActiveModule && <Check className="w-3.5 h-3.5" aria-hidden="true" />}
              <span>{isActiveModule ? 'Actif' : 'Activer'}</span>
            </button>
          )}
        </div>

        {/* System Voice Selector for this module */}
        <div className="space-y-1.5">
          <label
            htmlFor={`voice-select-${moduleAccent}`}
            className="text-[11px] font-bold sb-text-secondary block"
          >
            Voix système ({mod.bcp47}) :
          </label>
          <select
            id={`voice-select-${moduleAccent}`}
            value={savedUri}
            onChange={(e) => setSavedVoiceUri(moduleAccent, e.target.value)}
            className="w-full rounded-xl border sb-input px-3 py-2 text-xs cursor-pointer"
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
            <p className="text-[11px] text-amber-400 leading-snug">
              Voix native {mod.bcp47} non détectée sur cet appareil — voix de secours utilisée.
            </p>
          )}
        </div>

        {/* Pronunciation cues */}
        <ul className="space-y-1 text-[11px] sb-text-muted">
          {mod.pronunciationNotes.map((note) => (
            <li key={note} className="leading-snug">
              • {note}
            </li>
          ))}
        </ul>

        {/* Separate Audio Test Button */}
        <button
          type="button"
          onClick={() =>
            speakEnglish(mod.sampleSentence, {
              accent: moduleAccent,
              rate: speechRate,
            })
          }
          className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border sb-card-option text-xs font-bold sb-text-accent hover:sb-text-primary cursor-pointer transition-colors"
        >
          <Volume2 className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Tester la voix {mod.shortLabel}</span>
        </button>
      </div>
    );
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-xs font-bold tracking-wide transition-colors duration-300 whitespace-nowrap shrink-0 cursor-pointer tabular-nums ${
          isOpen ? 'sb-chip-active' : 'sb-chip-idle'
        }`}
        title="Ouvrir le panneau Modules Voix UK / US & Vitesse"
      >
        <SlidersHorizontal className="w-3.5 h-3.5 sb-text-accent" aria-hidden="true" />
        <span>
          Modules Voix {accent === 'en-GB' ? 'UK' : 'US'} · {formatRate(speechRate)}
        </span>
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="voice-modules-dialog-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsOpen(false);
          }}
        >
          <div className="manga-panel w-full max-w-2xl p-5 sm:p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Dialog Header */}
            <div className="flex items-start justify-between gap-4 border-b sb-divider pb-3.5">
              <div>
                <h2
                  id="voice-modules-dialog-title"
                  className="text-base sm:text-lg font-bold tracking-wide sb-text-primary flex items-center gap-2"
                >
                  <Volume2 className="w-5 h-5 sb-text-accent shrink-0" aria-hidden="true" />
                  <span>Modules Voix UK / US & Vitesse</span>
                </h2>
                <p className="text-xs sb-text-muted mt-0.5">
                  Configurez une voix britannique et une voix américaine distinctes, comparez la prononciation et ajustez la vitesse de lecture.
                </p>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={refreshSystemVoices}
                  title="Actualiser les voix détectées sur l'appareil"
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border sb-chip-idle text-xs font-bold cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
                  <span className="hidden sm:inline">Voix</span>
                </button>
                <button
                  type="button"
                  onClick={stopSpeaking}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border sb-chip-idle text-xs font-bold cursor-pointer"
                >
                  <Square className="w-3 h-3" aria-hidden="true" />
                  <span>Stop</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  aria-label="Fermer le panneau voix"
                  className="p-1.5 rounded-lg sb-text-muted hover:sb-text-primary cursor-pointer"
                >
                  <X className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            </div>

            {/* UK and US Modules Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {renderAccentModuleCard('en-GB')}
              {renderAccentModuleCard('en-US')}
            </div>

            {/* Express Pronunciation Comparator UK vs US */}
            <div className="p-4 rounded-2xl sb-surface-soft border sb-divider space-y-3">
              <div className="text-xs font-bold tracking-wide sb-text-secondary">
                Comparateur express de prononciation UK vs US
              </div>

              {/* Custom phrase tester */}
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={customCompareText}
                  onChange={(e) => setCustomCompareText(e.target.value)}
                  placeholder="Tapez un mot ou une phrase en anglais..."
                  className="flex-1 rounded-xl border sb-input px-3 py-1.5 text-xs"
                />
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() =>
                      speakEnglish(customCompareText, {
                        accent: 'en-GB',
                        rate: speechRate,
                      })
                    }
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 text-xs font-bold cursor-pointer hover:opacity-90"
                  >
                    <Volume2 className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Écouter UK</span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      speakEnglish(customCompareText, {
                        accent: 'en-US',
                        rate: speechRate,
                      })
                    }
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-violet-500/15 text-violet-300 border border-violet-500/30 text-xs font-bold cursor-pointer hover:opacity-90"
                  >
                    <Volume2 className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Écouter US</span>
                  </button>
                </div>
              </div>

              {/* Key sample phrases */}
              <div className="space-y-2">
                {VOICE_COMPARISON_SAMPLES.map((sample) => (
                  <div
                    key={sample.id}
                    className="p-2.5 rounded-xl border sb-divider sb-surface space-y-1.5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-bold sb-text-primary">
                        “{sample.en}”
                      </span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() =>
                            speakEnglish(sample.en, {
                              accent: 'en-GB',
                              rate: speechRate,
                            })
                          }
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-500/15 text-cyan-400 text-[11px] font-bold cursor-pointer hover:opacity-90"
                        >
                          <Volume2 className="w-3 h-3" aria-hidden="true" />
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
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-violet-500/15 text-violet-300 text-[11px] font-bold cursor-pointer hover:opacity-90"
                        >
                          <Volume2 className="w-3 h-3" aria-hidden="true" />
                          <span>US</span>
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[11px] sb-text-muted">
                      <span>{sample.ukTip}</span>
                      <span>{sample.usTip}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Speech Speed Controls (0.5x to 1.4x) */}
            <div className="p-4 rounded-2xl sb-surface-soft border sb-divider space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <label
                    htmlFor="speech-rate-slider"
                    className="text-xs font-bold tracking-wide sb-text-primary flex items-center gap-1.5"
                  >
                    <Gauge className="w-4 h-4 sb-text-accent" aria-hidden="true" />
                    <span>
                      Vitesse de lecture :{' '}
                      <span className="font-mono sb-text-accent tabular-nums">
                        {formatRate(speechRate)}
                      </span>
                    </span>
                  </label>
                  <p className="text-[11px] sb-text-muted mt-0.5">
                    {describeRate(speechRate)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onChangeRate(1)}
                  aria-label="Réinitialiser à 1.0x"
                  title="Réinitialiser à 1.0x"
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border sb-chip-idle text-[11px] font-bold cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" aria-hidden="true" />
                  <span>1.0x</span>
                </button>
              </div>

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

              <div className="grid grid-cols-4 gap-2">
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
            </div>

            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-5 py-2 rounded-xl manga-btn-primary text-xs font-bold cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
