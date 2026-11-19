import { useEffect, useRef, useState } from 'react';
import {
  Check,
  Copy,
  Eraser,
  Keyboard,
  PenTool,
  Plus,
  Sparkles,
  Trash2,
  Undo2,
  Volume2,
} from 'lucide-react';
import type {
  BoardStroke,
  StrokePoint,
  UserRole,
  VoiceAccent,
  WritingSpaceState,
} from '../types/lesson';
import { speakEnglish } from '../utils/speech';

interface WritingSpaceModuleProps {
  writingSpace: WritingSpaceState;
  role: UserRole;
  studentName: string;
  accent: VoiceAccent;
  speechRate: number;
  compact?: boolean;
  onUpdateText: (owner: 'tutor' | 'student', text: string) => void;
  onAddStroke: (owner: 'tutor' | 'student', stroke: BoardStroke) => void;
  onUndoStroke: (owner: 'tutor' | 'student') => void;
  onClearStrokes: (owner: 'tutor' | 'student') => void;
  onAwardStar?: () => void;
  onOpenFullView?: () => void;
}

type InputMode = 'text' | 'stylus' | 'both';

const LOGICAL_WIDTH = 720;
const LOGICAL_HEIGHT = 280;

const INK_COLORS = [
  { label: 'Encre noire', value: '#0F172A' },
  { label: 'Indigo', value: '#4338CA' },
  { label: 'Émeraude', value: '#059669' },
  { label: 'Corail', value: '#DC2626' },
];

const TUTOR_TEMPLATES = [
  {
    label: '3 phrases (Passé)',
    text: 'Write 3 sentences in the past simple (Yesterday, I...):',
  },
  {
    label: 'Traduire',
    text: 'Translate into English:\n1. Je vais au collège à 8h.\n2. Il aime dessiner des mangas.',
  },
  {
    label: 'Compléter',
    text: 'Complete the sentence:\n"Last weekend, I ______ with my friends because ______."',
  },
  {
    label: 'Corriger',
    text: 'Find and correct the mistake:\n"She go to London yesterday and she buyed a book."',
  },
];

interface WritingPadCanvasProps {
  strokes: BoardStroke[];
  defaultColor: string;
  stylusOnly: boolean;
  onAddStroke: (stroke: BoardStroke) => void;
  onUndoStroke: () => void;
  onClearStrokes: () => void;
}

