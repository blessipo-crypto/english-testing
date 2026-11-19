import { useMemo, useRef, useState } from 'react';
import {
  Clock,
  Volume2,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  RotateCcw,
  ChevronRight,
  Sparkles,
  Ear,
} from 'lucide-react';
import type { TimeModuleState, VoiceAccent } from '../types/lesson';
import { formatEnglishTime } from '../utils/timeEnglish';
import { speakEnglish } from '../utils/speech';
import { playError, playPop, playSuccess, playVictory } from '../utils/soundFx';

interface TimeModuleProps {
  timeModule: TimeModuleState;
  accent: VoiceAccent;
  speechRate: number;
  onUpdate: (patch: Partial<TimeModuleState>) => void;
  onAwardStar: () => void;
}

interface TimeChallengeItem {
  id: string;
  type: 'set' | 'read';
  targetHour: number;
  targetMinute: number;
  targetPm: boolean;
  options?: string[];
  correctOptionIndex?: number;
  tipFr: string;
}

const TIME_CHALLENGES: TimeChallengeItem[] = [
  {
    id: 'tc-1',
    type: 'set',
    targetHour: 3,
    targetMinute: 15,
    targetPm: true,
    tipFr: '« A quarter past three » = 3 h + 15 min (aiguille des minutes sur le 3).',
  },
  {
    id: 'tc-2',
    type: 'read',
    targetHour: 7,
    targetMinute: 30,
    targetPm: false,
    options: [
      "It's half past seven.",
      "It's half to eight.",
      "It's a quarter past seven.",
      "It's seven o'clock.",
    ],
    correctOptionIndex: 0,
    tipFr: 'À :30, on utilise toujours « half past » suivi de l’heure actuelle.',
  },
  {
    id: 'tc-3',
    type: 'set',
    targetHour: 4,
    targetMinute: 45,
    targetPm: true,
    tipFr: '« A quarter to five » = il manque 15 min avant 5 heures → 4 h 45 !',
  },
  {
    id: 'tc-4',
    type: 'read',
    targetHour: 8,
    targetMinute: 40,
    targetPm: false,
    options: [
      "It's twenty to nine.",
      "It's twenty past eight.",
      "It's forty past eight.",
      "It's twenty to eight.",
    ],
    correctOptionIndex: 0,
    tipFr: 'À :40 (zone TO à gauche), il reste 20 min pour aller à 9 h → twenty to nine.',
  },
  {
    id: 'tc-5',
    type: 'set',
    targetHour: 10,
    targetMinute: 10,
    targetPm: false,
    tipFr: '« Ten past ten » = 10 minutes après 10 h (zone PAST à droite).',
  },
  {
    id: 'tc-6',
    type: 'read',
    targetHour: 11,
    targetMinute: 55,
    targetPm: true,
    options: [
      "It's five to twelve.",
      "It's five past eleven.",
      "It's fifty-five to twelve.",
      "It's a quarter to twelve.",
    ],
    correctOptionIndex: 0,
    tipFr: 'À 11 h 55, il ne reste que 5 min avant midi/minuit (12) → five to twelve.',
  },
];

interface InteractiveClockSvgProps {
  hour: number;
  minute: number;
  showZones: boolean;
  interactive: boolean;
  onSetMinute?: (minute: number) => void;
  onSetHour?: (hour: number) => void;
}

