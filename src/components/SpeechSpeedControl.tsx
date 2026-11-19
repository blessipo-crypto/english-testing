import { useEffect, useRef, useState } from 'react';
import { Gauge, Volume2, Square, RotateCcw } from 'lucide-react';
import type { VoiceAccent } from '../types/lesson';
import { speakEnglish, stopSpeaking } from '../utils/speech';

interface SpeechSpeedControlProps {
  speechRate: number;
  accent: VoiceAccent;
  onChangeRate: (rate: number) => void;
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
}: SpeechSpeedControlProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

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
        <span>Vitesse : {formatRate(speechRate)}</span>
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-label="Réglage de la vitesse de lecture à voix haute"
          className="absolute left-0 mt-2 w-80 max-w-[calc(100vw-2rem)] manga-panel-sm p-4 space-y-4 z-40"
        >
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
                  "Hello! Let's practise speaking English together.",
                  { accent, rate: speechRate }
                )
              }
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl manga-btn-primary text-xs font-bold cursor-pointer"
            >
              <Volume2 className="w-3.5 h-3.5" aria-hidden="true" />
              Tester la voix
            </button>
            <button
              type="button"
              onClick={stopSpeaking}
              aria-label="Arrêter la lecture"
              className="inline-flex items-center justify-center gap-1 px-3 py-2 rounded-xl border sb-chip-idle text-xs font-bold cursor-pointer"
            >
              <Square className="w-3 h-3" aria-hidden="true" />
              Stop
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