function WritingPadCanvas({
  strokes,
  defaultColor,
  stylusOnly,
  onAddStroke,
  onUndoStroke,
  onClearStrokes,
}: WritingPadCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [inkColor, setInkColor] = useState(defaultColor);
  const [isEraser, setIsEraser] = useState(false);
  const [brushWidth, setBrushWidth] = useState(3);
  const [activePoints, setActivePoints] = useState<StrokePoint[] | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);

    const drawStroke = (stroke: {
      color: string;
      width: number;
      points: StrokePoint[];
    }) => {
      if (stroke.points.length === 0) return;
      const erasing = stroke.color === 'ERASER';
      ctx.save();
      ctx.globalCompositeOperation = erasing ? 'destination-out' : 'source-over';
      ctx.strokeStyle = erasing ? 'rgba(0,0,0,1)' : stroke.color;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (stroke.points.length === 1) {
        const pt = stroke.points[0];
        ctx.lineWidth = stroke.width;
        ctx.beginPath();
        ctx.moveTo(pt.x, pt.y);
        ctx.lineTo(pt.x + 0.5, pt.y + 0.5);
        ctx.stroke();
        ctx.restore();
        return;
      }

      const avgPressure =
        stroke.points.reduce(
          (acc, pt) => acc + (typeof pt.p === 'number' && pt.p > 0 ? pt.p : 0.5),
          0
        ) / stroke.points.length;
      const pressureScale = erasing ? 1 : 0.7 + avgPressure * 0.65;
      ctx.lineWidth = Math.max(1.5, stroke.width * pressureScale);

      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length - 1; i++) {
        const midX = (stroke.points[i].x + stroke.points[i + 1].x) / 2;
        const midY = (stroke.points[i].y + stroke.points[i + 1].y) / 2;
        ctx.quadraticCurveTo(stroke.points[i].x, stroke.points[i].y, midX, midY);
      }
      const last = stroke.points[stroke.points.length - 1];
      ctx.lineTo(last.x, last.y);
      ctx.stroke();
      ctx.restore();
    };

    strokes.forEach(drawStroke);
    if (activePoints && activePoints.length > 0) {
      drawStroke({
        color: isEraser ? 'ERASER' : inkColor,
        width: isEraser ? Math.max(16, brushWidth * 4) : brushWidth,
        points: activePoints,
      });
    }
  }, [strokes, activePoints, inkColor, brushWidth, isEraser]);

  const toLogicalPoint = (
    clientX: number,
    clientY: number,
    pressure?: number
  ): StrokePoint => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((clientX - rect.left) / rect.width) * LOGICAL_WIDTH,
      y: ((clientY - rect.top) / rect.height) * LOGICAL_HEIGHT,
      p:
        typeof pressure === 'number' && pressure > 0
          ? Number(pressure.toFixed(2))
          : undefined,
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.button === 2) return;
    if (stylusOnly && e.pointerType === 'touch') return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setActivePoints([toLogicalPoint(e.clientX, e.clientY, e.pressure)]);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!activePoints) return;
    if (stylusOnly && e.pointerType === 'touch') return;
    const coalesced =
      typeof e.nativeEvent.getCoalescedEvents === 'function'
        ? e.nativeEvent.getCoalescedEvents()
        : null;
    const newPts =
      coalesced && coalesced.length > 0
        ? coalesced.map((ce) => toLogicalPoint(ce.clientX, ce.clientY, ce.pressure))
        : [toLogicalPoint(e.clientX, e.clientY, e.pressure)];
    setActivePoints((prev) => (prev ? [...prev, ...newPts] : newPts));
  };

  const handlePointerUp = () => {
    if (!activePoints || activePoints.length === 0) {
      setActivePoints(null);
      return;
    }
    const newStroke: BoardStroke = {
      id: `ws-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      color: isEraser ? 'ERASER' : inkColor,
      width: isEraser ? Math.max(16, brushWidth * 4) : brushWidth,
      points: activePoints,
    };
    setActivePoints(null);
    onAddStroke(newStroke);
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          {INK_COLORS.map((c) => (
            <button
              key={c.value}
              type="button"
              aria-label={c.label}
              onClick={() => {
                setIsEraser(false);
                setInkColor(c.value);
              }}
              className={`w-5 h-5 rounded-full border-2 transition-transform cursor-pointer ${
                !isEraser && inkColor === c.value
                  ? 'border-[var(--sb-accent)] scale-110 ring-2 ring-[var(--sb-accent)]/40'
                  : 'border-slate-400 ring-1 ring-slate-500/40'
              }`}
              style={{ backgroundColor: c.value }}
            />
          ))}
          <button
            type="button"
            onClick={() => setIsEraser((v) => !v)}
            aria-label="Gomme"
            title="Gomme"
            className={`p-1 rounded-lg border text-xs cursor-pointer ${
              isEraser ? 'sb-status-danger' : 'sb-chip-idle'
            }`}
          >
            <Eraser className="w-3.5 h-3.5" />
          </button>
          <div className="flex items-center gap-0.5 sb-seg-track border p-0.5 rounded-lg ml-1">
            {[
              { label: 'Fin', width: 2 },
              { label: 'Moy', width: 4 },
            ].map((b) => (
              <button
                key={b.width}
                type="button"
                onClick={() => setBrushWidth(b.width)}
                className={`px-1.5 py-0.5 text-[10px] font-bold rounded cursor-pointer ${
                  brushWidth === b.width ? 'sb-seg-active' : 'sb-seg-idle'
                }`}
              >
                {b.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onUndoStroke}
            disabled={strokes.length === 0}
            aria-label="Annuler le dernier trait"
            className="p-1.5 rounded-lg border sb-chip-idle hover:sb-text-accent disabled:opacity-40 cursor-pointer"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onClearStrokes}
            disabled={strokes.length === 0}
            aria-label="Effacer le tracé"
            className="p-1.5 rounded-lg border sb-chip-idle hover:border-[var(--sb-danger)] hover:sb-text-danger disabled:opacity-40 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div
        className="rounded-2xl border-2 border-[var(--sb-accent)]/50 bg-slate-50 overflow-hidden select-none shadow-sm"
        style={{
          backgroundImage:
            'repeating-linear-gradient(to bottom, transparent 0px, transparent 34px, #cbd5e1 34px, #cbd5e1 35px)',
        }}
      >
        <canvas
          ref={canvasRef}
          width={LOGICAL_WIDTH}
          height={LOGICAL_HEIGHT}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onContextMenu={(e) => e.preventDefault()}
          className="w-full h-auto block touch-none select-none cursor-crosshair"
        />
      </div>
    </div>
  );
}

export function WritingSpaceModule({
  writingSpace,
  role,
  studentName,
  accent,
  speechRate,
  compact = false,
  onUpdateText,
  onAddStroke,
  onUndoStroke,
  onClearStrokes,
  onAwardStar,
  onOpenFullView,
}: WritingSpaceModuleProps) {
  const [inputMode, setInputMode] = useState<InputMode>('text');
  const [stylusOnly, setStylusOnly] = useState(false);
  const [copiedDuo, setCopiedDuo] = useState(false);

  const showText = inputMode === 'text' || inputMode === 'both';
  const showStylus = inputMode === 'stylus' || inputMode === 'both';

  const handleCopyExchange = async () => {
    const content = [
      '=== CÔTÉ PROFESSEUR ===',
      writingSpace.tutorText.trim() || '(vide)',
      '',
      `=== CÔTÉ ÉLÈVE (${studentName}) ===`,
      writingSpace.studentText.trim() || '(vide)',
    ].join('\n');

    try {
      await navigator.clipboard.writeText(content);
      setCopiedDuo(true);
      window.setTimeout(() => setCopiedDuo(false), 2200);
    } catch {
      setCopiedDuo(false);
    }
  };

  return (
    <section
      aria-label="Espace d'écriture dédié Prof et Élève"
      className={compact ? 'manga-panel p-4 space-y-3' : 'space-y-5'}
    >
      {/* Header & Input Mode Controls */}
      <div
        className={
          compact
            ? 'flex flex-wrap items-center justify-between gap-3 border-b sb-divider pb-3'
            : 'manga-panel p-5 flex flex-wrap items-center justify-between gap-4'
        }
      >
        <div>
          <h2
            className={
              compact
                ? 'text-sm font-bold tracking-wide sb-text-primary'
                : 'text-lg font-bold tracking-wide sb-text-primary'
            }
          >
            Cahier d’écriture en direct — Prof &amp; {studentName}
          </h2>
          <p className="text-xs sb-text-muted mt-0.5">
            Chacun dispose de sa zone dédiée synchronisée en direct : aucun risque
            d’effacer l’écriture de l’autre.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 p-0.5 sb-seg-track border rounded-xl">
            {(
              [
                { id: 'text', label: 'Clavier', icon: Keyboard },
                { id: 'stylus', label: 'Stylet', icon: PenTool },
                { id: 'both', label: 'Clavier + Stylet', icon: Sparkles },
              ] as const
            ).map((opt) => {
              const Icon = opt.icon;
              const active = inputMode === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setInputMode(opt.id)}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    active ? 'sb-seg-active' : 'sb-seg-idle'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>{opt.label}</span>
                </button>
              );
            })}
          </div>

          {showStylus && (
            <button
              type="button"
              onClick={() => setStylusOnly((v) => !v)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-xs font-bold whitespace-nowrap shrink-0 cursor-pointer ${
                stylusOnly ? 'sb-chip-solid' : 'sb-chip-idle'
              }`}
            >
              <PenTool className="w-3.5 h-3.5" aria-hidden="true" />
              {stylusOnly ? 'Anti-paume actif' : 'Stylet + Doigt'}
            </button>
          )}

          <button
            type="button"
            onClick={handleCopyExchange}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl border sb-chip-idle text-xs font-bold whitespace-nowrap shrink-0 cursor-pointer"
          >
            {copiedDuo ? (
              <>
                <Check className="w-3.5 h-3.5 sb-text-success" aria-hidden="true" />
                Copié
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                Copier les 2 textes
              </>
            )}
          </button>

          {compact && onOpenFullView && (
            <button
              type="button"
              onClick={onOpenFullView}
              className="manga-btn-primary px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 cursor-pointer"
            >
              Plein écran
            </button>
          )}
        </div>
      </div>

      {/* Dual Split Columns: Tutor Zone & Student Zone */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">
        {/* Column 1: Tutor Writing Space */}
        <div
          className={`manga-panel p-4 sm:p-5 flex flex-col gap-3 ${
            role === 'tutor' ? 'ring-2 ring-[var(--sb-accent)]/45' : ''
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b sb-divider">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-7 h-7 rounded-lg border sb-chip-solid text-xs font-extrabold flex items-center justify-center shrink-0">
                P
              </span>
              <div className="min-w-0">
                <h3 className="text-sm font-bold tracking-wide sb-text-primary truncate">
                  Espace Professeur
                </h3>
                <p className="text-[11px] sb-text-muted">
                  {role === 'tutor'
                    ? 'Écrivez vos consignes, modèles ou corrections ici'
                    : 'Modèle & consignes du professeur en direct'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <span
                className={`px-2 py-0.5 rounded-lg border text-[11px] font-bold ${
                  role === 'tutor' ? 'sb-chip-solid' : 'sb-chip-idle sb-text-accent'
                }`}
              >
                {role === 'tutor' ? 'Votre zone' : 'Prof'}
              </span>
              <button
                type="button"
                disabled={!writingSpace.tutorText.trim()}
                onClick={() =>
                  speakEnglish(writingSpace.tutorText, { accent, rate: speechRate })
                }
                aria-label="Écouter le texte du professeur"
                title="Écouter en anglais"
                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border sb-chip-active sb-text-accent text-xs font-bold hover:opacity-85 disabled:opacity-40 cursor-pointer"
              >
                <Volume2 className="w-3.5 h-3.5" aria-hidden="true" />
                Écouter
              </button>
              {writingSpace.tutorText && (
                <button
                  type="button"
                  onClick={() => onUpdateText('tutor', '')}
                  aria-label="Effacer le texte du professeur"
                  title="Effacer le texte"
                  className="p-1.5 rounded-lg border sb-chip-idle hover:sb-text-danger hover:border-[var(--sb-danger)] cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {!compact && role === 'tutor' && showText && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-semibold sb-text-muted mr-1">
                Modèles rapides :
              </span>
              {TUTOR_TEMPLATES.map((tpl) => (
                <button
                  key={tpl.label}
                  type="button"
                  onClick={() =>
                    onUpdateText(
                      'tutor',
                      writingSpace.tutorText.trim()
                        ? `${writingSpace.tutorText.trim()}\n\n${tpl.text}`
                        : tpl.text
                    )
                  }
                  className="px-2.5 py-1 rounded-lg border border-b-2 sb-card-option text-[11px] font-bold sb-text-accent whitespace-nowrap cursor-pointer"
                >
                  + {tpl.label}
                </button>
              ))}
            </div>
          )}

          {showText && (
            <textarea
              aria-label="Zone d'écriture du professeur"
              rows={compact ? 4 : 7}
              value={writingSpace.tutorText}
              onChange={(e) => onUpdateText('tutor', e.target.value)}
              placeholder="Prof : écrivez une phrase modèle, un exercice, une question ou une correction..."
              className="w-full rounded-xl border sb-input px-3.5 py-2.5 text-sm sm:text-base leading-relaxed"
            />
          )}

          {showStylus && (
            <WritingPadCanvas
              strokes={writingSpace.tutorStrokes}
              defaultColor="#4338CA"
              stylusOnly={stylusOnly}
              onAddStroke={(stroke) => onAddStroke('tutor', stroke)}
              onUndoStroke={() => onUndoStroke('tutor')}
              onClearStrokes={() => onClearStrokes('tutor')}
            />
          )}
        </div>

        {/* Column 2: Student Writing Space */}
        <div
          className={`manga-panel p-4 sm:p-5 flex flex-col gap-3 ${
            role === 'student' ? 'ring-2 ring-[var(--sb-danger)]/45' : ''
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b sb-divider">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-7 h-7 rounded-lg border sb-chip-danger-solid text-xs font-extrabold flex items-center justify-center shrink-0">
                {studentName.slice(0, 1).toUpperCase() || 'É'}
              </span>
              <div className="min-w-0">
                <h3 className="text-sm font-bold tracking-wide sb-text-primary truncate">
                  Espace Élève — {studentName}
                </h3>
                <p className="text-[11px] sb-text-muted">
                  {role === 'student'
                    ? 'Écris tes phrases ou réponses ici (clavier, écran ou stylet)'
                    : `Ce que ${studentName} écrit apparaît ici en temps réel`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <span
                className={`px-2 py-0.5 rounded-lg border text-[11px] font-bold ${
                  role === 'student' ? 'sb-chip-danger-solid' : 'sb-status-danger'
                }`}
              >
                {role === 'student' ? 'Ta zone' : 'Élève'}
              </span>
              <button
                type="button"
                disabled={!writingSpace.studentText.trim()}
                onClick={() =>
                  speakEnglish(writingSpace.studentText, { accent, rate: speechRate })
                }
                aria-label="Écouter le texte de l'élève"
                title="Écouter en anglais"
                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border sb-chip-active sb-text-accent text-xs font-bold hover:opacity-85 disabled:opacity-40 cursor-pointer"
              >
                <Volume2 className="w-3.5 h-3.5" aria-hidden="true" />
                Écouter
              </button>
              {role === 'tutor' && onAwardStar && (
                <button
                  type="button"
                  onClick={onAwardStar}
                  title="Récompenser la phrase de l'élève"
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border sb-reward-pill text-xs font-bold hover:opacity-90 whitespace-nowrap cursor-pointer"
                >
                  <Plus className="w-3 h-3" aria-hidden="true" />1 étoile
                </button>
              )}
              {writingSpace.studentText && (
                <button
                  type="button"
                  onClick={() => onUpdateText('student', '')}
                  aria-label="Effacer le texte de l'élève"
                  title="Effacer le texte"
                  className="p-1.5 rounded-lg border sb-chip-idle hover:sb-text-danger hover:border-[var(--sb-danger)] cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {!compact && showText && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-semibold sb-text-muted mr-1">
                Débuts de phrases :
              </span>
              {[
                'Yesterday, I ',
                'I like ',
                'My favourite ',
                'Because ',
              ].map((starter) => (
                <button
                  key={starter}
                  type="button"
                  onClick={() =>
                    onUpdateText(
                      'student',
                      writingSpace.studentText
                        ? `${writingSpace.studentText}${writingSpace.studentText.endsWith(' ') || writingSpace.studentText.endsWith('\n') ? '' : '\n'}${starter}`
                        : starter
                    )
                  }
                  className="px-2.5 py-1 rounded-lg border border-b-2 sb-reward-btn text-[11px] font-bold whitespace-nowrap cursor-pointer"
                >
                  + {starter.trim()}
                </button>
              ))}
            </div>
          )}

          {showText && (
            <textarea
              aria-label={`Zone d'écriture de ${studentName}`}
              rows={compact ? 4 : 7}
              value={writingSpace.studentText}
              onChange={(e) => onUpdateText('student', e.target.value)}
              placeholder={`${studentName} : écris ta réponse ou tes phrases en anglais ici...`}
              className="w-full rounded-xl border sb-input px-3.5 py-2.5 text-sm sm:text-base leading-relaxed"
            />
          )}

          {showStylus && (
            <WritingPadCanvas
              strokes={writingSpace.studentStrokes}
              defaultColor="#DC2626"
              stylusOnly={stylusOnly}
              onAddStroke={(stroke) => onAddStroke('student', stroke)}
              onUndoStroke={() => onUndoStroke('student')}
              onClearStrokes={() => onClearStrokes('student')}
            />
          )}
        </div>
      </div>
    </section>
  );
}