function InteractiveClockSvg({
  hour,
  minute,
  showZones,
  interactive,
  onSetMinute,
  onSetHour,
}: InteractiveClockSvgProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [dragging, setDragging] = useState(false);

  const minuteAngle = minute * 6;
  const hourAngle = ((hour % 12) + minute / 60) * 30;

  const updateMinuteFromPointer = (clientX: number, clientY: number) => {
    if (!interactive || !onSetMinute || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = clientX - cx;
    const dy = clientY - cy;
    let deg = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
    if (deg < 0) deg += 360;
    // Snap to 5-minute steps when dragging for clean 11yo ergonomics
    const rawMin = Math.round(deg / 6) % 60;
    const snapped = Math.round(rawMin / 5) * 5;
    onSetMinute(snapped === 60 ? 0 : snapped);
  };

  const markers = Array.from({ length: 12 }, (_, idx) => {
    const num = idx === 0 ? 12 : idx;
    const angleRad = ((idx * 30 - 90) * Math.PI) / 180;
    const labelX = 160 + Math.cos(angleRad) * 105;
    const labelY = 160 + Math.sin(angleRad) * 105;
    const minDotX = 160 + Math.cos(angleRad) * 134;
    const minDotY = 160 + Math.sin(angleRad) * 134;
    const targetMin = (idx * 5) % 60;
    return { num, labelX, labelY, minDotX, minDotY, targetMin };
  });

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 320 320"
      className="w-full max-w-[320px] mx-auto select-none touch-none"
      role="img"
      aria-label={`Horloge indiquant ${hour} heures ${minute}`}
      onPointerDown={(e) => {
        if (!interactive) return;
        setDragging(true);
        updateMinuteFromPointer(e.clientX, e.clientY);
      }}
      onPointerMove={(e) => {
        if (!interactive || !dragging) return;
        updateMinuteFromPointer(e.clientX, e.clientY);
      }}
      onPointerUp={() => setDragging(false)}
      onPointerLeave={() => setDragging(false)}
    >
      {/* Outer Tech Bezel Rim */}
      <circle cx="160" cy="160" r="154" fill="var(--sb-bg-panel)" stroke="var(--sb-accent)" strokeWidth="3" />
      <circle cx="160" cy="160" r="144" fill="#F8FAFC" stroke="#0F172A" strokeWidth="2.5" />

      {/* Optional Educational PAST / TO Hemispheres */}
      {showZones && (
        <>
          {/* Right half: PAST (01-29 min) */}
          <path
            d="M 160 16 A 144 144 0 0 1 160 304 Z"
            fill="#bae6fd"
            opacity="0.72"
          />
          {/* Left half: TO (31-59 min) */}
          <path
            d="M 160 16 A 144 144 0 0 0 160 304 Z"
            fill="#fecaca"
            opacity="0.68"
          />
          <text
            x="212"
            y="165"
            textAnchor="middle"
            className="font-display font-extrabold"
            fontSize="16"
            fill="#0284c7"
            opacity="0.7"
          >
            PAST
          </text>
          <text
            x="108"
            y="165"
            textAnchor="middle"
            className="font-display font-extrabold"
            fontSize="16"
            fill="#dc2626"
            opacity="0.7"
          >
            TO
          </text>
        </>
      )}

      {/* 60 subtle minute ticks */}
      {Array.from({ length: 60 }, (_, m) => {
        const rad = ((m * 6 - 90) * Math.PI) / 180;
        const inner = m % 5 === 0 ? 123 : 129;
        const outer = 138;
        return (
          <line
            key={`tick-${m}`}
            x1={160 + Math.cos(rad) * inner}
            y1={160 + Math.sin(rad) * inner}
            x2={160 + Math.cos(rad) * outer}
            y2={160 + Math.sin(rad) * outer}
            stroke="#0F172A"
            strokeWidth={m % 5 === 0 ? '2.5' : '1'}
            opacity={m % 5 === 0 ? 0.85 : 0.35}
          />
        );
      })}

      {/* Interactive 5-minute outer markers + Hour Numbers */}
      {markers.map(({ num, labelX, labelY, minDotX, minDotY, targetMin }) => {
        const isCurrentMin = minute === targetMin;
        const isCurrentHour = ((hour - 1 + 12) % 12) + 1 === num;
        return (
          <g key={`m-${num}`}>
            {interactive && onSetMinute && (
              <circle
                cx={minDotX}
                cy={minDotY}
                r={isCurrentMin ? 8 : 6}
                fill={isCurrentMin ? '#EF4444' : '#ffffff'}
                stroke="#0F172A"
                strokeWidth="2"
                className="cursor-pointer"
                onPointerDown={(e) => {
                  e.stopPropagation();
                  playPop();
                  onSetMinute(targetMin);
                }}
              />
            )}
            <g
              className={interactive && onSetHour ? 'cursor-pointer' : ''}
              onPointerDown={(e) => {
                if (!interactive || !onSetHour) return;
                e.stopPropagation();
                playPop();
                onSetHour(num);
              }}
            >
              {isCurrentHour && (
                <circle
                  cx={labelX}
                  cy={labelY}
                  r="14"
                  fill="#FACC15"
                  stroke="#0F172A"
                  strokeWidth="2"
                />
              )}
              <text
                x={labelX}
                y={labelY + 5}
                textAnchor="middle"
                fontSize="16"
                fontWeight="800"
                fill="#0F172A"
                className="font-display"
              >
                {num}
              </text>
            </g>
          </g>
        );
      })}

      {/* Hour Hand (short, dark slate) */}
      <g transform={`rotate(${hourAngle} 160 160)`}>
        <line
          x1="160"
          y1="168"
          x2="160"
          y2="88"
          stroke="#0F172A"
          strokeWidth="8"
          strokeLinecap="round"
        />
      </g>

      {/* Minute Hand (long, vivid red) */}
      <g transform={`rotate(${minuteAngle} 160 160)`}>
        <line
          x1="160"
          y1="174"
          x2="160"
          y2="46"
          stroke="#EF4444"
          strokeWidth="5"
          strokeLinecap="round"
        />
      </g>

      {/* Center Pin */}
      <circle cx="160" cy="160" r="8" fill="#0F172A" />
      <circle cx="160" cy="160" r="3" fill="var(--sb-accent)" />
    </svg>
  );
}

export function TimeModule({
  timeModule,
  accent,
  speechRate,
  onUpdate,
  onAwardStar,
}: TimeModuleProps) {
  // Local state for the 6-round Challenge Game
  const [challengeIdx, setChallengeIdx] = useState(0);
  const [userHour, setUserHour] = useState(12);
  const [userMinute, setUserMinute] = useState(0);
  const [pickedOption, setPickedOption] = useState<number | null>(null);
  const [setCheckStatus, setSetCheckStatus] = useState<'idle' | 'correct' | 'incorrect'>('idle');
  const [audioDictationMode, setAudioDictationMode] = useState(false);
  const [score, setScore] = useState(0);
  const [completed, setCompleted] = useState(false);

  const readout = useMemo(
    () => formatEnglishTime(timeModule.hour, timeModule.minute, timeModule.isPm),
    [timeModule.hour, timeModule.minute, timeModule.isPm]
  );

  const activeChallenge = TIME_CHALLENGES[challengeIdx % TIME_CHALLENGES.length];
  const targetReadout = useMemo(
    () =>
      formatEnglishTime(
        activeChallenge.targetHour,
        activeChallenge.targetMinute,
        activeChallenge.targetPm
      ),
    [activeChallenge]
  );

  const stepMinute = (delta: number) => {
    playPop();
    const total = (timeModule.minute + delta + 60) % 60;
    onUpdate({ minute: total });
  };

  const stepHour = (delta: number) => {
    playPop();
    const next = ((timeModule.hour - 1 + delta + 12) % 12) + 1;
    onUpdate({ hour: next });
  };

  const resetChallenge = () => {
    setChallengeIdx(0);
    setUserHour(12);
    setUserMinute(0);
    setPickedOption(null);
    setSetCheckStatus('idle');
    setScore(0);
    setCompleted(false);
  };

  const handleCheckClockSet = () => {
    const matchHour =
      ((userHour - 1 + 12) % 12) + 1 === activeChallenge.targetHour;
    const matchMin = userMinute === activeChallenge.targetMinute;
    if (matchHour && matchMin) {
      setSetCheckStatus('correct');
      setScore((s) => s + 1);
      speakEnglish(targetReadout.analogEn, { accent, rate: speechRate });
      if (challengeIdx === TIME_CHALLENGES.length - 1) {
        playVictory();
      } else {
        playSuccess();
      }
    } else {
      playError();
      setSetCheckStatus('incorrect');
    }
  };

  const handlePickReadOption = (optIdx: number) => {
    if (pickedOption !== null) return;
    setPickedOption(optIdx);
    const right = optIdx === activeChallenge.correctOptionIndex;
    if (right) {
      setScore((s) => s + 1);
      if (challengeIdx === TIME_CHALLENGES.length - 1) {
        playVictory();
      } else {
        playSuccess();
      }
    } else {
      playError();
    }
    speakEnglish(targetReadout.analogEn, { accent, rate: speechRate });
  };

  const handleNextChallenge = () => {
    if (challengeIdx + 1 >= TIME_CHALLENGES.length) {
      setCompleted(true);
      onAwardStar();
      return;
    }
    setChallengeIdx((i) => i + 1);
    setUserHour(12);
    setUserMinute(0);
    setPickedOption(null);
    setSetCheckStatus('idle');
  };

  return (
    <div className="space-y-6">
      {/* Top Mode Switcher Card */}
      <div className="manga-panel p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="text-xs font-bold tracking-wide sb-text-accent flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-[var(--sb-danger)]" aria-hidden="true" />
            <span>Telling the Time · Horloge interactive & Défi audio</span>
          </div>
          <h1 className="text-xl font-bold tracking-wide sb-text-primary">
            Apprendre à dire l’heure en anglais
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => onUpdate({ showZones: !timeModule.showZones })}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold tracking-wide whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
              timeModule.showZones ? 'sb-chip-active sb-text-accent' : 'sb-chip-idle'
            }`}
          >
            {timeModule.showZones ? (
              <Eye className="w-3.5 h-3.5" aria-hidden="true" />
            ) : (
              <EyeOff className="w-3.5 h-3.5" aria-hidden="true" />
            )}
            Zones PAST / TO
          </button>

          <div className="flex items-center gap-1 p-1 sb-seg-track border rounded-xl">
            <button
              type="button"
              onClick={() => onUpdate({ mode: 'explore' })}
              className={`px-3 py-1.5 text-xs font-bold tracking-wide rounded-lg whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                timeModule.mode === 'explore' ? 'sb-seg-active' : 'sb-seg-idle'
              }`}
            >
              Explorer l’horloge
            </button>
            <button
              type="button"
              onClick={() => {
                resetChallenge();
                onUpdate({ mode: 'challenge' });
              }}
              className={`px-3 py-1.5 text-xs font-bold tracking-wide rounded-lg whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                timeModule.mode === 'challenge' ? 'sb-seg-active-danger' : 'sb-seg-idle'
              }`}
            >
              Défi de l’heure (6)
            </button>
          </div>
        </div>
      </div>

      {timeModule.mode === 'explore' ? (
        /* Two-Zone Educational Simulation Layout */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left 6 cols: Interactive Clock Stage */}
          <div className="lg:col-span-6 manga-panel p-6 space-y-5">
            <div className="flex items-center justify-between gap-3">
              <div className="text-xs font-semibold sb-text-muted">
                Glisse l’aiguille ou clique un chiffre / point rouge
              </div>
              <div className="font-mono text-lg font-extrabold sb-text-reward tabular-nums tracking-wide">
                {readout.numeric24} · {readout.numeric12}
              </div>
            </div>

            <InteractiveClockSvg
              hour={timeModule.hour}
              minute={timeModule.minute}
              showZones={timeModule.showZones}
              interactive
              onSetMinute={(minute) => onUpdate({ minute })}
              onSetHour={(hour) => onUpdate({ hour })}
            />

            {/* Step Controls */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              <button
                type="button"
                onClick={() => stepHour(-1)}
                className="py-2 px-2 rounded-xl border border-b-4 sb-card-option text-xs font-bold hover:sb-text-accent transition-colors cursor-pointer tabular-nums"
              >
                -1 h
              </button>
              <button
                type="button"
                onClick={() => stepHour(1)}
                className="py-2 px-2 rounded-xl border border-b-4 sb-card-option text-xs font-bold hover:sb-text-accent transition-colors cursor-pointer tabular-nums"
              >
                +1 h
              </button>
              <button
                type="button"
                onClick={() => stepMinute(-5)}
                className="py-2 px-2 rounded-xl border border-b-4 sb-card-option text-xs font-bold hover:sb-text-accent transition-colors cursor-pointer tabular-nums"
              >
                -5 min
              </button>
              <button
                type="button"
                onClick={() => stepMinute(5)}
                className="py-2 px-2 rounded-xl border border-b-4 sb-card-option text-xs font-bold hover:sb-text-accent transition-colors cursor-pointer tabular-nums"
              >
                +5 min
              </button>
              <button
                type="button"
                onClick={() => stepMinute(-1)}
                className="py-2 px-2 rounded-xl border border-b-4 sb-card-option sb-text-secondary text-xs font-bold hover:sb-text-reward transition-colors cursor-pointer tabular-nums"
              >
                -1 min
              </button>
              <button
                type="button"
                onClick={() => stepMinute(1)}
                className="py-2 px-2 rounded-xl border border-b-4 sb-card-option sb-text-secondary text-xs font-bold hover:sb-text-reward transition-colors cursor-pointer tabular-nums"
              >
                +1 min
              </button>
            </div>
          </div>

          {/* Right 6 cols: Live English Readout & Grammar Rules */}
          <div className="lg:col-span-6 space-y-4">
            <div className="manga-panel p-6 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs font-semibold sb-text-secondary">
                  Moment : {readout.periodEn} ({readout.periodFr})
                </div>

                <div className="flex items-center gap-1 p-0.5 sb-seg-track border rounded-xl">
                  <button
                    type="button"
                    onClick={() => onUpdate({ isPm: false })}
                    className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                      !timeModule.isPm ? 'sb-seg-active-reward' : 'sb-seg-idle'
                    }`}
                  >
                    a.m. (matin)
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdate({ isPm: true })}
                    className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                      timeModule.isPm ? 'sb-seg-active' : 'sb-seg-idle'
                    }`}
                  >
                    p.m. (après-midi)
                  </button>
                </div>
              </div>

              {/* Primary Analog English Expression */}
              <div className="p-5 rounded-2xl border sb-surface-soft space-y-3">
                <div className="text-xs font-bold tracking-wide sb-text-accent">
                  Expression britannique classique :
                </div>
                <div className="font-display text-2xl sm:text-3xl font-extrabold sb-text-primary leading-tight">
                  “{readout.analogEn}”
                </div>
                <div className="text-xs sb-text-muted">
                  Forme numérique (orale / US) :{' '}
                  <span className="font-bold sb-text-reward">
                    {readout.digitalEn}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() =>
                      speakEnglish(readout.analogEn, { accent, rate: speechRate })
                    }
                    className="manga-btn-primary inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold tracking-wide cursor-pointer"
                  >
                    <Volume2 className="w-4 h-4" aria-hidden="true" />
                    Prononcer
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      speakEnglish(readout.analogEn, { accent, rate: 0.7 })
                    }
                    className="px-3.5 py-2 rounded-xl border border-b-4 sb-card-option text-xs font-bold hover:sb-text-accent transition-colors cursor-pointer"
                  >
                    Lent (0.7x)
                  </button>
                </div>
              </div>

              {/* Contextual Rule Callout */}
              <div className="p-4 rounded-2xl border sb-status-warn text-sm leading-relaxed">
                <span className="font-bold sb-text-reward">Règle : </span>
                {readout.ruleFr}
              </div>
            </div>

            {/* 4 Key Landmarks Quick Jump */}
            <div className="manga-panel p-5 space-y-3">
              <h2 className="text-sm font-bold tracking-wide sb-text-primary">
                Les 4 repères essentiels à tester d’un clic
              </h2>
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { label: "o'clock (:00)", minute: 0, fr: 'heure pile' },
                  { label: 'quarter past (:15)', minute: 15, fr: 'et quart' },
                  { label: 'half past (:30)', minute: 30, fr: 'et demie' },
                  { label: 'quarter to (:45)', minute: 45, fr: 'moins le quart' },
                ].map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => {
                      playPop();
                      onUpdate({ minute: preset.minute });
                    }}
                    className={`p-3 rounded-2xl border border-b-4 text-left transition-all cursor-pointer ${
                      timeModule.minute === preset.minute
                        ? 'sb-status-danger border-b-red-800'
                        : 'sb-card-option'
                    }`}
                  >
                    <div className="text-xs font-bold sb-text-primary flex items-center gap-2">
                      <span
                        aria-hidden="true"
                        className={`w-2 h-2 rotate-45 shrink-0 ${
                          timeModule.minute === preset.minute
                            ? 'bg-[var(--sb-danger)]'
                            : 'bg-[var(--sb-accent)]'
                        }`}
                      />
                      <span>{preset.label}</span>
                    </div>
                    <div className="text-xs sb-text-muted mt-0.5 pl-4">{preset.fr}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Challenge Mode (6 Rounds) */
        <div className="manga-panel p-6 sm:p-8 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b sb-divider">
            <div>
              <div className="text-xs font-semibold sb-text-accent">
                Défi de l’heure · Alterne réglage d’aiguilles et lecture rapide
              </div>
              <h2 className="text-xl font-bold tracking-wide sb-text-primary">
                Manche{' '}
                <span className="tabular-nums sb-text-accent">
                  {challengeIdx + 1}/{TIME_CHALLENGES.length}
                </span>{' '}
                · Score : <span className="tabular-nums sb-text-reward">{score}</span>
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setAudioDictationMode((v) => !v)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  audioDictationMode ? 'sb-chip-solid' : 'sb-chip-idle'
                }`}
              >
                <Ear className="w-3.5 h-3.5" aria-hidden="true" />
                {audioDictationMode ? 'Dictée audio : ON' : 'Mode Dictée Audio'}
              </button>

              <button
                type="button"
                onClick={resetChallenge}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-b-2 sb-card-option text-xs font-bold hover:sb-text-reward transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                Recommencer
              </button>
            </div>
          </div>

          {completed ? (
            <div className="p-6 rounded-2xl border sb-status-success space-y-4">
              <div className="flex items-center gap-2 text-lg font-bold tracking-wide">
                <Sparkles className="w-6 h-6 sb-text-reward shrink-0" aria-hidden="true" />
                <span>
                  Défi terminé ! Score : {score} / {TIME_CHALLENGES.length} (+1 étoile)
                </span>
              </div>
              <p className="text-sm opacity-90">
                Bravo ! Tu sais maintenant placer les aiguilles et lire « past » et « to » en anglais.
              </p>
              <button
                type="button"
                onClick={resetChallenge}
                className="manga-btn-primary px-4 py-2 rounded-xl text-xs font-bold tracking-wide cursor-pointer"
              >
                Rejouer le défi
              </button>
            </div>
          ) : activeChallenge.type === 'set' ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              <div className="lg:col-span-6 space-y-4">
                <InteractiveClockSvg
                  hour={userHour}
                  minute={userMinute}
                  showZones={timeModule.showZones}
                  interactive={setCheckStatus !== 'correct'}
                  onSetHour={(h) => {
                    setUserHour(h);
                    setSetCheckStatus('idle');
                  }}
                  onSetMinute={(m) => {
                    setUserMinute(m);
                    setSetCheckStatus('idle');
                  }}
                />
                <div className="flex justify-center gap-2">
                  <button
                    type="button"
                    disabled={setCheckStatus === 'correct'}
                    onClick={() => {
                      playPop();
                      setUserHour((h) => (h % 12) + 1);
                      setSetCheckStatus('idle');
                    }}
                    className="px-3.5 py-2 rounded-xl border border-b-4 sb-card-option text-xs font-bold hover:sb-text-accent disabled:opacity-40 cursor-pointer"
                  >
                    +1 heure
                  </button>
                  <button
                    type="button"
                    disabled={setCheckStatus === 'correct'}
                    onClick={() => {
                      playPop();
                      setUserMinute((m) => (m + 5) % 60);
                      setSetCheckStatus('idle');
                    }}
                    className="px-3.5 py-2 rounded-xl border border-b-4 sb-card-option text-xs font-bold hover:sb-text-accent disabled:opacity-40 cursor-pointer"
                  >
                    +5 minutes
                  </button>
                </div>
              </div>

              <div className="lg:col-span-6 space-y-4">
                <div className="p-5 rounded-2xl border sb-surface-soft space-y-3">
                  <div className="text-xs font-bold tracking-wide sb-text-danger">
                    Mission : règle l’horloge sur cette heure !
                  </div>
                  {audioDictationMode && setCheckStatus !== 'correct' ? (
                    <p className="text-sm font-semibold sb-text-secondary">
                      Texte masqué (Dictée Audio active) : clique sur « Écouter l’heure » puis règle les aiguilles.
                    </p>
                  ) : (
                    <div className="font-display text-2xl font-extrabold sb-text-primary">
                      “{targetReadout.analogEn}”
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        speakEnglish(targetReadout.analogEn, {
                          accent,
                          rate: speechRate,
                        })
                      }
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-b-4 sb-card-option text-xs font-bold hover:sb-text-accent cursor-pointer"
                    >
                      <Volume2 className="w-4 h-4" aria-hidden="true" />
                      Écouter l’heure
                    </button>
                    <span className="text-xs font-mono font-bold sb-text-reward tabular-nums">
                      Ton réglage : {userHour}:{String(userMinute).padStart(2, '0')}
                    </span>
                  </div>
                </div>

                {setCheckStatus === 'correct' && (
                  <div
                    role="status"
                    className="p-4 rounded-2xl border sb-status-success space-y-1"
                  >
                    <div className="flex items-center gap-2 text-sm font-bold">
                      <CheckCircle2 className="w-5 h-5 sb-text-success shrink-0" />
                      <span>Parfait ! C’est exactement {targetReadout.analogEn}</span>
                    </div>
                    <p className="text-xs opacity-90">{activeChallenge.tipFr}</p>
                  </div>
                )}

                {setCheckStatus === 'incorrect' && (
                  <div
                    role="status"
                    className="p-4 rounded-2xl border sb-status-warn text-xs font-bold"
                  >
                    Pas tout à fait ! Clique sur un chiffre pour changer l’heure (aiguille noire) et sur un point rouge pour les minutes (aiguille rouge).
                  </div>
                )}

                <div className="flex justify-end gap-2">
                  {setCheckStatus !== 'correct' ? (
                    <button
                      type="button"
                      onClick={handleCheckClockSet}
                      className="manga-btn-primary px-5 py-2.5 rounded-xl text-xs font-bold tracking-wide cursor-pointer"
                    >
                      Valider mon horloge
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleNextChallenge}
                      className="manga-btn-primary inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold tracking-wide cursor-pointer"
                    >
                      Manche suivante
                      <ChevronRight className="w-4 h-4" aria-hidden="true" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* Type B: Read the Analog Clock */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              <div className="lg:col-span-5">
                <InteractiveClockSvg
                  hour={activeChallenge.targetHour}
                  minute={activeChallenge.targetMinute}
                  showZones={timeModule.showZones}
                  interactive={false}
                />
              </div>

              <div className="lg:col-span-7 space-y-4">
                <div className="text-sm font-bold tracking-wide sb-text-primary">
                  What time is it? Choisis la bonne phrase en anglais :
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(activeChallenge.options || []).map((opt, idx) => {
                    const isPicked = pickedOption === idx;
                    const isRight = idx === activeChallenge.correctOptionIndex;
                    let cls = 'sb-card-option cursor-pointer';
                    let markerCls = 'bg-[var(--sb-accent)] group-hover:bg-[var(--sb-reward)]';
                    if (pickedOption !== null) {
                      if (isRight) {
                        cls = 'sb-status-success border-b-emerald-700 cursor-default';
                        markerCls = 'bg-emerald-500';
                      } else if (isPicked) {
                        cls = 'sb-status-danger border-b-red-800 cursor-default';
                        markerCls = 'bg-[var(--sb-danger)]';
                      } else {
                        cls = 'sb-card-used cursor-default';
                        markerCls = 'bg-slate-400';
                      }
                    }

                    return (
                      <button
                        key={`${activeChallenge.id}-opt-${idx}`}
                        type="button"
                        disabled={pickedOption !== null}
                        onClick={() => handlePickReadOption(idx)}
                        className={`group min-h-[56px] px-4 py-3 rounded-2xl border border-b-4 text-left text-sm font-bold flex items-center justify-between gap-2 transition-all ${cls}`}
                      >
                        <span className="flex items-center gap-3 min-w-0">
                          <span
                            aria-hidden="true"
                            className={`w-2.5 h-2.5 rotate-45 shrink-0 transition-colors ${markerCls}`}
                          />
                          <span>{opt}</span>
                        </span>
                        {pickedOption !== null && isRight && (
                          <CheckCircle2 className="w-4 h-4 sb-text-success shrink-0" />
                        )}
                        {pickedOption !== null && isPicked && !isRight && (
                          <XCircle className="w-4 h-4 sb-text-danger shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {pickedOption !== null && (
                  <div className="p-4 rounded-2xl border sb-surface-soft flex flex-wrap items-center justify-between gap-3">
                    <p className="text-xs font-medium sb-text-secondary">
                      {activeChallenge.tipFr}
                    </p>
                    <button
                      type="button"
                      onClick={handleNextChallenge}
                      className="manga-btn-primary inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold tracking-wide whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      {challengeIdx + 1 >= TIME_CHALLENGES.length
                        ? 'Terminer le défi'
                        : 'Suivant'}
                      <ChevronRight className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
